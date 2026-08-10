import { HeuristicCalculator } from "../../src/algorithms/HeuristicCalculator.js";
import { Graph } from "../../src/datamodel/Graph.js";
import { Heuristic } from "../../src/datamodel/Heuristic.js";

describe("HeuristicCalculator", () => {
  test("defaults to Heuristic.None", () => {
    const calculator = new HeuristicCalculator();
    expect(calculator.getHeuristic()).toBe(Heuristic.None);
  });

  test("getHeuristic reflects the value most recently passed to setHeuristic", () => {
    const calculator = new HeuristicCalculator();
    calculator.setHeuristic(Heuristic.Manhattan);
    expect(calculator.getHeuristic()).toBe(Heuristic.Manhattan);
  });

  describe("estimate", () => {
    // fromId/toId chosen for a 3-4-5 triangle (rowDelta=3, columnDelta=4) so
    // every heuristic's expected value is a clean, hand-checkable number.
    const graph = new Graph(10, 10);
    const fromId = graph.toId(0, 0);
    const toId = graph.toId(3, 4);

    test("None returns 0 regardless of distance", () => {
      const calculator = new HeuristicCalculator(Heuristic.None);
      expect(calculator.estimate(graph, fromId, toId)).toBe(0);
    });

    test("Manhattan returns the sum of row and column deltas", () => {
      const calculator = new HeuristicCalculator(Heuristic.Manhattan);
      expect(calculator.estimate(graph, fromId, toId)).toBe(7);
    });

    test("Euclidean returns the straight-line distance", () => {
      const calculator = new HeuristicCalculator(Heuristic.Euclidean);
      expect(calculator.estimate(graph, fromId, toId)).toBe(5);
    });

    test("Chebyshev returns the larger of the two deltas", () => {
      const calculator = new HeuristicCalculator(Heuristic.Chebyshev);
      expect(calculator.estimate(graph, fromId, toId)).toBe(4);
    });

    test("Octile returns diagonal-plus-straight distance", () => {
      const calculator = new HeuristicCalculator(Heuristic.Octile);
      expect(calculator.estimate(graph, fromId, toId)).toBe(3 * Math.SQRT2 + 1);
    });

    test("is symmetric regardless of which id is 'from' and which is 'to'", () => {
      const calculator = new HeuristicCalculator(Heuristic.Manhattan);
      expect(calculator.estimate(graph, toId, fromId)).toBe(
        calculator.estimate(graph, fromId, toId),
      );
    });
  });
});
