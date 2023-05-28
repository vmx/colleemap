<script>
  //import { messages, name } from '../stores.js'
  import { onMount } from 'svelte'

  import { select, forceSimulation, forceLink, forceManyBody, forceCenter, timeout } from 'd3';
  import { pipe } from 'it-pipe'
  import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
  import { peerIdFromString } from '@libp2p/peer-id'
  import { isPeerId } from '@libp2p/interface-peer-id'

  import { Topology, PeersQueue } from '../topology.js'

  export let libp2pNode

  const topology = new Topology()
  const queue = new PeersQueue(
    libp2pNode.peerId.toString(),
    libp2pNode.getPeers().map((peer) => peer.toString()))

  const initD3 = (nodes, links) => {
    //const container = select('#container')
    //const svg = container.append('svg')
    //const container = select('#container')
    const svg = select('svg')
      //.attr('height', 512)
      //.attr('width', 512)

    const { width, height } = svg.node().getBoundingClientRect()
    console.log('vmx: width, height:', width, height)

    let svgNodes = svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')

    let svgEdges = svg
      .append('g')
      .attr('stroke', '#000')
      .attr('stroke-width', 4)
      .selectAll('line')
      .data(links)
      .join('line')

    const ticked = () => {
      svgNodes
        .attr('r', 16)
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)

      svgEdges
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)
    }

    const simulation = forceSimulation()
      .force('link', forceLink()
             .id((d) => d.id)
             .distance(64)
      )
      //.force('charge', forceManyBody())
      .force('center', forceCenter(width/2, height/2))
      .on('tick', ticked)
      .nodes(nodes)
      .force('link').links(links)

    //simulation.nodes(nodes)
    //simulation.force('link').links(links)

    //svgEdges = svgEdges
    //  .data(links)
    //  .join('line')
    //svgNodes = svgNodes
    //  .data(nodes)
    //  .join('circle')
  }

  const init = async () => {
    while (!queue.isEmpty()) {
      //const peerToDial = peerIdFromString(queue.pop())
      const peerToDial = queue.pop()
      console.log('vmx: topology: peer to dial:', isPeerId(peerToDial), peerToDial)
      const stream = await libp2pNode.dialProtocol(
        peerIdFromString(peerToDial), '/getpeers/1.0.0')
      await pipe(
        stream,
        async (source) => {
          for await (const data of source) {
            const newPeer = uint8ArrayToString(data.subarray())
            //console.log('vmx: topology: peer:', newPeer)

            topology.addConnection(peerToDial, newPeer)
            queue.add(newPeer)
            //console.log('vmx: topology: one peer done: peer:', newPeer)
          }
          //console.log('vmx: done with receiving all peers')
        }
      )
      //console.log('vmx: done with the pipe')
    }

    console.log('vmx: topology: nodes, links:', topology.nodes, topology.links)

    const nodes = [
      { id: 'peerA' },
      { id: 'peerB' },
      { id: 'peerC' }
    ]
    const links = [
      { source: 'peerA', target: 'peerB' },
      { source: 'peerB', target: 'peerC' },
      { source: 'peerA', target: 'peerC' }
    ]

console.log('vmx: topology: init()')

    console.log('vmx: topolgy: nodes:', topology.nodes)
    console.log('vmx: topolgy: links:', topology.links)
    initD3(topology.nodes, topology.links)
    //initD3(nodes, links)
  }

  onMount(async () => {
    console.log('vmx: topology: onmount')
    //document.addEventListener("DOMContentLoaded", async () => {
      await init()
    //})
	})

</script>

<div id="container">
  <div>Topology</div>
  <svg></svg>
</div>
