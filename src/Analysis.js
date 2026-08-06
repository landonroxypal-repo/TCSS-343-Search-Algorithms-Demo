import { Statistics } from "./datamodel/Statistics.js";

function copyStatistics(stats) {
  return new Statistics(
    stats.getPathLength(),
    stats.getOperationCount(),
    stats.getExpandedNodes(),
    stats.getElapsedTime(),
  );
}

export class Analysis {
  constructor(algorithm, heuristic, graph, stats) {
    this.algorithm = algorithm;
    this.heuristic = heuristic;
    this.graph = graph.copy();
    this.stats = copyStatistics(stats);
  }

  getAlgorithm() {
    return this.algorithm;
  }

  getHeuristic() {
    return this.heuristic;
  }

  getGraph() {
    return this.graph;
  }

  getStats() {
    return this.stats;
  }
}
