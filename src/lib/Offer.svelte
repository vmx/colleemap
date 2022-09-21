<script>
  import QR from 'svelte-qr'

  export let connection

  let data = (async () => {
    const offer = await connection.createOffer()
    console.assert(offer.type === 'offer', 'SDP type is an offer')
    await connection.setLocalDescription(offer)
    // Prefix the SDP with the type. Use a single letter, `O` for offer.
    return 'O' + offer.sdp
  })()


  //const sdp = 'v=0\\r\\no=mozilla...THIS_IS_SDPARTA-99.0 2620878450409659912 0 IN IP4 0.0.0.0\\r\\ns=-\\r\\nt=0 0\\r\\na=fingerprint:sha-256 6A:48:EC:74:17:27:74:17:C5:4E:76:0E:71:2D:AD:19:AF:10:E9:9A:76:3D:AC:EB:FF:B2:DC:00:93:A8:0F:E8\\r\\na=group:BUNDLE 0\\r\\na=ice-options:trickle\\r\\na=msid-semantic:WMS *\\r\\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\\r\\nc=IN IP4 0.0.0.0\\r\\na=sendrecv\\r\\na=ice-pwd:b62fa452fcf2ff9d2212fc7ec80c248f\\r\\na=ice-ufrag:bb88b101\\r\\na=mid:0\\r\\na=setup:actpass\\r\\na=sctp-port:5000\\r\\na=max-message-size:1073741823\\r\\n'
</script>

<h1>Offer</h1>

<div class="qrcode">
  <!--
  <QR text={data} level="L" />
  -->
{#await data}
  Waiting for WebRTC offer.
{:then resolved}
  <QR text={resolved} level="L" />
{/await}
</div>

<style>
  .qrcode {
    height: 256px;
    width: 256px;
  }
</style>
