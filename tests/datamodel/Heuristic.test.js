import { Heuristic } from "../../src/datamodel/Heuristic.js";

describe("Heuristic", () => {
  const expectedKeys = [
    "None",
    "Euclidian",
    "Manhattan",
    "Chebyshev",
    "Octile",
  ];

  test("defines exactly the heuristics from the UML enumeration", () => {
    expect(Object.keys(Heuristic).sort()).toEqual([...expectedKeys].sort());
  });

  test("each heuristic has a unique value", () => {
    const values = Object.values(Heuristic);
    expect(new Set(values).size).toBe(values.length);
  });

  test("is frozen so heuristics cannot be reassigned at runtime", () => {
    expect(Object.isFrozen(Heuristic)).toBe(true);
  });
});
