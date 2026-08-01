import { Dijkstra } from "../../src/algorithms/Dijkstra.js";
import { describeSearchAlgorithmContract } from "./searchAlgorithmContract.js";

describe("Dijkstra", () => {
  describeSearchAlgorithmContract(Dijkstra);
});
