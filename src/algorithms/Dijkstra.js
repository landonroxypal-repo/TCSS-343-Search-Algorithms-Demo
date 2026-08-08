import { SearchAlgorithm } from "./SearchAlgorithm.js";
import { SearchStatus } from "../datamodel/SearchStatus.js";
import { PriorityQueue } from "./PriorityQueue.js";

export class Dijkstra extends SearchAlgorithm {
  constructor() {
    super();
    this._queue = new PriorityQueue();
    this._finalizedVertices = new Set();
  }

  initialize(graph) {
    super.initialize(graph);
    this._queue = new PriorityQueue();
    this._finalizedVertices = new Set();

    const startId = graph.getStartId();
    this.vertexInfo[startId].setCurrentPathLength(0);
    this._visit(startId);
    this._queue.enqueue(startId, 0);
  }

  step() {
    if (this.status === SearchStatus.Complete) {
      return this.status;
    }

    const currentId = this._popNextUnfinalized();
    if (currentId === null) {
      this._complete();
      return this.status;
    }

    this._finalizedVertices.add(currentId);
    this._expand(currentId);

    if (currentId === this.graph.getEndId()) {
      this._complete();
      return this.status;
    }

    const currentDistance = this.vertexInfo[currentId].getCurrentPathLength();
    for (const neighborId of this.graph.getNeighbors(currentId)) {
      if (this._finalizedVertices.has(neighborId)) {
        continue;
      }

      const candidateDistance =
        currentDistance + this.graph.getEdgeWeight(currentId, neighborId);

      if (candidateDistance < this.vertexInfo[neighborId].getCurrentPathLength()) {
        this.vertexInfo[neighborId].setCurrentPathLength(candidateDistance);
        this.vertexInfo[neighborId].setPreviousVertex(currentId);
        if (!this.visitedVertices.has(neighborId)) {
          this._visit(neighborId);
        }
        this._queue.enqueue(neighborId, candidateDistance);
      }
    }

    return this.status;
  }

  reset() {
    super.reset();
    this._queue = new PriorityQueue();
    this._finalizedVertices = new Set();
  }

  _popNextUnfinalized() {
    while (!this._queue.isEmpty()) {
      const id = this._queue.dequeueMin();
      if (!this._finalizedVertices.has(id)) {
        return id;
      }
    }
    return null;
  }
}
