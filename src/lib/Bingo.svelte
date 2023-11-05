<script>
  import { PUBSUB_TOPIC_CIDS } from '../constants.js'

  export let heliaNode

  const storage = dagCbor(heliaNode)

  //const syncFeatures = async () => {
  //  activeSync = true
  //  let geojsonFormat = new GeoJSON()
  //  const features = map.drawingSource.getFeatures()
  //  console.log('vmx: syncing features:', features)
  //  let cids = await Promise.all(features.map(async (feature) => {
  //    let geoJson = geojsonFormat.writeFeatureObject(feature)
  //    console.log('vmx: geojson:', geoJson)
  //    return storage.add(geoJson)
  //  }))
  //  console.log('vmx: cids:', cids)
  //  // Create a single root CID, pointing to all others.
  //  const rootCid = await storage.add(cids)
  //  await heliaNode.libp2p.services.pubsub.publish(PUBSUB_TOPIC_CIDS, rootCid.bytes)
  //}
</script>

<div id="container">
  <div id="actions">
    This is where the bingo is
  </div>
  <div>
    <a href="/main">Back</a>
  </div>
</div>

<style>
</style>
