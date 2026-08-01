import { SearchAlgorithm } from "../../src/algorithms/SearchAlgorithm.js";

// step() is redeclared with the same signature in every subclass (NaiveDFS,
// BFS, Dijkstra, AStar), which signals SearchAlgorithm is meant to be
// abstract rather than usable on its own.
describe("SearchAlgorithm", () => {
  test("cannot be instantiated directly", () => {
    expect(() => new SearchAlgorithm()).toThrow();
  });
});
