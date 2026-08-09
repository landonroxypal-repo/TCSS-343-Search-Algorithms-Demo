import { SearchAlgorithm } from "./SearchAlgorithm.js";
import { SearchStatus } from "../datamodel/SearchStatus.js";
import { VertexInfo } from "../datamodel/VertexInfo.js";
import { PriorityQueue } from "./PriorityQueue.js";
import { HeuristicCalculator } from "./HeuristicCalculator.js";

export class BestFirst extends SearchAlgorithm {
  constructor() {
    super();
    this._queue = new PriorityQueue();
    this._heuristicCalculator = new HeuristicCalculator();
  }

  getHeuristic() {
    return this._heuristicCalculator.getHeuristic();
  }

  setHeuristic(heuristic) {
    this._heuristicCalculator.setHeuristic(heuristic);
  }

  initialize(graph) {
    super.initialize(graph);
    this._queue = new PriorityQueue();

    const endId = graph.getEndId();
    for (let id = 0; id < this.vertexInfo.length; id++) {
      this.vertexInfo[id] = new VertexInfo(
        this._heuristicCalculator.estimate(graph, id, endId),
      );
    }

    const startId = graph.getStartId();
    this.vertexInfo[startId].setCurrentPathLength(0);
    this._visit(startId);
    this._queue.enqueue(startId, this.vertexInfo[startId].getHeuristicCost());
  }

  step() {
    if (this.status === SearchStatus.Complete) {
      return this.status;
    }

    if (this._queue.isEmpty()) {
      this._complete();
      return this.status;
    }

    const currentId = this._queue.dequeueMin();
    this._expand(currentId);

    if (currentId === this.graph.getEndId()) {
      this._complete();
      return this.status;
    }

    const currentDistance = this.vertexInfo[currentId].getCurrentPathLength();
    for (const neighborId of this.graph.getNeighbors(currentId)) {
      if (!this.visitedVertices.has(neighborId)) {
        this.vertexInfo[neighborId].relaxIfBetter(
          currentDistance + this.graph.getEdgeWeight(currentId, neighborId),
          currentId,
        );
        this._visit(neighborId);
        this._queue.enqueue(neighborId, this.vertexInfo[neighborId].getHeuristicCost());
      }
    }

    return this.status;
  }

  reset() {
    super.reset();
    this._queue = new PriorityQueue();
  }
}
