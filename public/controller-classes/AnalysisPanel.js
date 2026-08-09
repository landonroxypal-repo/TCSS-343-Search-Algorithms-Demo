import { VertexState } from "../../src/datamodel/VertexState.js";
import { Heuristic } from "../../src/datamodel/Heuristic.js";
import { Algorithm } from "../../src/datamodel/Algorithm.js";
import { Analysis } from "../../src/Analysis.js";
import { CELL_STATE_CLASS } from "./Board.js";

const ALGORITHM_LABELS = {
  [Algorithm.NaiveDFS]: "Naive DFS",
  [Algorithm.BFS]: "BFS",
  [Algorithm.Dijkstra]: "Dijkstra",
  [Algorithm.AStar]: "A*",
  [Algorithm.BestFirst]: "Best-First",
};

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function analysisLabel(analysis) {
  const heuristic = analysis.getHeuristic();
  const suffix = heuristic !== Heuristic.None ? ` · ${heuristic}` : "";
  return `${ALGORITHM_LABELS[analysis.getAlgorithm()]}${suffix} · ${analysis.getTime()}`;
}

// Owns the saved-analyses list and its own read-only board. Deliberately
// has no reference to SearchSession - callers hand it the pieces a save
// needs (selection, graph, stats) rather than this class reaching into
// SearchSession's internals itself.
export class AnalysisPanel {
  constructor(boardEl, cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this._savedAnalyses = [];
    this._selectedIndex = -1;

    this._boardEl = boardEl;
    boardEl.classList.add("grid", "gap-px");
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1.25rem)`;
    boardEl.style.gridTemplateRows = `repeat(${rows}, 1.25rem)`;
    this._cellEls = new Array(cols * rows);
    for (let id = 0; id < cols * rows; id++) {
      const el = document.createElement("div");
      el.className = "h-5 w-5 bg-white";
      el.dataset.id = String(id);
      boardEl.appendChild(el);
      this._cellEls[id] = el;
    }

    document.getElementById("analysis-dims-readout").textContent = `${cols} × ${rows}`;

    this._listEl = document.getElementById("analysis-list");
    this._emptyStateEl = document.getElementById("analysis-empty-state");
    this._sourceEl = document.getElementById("analysis-source");

    this._renderList();
  }

  save(selection, graph, stats) {
    const analysis = new Analysis(selection, graph, stats, formatTime(new Date()));
    this._savedAnalyses.push(analysis);
    this._renderList();
    this._select(this._savedAnalyses.length - 1);
  }

  _renderList() {
    this._listEl.innerHTML = "";
    this._emptyStateEl.hidden = this._savedAnalyses.length > 0;

    this._savedAnalyses.forEach((analysis, index) => {
      const li = document.createElement("li");
      li.className = "relative";

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "w-full rounded-md border px-2.5 py-1.5 pr-7 text-left text-xs " +
        (index === this._selectedIndex
          ? "border-slate-600 bg-stone-200"
          : "border-stone-300");
      button.textContent = analysisLabel(analysis);
      button.addEventListener("click", () => this._select(index));

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "X";
      removeButton.setAttribute("aria-label", "Remove saved analysis");
      removeButton.className =
        "absolute right-1.5 top-1/2 -translate-y-1/2 rounded px-1 text-xs font-semibold text-stone-600 hover:text-rose-700";
      removeButton.addEventListener("click", () => this._remove(index));

      li.appendChild(button);
      li.appendChild(removeButton);
      this._listEl.appendChild(li);
    });
  }

  _deselect() {
    this._selectedIndex = -1;
    for (const el of this._cellEls) {
      el.className = "h-5 w-5 " + CELL_STATE_CLASS[VertexState.Idle];
    }
    this._boardEl.parentElement.classList.add("opacity-40");
    this._sourceEl.textContent = "No analysis selected";
    document.getElementById("analysis-stat-path-length").textContent = "N/A";
    document.getElementById("analysis-stat-operations").textContent = "N/A";
    document.getElementById("analysis-stat-expanded").textContent = "N/A";
    document.getElementById("analysis-stat-elapsed").textContent = "N/A";
  }

  _remove(index) {
    this._savedAnalyses.splice(index, 1);

    if (this._selectedIndex === index) {
      this._deselect();
    } else if (this._selectedIndex > index) {
      this._selectedIndex -= 1;
    }

    this._renderList();
  }

  _select(index) {
    this._selectedIndex = index;
    const analysis = this._savedAnalyses[index];
    const analysisGraph = analysis.getGraph();
    const stats = analysis.getStats();

    for (let id = 0; id < this.cols * this.rows; id++) {
      const state = analysisGraph.getState(id);
      this._cellEls[id].className = "h-5 w-5 " + CELL_STATE_CLASS[state];
    }
    this._boardEl.parentElement.classList.remove("opacity-40");

    this._sourceEl.textContent = analysisLabel(analysis);
    document.getElementById("analysis-stat-path-length").textContent =
      stats.getPathLength() === null ? "N/A" : String(stats.getPathLength());
    document.getElementById("analysis-stat-operations").textContent = String(
      stats.getOperationCount(),
    );
    document.getElementById("analysis-stat-expanded").textContent = String(
      stats.getExpandedNodes(),
    );
    document.getElementById("analysis-stat-elapsed").textContent =
      `${stats.getElapsedTime().toFixed(1)} ms`;

    this._renderList();
  }
}
