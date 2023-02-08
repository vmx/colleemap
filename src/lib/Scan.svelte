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

  export let ipfsNode

  // Multiaddress protocol used to transmit custom information.
  const MEMORY = 777

  // TODO vmx 2023-01-31: Define `TOPIC` only once centrally.
  const TOPIC = 'data-exchange'

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


  const waitForPeersSubscribed = (peer, numPeers, topic) => {
    return new Promise((resolve, _reject) => {
      const interval = setInterval(async () => {
        const peerIds = await peer.pubsub.peers(topic)
        console.log('vmx: peerIds:', peerIds)
        if (peerIds.length >= numPeers) {
          resolve(peerIds.length)
          clearInterval(interval)
        }
      }, 1000)
    })
  }

  // Returns the parsed addresses if the scan was successful.
  const parseData = async (data) => {
    try {
      return JSON.parse(data).map((address) => {
        return new Multiaddr(address)
      })
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

  const onMessage = (message) => {
    console.log('vmx: message received:', new TextDecoder().decode(message.data))
  }


  let connect = async () => {
    //// Try to connect over the initiator connection.
    //const remoteAnswer = await mungedAnswer(parsed.receiverAddresses)
    //await initiator.connection.setRemoteDescription(remoteAnswer)
    //
    //// Try to connect over the receiver connection.
    //const offer = await mungedOffer(parsed.initiatorAddresses)
    //await receiver.connection.setRemoteDescription(offer)
    //await receiver.connection.createAnswer()
    //// TODO vmx 2022-01-06: Check if munging here is really needed.
    //const localAnswer = await mungedAnswer(receiverAddresses)
    //await receiver.connection.setLocalDescription(localAnswer)

    //for (const address of parsed) {
    //  console.log('trying to connect to:', address)
    //  await ipfsNode.swarm.connect(address)
    //}
    //const dials = parsed.map((address) => {
    //  console.log('trying to connect to:', address)
    //  return ipfsNode.swarm.connect(address)
    //})
    //await Promise.all(dials)

    //if (type === 'initiator') {
    //  const addresses = parsed.filter((address) => {
    //    return address.stringTuples().some(([protocol, value]) => {
    //      return protocol == MEMORY && value === 'initiator'
    //    })
    //  })
    //  console.log('initiator addresses:', addresses.map((address) => {
    //    address.toString()
    //  }))
    //  await ipfsNode.swarm.connect(addresses[0])
    //} else {
    //  const addresses = parsed.filter((address) => {
    //    return address.stringTuples().some(([protocol, value]) => {
    //      return protocol == MEMORY && value === 'receiver'
    //    })
    //  })
    //  console.log('receiver addresses:', addresses.map((address) => {
    //    address.toString()
    //  }))
    //  await ipfsNode.swarm.connect(addresses[0])
    //}

    //const dials = []
    const initiatorAddresses = parsed.filter((address) => {
     return address.stringTuples().some(([protocol, value]) => {
       return protocol == MEMORY && value === 'initiator'
     })
    })
    //console.log('initiator addresses:', initiatorAddresses.map((address) => {
    //  return address.toString()
    //}))
    //const initiatorDial = ipfsNode.swarm.connect(initiatorAddresses[0])
    //dials.push(initiatorDial)
    //
    const receiverAddresses = parsed.filter((address) => {
     return address.stringTuples().some(([protocol, value]) => {
       return protocol == MEMORY && value === 'receiver'
     })
    })
    //console.log('receiver addresses:', receiverAddresses.map((address) => {
    //  return address.toString()
    //}))
    //const receiverDial = ipfsNode.swarm.connect(receiverAddresses[0])
    //dials.push(receiverDial)
    //
    //try {
    ////const dialResult = await Promise.all(dials)
    ////console.log('vmx: dialResult:', dialResult)
    //for (const dial of dials) {
    //  console.log('vmx: awaiting dial:', dial)
    //  await dial
    //}
    //} catch (error) {
    //  console.log('errrrror:', error)
    //  throw err
    //}

   // This seems to work, let's see if there's a better way.
   const addresses = parsed
   //const addresses = [initiatorAddresses[0], receiverAddresses[0]]
//console.log('vmx: address book:', ipfsDialer.libp2p.peerStore.addressBook)
   const toDialPeerId = peerIdFromString(addresses[0].getPeerId())
   console.log('vmx: toDialPeerId:', toDialPeerId)
   await ipfsNode.libp2p.peerStore.addressBook.add(toDialPeerId, addresses)
   const connection = ipfsNode.swarm.connect(toDialPeerId)
   await connection


    //// No idea why this doesn't work.
    //const dials = []
    //for (const address of parsed) {
    //  console.log('vmx: trying to connect to:', address)
    //  const dial = ipfsNode.swarm.connect(address)
    //  dials.push(dial)
    //}
    //console.log('vmx: waiting for all dials:', dials)
    //const dialResult = await Promise.any(dials)
    //console.log('vmx: waiting for all dials:', dialResult)


    //await ipfsNode.pubsub.subscribe(TOPIC, onMessage)
    //console.log('vmx: subscribed to:', TOPIC)

    const numPeers = await waitForPeersSubscribed(ipfsNode, 1, TOPIC)
    console.log('vmx: waited for subscribed peers complete:', numPeers)

    scanState = "connected"
  }

  let sendPing = async () => {
    console.log('vmx: trying to ping to')
    //const numPeers = await waitForPeersSubscribed(ipfsNode, 1, TOPIC)
    //console.log('vmx: waited for subscribed peers complete:', numPeers)

    const message = new TextEncoder().encode('sending a ping.')
    ipfsNode.pubsub.publish(TOPIC, message)
  }

  let data = async () => {
    //initiatorAddresses = await createMultiaddrs(initiator.connection)
    //console.log('vmx: initiator multiaddrs:', initiatorAddresses)
    //receiverAddresses = await createMultiaddrs(receiver.connection)
    //console.log('vmx: receiver multiaddrs:', receiverAddresses)
    //
    //const multiaddrs = [initiatorAddresses, receiverAddresses]
    //console.log('vmx: offer: qr code data:', JSON.stringify(multiaddrs))
    //return JSON.stringify(multiaddrs)

    const addresses = await ipfsNode.swarm.localAddrs()
    console.log('vmx: offer: qr code data:', JSON.stringify(addresses))
    return JSON.stringify(addresses)
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
