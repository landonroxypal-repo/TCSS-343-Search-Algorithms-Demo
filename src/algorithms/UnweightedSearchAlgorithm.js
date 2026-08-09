import { SearchAlgorithm } from "./SearchAlgorithm.js";
import { SearchStatus } from "../datamodel/SearchStatus.js";

export class UnweightedSearchAlgorithm extends SearchAlgorithm {
  constructor() {
    super();
    if (new.target === UnweightedSearchAlgorithm) {
      throw new TypeError(
        "UnweightedSearchAlgorithm is abstract and cannot be instantiated directly",
      );
    }
    this._dataStructure = this._createDataStructure();
  }

  initialize(graph) {
    super.initialize(graph);
    this._dataStructure = this._createDataStructure();

    const startId = graph.getStartId();
    this.vertexInfo[startId].setCurrentPathLength(0);
    this._visit(startId);
    this._dataStructure.enqueue(startId);
  }

  step() {
    if (this.status === SearchStatus.Complete) {
      return this.status;
    }

    if (this._dataStructure.isEmpty()) {
      this._complete();
      return this.status;
    }

    const currentId = this._dataStructure.dequeue();
    this._expand(currentId);

    if (currentId === this.graph.getEndId()) {
      this._complete();
      return this.status;
    }

    for (const neighborId of this.graph.getNeighbors(currentId)) {
      if (!this.visitedVertices.has(neighborId)) {
        this.vertexInfo[neighborId].relaxIfBetter(
          this.vertexInfo[currentId].getCurrentPathLength() + 1,
          currentId,
        );
        this._visit(neighborId);
        this._dataStructure.enqueue(neighborId);
      }
    }

    return this.status;
  }

  reset() {
    super.reset();
    this._dataStructure = this._createDataStructure();
  }

  _createDataStructure() {
    throw new Error("_createDataStructure() must be implemented by a subclass");
  }
}
