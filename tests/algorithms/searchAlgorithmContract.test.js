import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";
import {
  recoverPath,
  buildGraphWithTailBeyondEnd,
} from "./searchAlgorithmContract.js";

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

describe("buildGraphWithTailBeyondEnd", () => {
  test("places Start at column 0 and End at column 2, regardless of tail length", () => {
    const { graph } = buildGraphWithTailBeyondEnd(4);
    expect(graph.getStartId()).toBe(graph.toId(0, 0));
    expect(graph.getEndId()).toBe(graph.toId(0, 2));
  });

  test("returns one tail id per column immediately beyond End, in order", () => {
    const { graph, tailIds } = buildGraphWithTailBeyondEnd(4);
    expect(tailIds).toEqual([
      graph.toId(0, 3),
      graph.toId(0, 4),
      graph.toId(0, 5),
      graph.toId(0, 6),
    ]);
  });

  test("the graph is exactly wide enough for Start, the middle vertex, End, and the tail", () => {
    const { graph } = buildGraphWithTailBeyondEnd(4);
    expect(graph.getVertexCount()).toBe(7);
  });

  test("defaults to a tail length of 3 when no argument is given", () => {
    const { graph, tailIds } = buildGraphWithTailBeyondEnd();
    expect(tailIds).toHaveLength(3);
    expect(graph.getVertexCount()).toBe(6);
  });

  test("a tail length of 0 produces no tail ids", () => {
    const { tailIds } = buildGraphWithTailBeyondEnd(0);
    expect(tailIds).toEqual([]);
  });
});
