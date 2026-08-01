import { SearchAlgorithm } from "../../src/algorithms/SearchAlgorithm.js";

// The UML marks the constructor private ("- searchAlgorithm(): void"), and
// step() is redeclared in every subclass (NaiveDFS, BFS, Dijkstra, AStar) -
// SearchAlgorithm is abstract and only usable through a subclass.
describe("SearchAlgorithm", () => {
  test("cannot be instantiated directly", () => {
    expect(() => new SearchAlgorithm()).toThrow();
  });
});
