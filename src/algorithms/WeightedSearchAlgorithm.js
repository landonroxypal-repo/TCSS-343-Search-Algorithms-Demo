import { SearchAlgorithm } from "./SearchAlgorithm.js";
import { SearchStatus } from "../datamodel/SearchStatus.js";
import { PriorityQueue } from "./PriorityQueue.js";

export class WeightedSearchAlgorithm extends SearchAlgorithm {
  constructor() {
    super();
    if (new.target === WeightedSearchAlgorithm) {
      throw new TypeError(
        "WeightedSearchAlgorithm is abstract and cannot be instantiated directly",
      );
    }
    this._queue = new PriorityQueue();
    this._finalizedVertices = new Set();
  }

  initialize(graph) {
    super.initialize(graph);
    this._queue = new PriorityQueue();
    this._finalizedVertices = new Set();
    this._prepareVertexInfo();

    const startId = graph.getStartId();
    this.vertexInfo[startId].setCurrentPathLength(0);
    this._visit(startId);
    this._queue.enqueue(startId, this._priorityFor(startId, 0));
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

      if (this.vertexInfo[neighborId].relaxIfBetter(candidateDistance, currentId)) {
        if (!this.visitedVertices.has(neighborId)) {
          this._visit(neighborId);
        }
        this._queue.enqueue(neighborId, this._priorityFor(neighborId, candidateDistance));
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
      const id = this._queue.dequeue();
      if (!this._finalizedVertices.has(id)) {
        return id;
      }
    }
    return null;
  }

  // No-op by default - Dijkstra doesn't need any extra per-vertex setup
  // before the initial enqueue. AStar overrides this to prime each vertex's
  // heuristic cost.
  _prepareVertexInfo() {}

  _priorityFor(vertexId, candidateDistance) {
    throw new Error("_priorityFor() must be implemented by a subclass");
  }
}
