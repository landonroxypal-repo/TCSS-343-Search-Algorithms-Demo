import { BFS } from "../../src/algorithms/BFS.js";
import { describeSearchAlgorithmContract } from "./searchAlgorithmContract.js";

describe("BFS", () => {
  describeSearchAlgorithmContract(BFS);
});
