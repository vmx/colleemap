<script>
  import navaid from 'navaid'

  import Home from './lib/Home.svelte'
  import Items from './lib/Items.svelte'
  import Bingo from './lib/Bingo.svelte'

  let component = Home;

  navaid()
    .on('/', () => {
      component = Home
    })
    .on('/items', () => {
      component = Items
    })
    .on('/bingo', () => {
      component = Bingo
    })
    .listen()
</script>

<svelte:component this={component} />
