import { UnweightedSearchAlgorithm } from "./UnweightedSearchAlgorithm.js";

export class BFS extends UnweightedSearchAlgorithm {
  _removeNext() {
    return this.dataStructure.shift();
  }
}
