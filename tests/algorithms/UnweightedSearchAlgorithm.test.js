import { UnweightedSearchAlgorithm } from "../../src/algorithms/UnweightedSearchAlgorithm.js";
import { SearchAlgorithm } from "../../src/algorithms/SearchAlgorithm.js";

// UnweightedSearchAlgorithm is the Form Template Method base shared by
// NaiveDFS and BFS - it's abstract in the same way SearchAlgorithm itself
// is, just one level down, with _createDataStructure() as the one hook
// subclasses must supply (a Stack for DFS, a Queue for BFS).
describe("UnweightedSearchAlgorithm", () => {
  test("cannot be instantiated directly", () => {
    expect(() => new UnweightedSearchAlgorithm()).toThrow();
  });

  test("is a SearchAlgorithm", () => {
    class CompleteSubclass extends UnweightedSearchAlgorithm {
      _createDataStructure() {
        return { isEmpty: () => true, enqueue: () => {}, dequeue: () => null };
      }
    }
    expect(new CompleteSubclass()).toBeInstanceOf(SearchAlgorithm);
  });

  test("_createDataStructure() throws unless overridden by a subclass", () => {
    class IncompleteSubclass extends UnweightedSearchAlgorithm {}
    expect(() => new IncompleteSubclass()).toThrow();
  });
});
