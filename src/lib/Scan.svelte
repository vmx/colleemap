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

  // Returns the route where to go next
  const parseData = async (data) => {
    const [offerOrAnswer, ...iceCandidates] = JSON.parse(data)
    const type = offerOrAnswer[0]
    const sdp = offerOrAnswer.substr(1)

    switch (type) {
      case 'O':
        //await generateAnswer(sdp)
        await connection.setRemoteDescription({
          type: "offer",
          sdp
        })

        iceCandidates.forEach(async (iceCandidate) => {
          console.log('about to add ice candidate:', iceCandidate)
          await connection.addIceCandidate(iceCandidate)
          //await connection.addIceCandidate('foobarbaz')
          //const candidate = new RTCIceCandidate(iceCandidate)
          //await connection.addIceCandidate(candidate)
        })
        await connection.addIceCandidate({candidate:''})

        return '/answer'
      case 'A':
        // TODO vmx 2022-09-22: check if the remove discription is already set
        // via `connection.currentRemoteDescription`.
        await connection.setRemoteDescription({
          type: "answer",
          sdp
        })

        iceCandidates.forEach(async (iceCandidate) => {
          console.log('about to add ice candidate:', iceCandidate)
          await connection.addIceCandidate(iceCandidate)
        })
        await connection.addIceCandidate({candidate:''})

        return '/connected'
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
      async (result) => {
        qrScanner.stop()
        console.log('decoded QR Code is:', result)
        const goto = await parseData(result.data)
        if (goto === undefined) {
          qrScanner.start()
        } else {
          qrScanner.destroy()
          router.goto(goto)
        }
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
