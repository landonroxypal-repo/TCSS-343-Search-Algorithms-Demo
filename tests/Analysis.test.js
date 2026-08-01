import { Analysis } from "../src/Analysis.js";
import { Graph } from "../src/datamodel/Graph.js";
import { Statistics } from "../src/datamodel/Statistics.js";
import { Algorithm } from "../src/datamodel/Algorithm.js";
import { Heuristic } from "../src/datamodel/Heuristic.js";

// The UML doesn't show Analysis's constructor signature. The composition
// arrows say it owns exactly one Graph and one Statistics, and it needs an
// algorithm/heuristic selection to run anything, so we assume it takes all
// four as constructor arguments: (width, height, algorithm, heuristic).
describe("Analysis", () => {
  test("owns a Graph built from the given dimensions", () => {
    const analysis = new Analysis(5, 5, Algorithm.BFS, Heuristic.None);
    expect(analysis.getGraph()).toBeInstanceOf(Graph);
  });

  test("exposes the algorithm it was configured with", () => {
    const analysis = new Analysis(5, 5, Algorithm.Dijkstra, Heuristic.None);
    expect(analysis.getAlgorithm()).toBe(Algorithm.Dijkstra);
  });

  test("exposes the heuristic it was configured with", () => {
    const analysis = new Analysis(5, 5, Algorithm.AStar, Heuristic.Manhattan);
    expect(analysis.getHeuristic()).toBe(Heuristic.Manhattan);
  });

  test("owns its own Statistics instance", () => {
    const analysis = new Analysis(5, 5, Algorithm.NaiveDFS, Heuristic.None);
    expect(analysis.getStats()).toBeInstanceOf(Statistics);
  });
});
