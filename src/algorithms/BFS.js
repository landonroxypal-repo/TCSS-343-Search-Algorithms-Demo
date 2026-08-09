import { UnweightedSearchAlgorithm } from "./UnweightedSearchAlgorithm.js";
import { Queue } from "./Queue.js";

export class BFS extends UnweightedSearchAlgorithm {
  _createDataStructure() {
    return new Queue();
  }
}
