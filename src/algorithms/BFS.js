import { UnweightedSearchAlgorithm } from "./UnweightedSearchAlgorithm.js";
import { Queue } from "../data-structures/Queue.js";

export class BFS extends UnweightedSearchAlgorithm {
  _createDataStructure() {
    return new Queue();
  }
}
