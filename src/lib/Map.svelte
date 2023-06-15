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

  import kosovoData from '../kosovo.pmtiles'

  export let libp2pNode

  let map
  let activeDrawing = false

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
    //geometryFunction: geometryFunction,
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

  const syncFeatures = () => {
    const features = drawingSource.getFeatures()
    console.log('vmx: syncing features:', features)
  }

  const initMap = (node) => {
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
