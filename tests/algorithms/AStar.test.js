import { AStar } from "../../src/algorithms/AStar.js";
import { Heuristic } from "../../src/datamodel/Heuristic.js";
import { describeSearchAlgorithmContract } from "./searchAlgorithmContract.js";

describe("AStar", () => {
  describeSearchAlgorithmContract(AStar);

  test("defaults to a heuristic from the Heuristic enumeration", () => {
    const algorithm = new AStar();
    expect(Object.values(Heuristic)).toContain(algorithm.getHeuristic());
  });

  test("setHeuristic changes the heuristic returned by getHeuristic", () => {
    const algorithm = new AStar();
    algorithm.setHeuristic(Heuristic.Octile);
    expect(algorithm.getHeuristic()).toBe(Heuristic.Octile);
  });
});
