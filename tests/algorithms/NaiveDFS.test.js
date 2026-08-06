import { NaiveDFS } from "../../src/algorithms/NaiveDFS.js";
import {
  describeSearchAlgorithmContract,
  buildGraphWithTailBeyondEnd,
  runToCompletion,
} from "./searchAlgorithmContract.js";

describe("NaiveDFS", () => {
  describeSearchAlgorithmContract(NaiveDFS);

  describe("early termination", () => {
    test("stops as soon as End is found and never visits vertices beyond it", () => {
      const { graph, tailIds } = buildGraphWithTailBeyondEnd(3);
      const algorithm = new NaiveDFS();
      algorithm.initialize(graph);

      const visitedIds = [];
      algorithm.onNodeVisited.push((id) => visitedIds.push(id));
      runToCompletion(algorithm);

      for (const tailId of tailIds) {
        expect(visitedIds).not.toContain(tailId);
      }
    });
  });
});
