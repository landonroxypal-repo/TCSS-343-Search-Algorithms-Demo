import { WeightedSearchAlgorithm } from "../../src/algorithms/WeightedSearchAlgorithm.js";
import { SearchAlgorithm } from "../../src/algorithms/SearchAlgorithm.js";
import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";

// WeightedSearchAlgorithm is the Form Template Method base shared by
// Dijkstra and AStar - both pop-unfinalized/finalize/expand/relax-with-
// lazy-deletion, differing only in what priority a relaxed neighbor gets
// enqueued with (_priorityFor) and whether vertexInfo needs extra per-vertex
// setup before the initial enqueue (_prepareVertexInfo, a no-op by default).
describe("WeightedSearchAlgorithm", () => {
  test("cannot be instantiated directly", () => {
    expect(() => new WeightedSearchAlgorithm()).toThrow();
  });

  test("is a SearchAlgorithm", () => {
    class CompleteSubclass extends WeightedSearchAlgorithm {
      _priorityFor(vertexId, candidateDistance) {
        return candidateDistance;
      }
    }
    expect(new CompleteSubclass()).toBeInstanceOf(SearchAlgorithm);
  });

  test("_priorityFor() throws unless overridden by a subclass", () => {
    class IncompleteSubclass extends WeightedSearchAlgorithm {}
    const algorithm = new IncompleteSubclass();
    const graph = new Graph(3, 1);
    graph.setState(graph.toId(0, 0), VertexState.Start);
    graph.setState(graph.toId(0, 2), VertexState.End);

    expect(() => algorithm.initialize(graph)).toThrow();
  });

  test("_prepareVertexInfo() is a no-op by default, so a subclass without it still initializes normally", () => {
    class CompleteSubclass extends WeightedSearchAlgorithm {
      _priorityFor(vertexId, candidateDistance) {
        return candidateDistance;
      }
    }
    const algorithm = new CompleteSubclass();
    const graph = new Graph(3, 1);
    graph.setState(graph.toId(0, 0), VertexState.Start);
    graph.setState(graph.toId(0, 2), VertexState.End);

    expect(() => algorithm.initialize(graph)).not.toThrow();
  });
});
