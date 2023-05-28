/// Create a topology of the peers.
///
/// The output is compatible with D3-force.
export class Topology {
  /// A list of peers.
  #peers = new Set()
  /// A list of connections between peers.
  ///
  /// It's a list of object of the form `{source: "peer-id-as-string",
  ///  target: "peer-id-as-string"}`.
  #connections = []

  /// Return the links in a D3-force compatible way.
  //
  /// It's a list of object of the form `{source: "peer-id-as-string",
  ///  target: "peer-id-as-string"}`.
  get links () {
    return this.#connections
  }

  /// Return the edges in a D3-force compatible way.
  ///
  /// It's a list of objects of form `{id: "peer-id-as-string"}`.
  get nodes () {
    return Array.from(this.#peers.values(), (peer) => {
      return { id: peer }
    })
  }

  /// Add a connection between two peers.
  ///
  /// This function is idempotent, i.e. if the element already exists, it's
  /// not added again. The source is always the PeerID that is smaller than
  /// the other PeerId (by comparing the string).
  addConnection (peerA, peerB) {
    this.#addPeer(peerA)
    this.#addPeer(peerB)

    let source
    let target
    if (peerA < peerB) {
      source = peerA
      target = peerB
    } else {
      source = peerB
      target = peerA
    }

    const connectionExists = this.#connections.some((connection) => {
      return connection.source === source && connection.target === target
    })
    if (!connectionExists) {
      this.#connections.push({ source, target })
    }
  }

  /// Adds a peer.
  ///
  /// This function is idempotent, i.e. if the element already exists, it's
  /// not added again.
  #addPeer (newPeer) {
    this.#peers.add(newPeer)
  }
}

/// A class to create and process a queue of peers.
export class PeersQueue {
  /// The set of peers that was already processed.
  ///
  /// This way we don't end up in endless loops.
  #processed = new Set()

  /// The list of peers that still need to be processed.
  #queue = []

  /// The queue needs to have an initial list of peers to start processing,
  /// hence they are passed into the constructor.
  // The `originatingPeer` is the peer we start the discovery from. It's passed
  // in, so that it doesn't try to dial itself.
  constructor (originatingPeer, peers) {
    // Define the peer we start the discovery from as "processed", so that it
    // doesn't get dialed later on.
    this.#processed.add(originatingPeer)

    this.#queue.push(...peers)
  }

  /// Add the given peer to the queue that needs to the list of peers that
  /// need be processed.
  ///
  /// If the peer was already processed, it won't be added again.
  add (peer) {
    if (!this.#processed.has(peer)) {
      this.#queue.push(peer)
    }
  }

  /// Get an element from the queue in order to process it.
  pop () {
    const peer = this.#queue.pop()
    this.#processed.add(peer)
    return peer
  }

  /// Returns true if the queue was fully processed.
  isEmpty () {
    return this.#queue.length === 0
  }
}
