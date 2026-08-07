import { SearchAlgorithm } from "./SearchAlgorithm.js";
import { SearchStatus } from "../datamodel/SearchStatus.js";
import { Heuristic } from "../datamodel/Heuristic.js";
import { VertexInfo } from "../datamodel/VertexInfo.js";
import { PriorityQueue } from "./PriorityQueue.js";

export class BestFirst extends SearchAlgorithm {
  constructor() {
    super();
    this._queue = new PriorityQueue();
    this.heuristic = Heuristic.None;
  }

  getHeuristic() {
    return this.heuristic;
  }

  setHeuristic(heuristic) {
    this.heuristic = heuristic;
  }

  initialize(graph) {
    super.initialize(graph);
    this._queue = new PriorityQueue();

    for (let id = 0; id < this.vertexInfo.length; id++) {
      this.vertexInfo[id] = new VertexInfo(this._estimateRemainingCost(id));
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
        this.vertexInfo[neighborId].setPreviousVertex(currentId);
        this.vertexInfo[neighborId].setCurrentPathLength(
          currentDistance + this.graph.getEdgeWeight(currentId, neighborId),
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

  _estimateRemainingCost(id) {
    const from = this.graph.toRowColumn(id);
    const to = this.graph.toRowColumn(this.graph.getEndId());
    const rowDelta = Math.abs(from.getRow() - to.getRow());
    const columnDelta = Math.abs(from.getColumn() - to.getColumn());

    switch (this.heuristic) {
      case Heuristic.Manhattan:
        return rowDelta + columnDelta;
      case Heuristic.Euclidian:
        return Math.sqrt(rowDelta * rowDelta + columnDelta * columnDelta);
      case Heuristic.Chebyshev:
        return Math.max(rowDelta, columnDelta);
      case Heuristic.Octile: {
        const diagonalSteps = Math.min(rowDelta, columnDelta);
        const straightSteps = Math.abs(rowDelta - columnDelta);
        return diagonalSteps * Math.SQRT2 + straightSteps;
      }
      case Heuristic.None:
      default:
        return 0;
    }
  }
}
