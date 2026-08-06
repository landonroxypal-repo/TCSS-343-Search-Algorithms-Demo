import { SearchAlgorithm } from "./SearchAlgorithm.js";
import { SearchStatus } from "../datamodel/SearchStatus.js";
import { Heuristic } from "../datamodel/Heuristic.js";
import { VertexInfo } from "../datamodel/VertexInfo.js";

export class AStar extends SearchAlgorithm {
  constructor() {
    super();
    this.dataStructure = [];
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
    this.dataStructure = [];
    this._finalizedVertices = new Set();

    for (let id = 0; id < this.vertexInfo.length; id++) {
      this.vertexInfo[id] = new VertexInfo(this._estimateRemainingCost(id));
    }

    const startId = graph.getStartId();
    this.vertexInfo[startId].setCurrentPathLength(0);
    this._visit(startId);
    this.dataStructure.push({
      id: startId,
      priority: this.vertexInfo[startId].getHeuristicCost(),
    });
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
        this.dataStructure.push({
          id: neighborId,
          priority:
            candidateDistance + this.vertexInfo[neighborId].getHeuristicCost(),
        });
      }
    }

    return this.status;
  }

  reset() {
    super.reset();
    this.dataStructure = [];
    this._finalizedVertices = new Set();
  }

  _popNextUnfinalized() {
    while (this.dataStructure.length > 0) {
      const index = this._indexOfMinPriority();
      const [entry] = this.dataStructure.splice(index, 1);
      if (!this._finalizedVertices.has(entry.id)) {
        return entry.id;
      }
    }
    return null;
  }

  _indexOfMinPriority() {
    let minIndex = 0;
    for (let i = 1; i < this.dataStructure.length; i++) {
      if (this.dataStructure[i].priority < this.dataStructure[minIndex].priority) {
        minIndex = i;
      }
    }
    return minIndex;
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
