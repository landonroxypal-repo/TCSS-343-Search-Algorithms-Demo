import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";
import { recoverPath } from "./searchAlgorithmContract.js";

// No real SearchAlgorithm subclass ever produces a cyclic previousVertex
// chain - this guards recoverPath itself against ever silently looping
// forever if one did, so it's exercised with a duck-typed fake algorithm
// instead of a real one.
describe("recoverPath", () => {
  test("throws if the previousVertex chain contains a cycle", () => {
    const graph = new Graph(3, 1);
    graph.setState(graph.toId(0, 0), VertexState.Start);
    graph.setState(graph.toId(0, 2), VertexState.End);

    const endId = graph.getEndId();
    const middleId = graph.toId(0, 1);

    const vertexInfo = new Array(graph.getVertexCount())
      .fill(null)
      .map(() => ({ getPreviousVertex: () => null }));
    vertexInfo[endId] = { getPreviousVertex: () => middleId };
    vertexInfo[middleId] = { getPreviousVertex: () => endId };

    const fakeAlgorithm = { getVertexInfo: () => vertexInfo };

    expect(() => recoverPath(fakeAlgorithm, graph)).toThrow();
  });
});
