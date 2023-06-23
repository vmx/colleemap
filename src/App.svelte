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
  import Map from './lib/Map.svelte'
  import Copypaste from './lib/Copypaste.svelte'
  import { PUBSUB_TOPIC_CIDS, PUBSUB_TOPIC_DATA, PUBSUB_TOPIC_TOPOLOGY } from './constants.js'
  import { messages } from './stores.js'
  import topology from './lib/topology-instance.js'
  import Main from './lib/Main.svelte'

  import { Map as OlMap, View } from "ol";
  import VectorTile from "ol/layer/VectorTile";
  import { PMTilesVectorSource } from "ol-pmtiles";
  import { Style, Stroke, Fill } from 'ol/style';
  import { useGeographic } from 'ol/proj';
  import { Vector as VectorSource } from 'ol/source';
  import { Vector as VectorLayer } from 'ol/layer';
  import Draw from 'ol/interaction/Draw'
  import Polygon from 'ol/geom/Polygon'
  import GeoJSON from 'ol/format/GeoJSON'
  import { createRegularPolygon } from 'ol/interaction/Draw';
  import GeometryCollection from 'ol/geom/GeometryCollection'
  import Feature from 'ol/Feature'

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


  const peersSource = new VectorSource({ wrapX: false })
  const peersLayer = new VectorLayer({
    source: peersSource,
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(89,53,16,0.8)',
          width: 1,
        }),
        fill: new Fill({
          color: 'rgba(246,158,02,0.5)',
        })
      })
  })

  const initMap = async () => {
    useGeographic()

    const backgroundLayer = new VectorTile({
      declutter: true,
      source: new PMTilesVectorSource({
        //url: "https://r2-public.protomaps.com/protomaps-sample-datasets/nz-buildings-v3.pmtiles",
        url: '/kosovo.pmtiles',
        attributions: ["Map data © OpenStreetMap contributors (ODbL)"]
      }),
      style: new Style({
        stroke: new Stroke({
          color: 'gray',
          width: 1,
        }),
        fill: new Fill({
          color: 'rgba(20,20,20,0.9)',
        })
      })
    })

    const drawingSource = new VectorSource({ wrapX: false })
    const drawingLayer = new VectorLayer({
      source: drawingSource,
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(34,85,179,0.9)',
          width: 1,
        }),
        fill: new Fill({
          color: 'rgba(222,222,222,0.7)',
        })
      })
    });

    const map = new OlMap({
      layers: [backgroundLayer, peersLayer, drawingLayer],
      view: new View({
        center: [20.739167, 42.212778],
        zoom: 12
      })
    })
    // Add a reference to the drawing source, so that we can later
    // enable/disable the drawing interaction on it.
    map.drawingSource = drawingSource
    // Add a reference to the drawing layer, so that we can restrict the select
    // interaction on it.
    map.drawingLayer = drawingLayer
    return map
  }



  // The idea of the init function is based on
  // https://stackoverflow.com/questions/73940340/use-promise-result-for-binding/73940618#73940618
  const init = async () => {
    //// Create two connections, one will be used to initiate a connection to the
    //// other peer, and the other one will be used to connect to another peer
    //// that initiated the connection.
    //const initiator = await createConnection()
    //const receiver = await createConnection()
    //return { initiator, receiver }

    //const libp2pNode = await createLibp2p({
    //  transports: [
    //    webRTCNoNat(),
    //  ],
    //  connectionEncryption: [plaintext()],
    //  transportManager: {
    //    faultTolerance: FaultTolerance.NO_FATAL
    //  },
    //  services: {
    //    pubsub: gossipsub({
    //      emitSelf: true
    //    }),
    //    identify: identifyService()
    //  },
    //  connectionManager: {
    //    minConnections: 0
    //  }
    //})

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
          pubsub: gossipsub(),
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
          const geoJsonFormat = new GeoJSON()
          // In order to be able to identify features, set an ID for the whole
          // collection. Use the PeerId for it, as we know it's unique.
          const featureId = message.detail.from.toString()

          // When features are synchronized, first remove the old copy, then
          // add the new ones.
          const oldCollection = peersSource.getFeatureById(featureId)
          peersSource.removeFeature(oldCollection)

          // We pubsub binary encoded CIDs.
          const rootCid = CID.decode(message.detail.data)
          console.log(`vmx: root CID received (${rootCid})`)
          const rootData = await storage.get(rootCid)
          const geometries = await Promise.all(rootData.map(async (cid) => {
            const geoJson = await storage.get(cid)
            const feature = geoJsonFormat.readFeature(geoJson)
            return feature.getGeometry()
          }))
          // Create a single feature, a geometry collection, out of all
          // features. This way we can update the data easily when we get it
          // from a peer.
          const collection = new Feature(new GeometryCollection(geometries))
          // In order to be able to identify features, set an ID for the whole
          // collection. Use the PeerId for it, as we know it's unique.
          collection.setId(featureId)
          console.log('vmx: combined feature:', collection.getId(), collection);
          peersSource.addFeature(collection)
          break
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

    heliaNode.libp2p.services.pubsub.addEventListener('message', receiveMessage)
    heliaNode.libp2p.services.pubsub.subscribe(PUBSUB_TOPIC_CIDS)
    heliaNode.libp2p.services.pubsub.subscribe(PUBSUB_TOPIC_DATA)
    heliaNode.libp2p.services.pubsub.subscribe(PUBSUB_TOPIC_TOPOLOGY)

    heliaNode.libp2p.addEventListener('peer:discovery', (evt) => {
      console.log('vmx: Discovered %s', evt.detail.id.toString()) // Log discovered peer
    })

    heliaNode.libp2p.addEventListener('peer:connect', (evt) => {
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

    const map = await initMap()

    // Announce every minute all peers a peer is connected too.
    setInterval(async () => {
      const peers = heliaNode.libp2p.getPeers().map((peer) => peer.toString())
      const data = uint8ArrayFromString(JSON.stringify(peers))
      await heliaNode.libp2p.services.pubsub.publish(PUBSUB_TOPIC_TOPOLOGY, data)
    }, 60000)

    return { heliaNode, map }
  }

</script>

{#await init() then { heliaNode, map }}
  <!--<Route path="/"><Home /></Route>-->
  <!--<Route path="/items"><Items /></Route>-->
  <!--<Route path="/bingo"><Bingo /></Route>-->
  <!--<Route path="/offer"><Offer {connection}/></Route>-->
  <Route path="/"><Scan { heliaNode } /></Route>
  <!--<Route path="/answer"><Answer {connection}/></Route>-->
  <Route path="/connected"><Connected { heliaNode }/></Route>
    <Route path="/topology"><Topology { heliaNode }/></Route>
    <Route path="/map"><Map { heliaNode } { map } /></Route>
  <Route path="/copypaste"><Copypaste { heliaNode } /></Route>
  <Route path="/main"><Main /></Route>
{/await}

<!--
<style>
:global(body) {
  margin: 0;
  padding: 0;
}
</style>
-->
