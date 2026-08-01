import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";
import { SearchStatus } from "../../src/datamodel/SearchStatus.js";
import { SearchAlgorithm } from "../../src/algorithms/SearchAlgorithm.js";

// Shared behavior every SearchAlgorithm subclass (NaiveDFS, BFS, Dijkstra,
// AStar) must satisfy per the UML. Call describeSearchAlgorithmContract(Class)
// from each subclass's own test file instead of duplicating these cases.

function buildOpenGrid(width, height) {
  const graph = new Graph(width, height);
  graph.setState(graph.toId(0, 0), VertexState.Start);
  graph.setState(graph.toId(height - 1, width - 1), VertexState.End);
  return graph;
}

function buildWalledCorridor() {
  // 1x3 corridor: Start | Wall | End - the End is unreachable.
  const graph = new Graph(3, 1);
  graph.setState(graph.toId(0, 0), VertexState.Start);
  graph.setState(graph.toId(0, 1), VertexState.Wall);
  graph.setState(graph.toId(0, 2), VertexState.End);
  return graph;
}

function runToCompletion(algorithm, maxSteps = 500) {
  let status;
  for (let i = 0; i < maxSteps; i++) {
    status = algorithm.step();
    if (status === SearchStatus.Complete) {
      break;
    }
  }
  return status;
}

export function describeSearchAlgorithmContract(AlgorithmClass) {
  describe("SearchAlgorithm contract", () => {
    test("is a SearchAlgorithm", () => {
      expect(new AlgorithmClass()).toBeInstanceOf(SearchAlgorithm);
    });

    test("initialize populates one VertexInfo per graph vertex", () => {
      const algorithm = new AlgorithmClass();
      algorithm.initialize(buildOpenGrid(3, 3));
      expect(algorithm.getVertexInfo()).toHaveLength(9);
    });

    test("step returns a value from the SearchStatus enumeration", () => {
      const algorithm = new AlgorithmClass();
      algorithm.initialize(buildOpenGrid(3, 3));
      expect(Object.values(SearchStatus)).toContain(algorithm.step());
    });

    test("stepping repeatedly reaches Complete on an open grid", () => {
      const algorithm = new AlgorithmClass();
      algorithm.initialize(buildOpenGrid(3, 3));
      expect(runToCompletion(algorithm)).toBe(SearchStatus.Complete);
    });

    test("onNodeVisited listeners are notified as the search runs", () => {
      const algorithm = new AlgorithmClass();
      algorithm.initialize(buildOpenGrid(3, 3));
      const onNodeVisited = jest.fn();
      algorithm.onNodeVisited.push(onNodeVisited);
      runToCompletion(algorithm);
      expect(onNodeVisited).toHaveBeenCalled();
    });

    test("onSearchCompleted listeners are notified exactly once", () => {
      const algorithm = new AlgorithmClass();
      algorithm.initialize(buildOpenGrid(3, 3));
      const onSearchCompleted = jest.fn();
      algorithm.onSearchCompleted.push(onSearchCompleted);
      runToCompletion(algorithm);
      expect(onSearchCompleted).toHaveBeenCalledTimes(1);
    });

    test("reset lets the same instance be initialized and run again", () => {
      const algorithm = new AlgorithmClass();
      const graph = buildOpenGrid(3, 3);
      algorithm.initialize(graph);
      runToCompletion(algorithm);

      algorithm.reset();
      algorithm.initialize(graph);
      expect(runToCompletion(algorithm)).toBe(SearchStatus.Complete);
    });

    test("never visits vertices on the far side of a Wall", () => {
      const algorithm = new AlgorithmClass();
      const graph = buildWalledCorridor();
      algorithm.initialize(graph);

      const visitedIds = [];
      algorithm.onNodeVisited.push((id) => visitedIds.push(id));
      runToCompletion(algorithm);

      expect(visitedIds).not.toContain(graph.toId(0, 2));
    });
  });
}
