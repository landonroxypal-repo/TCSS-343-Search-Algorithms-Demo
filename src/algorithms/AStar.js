import { WeightedSearchAlgorithm } from "./WeightedSearchAlgorithm.js";
import { VertexInfo } from "../datamodel/VertexInfo.js";
import { HeuristicCalculator } from "./HeuristicCalculator.js";

export class AStar extends WeightedSearchAlgorithm {
  constructor() {
    super();
    this._heuristicCalculator = new HeuristicCalculator();
  }

  getHeuristic() {
    return this._heuristicCalculator.getHeuristic();
  }

  setHeuristic(heuristic) {
    this._heuristicCalculator.setHeuristic(heuristic);
  }

  _prepareVertexInfo() {
    const endId = this.graph.getEndId();
    for (let id = 0; id < this.vertexInfo.length; id++) {
      this.vertexInfo[id] = new VertexInfo(
        this._heuristicCalculator.estimate(this.graph, id, endId),
      );
    }
  }

  _priorityFor(vertexId, candidateDistance) {
    return candidateDistance + this.vertexInfo[vertexId].getHeuristicCost();
  }
}
