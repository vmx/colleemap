<script>
  import { onMount } from 'svelte'

  import QrScanner from 'qr-scanner'
  import { router } from 'tinro'

  export let connection

  let video

  //const generateAnswer = async (sdp) => {
  //  await connection.setRemoteDescription({
  //    type: "offer",
  //    sdp
  //  })
  //}

  const parseData = async (data) => {
    const type = data[0]
    const sdp = data.substr(1)

    switch (type) {
      case 'O':
        //await generateAnswer(sdp)
        await connection.setRemoteDescription({
          type: "offer",
          sdp
        })
        // TODO vmx 2022-09-22: see if there's a svelter way to do it.
        router.goto('/answer')
        break
      case 'A':
        await acceptAnswer(sdp)
        break
      default:
        console.log('Cannot parse QR Code.')
    }
  }
    //await peerConnection.setRemoteDescription(offer);
    //let answer = await peerConnection.createAnswer();
    //await peerConnection.setLocalDescription(answer);

  onMount(async () => {
    const qrScanner = new QrScanner(
      video,
      (result) => {
        console.log('decoded QR Code is:', result)
        parseData(result.data)
        // TODO vmx 2022-09-21: destroy qr code scanner when read correctly
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true
      }
    )
    await qrScanner.setCamera('environment')
    qrScanner.start()
  })
</script>

<h1>Scan</h1>

<video bind:this={video}></video>

<style>
  video {
    display: block;
    height: 50%;
    margin: auto;
    width: 75%;
  }
</style>
