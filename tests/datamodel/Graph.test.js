import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";

describe("Graph", () => {
  test("creates one Idle vertex per grid cell", () => {
    const graph = new Graph(4, 3);
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 4; column++) {
        const id = graph.toId(row, column);
        expect(graph.getState(id)).toBe(VertexState.Idle);
      }
    }
  });

  test("toId assigns a unique id to every cell in the grid", () => {
    const graph = new Graph(4, 3);
    const ids = new Set();
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 4; column++) {
        ids.add(graph.toId(row, column));
      }
    }
    expect(ids.size).toBe(4 * 3);
  });

  test("toRowColumn is the inverse of toId", () => {
    const graph = new Graph(4, 3);
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 4; column++) {
        const id = graph.toId(row, column);
        const coordinate = graph.toRowColumn(id);
        expect(coordinate.getRow()).toBe(row);
        expect(coordinate.getColumn()).toBe(column);
      }
    }
  });

  test("setState followed by getState returns the state that was set", () => {
    const graph = new Graph(4, 3);
    const id = graph.toId(1, 2);
    graph.setState(id, VertexState.Wall);
    expect(graph.getState(id)).toBe(VertexState.Wall);
  });

  test("setState on one vertex does not affect others", () => {
    const graph = new Graph(4, 3);
    const wallId = graph.toId(0, 0);
    const otherId = graph.toId(2, 3);
    graph.setState(wallId, VertexState.Wall);
    expect(graph.getState(otherId)).toBe(VertexState.Idle);
  });

  test("reset returns every vertex to the Idle state", () => {
    const graph = new Graph(2, 2);
    graph.setState(graph.toId(0, 0), VertexState.Start);
    graph.setState(graph.toId(1, 1), VertexState.End);
    graph.setState(graph.toId(0, 1), VertexState.Wall);

    graph.reset();

    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 2; column++) {
        expect(graph.getState(graph.toId(row, column))).toBe(
          VertexState.Idle,
        );
      }
    }
  });
});
