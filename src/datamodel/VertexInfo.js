export class VertexInfo {
  constructor(heuristicCost) {
    this.heuristicCost = heuristicCost;
    this.currentPathLength = Infinity;
    this.previousVertex = null;
  }

  getHeuristicCost() {
    return this.heuristicCost;
  }

  getCurrentPathLength() {
    return this.currentPathLength;
  }

  setCurrentPathLength(length) {
    this.currentPathLength = length;
  }

  getPreviousVertex() {
    return this.previousVertex;
  }

  setPreviousVertex(id) {
    this.previousVertex = id;
  }
}
