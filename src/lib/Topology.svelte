<script>
  //import { messages, name } from '../stores.js'
  import { pipe } from 'it-pipe'
  import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

  import { Topology, PeersQueue } from '../topology.js'

  export let libp2pNode

  const topology = new Topology()
  const queue = new PeersQueue(libp2pNode.getPeers())

  const init = async () => {
    while (!queue.isEmpty()) {
      const peerToDial = queue.pop()
      const stream = await libp2pNode.dialProtocol(
        peerToDial, '/getpeers/1.0.0')
      console.log('vmx: topology: peer to dial:', peerToDial)
      pipe(
        stream,
        async (source) => {
          for await (const data of source) {
            const newPeer = uint8ArrayToString(data.subarray())
            console.log('vmx: topology: peer:', newPeer)

            topology.addConnection(peerToDial, newPeer)
            queue.add(newPeer)
          }
        }
      )
    }
  }
</script>

<h1>Topology</h1>

{#await init()}
{/await}
