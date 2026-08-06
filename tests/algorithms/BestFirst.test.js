import { BestFirst } from "../../src/algorithms/BestFirst.js";
import { Heuristic } from "../../src/datamodel/Heuristic.js";
import {
  describeSearchAlgorithmContract,
  buildOpenGrid,
  buildGraphWithTailBeyondEnd,
  runToCompletion,
} from "./searchAlgorithmContract.js";

describe("BestFirst", () => {
  describeSearchAlgorithmContract(BestFirst);

  test("defaults to a heuristic from the Heuristic enumeration", () => {
    const algorithm = new BestFirst();
    expect(Object.values(Heuristic)).toContain(algorithm.getHeuristic());
  });

  test("setHeuristic changes the heuristic returned by getHeuristic", () => {
    const algorithm = new BestFirst();
    algorithm.setHeuristic(Heuristic.Octile);
    expect(algorithm.getHeuristic()).toBe(Heuristic.Octile);
  });

  describe("heuristic formulas", () => {
    // 5x4 grid: Start (0,0), End (3,4) - a 3-4-5 triangle so every formula
    // produces a distinct, hand-checkable value at Start.
    const HEURISTIC_EXPECTATIONS = [
      { heuristic: Heuristic.Manhattan, expected: 7 },
      { heuristic: Heuristic.Euclidian, expected: 5 },
      { heuristic: Heuristic.Chebyshev, expected: 4 },
      { heuristic: Heuristic.Octile, expected: 3 * Math.SQRT2 + 1 },
      { heuristic: Heuristic.None, expected: 0 },
    ];

    test.each(HEURISTIC_EXPECTATIONS)(
      "$heuristic estimates the cost from Start to End correctly",
      ({ heuristic, expected }) => {
        const graph = buildOpenGrid(5, 4);
        const algorithm = new BestFirst();
        algorithm.setHeuristic(heuristic);
        algorithm.initialize(graph);

        const startCost = algorithm
          .getVertexInfo()
          [graph.getStartId()].getHeuristicCost();

        expect(startCost).toBeCloseTo(expected);
      },
    );
  });

  describe("early termination", () => {
    test("stops as soon as End is found and never visits vertices beyond it", () => {
      const { graph, tailIds } = buildGraphWithTailBeyondEnd(3);
      const algorithm = new BestFirst();
      algorithm.initialize(graph);

      const visitedIds = [];
      algorithm.onNodeVisited.push((id) => visitedIds.push(id));
      runToCompletion(algorithm);

      for (const tailId of tailIds) {
        expect(visitedIds).not.toContain(tailId);
      }
    });
  });
});
