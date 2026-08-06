import { SearchAlgorithm } from "./SearchAlgorithm.js";
import { SearchStatus } from "../datamodel/SearchStatus.js";

export class Dijkstra extends SearchAlgorithm {
  constructor() {
    super();
    this.dataStructure = [];
    this._finalizedVertices = new Set();
  }

  initialize(graph) {
    super.initialize(graph);
    this.dataStructure = [];
    this._finalizedVertices = new Set();

    const startId = graph.getStartId();
    this.vertexInfo[startId].setCurrentPathLength(0);
    this._visit(startId);
    this.dataStructure.push({ id: startId, priority: 0 });
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
        this.dataStructure.push({ id: neighborId, priority: candidateDistance });
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
}
