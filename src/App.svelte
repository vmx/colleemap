<script>
  import { onMount } from 'svelte';
  import { Route, router } from 'tinro';

  import { createLibp2p } from 'libp2p'
  import { webRTCNoNat } from '@libp2p/webrtc'
  import { FaultTolerance } from '@libp2p/interface-transport'
  //import * as IPFS from 'ipfs-core'
  import { gossipsub } from '@chainsafe/libp2p-gossipsub'
  import { plaintext } from 'libp2p/insecure'
  import { pipe } from 'it-pipe'
  import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
  import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
  import map from 'it-map'
  import { identifyService } from 'libp2p/identify'

  import Home from './lib/Home.svelte'
  //import Items from './lib/Items.svelte'
  //import Bingo from './lib/Bingo.svelte'
  //import Offer from './lib/Offer.svelte'
  import Scan from './lib/Scan.svelte'
  //import Answer from './lib/Answer.svelte'
  import Connected from './lib/Connected.svelte'
  import Topology from './lib/Topology.svelte'
  import Map from './lib/Map.svelte'
  import Copypaste from './lib/Copypaste.svelte'
  import { PUBSUB_TOPIC_TOPOLOGY, PUBSUB_TOPIC_DATA } from './constants.js'
  import { messages } from './stores.js'
  import topology from './lib/topology-instance.js'


  import './general.css'
  import './split.css'

  //const createConnection = async () => {
  //  const certificate = await RTCPeerConnection.generateCertificate({
  //    name: 'ECDSA',
  //    namedCurve: 'P-256',
  //    hash: 'SHA-256',
  //  })
  //
  //  console.log('vmx: certificate:', certificate)
  //  const connection = new RTCPeerConnection({certificates: [certificate]})
  //  console.log('vmx: connection is set:', connection)
  //
  //  connection.addEventListener('iceconnectionstatechange', (event) => {
  //    console.log('iceconnectionstatechange: gathering state:', event.target.iceGatheringState)
  //  })
  //
  //  connection.addEventListener("icecandidate", (event) => {
  //    console.log('vmx: icecandidates event: candidate:', event.candidate)
  //  })
  //
  //  const dataChannel = connection.createDataChannel("data-channel", {
  //    negotiated: true,
  //    id: 0
  //  })
  //  dataChannel.addEventListener("open", (event) => {
  //    console.log('vmx: data channel opened')
  //    //dataChannel.send("This message was sent as a data channel was opened")
  //  })
  //  dataChannel.addEventListener('message', (event) => {
  //    console.log(`vmx: data channel received:`, event.data)
  //  })
  //
  //  return { connection, dataChannel }
  //}

  router.mode.hash()

  //let libp2pNode

  // The idea of the init function is based on
  // https://stackoverflow.com/questions/73940340/use-promise-result-for-binding/73940618#73940618
  const init = async () => {
    //// Create two connections, one will be used to initiate a connection to the
    //// other peer, and the other one will be used to connect to another peer
    //// that initiated the connection.
    //const initiator = await createConnection()
    //const receiver = await createConnection()
    //return { initiator, receiver }

    const libp2pNode = await createLibp2p({
      transports: [
        webRTCNoNat(),
      ],
      connectionEncryption: [plaintext()],
      transportManager: {
        faultTolerance: FaultTolerance.NO_FATAL
      },
      services: {
        pubsub: gossipsub({
          emitSelf: true
        }),
        identify: identifyService()
      },
      connectionManager: {
        minConnections: 0
      }
    })

    const receiveMessage = (message) => {
      switch (message.detail.topic) {
        case PUBSUB_TOPIC_DATA:
          console.log('vmx: message received:', message)
          const text = new TextDecoder().decode(message.detail.data)
          console.log(`vmx: message received (${message.detail.topic}): ${text}`)
          // Push the latest message to the store.
          $messages = [...$messages, text]
          console.log('vmx: messages:', $messages)
          break
        case PUBSUB_TOPIC_TOPOLOGY:
          const peers = JSON.parse(uint8ArrayToString(message.detail.data))
          console.log('vmx: message received: topology: from, to', message.detail.from.toString(), peers)
          for (const peer of peers) {
            topology.addConnection(message.detail.from.toString(), peer)
          }
          console.log('vmx: message received: topolgy: links', topology.links)
          break
      }
    }

    libp2pNode.services.pubsub.addEventListener('message', receiveMessage)
    libp2pNode.services.pubsub.subscribe(PUBSUB_TOPIC_DATA)
    libp2pNode.services.pubsub.subscribe(PUBSUB_TOPIC_TOPOLOGY)

    libp2pNode.addEventListener('peer:discovery', (evt) => {
      console.log('vmx: Discovered %s', evt.detail.id.toString()) // Log discovered peer
    })

    libp2pNode.addEventListener('peer:connect', (evt) => {
      console.log('vmx: Connected to %s', evt.detail.toString()) // Log connected peer
    })

    //await libp2pNode.handle('/getpeers/1.0.0', async ({ stream }) => {
    //  console.log('vmx: app: handle protocol')
    //  const peers = libp2pNode.getPeers().map((peer) => peer.toString())
    //  console.log('vmx: app: getpeers protocol: peers', peers)
    //  await pipe(
    //    peers,
    //    (source) => {
    //      //return map(
    //      //  source,
    //      //  (string) => {
    //      //    return uint8ArrayFromString(string)
    //      //  }
    //      //)
    //      const mapped = map(
    //        source,
    //        (string) => {
    //          return fromString(string)
    //        }
    //      )
    //      console.log('vmx: app: getpeers protocol: mapped:', mapped)
    //      return mapped
    //    },
    //    stream
    //  )
    //})

    // Announce every minute all peers a peer is connected too.
    setInterval(async () => {
      const peers = libp2pNode.getPeers().map((peer) => peer.toString())
      const data = uint8ArrayFromString(JSON.stringify(peers))
      await libp2pNode.services.pubsub.publish(PUBSUB_TOPIC_TOPOLOGY, data)
    }, 60000)

    return libp2pNode
  }

</script>

{#await init() then libp2pNode}
  <Route path="/"><Home /></Route>
  <!--<Route path="/items"><Items /></Route>-->
  <!--<Route path="/bingo"><Bingo /></Route>-->
  <!--<Route path="/offer"><Offer {connection}/></Route>-->
  <Route path="/scan"><Scan { libp2pNode } /></Route>
  <!--<Route path="/answer"><Answer {connection}/></Route>-->
  <Route path="/connected"><Connected { libp2pNode }/></Route>
  <Route path="/topology"><Topology { libp2pNode }/></Route>
  <Route path="/map"><Map { libp2pNode }/></Route>
  <Route path="/copypaste"><Copypaste { libp2pNode }/></Route>
{/await}

<!--
<style>
:global(body) {
  margin: 0;
  padding: 0;
}
</style>
-->
