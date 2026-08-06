import { BFS } from "../../src/algorithms/BFS.js";
import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";
import {
  describeSearchAlgorithmContract,
  buildOpenGrid,
  buildGraphWithTailBeyondEnd,
  runToCompletion,
  recoverPath,
} from "./searchAlgorithmContract.js";

// Independent oracle, written directly against Graph's public API rather
// than reusing src/algorithms/BFS.js - if it reused BFS, a bug shared by
// both the oracle and the algorithm under test would go unnoticed.
function shortestPathHopCount(graph, startId, endId) {
  const distances = new Map([[startId, 0]]);
  const queue = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === endId) {
      return distances.get(currentId);
    }
    for (const neighborId of graph.getNeighbors(currentId)) {
      if (!distances.has(neighborId)) {
        distances.set(neighborId, distances.get(currentId) + 1);
        queue.push(neighborId);
      }
    }
  }

  return null;
}

function buildMazeWithSingleGap() {
  // 5x5 grid with row 2 walled off except a single gap at column 4, so the
  // shortest Start->End path is forced into a long detour rather than
  // matching the raw Manhattan distance between them.
  const graph = new Graph(5, 5);
  graph.setState(graph.toId(0, 0), VertexState.Start);
  graph.setState(graph.toId(4, 0), VertexState.End);

  for (let column = 0; column < 4; column++) {
    graph.setState(graph.toId(2, column), VertexState.Wall);
  }

  return graph;
}

describe("BFS", () => {
  describeSearchAlgorithmContract(BFS);

  describe("optimality", () => {
    test("finds a shortest possible path on an open grid", () => {
      const graph = buildOpenGrid(5, 5);
      const algorithm = new BFS();
      algorithm.initialize(graph);
      runToCompletion(algorithm, graph.getVertexCount() + 1);

      const path = recoverPath(algorithm, graph);
      const shortestHopCount = shortestPathHopCount(
        graph,
        graph.getStartId(),
        graph.getEndId(),
      );

      expect(path).not.toBeNull();
      expect(path.length - 1).toBe(shortestHopCount);
    });

    test("finds a shortest possible path around a forced detour", () => {
      const graph = buildMazeWithSingleGap();
      const algorithm = new BFS();
      algorithm.initialize(graph);
      runToCompletion(algorithm, graph.getVertexCount() + 1);

      const path = recoverPath(algorithm, graph);
      const shortestHopCount = shortestPathHopCount(
        graph,
        graph.getStartId(),
        graph.getEndId(),
      );

      expect(path).not.toBeNull();
      expect(shortestHopCount).toBe(12);
      expect(path.length - 1).toBe(shortestHopCount);
    });
  });

  describe("early termination", () => {
    test("stops as soon as End is found and never visits vertices beyond it", () => {
      const { graph, tailIds } = buildGraphWithTailBeyondEnd(3);
      const algorithm = new BFS();
      algorithm.initialize(graph);

      const visitedIds = [];
      algorithm.onNodeVisited.push((id) => visitedIds.push(id));
      runToCompletion(algorithm);

      for (const tailId of tailIds) {
        expect(visitedIds).not.toContain(tailId);
      }
    });
  });
});
