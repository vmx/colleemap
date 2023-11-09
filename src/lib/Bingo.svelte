<script>
  //import { derived } from "svelte/store";

  import { dagCbor } from '@helia/dag-cbor'

  import { ITEMS, PUBSUB_TOPIC_ITEMS } from '../constants.js'
  import { selectedStore } from '../stores.js'

  export let heliaNode

  const peerId = heliaNode.libp2p.peerId.toString()

  //// The code is based on
  //// https://stackoverflow.com/questions/16801687/javascript-random-ordering-with-seed/53758827#53758827
  //// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
  //const shuffle = (input, seed) => {
  //  const output = []
  //  for (let i = input.length - 1; i > 0; i--) {
  //    // Create a random number with a seed.
  //    const x = Math.sin(seed) * 10000
  //    const random = x - Math.floor(x)
  //
  //    // Do the shuffle.
  //    const j = Math.floor(Math.random() * (i + 1))
  //    //;[array[i], array[j]] = [array[j], array[i]]
  //    ;[output[i], output[j]] = [input[j], input[i]]
  //  }
  //  return output
  //}

  // The code is based on
  // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array/46545530#46545530
  // https://stackoverflow.com/questions/16801687/javascript-random-ordering-with-seed/53758827#53758827
  const shuffle = (input, seed) => {
    return input
      .map((value, ii) => {
        // Create a random number with a seed.
        const xx = Math.sin(seed + ii) * 10000
        const random = xx - Math.floor(xx)

        return ({ value, sort: random })
      })
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
  }

  const storage = dagCbor(heliaNode)
  // TODO vmx 2023-11-08: use PeerID as seed
  const items = shuffle(ITEMS, 123)
  console.log('items:', items)
  console.log('ITEMS:', ITEMS)

  const itemClicked = async (item) => {
    console.log('vmx: bingi: item clcked: item:', item)
    const selectedItem = $selectedStore[item.id]
    let eventType
    if (selectedItem !== undefined && selectedItem.includes(peerId)) {
      eventType = 'deselected'
    } else {
      eventType = 'selected'
    }
    let encoded = new TextEncoder().encode(JSON.stringify({
      type: eventType,
      id: item.id
    }))
    await heliaNode.libp2p.services.pubsub.publish(PUBSUB_TOPIC_ITEMS, encoded)
  }

  //const selectedItems = derived(
  //  [selectedStore],
  //  ([$selectedStore]) => {
  //    return items.map((item) => {
  //      console.log('vmx: bingo: item loop: id:', item.id)
  //      const selectedItem = $selectedStore[item.id]
  //      if (selectedItem !== undefined) {
  //        // It was selected by yourself.
  //        if (selectedItem.includes(heliaNode.libp2p.peerId)) {
  //          // And it was selected by at least another peer.
  //          if (selectedItem.length >= 2) {
  //            return 'confirmed'
  //          } else {
  //            return 'selected'
  //          }
  //        }
  //      }
  //      return ''
  //    })
  //  }
  //)


  let derived

  // "selected" means that the user themself selected the item.
  // "confirmed" means that at least another peer also selected it.
  $: {
    //for (const [id, peerIds] of Object.entries($selectedStore)) {
    //  console.log('vmx: looping through selected items: id, peerIds:', id, peerIds)
    //  //GO ON HERE and select those items
    //}
    //derived.push('')
    //derived.push('selected')
    console.log('vmx: bingo: selected store:', $selectedStore)
    // Loop through all items in the order they are currently displayed and
    // select them based on libp2p messages that were sent around.
    derived = items.map((item) => {
      console.log('vmx: bingo: item loop: id:', item.id)
      const selectedItem = $selectedStore[item.id]
      if (selectedItem !== undefined) {
        // It was selected by yourself.
        if (selectedItem.includes(peerId)) {
          // And it was selected by at least another peer.
          if (selectedItem.length >= 2) {
            return 'confirmed'
          } else {
            return 'selected'
          }
        }
      }
      return ''
    })
    console.log('vmx: bing: derived:', derived)
  }

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
  //<td on:click={() => itemClicked(item)} class:selected={$selectedStore[ii].length > 0}>{item.text}</td>
</script>

<div id="container">
  <div>
    <table id="bingo">
      <tr>
        {#each items as item, ii}
          {#if ii >= 0 && ii < 5}
            <td on:click={() => itemClicked(item)} class={derived[ii]}>{item.text}</td>
          {/if}
        {/each}
      </tr>
      <tr>
        {#each items as item, ii}
          {#if ii >= 5 && ii < 10}
            <td on:click={() => itemClicked(item)} class={derived[ii]}>{item.text}</td>
          {/if}
        {/each}
      </tr>
      <tr>
        {#each items as item, ii}
          {#if ii >= 10 && ii < 15}
            <td on:click={() => itemClicked(item)} class={derived[ii]}>{item.text}</td>
          {/if}
        {/each}
      </tr>
      <tr>
        {#each items as item, ii}
          {#if ii >= 15 && ii < 20}
            <td on:click={() => itemClicked(item)} class={derived[ii]}>{item.text}</td>
          {/if}
        {/each}
      </tr>
      <tr>
        {#each items as item, ii}
          {#if ii >= 20 && ii < 25}
            <td on:click={() => itemClicked(item)} class={derived[ii]}>{item.text}</td>
          {/if}
        {/each}
      </tr>
    </table>
  </div>
  <div>
    <a href="/main">Back</a>
  </div>
</div>

<style>
  a {
    text-decoration: none;
  }

  #container > div {
    background-color: #f69e02;
    display: table;
    padding: 0;
  }

  #container > div a {
    display: table-cell;
    font-size: 10vmin;
    text-align: center;
    vertical-align: middle;
  }

  #container > div > p > a {
    border: 3vmin solid #fff;
  }

  #container > div > p {
    display: table-row;
  }

  table {
    height: 100%;
    width: 100%;
    background-color: #ddd;
    border-collapse: separate;
    border-spacing: 2px;
  }

  table tr {
    height: 20%;
  }

  table td {
    width: 20%;
    background-color: #fff;
    text-align: center;
  }

  table td:hover {
    cursor: pointer;
  }

  #bingo2 {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-auto-rows: 1fr;
    margin: 0 auto;
  }

  .selected {
    background-color: #f69e02;
    font-weight: bold;
  }

  .confirmed {
    background-color: #25a;
    color: #fff;
    font-weight: bold;
  }
</style>
