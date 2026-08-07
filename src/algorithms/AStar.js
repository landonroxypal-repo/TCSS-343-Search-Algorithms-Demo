import { SearchAlgorithm } from "./SearchAlgorithm.js";
import { SearchStatus } from "../datamodel/SearchStatus.js";
import { Heuristic } from "../datamodel/Heuristic.js";
import { VertexInfo } from "../datamodel/VertexInfo.js";
import { PriorityQueue } from "./PriorityQueue.js";

export class AStar extends SearchAlgorithm {
  constructor() {
    super();
    this._queue = new PriorityQueue();
    this._finalizedVertices = new Set();
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
    this._finalizedVertices = new Set();

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
        this._queue.enqueue(
          neighborId,
          candidateDistance + this.vertexInfo[neighborId].getHeuristicCost(),
        );
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
