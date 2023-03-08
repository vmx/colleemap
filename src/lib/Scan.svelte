<script>
  import { onMount } from 'svelte'

  import { multiaddr as Multiaddr } from '@multiformats/multiaddr'
  import { base64url } from "multiformats/bases/base64"
  import * as digest from 'multiformats/hashes/digest'
  import { multiaddr } from '@multiformats/multiaddr'
  import { peerIdFromString } from '@libp2p/peer-id'
  import QrScanner from 'qr-scanner'
  import QR from 'svelte-qr'
  import { router } from 'tinro'

  import { name } from '../stores.js'

  export let libp2pNode

  // Multiaddress protocol used to transmit custom information.
  const MEMORY = 777
  const CERTHASH = 466
  const P2P = 421
  const IP4 = 4
  const IP6 = 41
  const UDP = 273
  const DNS = 53
  const DNS4 = 54
  const DNS6 = 55

  // TODO vmx 2023-01-31: Define `TOPIC` only once centrally.
  const TOPIC = 'data-exchange'

  let video
  /// The scan state defines which elements are displayed.
  ///
  ///  - "scaner": QR-code scanner.
  ///  - "scaned": Information when the QR-code was successfully scanned.
  let scanState = "scanner"
  //let scanState = "scanned"
  /// The parsed data of a scan.
  let parsed

  console.log('vmx: name:', $name)

  const waitForPeersSubscribed = (peer, numPeers, topic) => {
    return new Promise((resolve, _reject) => {
      const interval = setInterval(() => {
        console.log('vmx: wait for peers subscribed: connected peerIds:', peer.getConnections().map((connection) => connection.remotePeer.toString()))
        const peerIds = peer.pubsub.getSubscribers(topic)
        console.log('vmx: wait for peers subscribed: subscribed peerIds:', peerIds)
        if (peerIds.length >= numPeers) {
          resolve(peerIds.length)
          clearInterval(interval)
        }
      }, 1000)
    })
  }

  const toMultiaddress = (host, port, certhash, connectionType, peerId) => {
    let addr = ''

    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      addr += '/ip4'
    } else if (
      /^[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}:[\da-f]{0,4}$/.test(
        host.toLowerCase()
      )
    ) {
      addr += '/ip6'
    } else {
      // Obfuscated hosts are always IPv6.
      addr += '/dns6'
    }
    addr += '/' + host
    addr += '/udp/' + port
    addr += '/webrtc/certhash/' + certhash
    addr += '/memory/' + connectionType
    addr += '/p2p/' + peerId

    return new Multiaddr(addr)
  }

  // Returns the parsed addresses if the scan was successful.
  const parseData = async (data) => {
    const result = []
    try {
      // There's always only a single key.
      const [peerId, addresses] = Object.entries(JSON.parse(data))[0]
      for (const [certhash, initiators] of Object.entries(addresses.i)) {
        for (const [host, port] of initiators) {
          result.push(
            toMultiaddress(host, port, certhash, 'initiator', peerId)
          )
        }
      }
      for (const [certhash, receivers] of Object.entries(addresses.r)) {
        for (const [host, port] of receivers) {
          result.push(
            toMultiaddress(host, port, certhash, 'receiver', peerId)
          )
        }
      }
      console.log('vmx: parsed addresses:', JSON.stringify(result))
      return result
    } catch (error) {
      console.log('Cannot parse QR Code.', error)
      return
    }
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

  // Converts a list multiaddresses into a more compact JSON form, so that the
  // QR-code becomes smaller.
  const addressesToJson = (addresses) => {
    // All addresses have the same peer ID, hence we can just use the first
    // address to get it.
    const peerId = addresses[0].getPeerId()
    const json = {
      [peerId]: {
        // Initiator
        'i': {},
        // receiver
        'r': {}
      }
    }
    for (const address of addresses) {
      let certhash
      let host
      let port
      let connectionType
      for (const [protocol, value] of address.stringTuples()) {
        console.log('vmx: addressToJson protocol, value:', protocol, value)
        switch (protocol) {
          case CERTHASH: {
            certhash = value
            break
          }
          case DNS:
          case DNS4:
          case DNS6:
          case IP4:
          case IP6: {
            host = value
            break
          }
          case UDP: {
            port = parseInt(value)
            break
          }
          case MEMORY: {
            // Use the first character only, to reduce the total size.
            connectionType = value[0]
            break
          }
        }
      }
      if (certhash in json[peerId][connectionType]) {
        json[peerId][connectionType][certhash].push([host, port])
      } else {
        json[peerId][connectionType][certhash] = [[host, port]]
      }
      console.log('vmx: addressToJson: json:', json)
    }
    return json
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

  let connect = async () => {
    //const addresses = parsed
    const toDialPeerIdString = parsed[0].getPeerId()
    console.log('vmx: own PeerId:', libp2pNode.peerId.toString())

    let addresses
    if (libp2pNode.peerId.toString() > toDialPeerIdString) {
      addresses = parsed.filter((address) => {
        return address.stringTuples().some(([protocol, value]) => {
          return protocol == MEMORY && value === 'initiator'
        })
      })
    } else {
      addresses = parsed.filter((address) => {
        return address.stringTuples().some(([protocol, value]) => {
          return protocol == MEMORY && value === 'receiver'
        })
      })
    }

    // TODO vmx: This seems to work, let's see if there's a better way.
    const toDialPeerId = peerIdFromString(toDialPeerIdString)
    await libp2pNode.peerStore.addressBook.add(toDialPeerId, addresses)
    const connection = libp2pNode.dial(toDialPeerId)
    console.log('vmx: dial started')
    await connection
    console.log('vmx: dial finished awaiting')

    const numPeers = await waitForPeersSubscribed(libp2pNode, 1, TOPIC)
    console.log('vmx: waited for subscribed peers complete:', numPeers)

    router.goto('/connected')
  }

  let data = async () => {
    const addresses = await libp2pNode.getMultiaddrs()
    console.log('vmx: offer: addresses:', JSON.stringify(addresses))
    const json = addressesToJson(addresses)
    console.log('vmx: offer: qr code data2:', JSON.stringify(json).length, json)
    return JSON.stringify(json)
  }

</script>

<h1>Scan</h1>

<div id="container">
{#if scanState === "scanner"}
  <video bind:this={video}></video>
{:else if scanState === "scanned"}
  <div on:click={connect}>Peer addresses scanned! Click to connect.</div>
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
