<script>
  //import { derived } from "svelte/store";

  import { dagCbor } from '@helia/dag-cbor'

  import { ITEMS, PUBSUB_TOPIC_BINGO } from '../constants.js'
  import { selectedStore, winnersStore, name } from '../stores.js'

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
  const shuffle = (input) => {
    // Use the random bytes of the PeerID as randomness.
    const randomBytes = heliaNode.libp2p.peerId.multihash.digest.slice(4)
    return input
      .map((value, ii) => {
        return ({ value, sort: randomBytes[ii] })
      })
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
  }

  const storage = dagCbor(heliaNode)
  const items = shuffle(ITEMS)
  console.log('items:', items)
  console.log('ITEMS:', ITEMS)

  // Encodes JSON as ArrayBuffer
  const encodeJson = (data) => {
    return new TextEncoder().encode(JSON.stringify(data))
  }

  const itemClicked = async (item) => {
    console.log('vmx: bingi: item clcked: item:', item)
    const selectedItem = $selectedStore[item.id]
    let eventType
    if (selectedItem !== undefined && selectedItem.includes(peerId)) {
      eventType = 'deselected'
    } else {
      eventType = 'selected'
    }
    const encoded = encodeJson({ type: eventType, id: item.id })
    await heliaNode.libp2p.services.pubsub.publish(PUBSUB_TOPIC_BINGO, encoded)
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


  // An array of offsets that would be a valid Bingo (a line of 5
  // subsequent horizontally, vertically or diagonally connected items)
  const POSSIBLE_BINGOS = [
    // Horizontal.
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    // Vertical.
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    // Diagonal.
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20]
  ]

  // These three consts simulate and enum containing the status of a selected
  // item. If no-one selected it it's `NONE` if only you selected it it's
  // `SELECTED` and if you and at least someone else selected it it's
  // 'CONFIRMED`.
  const SELECTED_NONE = 0
  const SELECTED_SELECTED = 1
  const SELECTED_CONFIRMED = 2

  // Returns the status of a given value (a list of peerIds) from the
  // `$selectedStore`.
  const selectedItemStatus = (selectedItem) => {
    if (selectedItem !== undefined) {
      // It was selected by yourself.
      if (selectedItem.includes(peerId)) {
        // And it was selected by at least another peer.
        if (selectedItem.length >= 2) {
          return SELECTED_CONFIRMED
        } else {
          return SELECTED_SELECTED
        }
      }
    }
    return SELECTED_NONE
  }

  // Checks at the given array offsets, whether you and someone else have
  // selected all of those items at one of the list of offsets.
  const isBingo = (offsets) => {
    for (const possibleBingo of offsets) {
      const allConfirmed = possibleBingo.every((offset) => {
        const selectedItem = $selectedStore[items[offset].id]
        return selectedItemStatus(selectedItem) === SELECTED_CONFIRMED
      })
      if (allConfirmed === true) {
        return true
      }
    }
    return false
  }

  let derived
  //let youHaveWon

  // "selected" means that the user themself selected the item.
  // "confirmed" means that at least another peer also selected it.
  $: {
    // Loop through all items in the order they are currently displayed and
    // select them based on libp2p messages that were sent around.
    derived = items.map((item) => {
      const selectedItem = $selectedStore[item.id]
      switch(selectedItemStatus(selectedItem)) {
        case SELECTED_NONE:
          return ''
        case SELECTED_SELECTED:
          return 'selected'
        case SELECTED_CONFIRMED:
          return 'confirmed'
      }
    })
    console.log('vmx: bing: derived:', derived)

    const youHaveWon = isBingo(POSSIBLE_BINGOS)
    if (youHaveWon) {
      const encoded = encodeJson({ type: 'bingo', name: $name })
      // `publish` is an async function, awaiting won't work directly, but we
      // also don't really need to await, in this case "fire and forget" is
      // good enough.
      heliaNode.libp2p.services.pubsub.publish(PUBSUB_TOPIC_BINGO, encoded)
    }
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
  <div id="aux">
    <a href="/main">Back</a>
    <ul>
      {#each $winnersStore as winner}
      <li>{winner} has a bingo!</li>
      {/each}
    </ul>
  </div>
</div>

<style>
  a {
    text-decoration: none;
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

  .selected {
    background-color: #f69e02;
    font-weight: bold;
  }

  .confirmed {
    background-color: #25a;
    color: #fff;
    font-weight: bold;
  }

  #aux {
    display: grid;
    gap: 2vmin;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  @media (orientation: landscape) {
    #aux {
      grid-auto-flow: row;
    }
  }

  @media (orientation: portrait) {
    #aux {
      grid-auto-flow: column;
    }
  }

  #aux > * {
    align-items: center;
    display: grid;
    font-size: 5vmin;
    justify-items: center;
  }
</style>
