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
  import Select from 'ol/interaction/Select'

  import { PUBSUB_TOPIC_CIDS } from '../constants.js'
  //import kosovoData from '../kosovo.pmtiles'

  export let heliaNode
  export let map

  //let map
  let activeDrawing = false
  let activeDelete = false


  const storage = dagCbor(heliaNode)

  const drawingInteraction = new Draw({
    source: map.drawingSource,
    type: 'Circle',
    // TODO vmx 2023-06-21: find a way to make it non-free hand on non-touch devices
    freehand: true,
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

  // TODO vmx 2023-06-21: it would be nicer if the feature would be selected
  // first and then deleted on a second click.
  const selectInteraction = new Select({
    wrapX: false,
  });

  selectInteraction.on('select', (event) => {
    console.log('vmx: feature selected:', event)
    let feature = event.selected[0]
    map.drawingSource.removeFeature(feature)
  })

  const toggleDelete = () => {
    const interaction = map.removeInteraction(selectInteraction)
    if (interaction === undefined) {
      map.addInteraction(selectInteraction)
      activeDelete = true;
    } else {
      activeDelete = false;
    }
  }

  const syncFeatures = async () => {
    let geojsonFormat = new GeoJSON()
    const features = map.drawingSource.getFeatures()
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

  const setMap = (node) => {
    map.setTarget(node.id)
  }
</script>

<div id="container">
  <div>
    <p><a href="/scan">Scan another peer</a></p>
    <p><a href="/topology">Topology</a></p>
    <button on:click|preventDefault={toggleDrawing} class:active={activeDrawing}>Draw</button>
    <button on:click|preventDefault={toggleDelete} class:active={activeDelete}>Delete</button>
    <button on:click|preventDefault={syncFeatures}>Sync features</button>
  </div>
  <div id="mymap" use:setMap></div>
</div>

<style>
  button {
    background-color: #f69e02;
  }

  .active {
    background-color: #029ef6;
  }
</style>
