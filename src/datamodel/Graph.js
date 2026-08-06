import { VertexState } from "./VertexState.js";
import { CoordinatePair } from "./CoordinatePair.js";

const DEFAULT_EDGE_WEIGHT = 1;
const ORTHOGONAL_DELTAS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const DIAGONAL_DELTAS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export class Graph {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    const size = width * height;
    this.vertexStates = new Array(size).fill(VertexState.Idle);
    this.startId = -1;
    this.endId = -1;
    this.allowDiagonals = false;

    this.adjacencyList = [];
    this.diagonalAdjacencyList = [];
    for (let id = 0; id < size; id++) {
      this.adjacencyList.push(new Map());
      this.diagonalAdjacencyList.push(new Map());
    }

    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        const id = this.toId(row, column);
        this._connectDeltas(id, row, column, ORTHOGONAL_DELTAS, this.adjacencyList);
        this._connectDeltas(id, row, column, DIAGONAL_DELTAS, this.diagonalAdjacencyList);
      }
    }
  }

  _connectDeltas(id, row, column, deltas, adjacencyList) {
    for (const [rowDelta, columnDelta] of deltas) {
      const neighborRow = row + rowDelta;
      const neighborColumn = column + columnDelta;
      if (
        neighborRow >= 0 &&
        neighborRow < this.height &&
        neighborColumn >= 0 &&
        neighborColumn < this.width
      ) {
        const neighborId = this.toId(neighborRow, neighborColumn);
        adjacencyList[id].set(neighborId, DEFAULT_EDGE_WEIGHT);
      }
    }
  }

  toId(row, column) {
    return row * this.width + column;
  }

  toRowColumn(id) {
    const row = Math.floor(id / this.width);
    const column = id % this.width;
    return new CoordinatePair(row, column);
  }

  setAllowDiagonals(allowDiagonals) {
    this.allowDiagonals = allowDiagonals;
  }

  getNeighbors(id) {
    if (this.vertexStates[id] === VertexState.Wall) {
      return [];
    }
    const neighborIds = [...this.adjacencyList[id].keys()];
    if (this.allowDiagonals) {
      neighborIds.push(...this.diagonalAdjacencyList[id].keys());
    }
    return neighborIds.filter(
      (neighborId) => this.vertexStates[neighborId] !== VertexState.Wall,
    );
  }

  getEdgeWeight(fromId, toId) {
    if (this.adjacencyList[fromId].has(toId)) {
      return this.adjacencyList[fromId].get(toId);
    }
    return this.diagonalAdjacencyList[fromId].get(toId);
  }

  setState(id, state) {
    this.vertexStates[id] = state;

    if (state === VertexState.Start) {
      this.startId = id;
    } else if (this.startId === id) {
      this.startId = -1;
    }

    if (state === VertexState.End) {
      this.endId = id;
    } else if (this.endId === id) {
      this.endId = -1;
    }
  }

  getStartId() {
    return this.startId;
  }

  getEndId() {
    return this.endId;
  }

  getState(id) {
    return this.vertexStates[id];
  }

  reset() {
    this.vertexStates.fill(VertexState.Idle);
    this.startId = -1;
    this.endId = -1;
  }

  copy() {
    const copy = new Graph(this.width, this.height);
    for (let id = 0; id < this.vertexStates.length; id++) {
      copy.setState(id, this.vertexStates[id]);
    }
    copy.allowDiagonals = this.allowDiagonals;
    return copy;
  }
}
