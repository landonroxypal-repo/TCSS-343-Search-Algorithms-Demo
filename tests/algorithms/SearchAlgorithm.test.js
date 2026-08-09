import { jest } from "@jest/globals";
import { SearchAlgorithm } from "../../src/algorithms/SearchAlgorithm.js";
import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";

// The UML marks the constructor private ("- searchAlgorithm(): void"), and
// step() is redeclared in every subclass (NaiveDFS, BFS, Dijkstra, AStar) -
// SearchAlgorithm is abstract and only usable through a subclass.
describe("SearchAlgorithm", () => {
  test("cannot be instantiated directly", () => {
    expect(() => new SearchAlgorithm()).toThrow();
  });

  test("step() throws unless overridden by a subclass", () => {
    class IncompleteSubclass extends SearchAlgorithm {}
    const algorithm = new IncompleteSubclass();
    expect(() => algorithm.step()).toThrow();
  });

  test("_complete() only notifies onSearchCompleted listeners once even if called more than once", () => {
    class TestAlgorithm extends SearchAlgorithm {
      step() {
        this._complete();
        this._complete();
        return this.status;
      }
    }
    const algorithm = new TestAlgorithm();
    const onSearchCompleted = jest.fn();
    algorithm.onSearchCompleted.push(onSearchCompleted);

    algorithm.step();

    expect(onSearchCompleted).toHaveBeenCalledTimes(1);
  });

  // Moved from the view layer (Feature Envy: it only ever operated on an
  // algorithm's own vertexInfo/graph, never on anything the view actually
  // owned) - walks previousVertex backward from End to Start.
  describe("getPath", () => {
    class TestAlgorithm extends SearchAlgorithm {
      step() {
        this._complete();
        return this.status;
      }
    }

    test("returns a single-element path when Start and End resolve to the same vertex", () => {
      const algorithm = new TestAlgorithm();
      algorithm.graph = { getStartId: () => 0, getEndId: () => 0, getVertexCount: () => 1 };
      algorithm.vertexInfo = [{ getPreviousVertex: () => null }];

      expect(algorithm.getPath()).toEqual([0]);
    });

    test("returns null when End was never reached (no previousVertex chain to it)", () => {
      const graph = new Graph(3, 1);
      graph.setState(graph.toId(0, 0), VertexState.Start);
      graph.setState(graph.toId(0, 2), VertexState.End);
      const algorithm = new TestAlgorithm();
      algorithm.initialize(graph);

      expect(algorithm.getPath()).toBeNull();
    });

    test("walks previousVertex backward from End to Start and returns the path in order", () => {
      const graph = new Graph(3, 1);
      const startId = graph.toId(0, 0);
      const middleId = graph.toId(0, 1);
      const endId = graph.toId(0, 2);
      graph.setState(startId, VertexState.Start);
      graph.setState(endId, VertexState.End);
      const algorithm = new TestAlgorithm();
      algorithm.initialize(graph);
      algorithm.vertexInfo[middleId].setPreviousVertex(startId);
      algorithm.vertexInfo[endId].setPreviousVertex(middleId);

      expect(algorithm.getPath()).toEqual([startId, middleId, endId]);
    });

    test("returns null instead of looping forever if the previousVertex chain contains a cycle", () => {
      const graph = new Graph(3, 1);
      const startId = graph.toId(0, 0);
      const middleId = graph.toId(0, 1);
      const endId = graph.toId(0, 2);
      graph.setState(startId, VertexState.Start);
      graph.setState(endId, VertexState.End);
      const algorithm = new TestAlgorithm();
      algorithm.initialize(graph);
      // Cycle: end -> middle -> end -> ... never reaches start.
      algorithm.vertexInfo[endId].setPreviousVertex(middleId);
      algorithm.vertexInfo[middleId].setPreviousVertex(endId);

      expect(algorithm.getPath()).toBeNull();
    });
  });
});
