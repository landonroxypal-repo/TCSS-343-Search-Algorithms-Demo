import { UnweightedSearchAlgorithm } from "../../src/algorithms/UnweightedSearchAlgorithm.js";
import { SearchAlgorithm } from "../../src/algorithms/SearchAlgorithm.js";
import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";

// UnweightedSearchAlgorithm is the Form Template Method base shared by
// NaiveDFS and BFS - it's abstract in the same way SearchAlgorithm itself
// is, just one level down, with _removeNext() as the one hook subclasses
// must supply (pop for a stack/DFS, shift for a queue/BFS).
describe("UnweightedSearchAlgorithm", () => {
  test("cannot be instantiated directly", () => {
    expect(() => new UnweightedSearchAlgorithm()).toThrow();
  });

  test("is a SearchAlgorithm", () => {
    class CompleteSubclass extends UnweightedSearchAlgorithm {
      _removeNext() {
        return this.dataStructure.pop();
      }
    }
    expect(new CompleteSubclass()).toBeInstanceOf(SearchAlgorithm);
  });

  test("_removeNext() throws unless overridden by a subclass", () => {
    class IncompleteSubclass extends UnweightedSearchAlgorithm {}
    const algorithm = new IncompleteSubclass();
    const graph = new Graph(3, 1);
    graph.setState(graph.toId(0, 0), VertexState.Start);
    graph.setState(graph.toId(0, 2), VertexState.End);
    algorithm.initialize(graph);

    expect(() => algorithm.step()).toThrow();
  });
});
