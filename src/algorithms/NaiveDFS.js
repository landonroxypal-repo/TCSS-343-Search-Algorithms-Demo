import { UnweightedSearchAlgorithm } from "./UnweightedSearchAlgorithm.js";
import { Stack } from "./Stack.js";

export class NaiveDFS extends UnweightedSearchAlgorithm {
  _createDataStructure() {
    return new Stack();
  }
}
