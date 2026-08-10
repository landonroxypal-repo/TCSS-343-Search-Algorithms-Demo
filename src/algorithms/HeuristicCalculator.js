import { Heuristic } from "../datamodel/Heuristic.js";

export class HeuristicCalculator {
  constructor(heuristic = Heuristic.None) {
    this.heuristic = heuristic;
  }

  getHeuristic() {
    return this.heuristic;
  }

  setHeuristic(heuristic) {
    this.heuristic = heuristic;
  }

  estimate(graph, fromId, toId) {
    const from = graph.toRowColumn(fromId);
    const to = graph.toRowColumn(toId);
    const rowDelta = Math.abs(from.getRow() - to.getRow());
    const columnDelta = Math.abs(from.getColumn() - to.getColumn());

    switch (this.heuristic) {
      case Heuristic.Manhattan:
        return rowDelta + columnDelta;
      case Heuristic.Euclidean:
        return Math.sqrt(rowDelta * rowDelta + columnDelta * columnDelta);
      case Heuristic.Chebyshev:
        return Math.max(rowDelta, columnDelta);
      case Heuristic.Octile: {
        const diagonalSteps = Math.min(rowDelta, columnDelta);
        const straightSteps = Math.abs(rowDelta - columnDelta);
        return diagonalSteps * Math.SQRT2 + straightSteps;
      }
      case Heuristic.None:
      default:
        return 0;
    }
  }
}
