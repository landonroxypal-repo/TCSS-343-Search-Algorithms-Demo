import { SearchStatus } from "../../src/datamodel/SearchStatus.js";

describe("SearchStatus", () => {
  const expectedKeys = ["Inactive", "InProgress", "Complete"];

  test("defines exactly the statuses from the UML enumeration", () => {
    expect(Object.keys(SearchStatus).sort()).toEqual([...expectedKeys].sort());
  });

  test("each status has a unique value", () => {
    const values = Object.values(SearchStatus);
    expect(new Set(values).size).toBe(values.length);
  });

  test("is frozen so statuses cannot be reassigned at runtime", () => {
    expect(Object.isFrozen(SearchStatus)).toBe(true);
  });
});
