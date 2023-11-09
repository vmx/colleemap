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
  import { createHelia } from 'helia'
  import { dagCbor } from '@helia/dag-cbor'
  import { CID } from 'multiformats/cid'

  import Home from './lib/Home.svelte'
  //import Items from './lib/Items.svelte'
  //import Bingo from './lib/Bingo.svelte'
  //import Offer from './lib/Offer.svelte'
  import Scan from './lib/Scan.svelte'
  //import Answer from './lib/Answer.svelte'
  import Connected from './lib/Connected.svelte'
  import Topology from './lib/Topology.svelte'
  import Copypaste from './lib/Copypaste.svelte'
  import {
    PUBSUB_TOPIC_CIDS,
    PUBSUB_TOPIC_DATA,
    PUBSUB_TOPIC_ITEMS,
    PUBSUB_TOPIC_TOPOLOGY
  } from './constants.js'
  import { messages, selectedStore } from './stores.js'
  import topology from './lib/topology-instance.js'
  import Main from './lib/Main.svelte'
  import Bingo from './lib/Bingo.svelte'

  import './general.css'
  import './split.css'

  router.mode.hash()

  // The idea of the init function is based on
  // https://stackoverflow.com/questions/73940340/use-promise-result-for-binding/73940618#73940618
  const init = async () => {
    // TODO vmx 2023-06-21: use persisted blockstore
    const heliaNode = await createHelia({
      libp2p: {
        transports: [
          webRTCNoNat(),
        ],
        connectionEncryption: [plaintext()],
        // Make sure that it doesn't call to the outside.
        contentRouters: [],
        transportManager: {
          faultTolerance: FaultTolerance.NO_FATAL
        },
        services: {
          pubsub: gossipsub({emitSelf: true}),
          //pubsub: gossipsub(),
          identify: identifyService()
        },
        connectionManager: {
          minConnections: 0
        }
      }
    })

    const storage = dagCbor(heliaNode)

    const receiveMessage = async (message) => {
      switch (message.detail.topic) {
        case PUBSUB_TOPIC_CIDS:
          //const geoJsonFormat = new GeoJSON()
          //// In order to be able to identify features, set an ID for the whole
          //// collection. Use the PeerId for it, as we know it's unique.
          //const featureId = message.detail.from.toString()
          //
          //// When features are synchronized, first remove the old copy, then
          //// add the new ones.
          //const oldCollection = peersSource.getFeatureById(featureId)
          //peersSource.removeFeature(oldCollection)
          //
          //// We pubsub binary encoded CIDs.
          //const rootCid = CID.decode(message.detail.data)
          //console.log(`vmx: root CID received (${rootCid})`)
          //const rootData = await storage.get(rootCid)
          //const geometries = await Promise.all(rootData.map(async (cid) => {
          //  const geoJson = await storage.get(cid)
          //  const feature = geoJsonFormat.readFeature(geoJson)
          //  return feature.getGeometry()
          //}))
          //// Create a single feature, a geometry collection, out of all
          //// features. This way we can update the data easily when we get it
          //// from a peer.
          //const collection = new Feature(new GeometryCollection(geometries))
          //// In order to be able to identify features, set an ID for the whole
          //// collection. Use the PeerId for it, as we know it's unique.
          //collection.setId(featureId)
          //console.log('vmx: combined feature:', collection.getId(), collection);
          //peersSource.addFeature(collection)
          break
        case PUBSUB_TOPIC_DATA:
          console.log('vmx: message received:', message)
          const text = new TextDecoder().decode(message.detail.data)
          console.log(`vmx: message received (${message.detail.topic}): ${text}`)
          // Push the latest message to the store.
          $messages = [...$messages, text]
          console.log('vmx: messages:', $messages)
          break
        case PUBSUB_TOPIC_ITEMS:
          console.log('vmx: app: received item message:', message)
          const data = JSON.parse(new TextDecoder().decode(message.detail.data))
          console.log('vmx: app: received item message: selected: data', data)
          //const type = message.detail.data.type
          //const id = message.detail.data.id
          const peerId = message.detail.from.toString()
          //const peerId = message.detail.from
          switch (data.type) {
            case 'selected':
              console.log('vmx: app: received item message: selected: id, peerId', data.id, peerId)
              // Push the item to the store.
              if ($selectedStore[data.id] === undefined) {
                $selectedStore[data.id] = [peerId]
              } else {
                if (!$selectedStore[data.id].includes(peerId)) {
                  $selectedStore[data.id] = [...$selectedStore[data.id], peerId]
                }
              }
              break
            case 'deselected':
              if ($selectedStore[data.id] !== undefined) {
                // Remove the current PeerID from the list.
                $selectedStore[data.id] = $selectedStore[data.id].filter(
                  (selectedPeerId) => { return selectedPeerId !== peerId }
                )
              }
              break
          }
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

    heliaNode.libp2p.services.pubsub.addEventListener('message', receiveMessage)
    heliaNode.libp2p.services.pubsub.subscribe(PUBSUB_TOPIC_CIDS)
    heliaNode.libp2p.services.pubsub.subscribe(PUBSUB_TOPIC_DATA)
    heliaNode.libp2p.services.pubsub.subscribe(PUBSUB_TOPIC_TOPOLOGY)
    heliaNode.libp2p.services.pubsub.subscribe(PUBSUB_TOPIC_ITEMS)

    heliaNode.libp2p.addEventListener('peer:discovery', (evt) => {
      console.log('vmx: Discovered %s', evt.detail.id.toString()) // Log discovered peer
    })

    heliaNode.libp2p.addEventListener('peer:connect', (evt) => {
      console.log('vmx: Connected to %s', evt.detail.toString()) // Log connected peer
    })

    // Announce every minute all peers a peer is connected too.
    setInterval(async () => {
      const peers = heliaNode.libp2p.getPeers().map((peer) => peer.toString())
      const data = uint8ArrayFromString(JSON.stringify(peers))
      await heliaNode.libp2p.services.pubsub.publish(PUBSUB_TOPIC_TOPOLOGY, data)
    }, 60000)

    return { heliaNode }
  }

</script>

<svelte:head>
  <title>Bingo</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

{#await init() then { heliaNode }}
  <!--<Route path="/"><Home /></Route>-->
  <!--<Route path="/items"><Items /></Route>-->
  <!--<Route path="/bingo"><Bingo /></Route>-->
  <!--<Route path="/offer"><Offer {connection}/></Route>-->
  <Route path="/"><Scan { heliaNode } /></Route>
  <!--<Route path="/answer"><Answer {connection}/></Route>-->
  <Route path="/connected"><Connected { heliaNode }/></Route>
    <Route path="/topology"><Topology { heliaNode }/></Route>
    <Route path="/bingo"><Bingo { heliaNode } /></Route>
  <Route path="/copypaste"><Copypaste { heliaNode } /></Route>
  <Route path="/main"><Main /></Route>
{/await}

