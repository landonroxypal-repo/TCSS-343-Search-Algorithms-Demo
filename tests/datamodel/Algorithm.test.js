import { Algorithm } from "../../src/datamodel/Algorithm.js";

describe("Algorithm", () => {
  const expectedKeys = ["NaiveDFS", "BFS", "Dijkstra", "AStar"];

  test("defines exactly the algorithms from the UML enumeration", () => {
    expect(Object.keys(Algorithm).sort()).toEqual([...expectedKeys].sort());
  });

  test("each algorithm has a unique value", () => {
    const values = Object.values(Algorithm);
    expect(new Set(values).size).toBe(values.length);
  });

  test("is frozen so algorithms cannot be reassigned at runtime", () => {
    expect(Object.isFrozen(Algorithm)).toBe(true);
  });
});
