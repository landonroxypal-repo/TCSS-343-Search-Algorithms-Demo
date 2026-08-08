import { Analysis } from "../src/Analysis.js";
import { Graph } from "../src/datamodel/Graph.js";
import { Statistics } from "../src/datamodel/Statistics.js";
import { Algorithm } from "../src/datamodel/Algorithm.js";
import { Heuristic } from "../src/datamodel/Heuristic.js";
import { VertexState } from "../src/datamodel/VertexState.js";

function buildAnalysis(algorithm, heuristic, time = "2:05 PM") {
  const graph = new Graph(5, 5);
  const stats = new Statistics(0, 0, 0, 0);
  const analysis = new Analysis(algorithm, heuristic, graph, stats, time);
  return { analysis, graph, stats, time };
}

describe("Analysis", () => {
  test("exposes the algorithm it was configured with", () => {
    const { analysis } = buildAnalysis(Algorithm.Dijkstra, Heuristic.None);
    expect(analysis.getAlgorithm()).toBe(Algorithm.Dijkstra);
  });

  test("exposes the heuristic it was configured with", () => {
    const { analysis } = buildAnalysis(Algorithm.AStar, Heuristic.Manhattan);
    expect(analysis.getHeuristic()).toBe(Heuristic.Manhattan);
  });

  test("exposes the time it was configured with", () => {
    const { analysis } = buildAnalysis(
      Algorithm.BFS,
      Heuristic.None,
      "11:47 PM",
    );
    expect(analysis.getTime()).toBe("11:47 PM");
  });

  describe("Graph copy", () => {
    test("returns a Graph that is a different instance from the one passed in", () => {
      const { analysis, graph } = buildAnalysis(Algorithm.BFS, Heuristic.None);
      expect(analysis.getGraph()).not.toBe(graph);
    });

    test("the copy starts out with the same vertex states as the original", () => {
      const graph = new Graph(3, 3);
      graph.setState(graph.toId(0, 0), VertexState.Start);
      graph.setState(graph.toId(2, 2), VertexState.End);
      graph.setState(graph.toId(1, 1), VertexState.Wall);
      const analysis = new Analysis(
        Algorithm.BFS,
        Heuristic.None,
        graph,
        new Statistics(0, 0, 0, 0),
        "2:05 PM",
      );

      const copy = analysis.getGraph();
      for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 3; column++) {
          const id = graph.toId(row, column);
          expect(copy.getState(id)).toBe(graph.getState(id));
        }
      }
    });

    test("later mutations to the original graph do not leak into the copy", () => {
      const { analysis, graph } = buildAnalysis(Algorithm.BFS, Heuristic.None);
      const id = graph.toId(0, 0);

      graph.setState(id, VertexState.Wall);

      expect(analysis.getGraph().getState(id)).toBe(VertexState.Idle);
    });

    test("mutating the returned copy does not affect the original graph", () => {
      const { analysis, graph } = buildAnalysis(Algorithm.BFS, Heuristic.None);
      const id = graph.toId(0, 0);

      analysis.getGraph().setState(id, VertexState.Wall);

      expect(graph.getState(id)).toBe(VertexState.Idle);
    });
  });

  describe("Statistics copy", () => {
    // Statistics only exposes getters (no setters), so there's no public way
    // to mutate one after construction and check whether the copy reacts.
    // Identity plus matching values at copy time is the most we can assert.
    test("returns a Statistics that is a different instance from the one passed in", () => {
      const { analysis, stats } = buildAnalysis(
        Algorithm.NaiveDFS,
        Heuristic.None,
      );
      expect(analysis.getStats()).not.toBe(stats);
    });

    test("the copy starts out with the same values as the original", () => {
      const { analysis, stats } = buildAnalysis(
        Algorithm.NaiveDFS,
        Heuristic.None,
      );
      const copy = analysis.getStats();
      expect(copy.getPathLength()).toBe(stats.getPathLength());
      expect(copy.getOperationCount()).toBe(stats.getOperationCount());
      expect(copy.getExpandedNodes()).toBe(stats.getExpandedNodes());
      expect(copy.getElapsedTime()).toBe(stats.getElapsedTime());
    });
  });
});
