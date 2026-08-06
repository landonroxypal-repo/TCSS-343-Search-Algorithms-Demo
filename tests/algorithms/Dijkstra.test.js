import { Dijkstra } from "../../src/algorithms/Dijkstra.js";
import {
  describeSearchAlgorithmContract,
  buildOpenGrid,
  buildMazeWithSingleGap,
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
  });
});
