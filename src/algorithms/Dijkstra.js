import { WeightedSearchAlgorithm } from "./WeightedSearchAlgorithm.js";

export class Dijkstra extends WeightedSearchAlgorithm {
  _priorityFor(vertexId, candidateDistance) {
    return candidateDistance;
  }
}
