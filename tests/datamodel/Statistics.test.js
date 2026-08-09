import { Statistics } from "../../src/datamodel/Statistics.js";

describe("Statistics", () => {
  test("stores each constructor argument in its own field", () => {
    const stats = new Statistics(5, 10, 15, 2.5);
    expect(stats.getPathLength()).toBe(5);
    expect(stats.getOperationCount()).toBe(10);
    expect(stats.getExpandedNodes()).toBe(15);
    expect(stats.getElapsedTime()).toBe(2.5);
  });

  test("supports zeroed-out counters for a search that hasn't run yet", () => {
    const stats = new Statistics(0, 0, 0, 0);
    expect(stats.getPathLength()).toBe(0);
    expect(stats.getOperationCount()).toBe(0);
    expect(stats.getExpandedNodes()).toBe(0);
    expect(stats.getElapsedTime()).toBe(0);
  });

  describe("copy", () => {
    // No setters exist on this class, so - same as AlgorithmSelection - the
    // only testable copy semantics are identity divergence plus matching
    // values at copy time.
    test("returns a Statistics that is a different instance from the original", () => {
      const stats = new Statistics(5, 10, 15, 2.5);
      expect(stats.copy()).not.toBe(stats);
    });

    test("the copy starts out with the same values as the original", () => {
      const stats = new Statistics(5, 10, 15, 2.5);
      const copy = stats.copy();
      expect(copy.getPathLength()).toBe(stats.getPathLength());
      expect(copy.getOperationCount()).toBe(stats.getOperationCount());
      expect(copy.getExpandedNodes()).toBe(stats.getExpandedNodes());
      expect(copy.getElapsedTime()).toBe(stats.getElapsedTime());
    });
  });
});
