import { test } from 'zora'

import { Topology, PeersQueue } from '../src/topology.js'

test('Topology', (assert) => {
  const topology = new Topology()

  assert.test('Topology add connection', (asssert) => {
    topology.addConnection('peerA', 'peerB')
    assert.equal(topology.nodes, [
      { id: 'peerA' },
      { id: 'peerB' }
    ])
    assert.equal(topology.edges, [
      { source: 'peerA', target: 'peerB' }
    ])
  })

  // Make sure that adding the same connection again doesn't make a difference.
  assert.test('Topology adding again, no difference', (assert) => {
    topology.addConnection('peerA', 'peerB')
    assert.equal(topology.nodes, [
      { id: 'peerA' },
      { id: 'peerB' }
    ])
    assert.equal(topology.edges, [
      { source: 'peerA', target: 'peerB' }
    ])
  })

  // Make sure that adding the same connection, but with reverse order doesn't
  // make a difference.
  assert.test('Topology adding again reverse, no difference', (assert) => {
    topology.addConnection('peerA', 'peerB')
    assert.equal(topology.nodes, [
      { id: 'peerA' },
      { id: 'peerB' }
    ])
    assert.equal(topology.edges, [
      { source: 'peerA', target: 'peerB' }
    ])
  })

  assert.test('Topology adding new connection to new peer', (assert) => {
    topology.addConnection('peerB', 'peerC')
    assert.equal(topology.nodes, [
      { id: 'peerA' },
      { id: 'peerB' },
      { id: 'peerC' }
    ])
    assert.equal(topology.edges, [
      { source: 'peerA', target: 'peerB' },
      { source: 'peerB', target: 'peerC' }
    ])
  })

  assert.test('Topology adding new connection to existing peer', (assert) => {
    topology.addConnection('peerA', 'peerC')
    assert.equal(topology.nodes, [
      { id: 'peerA' },
      { id: 'peerB' },
      { id: 'peerC' }
    ])
    assert.equal(topology.edges, [
      { source: 'peerA', target: 'peerB' },
      { source: 'peerB', target: 'peerC' },
      { source: 'peerA', target: 'peerC' }
    ])
  })
})

test('PeersQueue', (assert) => {
  const queue = new PeersQueue(['peerA', 'peerB'])
  assert.notOk(queue.isEmpty())

  const peerA = queue.pop()
  assert.equal(peerA, 'peerB')

  // Add the peer we just proccessed back to the queue. As it was processed
  // already, it should not become part of the queue again.
  queue.add(peerA)
  const peerB = queue.pop()
  assert.equal(peerB, 'peerA')

  // The whole queue was processed.
  assert.ok(queue.isEmpty())
})
