import { BestFirst } from "../../src/algorithms/BestFirst.js";
import { Heuristic } from "../../src/datamodel/Heuristic.js";
import { describeSearchAlgorithmContract } from "./searchAlgorithmContract.js";

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
});
