<script>
  import { Map, View } from "ol";
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
  import * as Block from 'multiformats/block'
  import * as codec from '@ipld/dag-cbor'
  import { sha256 as hasher } from 'multiformats/hashes/sha2'
  import { dagCbor } from '@helia/dag-cbor'

  import { PUBSUB_TOPIC_CIDS } from '../constants.js'
  import kosovoData from '../kosovo.pmtiles'

  export let heliaNode

  let map
  let activeDrawing = false


  let helia
  const storage = dagCbor(heliaNode)


  const backgroundLayer = new VectorTile({
    declutter: true,
    source: new PMTilesVectorSource({
      //url: "https://r2-public.protomaps.com/protomaps-sample-datasets/nz-buildings-v3.pmtiles",
      url: kosovoData,
      attributions: ["Map data © OpenStreetMap contributors (ODbL)"]
    }),
    style: new Style({
      stroke: new Stroke({
        color: "gray",
        width: 1,
      }),
      fill: new Fill({
        color: "rgba(20,20,20,0.9)",
      })
    })
  })


  const drawingSource = new VectorSource({ wrapX: false })
  const drawingLayer = new VectorLayer({
    source: drawingSource,
  });
  const drawingInteraction = new Draw({
    source: drawingSource,
    type: 'Circle',
    geometryFunction: createRegularPolygon(6),
  })



  const toggleDrawing = () => {
    const interaction = map.removeInteraction(drawingInteraction)
    if (interaction === undefined) {
      map.addInteraction(drawingInteraction)
      activeDrawing = true;
    } else {
      activeDrawing = false;
    }
  }

  const syncFeatures = async () => {
    let geojsonFormat = new GeoJSON()
    const features = drawingSource.getFeatures()
    console.log('vmx: syncing features:', features)
    //let blocks = await Promise.all(features.map(async (feature) => {
    //  //console.log('vmx: feature geom:', geojsonFormat.writeFeature(feature))
    //  let geoJson = geojsonFormat.writeFeatureObject(feature)
    //  console.log('vmx: feature geojson:', geoJson)
    //  let block = await Block.encode({ value: geoJson, codec, hasher })
    //  return block
    //}))
    //console.log('vmx: blocks:', blocks)
    let cids = await Promise.all(features.map(async (feature) => {
      let geoJson = geojsonFormat.writeFeatureObject(feature)
      console.log('vmx: geojson:', geoJson)
      return storage.add(geoJson)
    }))
    console.log('vmx: cids:', cids)
    // Create a single root CID, pointing to all others.
    const rootCid = await storage.add(cids)
    await heliaNode.libp2p.services.pubsub.publish(PUBSUB_TOPIC_CIDS, rootCid.bytes)
  }

  const initMap = async (node) => {
    map = new Map({
      layers: [backgroundLayer, drawingLayer],
      target: node.id,
      view: new View({
        center: [20.739167, 42.212778],
        zoom: 12
      })
    })

    return {
      destory() {
        if (map) {
          map.setTarget(undefined)
        }
      }
    }
  }

  useGeographic();
</script>

<div id="container">
  <div>
    <p><a href="/scan">Scan another peer</a></p>
    <p><a href="/connected">Chat</a></p>
    <button on:click|preventDefault={toggleDrawing} class:active={activeDrawing}>Draw</button>
    <button on:click|preventDefault={syncFeatures}>Sync features</button>
  </div>
  <div id="map" use:initMap></div>
</div>

<style>
  button {
    background-color: #f69e02;
  }

  .active {
    background-color: #029ef6;
  }
</style>
