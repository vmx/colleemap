<script>
  import { router } from 'tinro'

  import { name } from '../stores.js'

  const next = () => {
    router.goto('/scan')
  }
</script>

<h1>Get started</h1>

<form on:submit|preventDefault={() => { router.goto('/scan')}}>
  <p><input type="text" placeholder="Your name" bind:value={$name} /></p>
  <p><button type="submit">Next</button></p>
</form>


<!--
<a href="/items">Add items</a>
<a href="/offer">Offer</a>
<a href="/scan">Scan</a>
-->
