<script>
  //import { afterUpdate } from 'svelte'

  // The item of the input box.
  let newItem = ''

  let items = [
    { "text": "Wand" },
    { "text": "Klavier" },
    { "text": "Minion" }
  ]

  const addItem = () => {
    items = [...items, { text: newItem }]
    newItem = ''
  }

  //afterUpdate(() => {
  //  document.querySelector('#add-item')
  //})
</script>


<form on:submit|preventDefault={addItem}>
  <input type="text" placeholder="Enter item name" id="add-item" bind:value={newItem} />
</form>

<ul>
{#each items as item}
  <li>{item.text}</li>
{/each}
</ul>
