import { CoordinatePair } from "../../src/datamodel/CoordinatePair.js";

describe("CoordinatePair", () => {
  test("stores the row and column it was constructed with", () => {
    const pair = new CoordinatePair(3, 7);
    expect(pair.getRow()).toBe(3);
    expect(pair.getColumn()).toBe(7);
  });

  test("distinguishes row from column", () => {
    const pair = new CoordinatePair(1, 2);
    expect(pair.getRow()).not.toBe(pair.getColumn());
  });

  test("supports coordinates at the origin", () => {
    const pair = new CoordinatePair(0, 0);
    expect(pair.getRow()).toBe(0);
    expect(pair.getColumn()).toBe(0);
  });
});
