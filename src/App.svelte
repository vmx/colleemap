<script>
  import {Route} from 'tinro';

  import Home from './lib/Home.svelte'
  import Items from './lib/Items.svelte'
  import Bingo from './lib/Bingo.svelte'
  import Offer from './lib/Offer.svelte'
  import Scan from './lib/Scan.svelte'
  import Answer from './lib/Answer.svelte'
  import Connected from './lib/Connected.svelte'

  const connection = new RTCPeerConnection()

  connection.addEventListener('iceconnectionstatechange', (event) => {
    console.log('iceconnectionstatechange: gathering state:', event.target.iceGatheringState)
  })

  connection.addEventListener("icecandidate", (event) => {
    console.log('vmx: icecandidates event: candidate:', event.candidate)
  })

  const dataChannel = connection.createDataChannel("data-channel", {
    negotiated: true,
    id: 0
  })
  dataChannel.addEventListener("open", (event) => {
    console.log('vmx: data channel opened')
  })

</script>

<Route path="/"><Home /></Route>
<Route path="/items"><Items /></Route>
<Route path="/bingo"><Bingo /></Route>
<Route path="/offer"><Offer {connection}/></Route>
<Route path="/scan"><Scan {connection}/></Route>
<Route path="/answer"><Answer {connection}/></Route>
<Route path="/connected"><Connected {connection}/></Route>
