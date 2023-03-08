<script>
  import { messages, name } from '../stores.js'

  export let libp2pNode

  let messageToSend
  let messagesReceived

  // TODO vmx 2023-01-31: Define `TOPIC` only once centrally.
  const TOPIC = 'data-exchange'

  let sendPing = async () => {
    console.log('vmx: trying to ping to')

    const encoded = new TextEncoder().encode(`${$name}: ${messageToSend}`)
    await libp2pNode.pubsub.publish(TOPIC, encoded)

    messageToSend = ''
  }

  messages.subscribe((value) => {
    console.log('vmx: connected: messages store: subscribe: value:', value)
    messagesReceived = value
  })
</script>

<h1>Send message to others</h1>

<form on:submit|preventDefault={sendPing}>
  <p><input type="text" placeholder="Your message" bind:value={messageToSend} /></p>
  <p><button type="submit">Send</button></p>
</form>

<h2>Messages</h2>

<ul>
  {#each messagesReceived as messageReceived}
    <li>{messageReceived}</li>
  {/each}
</ul>

<hr />

<p><a href="/scan">Scan another peer</a></p>




