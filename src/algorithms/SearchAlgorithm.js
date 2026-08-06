import { SearchStatus } from "../datamodel/SearchStatus.js";
import { VertexInfo } from "../datamodel/VertexInfo.js";

export class SearchAlgorithm {
  constructor() {
    if (new.target === SearchAlgorithm) {
      throw new TypeError(
        "SearchAlgorithm is abstract and cannot be instantiated directly",
      );
    }

    this.graph = null;
    this.visitedVertices = new Set();
    this.vertexInfo = [];
    this.status = SearchStatus.Inactive;

    this.onNodeVisited = [];
    this.onNodeExpanded = [];
    this.onSearchCompleted = [];
  }

  initialize(graph) {
    if (graph.getStartId() === -1 || graph.getEndId() === -1) {
      throw new Error(
        "SearchAlgorithm cannot be initialized on a graph without both a Start and an End vertex",
      );
    }

    this.graph = graph;
    this.visitedVertices = new Set();
    this.vertexInfo = [];
    for (let id = 0; id < graph.getVertexCount(); id++) {
      this.vertexInfo.push(new VertexInfo(0));
    }
    this.status = SearchStatus.InProgress;
  }

  getVertexInfo() {
    return this.vertexInfo;
  }

  step() {
    throw new Error("step() must be implemented by a SearchAlgorithm subclass");
  }

  reset() {
    this.graph = null;
    this.visitedVertices = new Set();
    this.vertexInfo = [];
    this.status = SearchStatus.Inactive;
  }

  _visit(id) {
    this.visitedVertices.add(id);
    for (const listener of this.onNodeVisited) {
      listener(id);
    }
  }

  _expand(id) {
    for (const listener of this.onNodeExpanded) {
      listener(id);
    }
  }

  _complete() {
    if (this.status !== SearchStatus.Complete) {
      this.status = SearchStatus.Complete;
      for (const listener of this.onSearchCompleted) {
        listener();
      }
    }
  }
}
