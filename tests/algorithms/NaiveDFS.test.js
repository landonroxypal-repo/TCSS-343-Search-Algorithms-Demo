import { NaiveDFS } from "../../src/algorithms/NaiveDFS.js";
import { describeSearchAlgorithmContract } from "./searchAlgorithmContract.js";

describe("NaiveDFS", () => {
  describeSearchAlgorithmContract(NaiveDFS);
});
