<script>
  import { base64url } from "multiformats/bases/base64"
  import { create as digestToMultihash } from "multiformats/hashes/digest"
  //import { multiaddr as Multiaddr } from '@multiformats/multiaddr'
  import QR from 'svelte-qr'

  export let connection

  const SHA2_256 = 0x12

  // From https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript/50868276#50868276
  const uint8ArrayFromHex = (hex) => {
    return Uint8Array.from(
      hex.match(/.{1,2}/g).map((byte) => {
        return parseInt(byte, 16)
      })
    )
  }

  const getFingerprintFromOffer = (offer) => {
    for (const line of offer.sdp.split('\n')) {
      if (line.startsWith('a=fingerprint:')) {
        return line.substring('a=fingerprint:'.length).trim()
      }
    }
  }

  // Returns a Base64Url multibase encoded multihash certhash.
  const getCerthashFromOffer = (offer) => {
    const fingerprint = getFingerprintFromOffer(offer);
    const hash = fingerprint.split(' ')[1]
    const hex = hash.replaceAll(':', '')
    const bytes = uint8ArrayFromHex(hex.toLowerCase())
    const multihash = digestToMultihash(SHA2_256, bytes)
    const multibase = base64url.encode(multihash.bytes)
    return multibase
  }

  // From https://github.com/little-bear-labs/js-libp2p-webrtc/blob/b2e4f60e50d68e79cba2d88b7dae88ef70ec6f5f/src/sdp.ts#L110-L120
  const munge = (offer, ufrag) => {
    offer.sdp = offer.sdp
      .replace(/\na=ice-ufrag:[^\n]*\n/, '\na=ice-ufrag:' + ufrag + '\n')
      .replace(/\na=ice-pwd:[^\n]*\n/, '\na=ice-pwd:' + ufrag + '\n')
    return offer
  }

  const waitForIceCandidates = () => {
    return new Promise((resolve, _reject) => {
      const candidates = []
      connection.addEventListener("icecandidate", (event) => {
        if (event.candidate && event.candidate.candidate) {
          candidates.push(event.candidate)
        } else {
          resolve(candidates)
        }
      })
    })
  }

  // Returns a Multiaddr if the candidate can be used for inbound connections,
  // else it returns `null`.
  const candidateToMultiaddr = (candidate) => {
    const [
      _candidate,
      componentId,
      transport,
      priority,
      connectionAddress,
      port,
      _typ,
      candidateType,
      ...extensionsList
    ] = candidate.candidate.split(' ')

    const extensions = {}
    for (let ii = 0; ii < extensionsList.length; ii += 2) {
      extensions[extensionsList[ii]] = extensionsList[ii + 1]
    }

    // Active TCP connections cannot be used for incoming requests.
    if (extensions?.tcptype === 'active') {
      return null
    }

    let multiaddr = ''

    // Specify the host.
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(connectionAddress)) {
      multiaddr += '/ip4'
    } else if (/^[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}$/.test(connectionAddress.toLowerCase())) {
      multiaddr += '/ip6'
    } else {
      // Obfuscated hosts are always IPv6.
      multiaddr += '/dns6'
    }
    multiaddr += '/' + connectionAddress

    // Specify the transport.
    multiaddr += '/' + transport.toLowerCase()

    // Specify the port.
    multiaddr += '/' + port

    return multiaddr
  }

  let data = (async () => {
    // TODO vmx 2022-12-04: Make sure it's not called again in case there is
    // already and offer
    console.log("vmx: offer: called data function")
    const offer = await connection.createOffer()
    const certhash = await getCerthashFromOffer(offer)
    const ufrag = self.crypto.randomUUID().replaceAll('-', '');
    const mungedOffer = munge(offer, ufrag)
    await connection.setLocalDescription(mungedOffer)
    const iceCandidates = await waitForIceCandidates()
    //console.log('vmx: icecandidate:', iceCandidates.map((candidate) => candidate.toJSON()))
    console.log('vmx: icecandidate:', iceCandidates)

    let multiaddrs = iceCandidates.reduce((acc, candidate) => {
      let multiaddr = candidateToMultiaddr(candidate)
      if (multiaddr !== null) {
        multiaddr += '/webrtc/certhash/' + certhash
        //acc.push(new Multiaddr(multiaddr))
        acc.push(multiaddr)
      }
      return acc
    }, [])

    console.log('vmx: multiaddrs:', multiaddrs)

    console.log('vmx: offer: qr code data:', JSON.stringify(multiaddrs))
    return JSON.stringify(multiaddrs)
  })()


  //const sdp = 'v=0\\r\\no=mozilla...THIS_IS_SDPARTA-99.0 2620878450409659912 0 IN IP4 0.0.0.0\\r\\ns=-\\r\\nt=0 0\\r\\na=fingerprint:sha-256 6A:48:EC:74:17:27:74:17:C5:4E:76:0E:71:2D:AD:19:AF:10:E9:9A:76:3D:AC:EB:FF:B2:DC:00:93:A8:0F:E8\\r\\na=group:BUNDLE 0\\r\\na=ice-options:trickle\\r\\na=msid-semantic:WMS *\\r\\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\\r\\nc=IN IP4 0.0.0.0\\r\\na=sendrecv\\r\\na=ice-pwd:b62fa452fcf2ff9d2212fc7ec80c248f\\r\\na=ice-ufrag:bb88b101\\r\\na=mid:0\\r\\na=setup:actpass\\r\\na=sctp-port:5000\\r\\na=max-message-size:1073741823\\r\\n'
</script>

<h1>Offer</h1>

<div class="qrcode">
  <!--
  <QR text={data} level="L" />
  -->
{#await data}
  Waiting for WebRTC offer.
{:then resolved}
  <QR text={resolved} level="L" />
{/await}
</div>

<a href="/scan">Scan answer</a>

<style>
  .qrcode {
    height: 256px;
    width: 256px;
  }
</style>
