export class Analysis {
  constructor(selection, graph, stats, time) {
    this.selection = selection.copy();
    this.graph = graph.copy();
    this.stats = stats.copy();
    this.time = time;
  }

  getAlgorithm() {
    return this.selection.getAlgorithm();
  }

  getHeuristic() {
    return this.selection.getHeuristic();
  }

  getGraph() {
    return this.graph;
  }

  getStats() {
    return this.stats;
  }

  getTime() {
    return this.time;
  }
}
