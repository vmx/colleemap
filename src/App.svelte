<script>
  import { onMount } from 'svelte';
  import { Route } from 'tinro';

  import Home from './lib/Home.svelte'
  //import Items from './lib/Items.svelte'
  //import Bingo from './lib/Bingo.svelte'
  //import Offer from './lib/Offer.svelte'
  import Scan from './lib/Scan.svelte'
  //import Answer from './lib/Answer.svelte'
  //import Connected from './lib/Connected.svelte'

  const createConnection = async () => {
    const certificate = await RTCPeerConnection.generateCertificate({
      name: 'ECDSA',
      namedCurve: 'P-256',
      hash: 'SHA-256',
    })

    console.log('vmx: certificate:', certificate)
    const connection = new RTCPeerConnection({certificates: [certificate]})
    console.log('vmx: connection is set:', connection)

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
      //dataChannel.send("This message was sent as a data channel was opened")
    })
    dataChannel.addEventListener('message', (event) => {
      console.log(`vmx: data channel received:`, event.data)
    })

    return { connection, dataChannel }
  }

  // The idea of the init function is based on
  // https://stackoverflow.com/questions/73940340/use-promise-result-for-binding/73940618#73940618
  const init = async () => {
    // Create two connections, one will be used to initiate a connection to the
    // other peer, and the other one will be used to connect to another peer
    // that initiated the connection.
    const initiator = await createConnection()
    const receiver = await createConnection()
    return { initiator, receiver }
  }
</script>

{#await init() then { initiator, receiver }}
  <Route path="/"><Home /></Route>
  <!--<Route path="/items"><Items /></Route>-->
  <!--<Route path="/bingo"><Bingo /></Route>-->
  <!--<Route path="/offer"><Offer {connection}/></Route>-->
  <Route path="/scan"><Scan { initiator } { receiver }/></Route>
  <!--<Route path="/answer"><Answer {connection}/></Route>-->
  <!--<Route path="/connected"><Connected {connection}/></Route>-->
{/await}
