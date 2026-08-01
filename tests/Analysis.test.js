import { Analysis } from "../src/Analysis.js";
import { Graph } from "../src/datamodel/Graph.js";
import { Statistics } from "../src/datamodel/Statistics.js";
import { Algorithm } from "../src/datamodel/Algorithm.js";
import { Heuristic } from "../src/datamodel/Heuristic.js";

function buildAnalysis(algorithm, heuristic) {
  const graph = new Graph(5, 5);
  const stats = new Statistics();
  const analysis = new Analysis(algorithm, heuristic, graph, stats);
  return { analysis, graph, stats };
}

describe("Analysis", () => {
  test("exposes the exact Graph instance it was constructed with", () => {
    const { analysis, graph } = buildAnalysis(Algorithm.BFS, Heuristic.None);
    expect(analysis.getGraph()).toBe(graph);
  });

  test("exposes the exact Statistics instance it was constructed with", () => {
    const { analysis, stats } = buildAnalysis(
      Algorithm.NaiveDFS,
      Heuristic.None,
    );
    expect(analysis.getStats()).toBe(stats);
  });

  test("exposes the algorithm it was configured with", () => {
    const { analysis } = buildAnalysis(Algorithm.Dijkstra, Heuristic.None);
    expect(analysis.getAlgorithm()).toBe(Algorithm.Dijkstra);
  });

  test("exposes the heuristic it was configured with", () => {
    const { analysis } = buildAnalysis(Algorithm.AStar, Heuristic.Manhattan);
    expect(analysis.getHeuristic()).toBe(Heuristic.Manhattan);
  });
});
