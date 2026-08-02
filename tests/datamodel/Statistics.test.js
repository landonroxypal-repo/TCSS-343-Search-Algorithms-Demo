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
});
