import { AlgorithmSelection } from "../../src/datamodel/AlgorithmSelection.js";
import { Algorithm } from "../../src/datamodel/Algorithm.js";
import { Heuristic } from "../../src/datamodel/Heuristic.js";

describe("AlgorithmSelection", () => {
  test("stores the algorithm and heuristic it was constructed with", () => {
    const selection = new AlgorithmSelection(Algorithm.AStar, Heuristic.Manhattan);
    expect(selection.getAlgorithm()).toBe(Algorithm.AStar);
    expect(selection.getHeuristic()).toBe(Heuristic.Manhattan);
  });

  test("supports Heuristic.None for algorithms that don't use a heuristic", () => {
    const selection = new AlgorithmSelection(Algorithm.BFS, Heuristic.None);
    expect(selection.getAlgorithm()).toBe(Algorithm.BFS);
    expect(selection.getHeuristic()).toBe(Heuristic.None);
  });

  describe("copy", () => {
    // No setters exist on this class, so - same as Statistics - the only
    // testable copy semantics are identity divergence plus matching values
    // at copy time.
    test("returns an AlgorithmSelection that is a different instance from the original", () => {
      const selection = new AlgorithmSelection(Algorithm.Dijkstra, Heuristic.None);
      expect(selection.copy()).not.toBe(selection);
    });

    test("the copy starts out with the same values as the original", () => {
      const selection = new AlgorithmSelection(Algorithm.BestFirst, Heuristic.Chebyshev);
      const copy = selection.copy();
      expect(copy.getAlgorithm()).toBe(selection.getAlgorithm());
      expect(copy.getHeuristic()).toBe(selection.getHeuristic());
    });
  });
});
