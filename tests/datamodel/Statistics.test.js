import { Statistics } from "../../src/datamodel/Statistics.js";

describe("Statistics", () => {
  test("starts with zeroed-out counters before any search has run", () => {
    const stats = new Statistics();
    expect(stats.getPathLength()).toBe(0);
    expect(stats.getOperationCount()).toBe(0);
    expect(stats.getExpandedNodes()).toBe(0);
    expect(stats.getElapsedTime()).toBe(0);
  });
});
