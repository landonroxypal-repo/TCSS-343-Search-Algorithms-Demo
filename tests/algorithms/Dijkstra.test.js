import { Dijkstra } from "../../src/algorithms/Dijkstra.js";
import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";
import {
  describeSearchAlgorithmContract,
  buildOpenGrid,
  buildMazeWithSingleGap,
  buildGraphWithTailBeyondEnd,
  runToCompletion,
  recoverPath,
  pathWeight,
} from "./searchAlgorithmContract.js";

// Independent oracle, written directly against Graph's public API rather
// than reusing src/algorithms/Dijkstra.js - if it reused Dijkstra, a bug
// shared by both the oracle and the algorithm under test would go
// unnoticed. Uses real edge weights rather than hop count, since that's
// the whole point of Dijkstra over BFS.
function shortestPathWeight(graph, startId, endId) {
  const distances = new Map([[startId, 0]]);
  const finalized = new Set();
  const queue = [{ id: startId, priority: 0 }];

  while (queue.length > 0) {
    let minIndex = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].priority < queue[minIndex].priority) {
        minIndex = i;
      }
    }
    const { id: currentId } = queue.splice(minIndex, 1)[0];
    if (finalized.has(currentId)) {
      continue;
    }
    finalized.add(currentId);

    if (currentId === endId) {
      return distances.get(currentId);
    }

    for (const neighborId of graph.getNeighbors(currentId)) {
      if (finalized.has(neighborId)) {
        continue;
      }
      const candidate =
        distances.get(currentId) + graph.getEdgeWeight(currentId, neighborId);
      if (!distances.has(neighborId) || candidate < distances.get(neighborId)) {
        distances.set(neighborId, candidate);
        queue.push({ id: neighborId, priority: candidate });
      }
    }
  }

  return null;
}

describe("Dijkstra", () => {
  describeSearchAlgorithmContract(Dijkstra);

  describe("optimality", () => {
    test("finds a path with the shortest possible total weight on an open grid", () => {
      const graph = buildOpenGrid(5, 5);
      const algorithm = new Dijkstra();
      algorithm.initialize(graph);
      runToCompletion(algorithm, graph.getVertexCount() + 1);

      const path = recoverPath(algorithm, graph);
      const shortestWeight = shortestPathWeight(
        graph,
        graph.getStartId(),
        graph.getEndId(),
      );

      expect(path).not.toBeNull();
      expect(pathWeight(graph, path)).toBe(shortestWeight);
    });

    test("finds a path with the shortest possible total weight around a forced detour", () => {
      const graph = buildMazeWithSingleGap();
      const algorithm = new Dijkstra();
      algorithm.initialize(graph);
      runToCompletion(algorithm, graph.getVertexCount() + 1);

      const path = recoverPath(algorithm, graph);
      const shortestWeight = shortestPathWeight(
        graph,
        graph.getStartId(),
        graph.getEndId(),
      );

      expect(path).not.toBeNull();
      expect(shortestWeight).toBe(8);
      expect(pathWeight(graph, path)).toBe(shortestWeight);
    });

    test("still finds the shortest-weight path when a vertex is relaxed more than once", () => {
      // Row 3 is walled except at column 0 and column 3, forcing two
      // separate gaps down to row 4. With realistic diagonal weights the
      // two routes cost differently, so vertex (4,2) is first discovered
      // via the pricier gap and later re-relaxed via the cheaper one - the
      // scenario the priority queue's lazy deletion exists to handle.
      const graph = new Graph(4, 5);
      graph.setRealisticDiagonalWeights(true);
      graph.setState(graph.toId(3, 1), VertexState.Wall);
      graph.setState(graph.toId(3, 2), VertexState.Wall);
      graph.setState(graph.toId(0, 0), VertexState.Start);
      graph.setState(graph.toId(4, 3), VertexState.End);

      const algorithm = new Dijkstra();
      algorithm.initialize(graph);
      runToCompletion(algorithm, graph.getVertexCount() + 1);

      const path = recoverPath(algorithm, graph);
      const shortestWeight = shortestPathWeight(
        graph,
        graph.getStartId(),
        graph.getEndId(),
      );

      expect(path).not.toBeNull();
      expect(pathWeight(graph, path)).toBe(shortestWeight);
    });
  });

  describe("early termination", () => {
    test("stops as soon as End is finalized and never visits vertices beyond it", () => {
      const { graph, tailIds } = buildGraphWithTailBeyondEnd(3);
      const algorithm = new Dijkstra();
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
