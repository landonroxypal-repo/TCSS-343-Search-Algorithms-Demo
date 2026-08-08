export class AlgorithmSelection {
  constructor(algorithm, heuristic) {
    this.algorithm = algorithm;
    this.heuristic = heuristic;
  }

  getAlgorithm() {
    return this.algorithm;
  }

  getHeuristic() {
    return this.heuristic;
  }

  copy() {
    return new AlgorithmSelection(this.algorithm, this.heuristic);
  }
}
