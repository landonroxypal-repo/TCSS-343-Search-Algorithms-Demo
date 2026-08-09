import { VertexInfo } from "../../src/datamodel/VertexInfo.js";

describe("VertexInfo", () => {
  test("stores the heuristic cost it was constructed with", () => {
    const info = new VertexInfo(12);
    expect(info.getHeuristicCost()).toBe(12);
  });

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

  describe("relaxIfBetter", () => {
    test("improves and returns true when the candidate distance is shorter than the current path length", () => {
      const info = new VertexInfo(0);
      const improved = info.relaxIfBetter(5, 10);

      expect(improved).toBe(true);
      expect(info.getCurrentPathLength()).toBe(5);
      expect(info.getPreviousVertex()).toBe(10);
    });

    test("does not improve and returns false when the candidate distance is longer than the current path length", () => {
      const info = new VertexInfo(0);
      info.relaxIfBetter(5, 10);

      const improved = info.relaxIfBetter(10, 99);

      expect(improved).toBe(false);
      expect(info.getCurrentPathLength()).toBe(5);
      expect(info.getPreviousVertex()).toBe(10);
    });

    test("an equal candidate distance does not count as an improvement", () => {
      const info = new VertexInfo(0);
      info.relaxIfBetter(5, 10);

      const improved = info.relaxIfBetter(5, 30);

      expect(improved).toBe(false);
      expect(info.getCurrentPathLength()).toBe(5);
      expect(info.getPreviousVertex()).toBe(10);
    });

    test("can improve more than once as shorter distances are found", () => {
      const info = new VertexInfo(0);
      info.relaxIfBetter(5, 10);

      const improved = info.relaxIfBetter(3, 20);

      expect(improved).toBe(true);
      expect(info.getCurrentPathLength()).toBe(3);
      expect(info.getPreviousVertex()).toBe(20);
    });
  });
});
