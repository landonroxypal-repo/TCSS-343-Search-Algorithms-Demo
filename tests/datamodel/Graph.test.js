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

  // getStartId()/getEndId() default to -1 when unset; this is not shown on
  // the UML but is needed as a sentinel for "no vertex marked yet".
  describe("start and end vertex tracking", () => {
    test("has no start or end vertex on a freshly constructed graph", () => {
      const graph = new Graph(3, 3);
      expect(graph.getStartId()).toBe(-1);
      expect(graph.getEndId()).toBe(-1);
    });

    test("setState to Start updates startId to the vertex that was set", () => {
      const graph = new Graph(3, 3);
      const id = graph.toId(1, 2);
      graph.setState(id, VertexState.Start);
      expect(graph.getStartId()).toBe(id);
    });

    test("setState to End updates endId to the vertex that was set", () => {
      const graph = new Graph(3, 3);
      const id = graph.toId(2, 0);
      graph.setState(id, VertexState.End);
      expect(graph.getEndId()).toBe(id);
    });

    test("marking a new vertex as Start moves startId to the new vertex", () => {
      const graph = new Graph(3, 3);
      const firstStart = graph.toId(0, 0);
      const secondStart = graph.toId(1, 1);
      graph.setState(firstStart, VertexState.Start);
      graph.setState(secondStart, VertexState.Start);
      expect(graph.getStartId()).toBe(secondStart);
    });

    test("marking a new vertex as End moves endId to the new vertex", () => {
      const graph = new Graph(3, 3);
      const firstEnd = graph.toId(2, 2);
      const secondEnd = graph.toId(0, 1);
      graph.setState(firstEnd, VertexState.End);
      graph.setState(secondEnd, VertexState.End);
      expect(graph.getEndId()).toBe(secondEnd);
    });

    test("startId always points at a vertex whose state is Start", () => {
      const graph = new Graph(4, 4);
      graph.setState(graph.toId(0, 0), VertexState.Start);
      graph.setState(graph.toId(3, 3), VertexState.End);
      graph.setState(graph.toId(2, 1), VertexState.Wall);

      expect(graph.getState(graph.getStartId())).toBe(VertexState.Start);
    });

    test("endId always points at a vertex whose state is End", () => {
      const graph = new Graph(4, 4);
      graph.setState(graph.toId(0, 0), VertexState.Start);
      graph.setState(graph.toId(3, 3), VertexState.End);
      graph.setState(graph.toId(2, 1), VertexState.Wall);

      expect(graph.getState(graph.getEndId())).toBe(VertexState.End);
    });

    test("reset clears startId and endId along with the vertex states", () => {
      const graph = new Graph(3, 3);
      graph.setState(graph.toId(0, 0), VertexState.Start);
      graph.setState(graph.toId(2, 2), VertexState.End);

      graph.reset();

      expect(graph.getStartId()).toBe(-1);
      expect(graph.getEndId()).toBe(-1);
    });
  });

  describe("neighbors and wall edges", () => {
    test("getNeighbors never includes the vertex itself", () => {
      const graph = new Graph(4, 4);
      for (let id = 0; id < 16; id++) {
        expect(graph.getNeighbors(id)).not.toContain(id);
      }
    });

    test("getNeighbors is symmetric: if B is a neighbor of A, A is a neighbor of B", () => {
      const graph = new Graph(4, 4);
      for (let id = 0; id < 16; id++) {
        for (const neighborId of graph.getNeighbors(id)) {
          expect(graph.getNeighbors(neighborId)).toContain(id);
        }
      }
    });

    test("a corner vertex has fewer neighbors than an interior vertex on an open grid", () => {
      const graph = new Graph(4, 4);
      const cornerId = graph.toId(0, 0);
      const interiorId = graph.toId(2, 2);
      expect(graph.getNeighbors(cornerId).length).toBeLessThan(
        graph.getNeighbors(interiorId).length,
      );
    });

    test("marking a vertex as Wall removes it from its former neighbors' neighbor lists", () => {
      const graph = new Graph(3, 3);
      const centerId = graph.toId(1, 1);
      const formerNeighbors = graph.getNeighbors(centerId);

      graph.setState(centerId, VertexState.Wall);

      for (const neighborId of formerNeighbors) {
        expect(graph.getNeighbors(neighborId)).not.toContain(centerId);
      }
    });

    test("a Wall vertex has no traversable neighbors of its own", () => {
      const graph = new Graph(3, 3);
      const centerId = graph.toId(1, 1);

      graph.setState(centerId, VertexState.Wall);

      expect(graph.getNeighbors(centerId)).toEqual([]);
    });

    test("changing a Wall vertex to any other state restores its edges", () => {
      const graph = new Graph(3, 3);
      const centerId = graph.toId(1, 1);
      const originalNeighbors = [...graph.getNeighbors(centerId)].sort();

      graph.setState(centerId, VertexState.Wall);
      graph.setState(centerId, VertexState.Visited);

      expect([...graph.getNeighbors(centerId)].sort()).toEqual(
        originalNeighbors,
      );
      for (const neighborId of originalNeighbors) {
        expect(graph.getNeighbors(neighborId)).toContain(centerId);
      }
    });

    test("un-walling a vertex restores its original edge weights", () => {
      const graph = new Graph(3, 3);
      const centerId = graph.toId(1, 1);
      const neighborIds = graph.getNeighbors(centerId);
      const originalWeights = neighborIds.map((neighborId) =>
        graph.getEdgeWeight(centerId, neighborId),
      );

      graph.setState(centerId, VertexState.Wall);
      graph.setState(centerId, VertexState.Idle);

      neighborIds.forEach((neighborId, index) => {
        expect(graph.getEdgeWeight(centerId, neighborId)).toBe(
          originalWeights[index],
        );
      });
    });

    test("un-walling one vertex does not restore a different vertex's cut edges", () => {
      const graph = new Graph(3, 3);
      const firstWallId = graph.toId(0, 1);
      const secondWallId = graph.toId(1, 0);

      graph.setState(firstWallId, VertexState.Wall);
      graph.setState(secondWallId, VertexState.Wall);
      graph.setState(firstWallId, VertexState.Idle);

      expect(graph.getNeighbors(secondWallId)).toEqual([]);
    });
  });

  // setAllowDiagonals toggles whether getNeighbors includes diagonal
  // neighbors. There is deliberately no getter for this flag - callers can
  // only observe its effect through getNeighbors, per the UML.
  describe("diagonal neighbors", () => {
    test("does not include diagonal neighbors by default", () => {
      const graph = new Graph(3, 3);
      const centerId = graph.toId(1, 1);
      const neighbors = graph.getNeighbors(centerId);

      expect(neighbors).toHaveLength(4);
      const diagonalIds = [
        graph.toId(0, 0),
        graph.toId(0, 2),
        graph.toId(2, 0),
        graph.toId(2, 2),
      ];
      for (const diagonalId of diagonalIds) {
        expect(neighbors).not.toContain(diagonalId);
      }
    });

    test("setAllowDiagonals(true) makes diagonal neighbors traversable", () => {
      const graph = new Graph(3, 3);
      const centerId = graph.toId(1, 1);

      graph.setAllowDiagonals(true);
      const neighbors = graph.getNeighbors(centerId);

      expect(neighbors).toHaveLength(8);
      const diagonalIds = [
        graph.toId(0, 0),
        graph.toId(0, 2),
        graph.toId(2, 0),
        graph.toId(2, 2),
      ];
      for (const diagonalId of diagonalIds) {
        expect(neighbors).toContain(diagonalId);
      }
    });

    test("setAllowDiagonals(false) removes diagonal neighbors again", () => {
      const graph = new Graph(3, 3);
      const centerId = graph.toId(1, 1);

      graph.setAllowDiagonals(true);
      graph.setAllowDiagonals(false);

      expect(graph.getNeighbors(centerId)).toHaveLength(4);
    });

    test("a corner vertex only gains its single in-bounds diagonal neighbor when enabled", () => {
      const graph = new Graph(3, 3);
      const cornerId = graph.toId(0, 0);

      graph.setAllowDiagonals(true);
      const neighbors = [...graph.getNeighbors(cornerId)].sort();

      expect(neighbors).toEqual(
        [graph.toId(0, 1), graph.toId(1, 0), graph.toId(1, 1)].sort(),
      );
    });

    test("a Wall diagonal neighbor is still excluded when diagonals are enabled", () => {
      const graph = new Graph(3, 3);
      const centerId = graph.toId(1, 1);
      const diagonalWallId = graph.toId(0, 0);

      graph.setAllowDiagonals(true);
      graph.setState(diagonalWallId, VertexState.Wall);

      expect(graph.getNeighbors(centerId)).not.toContain(diagonalWallId);
    });
  });
});
