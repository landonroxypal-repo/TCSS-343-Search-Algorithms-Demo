import { UnweightedSearchAlgorithm } from "./UnweightedSearchAlgorithm.js";

export class NaiveDFS extends UnweightedSearchAlgorithm {
  _removeNext() {
    return this.dataStructure.pop();
  }
}
