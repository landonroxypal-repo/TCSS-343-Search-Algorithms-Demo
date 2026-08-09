import { VertexState } from "../../src/datamodel/VertexState.js";
import { Algorithm } from "../../src/datamodel/Algorithm.js";
import { Heuristic } from "../../src/datamodel/Heuristic.js";
import { SearchStatus } from "../../src/datamodel/SearchStatus.js";
import { Statistics } from "../../src/datamodel/Statistics.js";
import { AlgorithmSelection } from "../../src/datamodel/AlgorithmSelection.js";
import { NaiveDFS } from "../../src/algorithms/NaiveDFS.js";
import { BFS } from "../../src/algorithms/BFS.js";
import { Dijkstra } from "../../src/algorithms/Dijkstra.js";
import { AStar } from "../../src/algorithms/AStar.js";
import { BestFirst } from "../../src/algorithms/BestFirst.js";

const ALGORITHM_CLASSES = {
  [Algorithm.NaiveDFS]: NaiveDFS,
  [Algorithm.BFS]: BFS,
  [Algorithm.Dijkstra]: Dijkstra,
  [Algorithm.AStar]: AStar,
  [Algorithm.BestFirst]: BestFirst,
};

const SPEED_DELAYS = { 1: 140, 2: 80, 3: 45, 4: 20, 5: 6 };

function usesHeuristic(alg) {
  return alg === Algorithm.AStar || alg === Algorithm.BestFirst;
}

// Owns algorithm/heuristic selection, the running algorithm instance, and
// Run/Step/Reset/Save/Clear-board control flow, including locking every
// other control (its own, plus telling Board to lock its tool inputs) for
// as long as a run session is active.
export class SearchSession {
  constructor(board) {
    this._board = board;

    this._selection = new AlgorithmSelection(Algorithm.BFS, Heuristic.Manhattan);
    this._algorithm = null;
    this._isRunning = false;
    this._runTimer = null;
    this._speed = 3;
    this._operationsCount = 0;
    this._expandedCount = 0;
    this._elapsedMs = 0;
    this._lastRunStats = null;
    this._lastRunSelection = null;
    // Populated by onNodeVisited/onNodeExpanded during a step() call, then
    // drained into actual DOM repaints right after - see _stepOnce().
    this._pendingRenderIds = [];

    this._algorithmInputs = document.querySelectorAll('input[name="algorithm"]');
    this._heuristicInputs = document.querySelectorAll('input[name="heuristic"]');
    this._heuristicSelector = document.getElementById("heuristic-selector");
    this._diagonalToggle = document.getElementById("diagonal-toggle");
    this._diagonalWeightToggle = document.getElementById("diagonal-weight-toggle");
    this._speedSlider = document.getElementById("speed-slider");
    this._runButton = document.getElementById("run-button");
    this._stepButton = document.getElementById("step-button");
    this._resetButton = document.getElementById("reset-button");
    this._saveButton = document.getElementById("save-button");
    this._clearBoardButton = document.getElementById("clear-board-button");
    this._resultNote = document.getElementById("result-note");
    this._statOperationsEl = document.getElementById("stat-operations");
    this._statExpandedEl = document.getElementById("stat-expanded");
    this._statPathLengthEl = document.getElementById("stat-path-length");
    this._statElapsedEl = document.getElementById("stat-elapsed");

    this._algorithmInputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        this._selection = new AlgorithmSelection(e.target.value, this._selection.getHeuristic());
        this._syncHeuristicVisibility();
      });
    });
    this._syncHeuristicVisibility();

    this._heuristicInputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        this._selection = new AlgorithmSelection(this._selection.getAlgorithm(), e.target.value);
      });
    });

    this._diagonalToggle.addEventListener("change", (e) => {
      this._board.graph.setAllowDiagonals(e.target.checked);
    });

    this._diagonalWeightToggle.addEventListener("change", (e) => {
      this._board.graph.setRealisticDiagonalWeights(e.target.checked);
    });

    this._speedSlider.addEventListener("input", (e) => {
      this._speed = Number(e.target.value);
    });

    this._clearBoardButton.addEventListener("click", () => {
      if (this._isRunning) return;
      this._board.clear();
      this._resetStats();
    });

    this._stepButton.addEventListener("click", () => {
      if (this._isRunning) return;
      this._stepOnce();
    });

    this._runButton.addEventListener("click", () => {
      if (this._isRunning) {
        clearInterval(this._runTimer);
        this._setRunToggleAvailability(false);
        this._runButton.textContent = "Run";
        return;
      }
      this._ensureAlgorithm();
      this._setRunToggleAvailability(true);
      this._runButton.textContent = "Pause";
      this._runTimer = setInterval(() => {
        const done = this._stepOnce();
        if (done) clearInterval(this._runTimer);
      }, SPEED_DELAYS[this._speed]);
    });

    this._resetButton.addEventListener("click", () => {
      if (this._isRunning) return;
      clearInterval(this._runTimer);
      this._algorithm = null;
      this._board.clearRunVisuals();
      this._resetStats();
      this._setControlsEnabled(false);
      this._runButton.textContent = "Run";
    });
  }

  getLastRunSelection() {
    return this._lastRunSelection;
  }

  getLastRunStats() {
    return this._lastRunStats;
  }

  _syncHeuristicVisibility() {
    this._heuristicSelector.hidden = !usesHeuristic(this._selection.getAlgorithm());
  }

  // Locks every mutation control except playback speed (tools, algorithm/
  // heuristic, diagonal settings) for as long as a run session is active -
  // from the first Step/Run of a search until it completes or Reset is
  // clicked. Deliberately independent of _isRunning: a paused or
  // manually-stepped-through search is still an active session and must
  // stay locked. Speed is handled separately in _setRunToggleAvailability,
  // since it's safe to edit any time the auto-play interval isn't actively
  // ticking.
  _setControlsEnabled(sessionActive) {
    this._algorithmInputs.forEach((i) => (i.disabled = sessionActive));
    this._heuristicInputs.forEach((i) => (i.disabled = sessionActive));
    this._board.setLocked(sessionActive);
    this._diagonalToggle.disabled = sessionActive;
    this._diagonalWeightToggle.disabled = sessionActive;
    this._saveButton.disabled = sessionActive || !this._lastRunStats;
  }

  // Step/Reset are unavailable while the auto-play interval is actively
  // ticking (_isRunning) - otherwise identical whether a session is idle,
  // complete, or merely paused. Speed is only unsafe to edit while that
  // same interval is ticking (its delay is read once, when setInterval is
  // scheduled), so it tracks _isRunning directly rather than session state.
  _setRunToggleAvailability(running) {
    this._isRunning = running;
    this._stepButton.disabled = running;
    this._resetButton.disabled = running;
    this._speedSlider.disabled = running;
  }

  _resetStats() {
    this._operationsCount = 0;
    this._expandedCount = 0;
    this._elapsedMs = 0;
    this._lastRunStats = null;
    this._statOperationsEl.textContent = "N/A";
    this._statExpandedEl.textContent = "N/A";
    this._statPathLengthEl.textContent = "N/A";
    this._statElapsedEl.textContent = "N/A";
    this._resultNote.textContent = "";
    this._resultNote.className = "mt-2.5 min-h-4 text-xs text-stone-600";
  }

  // onNodeVisited/onNodeExpanded fire synchronously from inside
  // algorithm.step(), so anything they do runs inside _stepOnce()'s timed
  // window. They only track what happened here (counters, model state) -
  // painting the result happens once, after step() returns and the timer
  // has already stopped, so DOM/rendering cost is never attributed to the
  // algorithm's own elapsed time.
  _createAlgorithm() {
    const AlgorithmClass = ALGORITHM_CLASSES[this._selection.getAlgorithm()];
    const instance = new AlgorithmClass();
    if (usesHeuristic(this._selection.getAlgorithm())) {
      instance.setHeuristic(this._selection.getHeuristic());
    }

    instance.onNodeVisited.push((id) => {
      this._operationsCount++;
      const state = this._board.graph.getState(id);
      if (state !== VertexState.Start && state !== VertexState.End) {
        this._board.graph.setState(id, VertexState.Visited);
      }
      this._pendingRenderIds.push(id);
    });

    instance.onNodeExpanded.push((id) => {
      this._operationsCount++;
      this._expandedCount++;
      const state = this._board.graph.getState(id);
      if (state !== VertexState.Start && state !== VertexState.End) {
        this._board.graph.setState(id, VertexState.Expanded);
      }
      this._pendingRenderIds.push(id);
    });

    return instance;
  }

  _ensureAlgorithm() {
    if (!this._algorithm) {
      this._board.clearRunVisuals();
      this._resetStats();
      this._lastRunSelection = new AlgorithmSelection(
        this._selection.getAlgorithm(),
        usesHeuristic(this._selection.getAlgorithm())
          ? this._selection.getHeuristic()
          : Heuristic.None,
      );
      this._algorithm = this._createAlgorithm();
      this._algorithm.initialize(this._board.graph);
      this._setControlsEnabled(true);
    }
  }

  _finishRun() {
    const path = this._algorithm.getPath();
    const pathLength = path === null ? null : path.length - 1;
    if (path !== null) {
      // path[0] and path[path.length - 1] are Start/End - leave their state alone.
      for (const id of path.slice(1, -1)) {
        this._board.graph.setState(id, VertexState.Path);
      }
    }
    this._board.render();

    this._statPathLengthEl.textContent = pathLength === null ? "N/A" : String(pathLength);
    this._statElapsedEl.textContent = `${this._elapsedMs.toFixed(1)} ms`;

    if (pathLength === null) {
      this._resultNote.textContent = "End is unreachable from Start.";
      this._resultNote.className = "mt-2.5 min-h-4 text-xs text-rose-700";
    } else {
      this._resultNote.textContent = `Path found! ${pathLength} steps.`;
      this._resultNote.className = "mt-2.5 min-h-4 text-xs text-emerald-700";
    }

    this._lastRunStats = new Statistics(
      pathLength,
      this._operationsCount,
      this._expandedCount,
      this._elapsedMs,
    );

    this._algorithm = null;
    this._setControlsEnabled(false);
    this._setRunToggleAvailability(false);
    this._runButton.textContent = "Run";
  }

  _stepOnce() {
    this._ensureAlgorithm();
    this._pendingRenderIds = [];

    const t0 = performance.now();
    const status = this._algorithm.step();
    this._elapsedMs += performance.now() - t0;

    for (const id of this._pendingRenderIds) {
      this._board.renderCell(id);
    }
    this._statOperationsEl.textContent = String(this._operationsCount);
    this._statExpandedEl.textContent = String(this._expandedCount);

    if (status === SearchStatus.Complete) {
      this._finishRun();
      return true;
    }
    return false;
  }
}
