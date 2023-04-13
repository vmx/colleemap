<script>
  //import { messages, name } from '../stores.js'
  import { pipe } from 'it-pipe'
  import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

  export let libp2pNode

  const init = async () => {
    const peers = libp2pNode.getPeers()

    console.log('vmx: topology: peers:', peers);

    for (const peer of peers) {
      const stream = await libp2pNode.dialProtocol(peer, '/getpeers/1.0.0')
      console.log('vmx: topology: getpeers: peer, stream:', peer, stream)
      pipe(
        stream,
        async (source) => {
          for await (const data of source) {
            const peer = uint8ArrayToString(data.subarray())
            console.log('vmx: topology: peer:', peer)
          }
        }
      )
    }
  }
</script>

<h1>Topology</h1>

{#await init()}
{/await}
