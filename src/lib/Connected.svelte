<script>
  export let libp2pNode

  // TODO vmx 2023-01-31: Define `TOPIC` only once centrally.
  const TOPIC = 'data-exchange'

  console.log('vmx: connected:', libp2pNode)

  let sendPing = async () => {
    console.log('vmx: trying to ping to')

    const message = new TextEncoder().encode('sending a ping.')
    await libp2pNode.pubsub.publish(TOPIC, message)
  }
</script>

<h1>Connected</h1>

<div on:click={sendPing}>Connected to peer xyz. Click to send a ping to the other peer.</div>
