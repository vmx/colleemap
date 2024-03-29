<script>
  import { onMount } from 'svelte'

  import { multiaddr as Multiaddr } from '@multiformats/multiaddr'
  import { base64url } from "multiformats/bases/base64"
  import * as digest from 'multiformats/hashes/digest'
  import { multiaddr } from '@multiformats/multiaddr'
  import { peerIdFromString } from '@libp2p/peer-id'
  import { router } from 'tinro'

  import { PUBSUB_TOPIC_DATA } from '../constants.js'

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

  /// The connection data of the other peer.
  let otherPeer = null
  /// The scan state defines which elements are displayed.
  ///
  ///  - "scanner": QR-code scanner.
  ///  - "scanned": Information when the QR-code was successfully scanned.
  ///  - "connecting": When clicked after a successful scan and trying to
  ///    connect.
  let scanState = "scanner"
  //let scanState = "scanned"
  /// The parsed data of a scan.
  let parsed

  const waitForPeersSubscribed = (peer, numPeers, topic) => {
    return new Promise((resolve, _reject) => {
      const interval = setInterval(() => {
        console.log('vmx: wait for peers subscribed: connected peerIds:', peer.getConnections().map((connection) => connection.remotePeer.toString()))
        const peerIds = peer.services.pubsub.getSubscribers(topic)
        console.log('vmx: wait for peers subscribed: subscribed peerIds:', peerIds)
        if (peerIds.length >= numPeers) {
          resolve(peerIds.length)
          clearInterval(interval)
        }
      }, 1000)
    })
  }

  const toMemoryValue = (connectionType, hostPorts) => {
    const hostPortsString = hostPorts.map(([host, port]) => {
      return `${host}_${port}`
    }).join('|')
    return `${connectionType}=${hostPortsString}`
  }

  const toMultiaddress = (certhash, connectionType, peerId, hostPorts) => {
    let addr = ''
    addr += '/webrtc/certhash/' + certhash
    addr += '/memory/' +  toMemoryValue(connectionType, hostPorts)
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
        result.push(
          toMultiaddress(certhash, 'initiator', peerId, initiators)
        )
      }
      for (const [certhash, receivers] of Object.entries(addresses.r)) {
        result.push(
          toMultiaddress(certhash, 'receiver', peerId, receivers)
        )
      }
      console.log('vmx: parsed addresses:', JSON.stringify(result))
      return result
    } catch (error) {
      console.log('Cannot parse QR Code.', error)
      return
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
      let connectionTypeShort
      let hostPorts
      for (const [protocol, value] of address.stringTuples()) {
        console.log('vmx: addressToJson protocol, value:', protocol, value)
        switch (protocol) {
          case CERTHASH: {
            certhash = value
            break
          }
          case MEMORY: {
            // Use the first character only, to reduce the total size.
            //connectionType = value[0]
            const [connectionType, hostPortsString] = value.split('=')
            hostPorts = hostPortsString.split('|').map((hostPort) => {
              const [host, port] = hostPort.split('_')
              return [host, parseInt(port)]
            })
            // Use the first character of the connection type only, to reduce
            // the total size.
            connectionTypeShort = connectionType[0]
            break
          }
        }
      }
      json[peerId][connectionTypeShort][certhash] = hostPorts
      console.log('vmx: addressToJson: json:', json)
    }
    return json
  }

  const submitData = async () => {
    parsed = await parseData(otherPeer)
    if (parsed !== undefined) {
      scanState = "scanned"
    }
  }

  const connect = async () => {
    scanState = "connecting"

    const toDialPeerIdString = parsed[0].getPeerId()
    console.log('vmx: own PeerId:', libp2pNode.peerId.toString())

    let addresses
    if (libp2pNode.peerId.toString() > toDialPeerIdString) {
      addresses = parsed.filter((address) => {
        return address.stringTuples().some(([protocol, value]) => {
          return protocol == MEMORY && value.startsWith('initiator')
        })
      })
    } else {
      addresses = parsed.filter((address) => {
        return address.stringTuples().some(([protocol, value]) => {
          return protocol == MEMORY && value.startsWith('receiver')
        })
      })
    }

    // TODO vmx: This seems to work, let's see if there's a better way.
    const toDialPeerId = peerIdFromString(toDialPeerIdString)
    console.log('vmx: about to dial')
    const connection = await libp2pNode.dial(addresses[0])
    //await Promise.any(connections)
    console.log('vmx: dial finished awaiting')

    const numPeers = await waitForPeersSubscribed(libp2pNode, 1, PUBSUB_TOPIC_DATA)
    console.log('vmx: waited for subscribed peers complete:', numPeers)

    router.goto('/connected')
  }

  const data = async () => {
    const addresses = await libp2pNode.getMultiaddrs()
    console.log('vmx: offer: addresses:', JSON.stringify(addresses))
    const json = addressesToJson(addresses)
    console.log('vmx: offer: qr code data2:', JSON.stringify(json).length, json)
    return JSON.stringify(json)
  }

</script>

<div id="container">
{#if scanState === "scanner"}
  <textarea bind:value={otherPeer} placeholder="Put here the data from the other peer."></textarea>
  <button on:click|preventDefault={submitData}>Submit data</button>
{:else if scanState === "scanned"}
  <div class="connect" on:click={connect}>
    <p>Once the other peer has scanned your code, click here to</p>
    <p class="connect">connect</p>
    <p>You and the other peer should click on “connect” at roughly the same time.</p>
  </div>
{:else if scanState === "connecting"}
  <div class="connect">
    <p class="connect">Connecting…</p>
  </div>
{/if}
{#await data()}
    <p>Waiting for WebRTC offer.</p>
  {:then resolved}
    <textarea readonly="readonly">{resolved}</textarea>
  {/await}
</div>

<style>
  div.connect {
    background-color: #f69e02;
    font-size: 1rem;
  }
  p.connect {
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
  }

  #qrcode {
    background-color: #fff;
  }
</style>
