<script>
  import {Route} from 'tinro';

  import Home from './lib/Home.svelte'
  import Items from './lib/Items.svelte'
  import Bingo from './lib/Bingo.svelte'
  import Offer from './lib/Offer.svelte'
  import Scan from './lib/Scan.svelte'
  import Answer from './lib/Answer.svelte'

  const connection = new RTCPeerConnection()
  connection.createDataChannel("data-channel")
</script>

<Route path="/"><Home /></Route>
<Route path="/items"><Items /></Route>
<Route path="/bingo"><Bingo /></Route>
<Route path="/offer"><Offer {connection}/></Route>
<Route path="/scan"><Scan {connection}/></Route>
<Route path="/answer"><Answer {connection}/></Route>
