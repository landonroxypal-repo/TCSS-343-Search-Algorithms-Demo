export class Statistics {
  constructor(pathLength, operationCount, expandedNodes, elapsedTime) {
    this.pathLength = pathLength;
    this.operationCount = operationCount;
    this.expandedNodes = expandedNodes;
    this.elapsedTime = elapsedTime;
  }

  getPathLength() {
    return this.pathLength;
  }

  getOperationCount() {
    return this.operationCount;
  }

  getExpandedNodes() {
    return this.expandedNodes;
  }

  getElapsedTime() {
    return this.elapsedTime;
  }

  copy() {
    return new Statistics(
      this.pathLength,
      this.operationCount,
      this.expandedNodes,
      this.elapsedTime,
    );
  }
}
