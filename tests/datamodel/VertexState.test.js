import { VertexState } from "../../src/datamodel/VertexState.js";

describe("VertexState", () => {
  const expectedKeys = ["Idle", "Start", "End", "Visited", "Expanded", "Wall"];

  test("defines exactly the states from the UML enumeration", () => {
    expect(Object.keys(VertexState).sort()).toEqual([...expectedKeys].sort());
  });

  test("each state has a unique value", () => {
    const values = Object.values(VertexState);
    expect(new Set(values).size).toBe(values.length);
  });

  test("is frozen so states cannot be reassigned at runtime", () => {
    expect(Object.isFrozen(VertexState)).toBe(true);
  });
});
