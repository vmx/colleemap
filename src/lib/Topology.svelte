<script>
  //import { messages, name } from '../stores.js'
  import { onMount, onDestroy } from 'svelte'

  import { select, forceSimulation, forceLink, forceManyBody, forceCenter, timeout } from 'd3';
  import { pipe } from 'it-pipe'
  import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
  import { peerIdFromString } from '@libp2p/peer-id'
  import { isPeerId } from '@libp2p/interface-peer-id'

  import { PUBSUB_TOPIC_TOPOLOGY } from '../constants.js'

  import topology from './topology-instance.js'

  const initD3 = (nodes, links) => {
    const svg = select('svg')
    const { width, height } = svg.node().getBoundingClientRect()
    console.log('vmx: width, height:', width, height)

    const svgNodes = svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')

    const svgEdges = svg
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
      .stop()
      //.on('tick', ticked)
      //.nodes(nodes)
      //.force('link').links(links)

    simulation.nodes(nodes)
    simulation.force('link').links(links)

    for (let ii = 0; ii < 40; ii++) {
      simulation.tick()
    }

    ticked()
  }

  onMount(async () => {
    console.log('vmx: topology: onmount: topology:', topology)
    initD3(topology.nodes, topology.links)
  })

  onDestroy(() => {
    console.log('vmx: topology: on destroy')
    document.querySelector('#container svg').replaceChildren();
  })

</script>

<div id="container">
  <div>
    <a href="/main">Back</a>
  </div>
  <svg></svg>
</div>


<style>
  a {
    text-decoration: none;
  }

  #container > div  {
    display: grid;
  }
  #container > div > a {
    align-items: center;
    display: grid;
    font-size: 15vmin;
    justify-items: center;
  }
</style>
