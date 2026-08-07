import { jest } from "@jest/globals";
import { SearchAlgorithm } from "../../src/algorithms/SearchAlgorithm.js";

// The UML marks the constructor private ("- searchAlgorithm(): void"), and
// step() is redeclared in every subclass (NaiveDFS, BFS, Dijkstra, AStar) -
// SearchAlgorithm is abstract and only usable through a subclass.
describe("SearchAlgorithm", () => {
  test("cannot be instantiated directly", () => {
    expect(() => new SearchAlgorithm()).toThrow();
  });

  test("step() throws unless overridden by a subclass", () => {
    class IncompleteSubclass extends SearchAlgorithm {}
    const algorithm = new IncompleteSubclass();
    expect(() => algorithm.step()).toThrow();
  });

  test("_complete() only notifies onSearchCompleted listeners once even if called more than once", () => {
    class TestAlgorithm extends SearchAlgorithm {
      step() {
        this._complete();
        this._complete();
        return this.status;
      }
    }
    const algorithm = new TestAlgorithm();
    const onSearchCompleted = jest.fn();
    algorithm.onSearchCompleted.push(onSearchCompleted);

    algorithm.step();

    expect(onSearchCompleted).toHaveBeenCalledTimes(1);
  });
});
