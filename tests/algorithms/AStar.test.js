import { AStar } from "../../src/algorithms/AStar.js";
import { Heuristic } from "../../src/datamodel/Heuristic.js";
import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";
import {
  describeSearchAlgorithmContract,
  buildOpenGrid,
  buildGraphWithTailBeyondEnd,
  runToCompletion,
  recoverPath,
  pathWeight,
} from "./searchAlgorithmContract.js";

// Independent oracle, written directly against Graph's public API rather
// than reusing src/algorithms/AStar.js or Dijkstra.js - true shortest-path
// weight doesn't depend on any heuristic.
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

describe("AStar", () => {
  describeSearchAlgorithmContract(AStar);

  test("defaults to a heuristic from the Heuristic enumeration", () => {
    const algorithm = new AStar();
    expect(Object.values(Heuristic)).toContain(algorithm.getHeuristic());
  });

  test("setHeuristic changes the heuristic returned by getHeuristic", () => {
    const algorithm = new AStar();
    algorithm.setHeuristic(Heuristic.Octile);
    expect(algorithm.getHeuristic()).toBe(Heuristic.Octile);
  });

  describe("heuristic formulas", () => {
    // 5x4 grid: Start (0,0), End (3,4) - a 3-4-5 triangle so every formula
    // produces a distinct, hand-checkable value at Start.
    const HEURISTIC_EXPECTATIONS = [
      { heuristic: Heuristic.Manhattan, expected: 7 },
      { heuristic: Heuristic.Euclidian, expected: 5 },
      { heuristic: Heuristic.Chebyshev, expected: 4 },
      { heuristic: Heuristic.Octile, expected: 3 * Math.SQRT2 + 1 },
      { heuristic: Heuristic.None, expected: 0 },
    ];

    test.each(HEURISTIC_EXPECTATIONS)(
      "$heuristic estimates the cost from Start to End correctly",
      ({ heuristic, expected }) => {
        const graph = buildOpenGrid(5, 4);
        const algorithm = new AStar();
        algorithm.setHeuristic(heuristic);
        algorithm.initialize(graph);

        const startCost = algorithm
          .getVertexInfo()
          [graph.getStartId()].getHeuristicCost();

        expect(startCost).toBeCloseTo(expected);
      },
    );
  });

  describe("optimality", () => {
    test("still finds the shortest-weight path when a vertex is relaxed more than once", () => {
      // (1,0) is walled off and row 2 is walled except at column 0, forcing
      // a narrow, winding route. With realistic diagonal weights, and a
      // heuristic steering exploration out of strict g-order, some vertices
      // along the way are first discovered via a costlier route and later
      // re-relaxed via a cheaper one once found - including a stale queue
      // entry that gets popped and discarded after its vertex is already
      // finalized. That's the exact scenario the priority queue's lazy
      // deletion exists to handle correctly.
      const graph = new Graph(3, 4);
      graph.setRealisticDiagonalWeights(true);
      graph.setState(graph.toId(1, 0), VertexState.Wall);
      graph.setState(graph.toId(2, 1), VertexState.Wall);
      graph.setState(graph.toId(2, 2), VertexState.Wall);
      graph.setState(graph.toId(0, 0), VertexState.Start);
      graph.setState(graph.toId(3, 2), VertexState.End);

      const algorithm = new AStar();
      algorithm.setHeuristic(Heuristic.Manhattan);
      algorithm.initialize(graph);
      runToCompletion(algorithm, graph.getVertexCount() + 1);

      const path = recoverPath(algorithm, graph);
      const shortestWeight = shortestPathWeight(
        graph,
        graph.getStartId(),
        graph.getEndId(),
      );

      expect(path).not.toBeNull();
      expect(pathWeight(graph, path)).toBeCloseTo(shortestWeight);
    });
  });

  describe("early termination", () => {
    test("stops as soon as End is found and never visits vertices beyond it", () => {
      const { graph, tailIds } = buildGraphWithTailBeyondEnd(3);
      const algorithm = new AStar();
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
