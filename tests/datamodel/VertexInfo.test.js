import { VertexInfo } from "../../src/datamodel/VertexInfo.js";

describe("VertexInfo", () => {
  test("stores the heuristic cost it was constructed with", () => {
    const info = new VertexInfo(12);
    expect(info.getHeuristicCost()).toBe(12);
  });

  // The UML shows setCurrentPathLength()/setPreviousVertex() with no parameter,
  // but a parameterless setter can't set anything meaningful, so we assume one.
  test("current path length can be set and read back", () => {
    const info = new VertexInfo(0);
    info.setCurrentPathLength(42);
    expect(info.getCurrentPathLength()).toBe(42);
  });

  test("previous vertex can be set and read back", () => {
    const info = new VertexInfo(0);
    info.setPreviousVertex(5);
    expect(info.getPreviousVertex()).toBe(5);
  });
});
