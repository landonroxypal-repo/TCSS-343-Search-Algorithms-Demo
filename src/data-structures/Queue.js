// Adapts a plain array to the same enqueue/dequeue/isEmpty interface
// PriorityQueue already exposes (Unify Interfaces with Adapter), so
// UnweightedSearchAlgorithm's data structure can be swapped in without its
// callers needing to know whether they're holding a Stack, a Queue, or a
// PriorityQueue.
export class Queue {
  constructor() {
    this._entries = [];
  }

  isEmpty() {
    return this._entries.length === 0;
  }

  enqueue(id) {
    this._entries.push(id);
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    return this._entries.shift();
  }
}
