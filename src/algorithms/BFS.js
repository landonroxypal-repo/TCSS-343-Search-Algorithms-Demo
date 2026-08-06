import { SearchAlgorithm } from "./SearchAlgorithm.js";
import { SearchStatus } from "../datamodel/SearchStatus.js";

export class BFS extends SearchAlgorithm {
  constructor() {
    super();
    this.dataStructure = [];
  }

  initialize(graph) {
    super.initialize(graph);
    this.dataStructure = [];

    const startId = graph.getStartId();
    this.vertexInfo[startId].setCurrentPathLength(0);
    this._visit(startId);
    this.dataStructure.push(startId);
  }

  step() {
    if (this.status === SearchStatus.Complete) {
      return this.status;
    }

    if (this.dataStructure.length === 0) {
      this._complete();
      return this.status;
    }

    const currentId = this.dataStructure.shift();
    this._expand(currentId);

    if (currentId === this.graph.getEndId()) {
      this._complete();
      return this.status;

    for (const neighborId of this.graph.getNeighbors(currentId)) {
      if (!this.visitedVertices.has(neighborId)) {
        this.vertexInfo[neighborId].setPreviousVertex(currentId);
        this.vertexInfo[neighborId].setCurrentPathLength(
          this.vertexInfo[currentId].getCurrentPathLength() + 1,
        );
        this._visit(neighborId);
        this.dataStructure.push(neighborId);
      }
    }

    return this.status;
  }

  reset() {
    super.reset();
    this.dataStructure = [];
  }
}
