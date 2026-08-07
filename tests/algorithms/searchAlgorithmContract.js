import { jest } from "@jest/globals";
import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";
import { SearchStatus } from "../../src/datamodel/SearchStatus.js";
import { SearchAlgorithm } from "../../src/algorithms/SearchAlgorithm.js";

// Shared behavior every SearchAlgorithm subclass (NaiveDFS, BFS, Dijkstra,
// AStar) must satisfy per the UML. Call describeSearchAlgorithmContract(Class)
// from each subclass's own test file instead of duplicating these cases.

export function buildOpenGrid(width, height) {
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

function buildGridWithBarrier(width, height) {
  // A width x height grid split down the middle by a solid wall column, so
  // Start (top-left) and End (bottom-right) are never connected.
  const graph = new Graph(width, height);
  graph.setState(graph.toId(0, 0), VertexState.Start);
  graph.setState(graph.toId(height - 1, width - 1), VertexState.End);

  const barrierColumn = Math.floor(width / 2);
  for (let row = 0; row < height; row++) {
    graph.setState(graph.toId(row, barrierColumn), VertexState.Wall);
  }
  return graph;
}

// A straight 1-row line: Start - middle - End - tail...tail. The tail
// vertices are only reachable by continuing past End, so an algorithm that
// terminates as soon as it finds End should never visit them. Not part of
// the shared contract since Dijkstra (and, once weighted, A*/BestFirst)
// cannot safely stop the instant End is first seen.
export function buildGraphWithTailBeyondEnd(tailLength = 3) {
  const width = 3 + tailLength;
  const graph = new Graph(width, 1);
  graph.setState(graph.toId(0, 0), VertexState.Start);
  graph.setState(graph.toId(0, 2), VertexState.End);

  const tailIds = [];
  for (let column = 3; column < width; column++) {
    tailIds.push(graph.toId(0, column));
  }

  return { graph, tailIds };
}

// A 5x5 grid with row 2 walled off except a single gap at column 4, so the
// shortest Start->End path is forced into a long detour rather than
// matching the raw Manhattan distance between them.
export function buildMazeWithSingleGap() {
  const graph = new Graph(5, 5);
  graph.setState(graph.toId(0, 0), VertexState.Start);
  graph.setState(graph.toId(4, 0), VertexState.End);

  for (let column = 0; column < 4; column++) {
    graph.setState(graph.toId(2, column), VertexState.Wall);
  }

  return graph;
}

export function runToCompletion(algorithm, maxSteps = 500) {
  let status;
  for (let i = 0; i < maxSteps; i++) {
    status = algorithm.step();
    if (status === SearchStatus.Complete) {
      break;
    }
  }
  return status;
}

// Walks previousVertex backward from End to Start using the algorithm's own
// VertexInfo bookkeeping. Returns null if End was never reached (no solution
// recoverable), or the recovered path (Start ... End) otherwise.
export function recoverPath(algorithm, graph) {
  const vertexInfo = algorithm.getVertexInfo();
  const startId = graph.getStartId();
  const endId = graph.getEndId();

  if (endId !== startId && vertexInfo[endId].getPreviousVertex() === null) {
    return null;
  }

  const path = [endId];
  let currentId = endId;
  const maxHops = graph.getVertexCount();
  for (let hops = 0; currentId !== startId; hops++) {
    if (hops >= maxHops) {
      throw new Error(
        "recoverPath did not terminate - previousVertex chain may contain a cycle",
      );
    }
    currentId = vertexInfo[currentId].getPreviousVertex();
    path.push(currentId);
  }
  return path.reverse();
}

// Sums the edge weight of each consecutive pair in a path recovered via
// recoverPath. Assumes every consecutive pair is actually adjacent - true
// for anything recoverPath returns, since it reads previousVertex links.
export function pathWeight(graph, path) {
  let totalWeight = 0;
  for (let i = 1; i < path.length; i++) {
    totalWeight += graph.getEdgeWeight(path[i - 1], path[i]);
  }
  return totalWeight;
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

    test("throws if initialized on a graph with no start or end vertex", () => {
      const algorithm = new AlgorithmClass();
      const graph = new Graph(3, 3);
      expect(() => algorithm.initialize(graph)).toThrow();
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

    test("onNodeExpanded listeners are notified as the search runs", () => {
      const algorithm = new AlgorithmClass();
      algorithm.initialize(buildOpenGrid(3, 3));
      const onNodeExpanded = jest.fn();
      algorithm.onNodeExpanded.push(onNodeExpanded);
      runToCompletion(algorithm);
      expect(onNodeExpanded).toHaveBeenCalled();
    });

    test("onSearchCompleted listeners are notified exactly once", () => {
      const algorithm = new AlgorithmClass();
      algorithm.initialize(buildOpenGrid(3, 3));
      const onSearchCompleted = jest.fn();
      algorithm.onSearchCompleted.push(onSearchCompleted);
      runToCompletion(algorithm);
      expect(onSearchCompleted).toHaveBeenCalledTimes(1);
    });

    test("stepping again after Complete is a no-op that keeps returning Complete", () => {
      const algorithm = new AlgorithmClass();
      algorithm.initialize(buildOpenGrid(3, 3));
      runToCompletion(algorithm);

      const onSearchCompleted = jest.fn();
      algorithm.onSearchCompleted.push(onSearchCompleted);
      const status = algorithm.step();

      expect(status).toBe(SearchStatus.Complete);
      expect(onSearchCompleted).not.toHaveBeenCalled();
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

    test("recovers a path from Start to End on a larger grid when one exists", () => {
      const algorithm = new AlgorithmClass();
      const graph = buildOpenGrid(5, 5);
      algorithm.initialize(graph);
      runToCompletion(algorithm);

      const path = recoverPath(algorithm, graph);

      expect(path).not.toBeNull();
      expect(path[0]).toBe(graph.getStartId());
      expect(path[path.length - 1]).toBe(graph.getEndId());
      for (let i = 1; i < path.length; i++) {
        expect(graph.getNeighbors(path[i - 1])).toContain(path[i]);
      }
    });

    test("recovers no path on a larger grid when none exists", () => {
      const algorithm = new AlgorithmClass();
      const graph = buildGridWithBarrier(5, 5);
      algorithm.initialize(graph);
      runToCompletion(algorithm);

      expect(recoverPath(algorithm, graph)).toBeNull();
    });

    test("recovers a path from Start to End on a full-size (30x56) grid when one exists", () => {
      const algorithm = new AlgorithmClass();
      const graph = buildOpenGrid(30, 56);
      algorithm.initialize(graph);
      runToCompletion(algorithm, graph.getVertexCount() + 1);

      const path = recoverPath(algorithm, graph);

      expect(path).not.toBeNull();
      expect(path[0]).toBe(graph.getStartId());
      expect(path[path.length - 1]).toBe(graph.getEndId());
      for (let i = 1; i < path.length; i++) {
        expect(graph.getNeighbors(path[i - 1])).toContain(path[i]);
      }
    });

    test("recovers no path on a full-size (30x56) grid when none exists", () => {
      const algorithm = new AlgorithmClass();
      const graph = buildGridWithBarrier(30, 56);
      algorithm.initialize(graph);
      runToCompletion(algorithm, graph.getVertexCount() + 1);

      expect(recoverPath(algorithm, graph)).toBeNull();
    });
  });
}
