<script>
  import { router } from 'tinro'

  import { name } from '../stores.js'

  const submit = (event) => {
    event.preventDefault()

    if ($name) {
      router.goto('/scan')
    }
  }
</script>

<!--<form id="container" on:submit|preventDefault={() => { router.goto('/scan')}}>-->
<form id="container" on:submit={submit}>
  <div id="name">
    <input type="text" placeholder="Your name" bind:value={$name} />
  </div>
  <div>
    <button type="submit">Next</button>
  </div>
</form>

<style>
  #name {
    display: flex;
  }
  input {
    font-size: 10vmin;
    width: 100%;
  }
  button {
    background-color: #f69e02;
    border: none;
    font-size: 10vmin;
    width: 100%;
    height: 100%;
  }
</style>

<!--
<a href="/items">Add items</a>
<a href="/offer">Offer</a>
<a href="/scan">Scan</a>
-->
