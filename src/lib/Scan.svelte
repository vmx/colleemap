<script>
  import { onMount } from 'svelte'

  import { multiaddr as Multiaddr } from '@multiformats/multiaddr'
  import { base64url } from "multiformats/bases/base64"
  import * as digest from 'multiformats/hashes/digest'
  import { multiaddr } from '@multiformats/multiaddr'
  import QrScanner from 'qr-scanner'
  import QR from 'svelte-qr'
  import { router } from 'tinro'

  export let initiator
  export let receiver

  let video
  /// The scan state defines which elements are displayed.
  ///
  ///  - "scaner": QR-code scanner.
  ///  - "scaned": Information when the QR-code was successfully scanned.
  ///  - "connected": Information when the connection was made.
  let scanState = "scanner"
  //let scanState = "scanned"
  /// The parsed data of a scan.
  let parsed
  /// The local initiator multiaddresses.
  let initiatorAddresses
  /// The local receiver multiaddresses.
  let receiverAddresses

  const ipv = (ma) => {
    for (const proto of ma.protoNames()) {
      if (proto.startsWith('ip')) {
        return proto.toUpperCase();
      }
    }
    return 'IP6';
  }

  const getFingerprintFromOffer = (offer) => {
    for (const line of offer.sdp.split('\n')) {
      if (line.startsWith('a=fingerprint:')) {
        return line.substring('a=fingerprint:'.length).trim()
      }
    }
  }

  const certhashToFingerprint = (certhash) => {
    const baseDecoded = base64url.decode(certhash)
    console.log('vmx: baseDecoded:', baseDecoded)
    const multihashDecoded = digest.decode(baseDecoded)
    console.log('vmx: multihashDecoded:', multihashDecoded)
    const hex = hexFromUint8Array(multihashDecoded.digest).toUpperCase()
    console.log('vmx: hex:', hex)
    const fingerprint = hex.match(/.{2}/g).join(':')
    console.log('vmx: fingerprint:', fingerprint)
    return `sha-256 ${fingerprint}`
  }

  const ma2sdp = (addresses, withIceCandidates) => {
    const IP = addresses[0].toOptions().host
    const IPVERSION = ipv(addresses[0])
    const PORT = addresses[0].toOptions().port
    const fingerprint = addresses[0].stringTuples().filter(([proto, value]) => {
      console.log('vmx: proto value:', proto, value)
      return proto === CERTHASH
    }).map(([_proto, certhash]) => {
      return certhashToFingerprint(certhash)
    }).pop()
    console.log('vmx: m2sdp: fingerprint:', fingerprint)

    const candidates = addresses.map((address) => {
      const ip = address.toOptions().host
      //const ipVersion = ipv(address)
      const port = address.toOptions().port
      return `a=candidate:1467250027 1 UDP 1467250027 ${ip} ${port} typ host`
    })

    const sdp = `v=0
o=- 0 0 IN ${IPVERSION} ${IP}
s=-
c=IN ${IPVERSION} ${IP}
t=0 0
m=application ${PORT} UDP/DTLS/SCTP webrtc-datachannel
a=mid:0
a=setup:passive
a=ice-ufrag:${UFRAG}
a=ice-pwd:${UFRAG}
a=fingerprint:${fingerprint}
a=sctp-port:5000
a=max-message-size:1073741823
`
    if (withIceCandidates) {
      return sdp + candidates.join('\n') + '\n'
    } else {
      return sdp
    }
  }

  // Returns true if the scan was successful.
  const parseData = async (data) => {
    let initiatorAddresses
    let receiverAddresses
    try {
      const [initiatorData, receiverData] = JSON.parse(data)
      initiatorAddresses = initiatorData.map((address) => {
        return new Multiaddr(address)
      })
      receiverAddresses = receiverData.map((address) => {
        return new Multiaddr(address)
      })
    } catch (error) {
      console.log('Cannot parse QR Code.', error)
      return
    }

    return { initiatorAddresses, receiverAddresses }
  }

  // Based on `qr-scanner`s default code.
  const calculateScanRegion = (video) => {
    const smallestDimension = Math.min(video.videoWidth, video.videoHeight)
    const scanRegionSize = Math.round(0.85 * smallestDimension)
    return {
      x: Math.round((video.videoWidth - scanRegionSize) / 2),
      y: Math.round((video.videoHeight - scanRegionSize) / 2),
      width: scanRegionSize,
      height: scanRegionSize,
      downScaledWidth: 400,
      downScaledHeight: 400
    }
  }

  onMount(async () => {
    const qrScanner = new QrScanner(
      video,
      async (result) => {
        qrScanner.stop()
        console.log('decoded QR Code is:', result)
        parsed = await parseData(result.data)
        if (parsed === undefined) {
          qrScanner.start()
        } else {
          // TODO vmx 2023-01-05: replace the scanner with a field with a checkmark saying "scanned".
          // It could then also present a button saying "click here to connect".
          scanState = "scanned"
        }
      },
      {
        calculateScanRegion,
        highlightScanRegion: true,
        highlightCodeOutline: true
      }
    )
    await qrScanner.setCamera('environment')
    qrScanner.start()
  })

  // The QR-code part

  const SHA2_256 = 0x12
  const CERTHASH = 466
  const UFRAG = 'myufragalwaysthesame'

  // From https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript/50868276#50868276
  const uint8ArrayFromHex = (hex) => {
    return Uint8Array.from(
      hex.match(/.{1,2}/g).map((byte) => {
        return parseInt(byte, 16)
      })
    )
  }

  // From https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript/50868276#50868276
  const hexFromUint8Array = (bytes) => {
    return bytes.reduce((str, byte) => {
        return str + byte.toString(16).padStart(2, '0')
    }, '')
  }

  // Returns a Base64Url multibase encoded multihash certhash.
  const getCerthashFromOffer = (offer) => {
    const fingerprint = getFingerprintFromOffer(offer)
    const hash = fingerprint.split(' ')[1]
    const hex = hash.replaceAll(':', '')
    const bytes = uint8ArrayFromHex(hex.toLowerCase())
    const multihash = digest.create(SHA2_256, bytes)
    const multibase = base64url.encode(multihash.bytes)
    return multibase
  }

  // From https://github.com/little-bear-labs/js-libp2p-webrtc/blob/b2e4f60e50d68e79cba2d88b7dae88ef70ec6f5f/src/sdp.ts#L110-L120
  const setUfrag = (offer) => {
    offer.sdp = offer.sdp
      .replace(/\na=ice-ufrag:[^\n]*\n/, '\na=ice-ufrag:' + UFRAG + '\n')
      .replace(/\na=ice-pwd:[^\n]*\n/, '\na=ice-pwd:' + UFRAG + '\n')
    return offer
  }

  const waitForIceCandidates = (connection) => {
    return new Promise((resolve, _reject) => {
      const candidates = []
      connection.addEventListener('icecandidate', (event) => {
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

  const createMultiaddrs = async (connection) => {
    const offer = await connection.createOffer()
    const certhash = await getCerthashFromOffer(offer)
    const mungedOffer = setUfrag(offer)
    console.log('vmx: munged offer:', mungedOffer)
    await connection.setLocalDescription(mungedOffer)
    const iceCandidates = await waitForIceCandidates(connection)
    // console.log('vmx: icecandidate:', iceCandidates.map((candidate) => candidate.toJSON()))
    console.log('vmx: icecandidate:', iceCandidates)

    const addrs = iceCandidates.reduce((acc, candidate) => {
      let addr = candidateToMultiaddr(candidate)
      if (addr !== null) {
        addr += '/webrtc/certhash/' + certhash
        acc.push(multiaddr(addr))
        // acc.push(multiaddr)
      }
      return acc
    }, [])

    console.log('vmx: addrs:', addrs)

    console.log('vmx: offer: qr code data:', JSON.stringify(addrs))

    return addrs
  }


  const mungedAnswer = async (addresses) => {
    // Construct answer SDP from multiaddr.
    return {
      type: 'answer',
      sdp: ma2sdp(addresses, false)
    }
  }

  const mungedOffer = async (addresses) => {
    // Construct offer sdp from multiaddr.
    return {
      type: 'offer',
      sdp: ma2sdp(addresses, true)
    }
  }

  let connect = async () => {
    // Try to connect over the initiator connection.
    const remoteAnswer = await mungedAnswer(parsed.receiverAddresses)
    await initiator.connection.setRemoteDescription(remoteAnswer)

    // Try to connect over the receiver connection.
    const offer = await mungedOffer(parsed.initiatorAddresses)
    await receiver.connection.setRemoteDescription(offer)
    await receiver.connection.createAnswer()
    // TODO vmx 2022-01-06: Check if munging here is really needed.
    const localAnswer = await mungedAnswer(receiverAddresses)
    await receiver.connection.setLocalDescription(localAnswer)

    scanState = "connected"
  }

  /// Send a ping over both connections.
  let sendPing = () => {
    initiator.dataChannel.send("Ping from initiator connection")
    receiver.dataChannel.send("Ping from receiver connection")
  }

  let data = async () => {
    initiatorAddresses = await createMultiaddrs(initiator.connection)
    console.log('vmx: initiator multiaddrs:', initiatorAddresses)
    receiverAddresses = await createMultiaddrs(receiver.connection)
    console.log('vmx: receiver multiaddrs:', receiverAddresses)

    const multiaddrs = [initiatorAddresses, receiverAddresses]
    console.log('vmx: offer: qr code data:', JSON.stringify(multiaddrs))
    return JSON.stringify(multiaddrs)
  }

</script>

<h1>Scan</h1>

<div id="container">
{#if scanState === "scanner"}
  <video bind:this={video}></video>
{:else if scanState === "scanned"}
  <div on:click={connect}>Peer addresses scanned! Click to connect.</div>
{:else if scanState === "connected"}
  <div on:click={sendPing}>Connected to peer xyz. Click to send a ping to the other peer.</div>
{/if}
  <div class="qrcode">
  {#await data()}
    Waiting for WebRTC offer.
  {:then resolved}
    <QR text={resolved} level="L" />
  {/await}
  </div>
</div>

<style>
  #container {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
  }


  video {
    aspect-ratio: 1/1;
    display: block;
    object-fit: cover;
    flex: 1;
    /*height: 50%;*/
    /*margin: auto;*/
    /*width: 75%;*/
  }
  /*@media (orrientation: portrait) {*/
    video {
      height: 50%;
      max-height: 50%;
      max-width: 50%;
      /*width: 100%;*/
    }
  /*}*/
  /*@media (oritentation: landscape) {*/
  /*  video {*/
  /*    height: 100%;*/
  /*    width: 50%;*/
  /*  }*/
  /*}*/

  .qrcode {
    aspect-ratio: 1/1;
    box-sizing: border-box;
    display: block;
    flex: 1;
    /*height: 100%;*/
    max-height: 50%;
    /*max-width: 100%;*/
    padding: 10px;
    width: 50%;
  }
</style>
