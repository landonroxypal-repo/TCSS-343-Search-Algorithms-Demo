import { Graph } from "../src/datamodel/Graph.js";
import { VertexState } from "../src/datamodel/VertexState.js";
import { Algorithm } from "../src/datamodel/Algorithm.js";
import { Heuristic } from "../src/datamodel/Heuristic.js";
import { SearchStatus } from "../src/datamodel/SearchStatus.js";
import { Statistics } from "../src/datamodel/Statistics.js";
import { Analysis } from "../src/Analysis.js";
import { NaiveDFS } from "../src/algorithms/NaiveDFS.js";
import { BFS } from "../src/algorithms/BFS.js";
import { Dijkstra } from "../src/algorithms/Dijkstra.js";
import { AStar } from "../src/algorithms/AStar.js";
import { BestFirst } from "../src/algorithms/BestFirst.js";

const COLS = 30;
const ROWS = 20;

const ALGORITHM_CLASSES = {
  [Algorithm.NaiveDFS]: NaiveDFS,
  [Algorithm.BFS]: BFS,
  [Algorithm.Dijkstra]: Dijkstra,
  [Algorithm.AStar]: AStar,
  [Algorithm.BestFirst]: BestFirst,
};

const ALGORITHM_LABELS = {
  [Algorithm.NaiveDFS]: "Naive DFS",
  [Algorithm.BFS]: "BFS",
  [Algorithm.Dijkstra]: "Dijkstra",
  [Algorithm.AStar]: "A*",
  [Algorithm.BestFirst]: "Best-First",
};

const CELL_STATE_CLASS = {
  [VertexState.Idle]: "bg-white",
  [VertexState.Wall]: "bg-zinc-900",
  [VertexState.Start]: "bg-emerald-700",
  [VertexState.End]: "bg-rose-700",
  [VertexState.Visited]: "bg-emerald-100",
  [VertexState.Expanded]: "bg-emerald-400",
  [VertexState.Path]: "bg-amber-500",
};

const SPEED_DELAYS = { 1: 140, 2: 80, 3: 45, 4: 20, 5: 6 };

function seedDefaultStartEnd(g) {
  g.setState(g.toId(0, 0), VertexState.Start);
  g.setState(g.toId(ROWS - 1, COLS - 1), VertexState.End);
}

const graph = new Graph(COLS, ROWS);
seedDefaultStartEnd(graph);

let tool = "wall";
let selectedAlgorithm = Algorithm.BFS;
let selectedHeuristic = Heuristic.Manhattan;
let algorithm = null;
let isRunning = false;
let isPointerDown = false;
let runTimer = null;
let operationsCount = 0;
let expandedCount = 0;
let elapsedMs = 0;
let lastRunStats = null;
let lastRunAlgorithm = null;
let lastRunHeuristic = null;
let savedAnalyses = [];
let selectedAnalysisIndex = -1;

function buildBoardDom(container) {
  container.classList.add("grid", "gap-px");
  container.style.gridTemplateColumns = `repeat(${COLS}, 1.25rem)`;
  container.style.gridTemplateRows = `repeat(${ROWS}, 1.25rem)`;
  const els = new Array(COLS * ROWS);
  for (let id = 0; id < COLS * ROWS; id++) {
    const el = document.createElement("div");
    el.className = "h-5 w-5 bg-white";
    el.dataset.id = String(id);
    container.appendChild(el);
    els[id] = el;
  }
  return els;
}

const boardEl = document.getElementById("board");
const analysisBoardEl = document.getElementById("analysis-board");
const cellEls = buildBoardDom(boardEl);
const analysisCellEls = buildBoardDom(analysisBoardEl);
boardEl.classList.add("cursor-pointer");

document.getElementById("dims-readout").textContent = `${COLS} × ${ROWS}`;
document.getElementById("analysis-dims-readout").textContent = `${COLS} × ${ROWS}`;

function renderCell(id) {
  cellEls[id].className = "h-5 w-5 " + CELL_STATE_CLASS[graph.getState(id)];
}

function renderBoard() {
  for (let id = 0; id < COLS * ROWS; id++) renderCell(id);
}

renderBoard();

// ---- Paint tools ----

const toolInputs = document.querySelectorAll('input[name="tool"]');
toolInputs.forEach((input) => {
  input.addEventListener("change", (e) => {
    tool = e.target.value;
  });
});

function applyTool(id) {
  if (isRunning) return;
  const state = graph.getState(id);

  if (tool === "wall") {
    if (state === VertexState.Start || state === VertexState.End) return;
    graph.setState(id, VertexState.Wall);
  } else if (tool === "erase") {
    if (state === VertexState.Start || state === VertexState.End) return;
    graph.setState(id, VertexState.Idle);
  } else if (tool === "start") {
    if (state === VertexState.Wall || state === VertexState.End) return;
    const previousStart = graph.getStartId();
    if (previousStart !== -1 && previousStart !== id) {
      graph.setState(previousStart, VertexState.Idle);
      renderCell(previousStart);
    }
    graph.setState(id, VertexState.Start);
  } else if (tool === "end") {
    if (state === VertexState.Wall || state === VertexState.Start) return;
    const previousEnd = graph.getEndId();
    if (previousEnd !== -1 && previousEnd !== id) {
      graph.setState(previousEnd, VertexState.Idle);
      renderCell(previousEnd);
    }
    graph.setState(id, VertexState.End);
  }

  renderCell(id);
}

boardEl.addEventListener("pointerdown", (e) => {
  const target = e.target.closest("[data-id]");
  if (!target) return;
  isPointerDown = true;
  applyTool(Number(target.dataset.id));
});

boardEl.addEventListener("pointermove", (e) => {
  const target = e.target.closest("[data-id]");
  if (!target) return;
  const id = Number(target.dataset.id);
  const rc = graph.toRowColumn(id);
  document.getElementById("hover-readout").textContent =
    `(${rc.getRow()}, ${rc.getColumn()}) → id ${id} · ${graph.getState(id)}`;
  if (isPointerDown) applyTool(id);
});

function stopPainting() {
  isPointerDown = false;
}
window.addEventListener("pointerup", stopPainting);
window.addEventListener("pointercancel", stopPainting);

document.getElementById("clear-board-button").addEventListener("click", () => {
  if (isRunning) return;
  graph.reset();
  seedDefaultStartEnd(graph);
  renderBoard();
  resetStats();
});

// ---- Algorithm / heuristic / settings ----

const algorithmInputs = document.querySelectorAll('input[name="algorithm"]');
const heuristicInputs = document.querySelectorAll('input[name="heuristic"]');
const heuristicSelector = document.getElementById("heuristic-selector");

function usesHeuristic(alg) {
  return alg === Algorithm.AStar || alg === Algorithm.BestFirst;
}

function syncHeuristicVisibility() {
  heuristicSelector.hidden = !usesHeuristic(selectedAlgorithm);
}

algorithmInputs.forEach((input) => {
  input.addEventListener("change", (e) => {
    selectedAlgorithm = e.target.value;
    syncHeuristicVisibility();
  });
});
syncHeuristicVisibility();

heuristicInputs.forEach((input) => {
  input.addEventListener("change", (e) => {
    selectedHeuristic = e.target.value;
  });
});

document.getElementById("diagonal-toggle").addEventListener("change", (e) => {
  graph.setAllowDiagonals(e.target.checked);
});

document.getElementById("diagonal-weight-toggle").addEventListener("change", (e) => {
  graph.setRealisticDiagonalWeights(e.target.checked);
});

let speed = 3;
document.getElementById("speed-slider").addEventListener("input", (e) => {
  speed = Number(e.target.value);
});

// ---- Run / Step / Reset / Save ----

const runButton = document.getElementById("run-button");
const stepButton = document.getElementById("step-button");
const resetButton = document.getElementById("reset-button");
const saveButton = document.getElementById("save-button");
const resultNote = document.getElementById("result-note");

// Locks every mutation control except playback speed (tools, algorithm/
// heuristic, diagonal settings) for as long as a run session is active -
// from the first Step/Run of a search until it completes or Reset is
// clicked. Deliberately independent of isRunning: a paused or
// manually-stepped-through search is still an active session and must stay
// locked. Speed is handled separately in setRunToggleAvailability, since
// it's safe to edit any time the auto-play interval isn't actively ticking.
function setControlsEnabled(sessionActive) {
  algorithmInputs.forEach((i) => (i.disabled = sessionActive));
  heuristicInputs.forEach((i) => (i.disabled = sessionActive));
  toolInputs.forEach((i) => (i.disabled = sessionActive));
  document.getElementById("diagonal-toggle").disabled = sessionActive;
  document.getElementById("diagonal-weight-toggle").disabled = sessionActive;
  saveButton.disabled = sessionActive || !lastRunStats;
}

// Step/Reset are unavailable while the auto-play interval is actively
// ticking (isRunning) - otherwise identical whether a session is idle,
// complete, or merely paused. Speed is only unsafe to edit while that same
// interval is ticking (its delay is read once, when setInterval is
// scheduled), so it tracks isRunning directly rather than session state.
function setRunToggleAvailability(running) {
  isRunning = running;
  stepButton.disabled = running;
  resetButton.disabled = running;
  document.getElementById("speed-slider").disabled = running;
}

function resetStats() {
  operationsCount = 0;
  expandedCount = 0;
  elapsedMs = 0;
  lastRunStats = null;
  document.getElementById("stat-operations").textContent = "N/A";
  document.getElementById("stat-expanded").textContent = "N/A";
  document.getElementById("stat-path-length").textContent = "N/A";
  document.getElementById("stat-elapsed").textContent = "N/A";
  resultNote.textContent = "";
  resultNote.className = "mt-2.5 min-h-4 text-xs text-stone-600";
}

function clearRunVisuals() {
  for (let id = 0; id < COLS * ROWS; id++) {
    const state = graph.getState(id);
    if (
      state === VertexState.Visited ||
      state === VertexState.Expanded ||
      state === VertexState.Path
    ) {
      graph.setState(id, VertexState.Idle);
    }
  }
  renderBoard();
}

function createAlgorithm() {
  const AlgorithmClass = ALGORITHM_CLASSES[selectedAlgorithm];
  const instance = new AlgorithmClass();
  if (usesHeuristic(selectedAlgorithm)) {
    instance.setHeuristic(selectedHeuristic);
  }

  instance.onNodeVisited.push((id) => {
    operationsCount++;
    const state = graph.getState(id);
    if (state !== VertexState.Start && state !== VertexState.End) {
      graph.setState(id, VertexState.Visited);
    }
    renderCell(id);
    document.getElementById("stat-operations").textContent = String(operationsCount);
  });

  instance.onNodeExpanded.push((id) => {
    operationsCount++;
    expandedCount++;
    const state = graph.getState(id);
    if (state !== VertexState.Start && state !== VertexState.End) {
      graph.setState(id, VertexState.Expanded);
    }
    renderCell(id);
    document.getElementById("stat-operations").textContent = String(operationsCount);
    document.getElementById("stat-expanded").textContent = String(expandedCount);
  });

  return instance;
}

function ensureAlgorithm() {
  if (!algorithm) {
    clearRunVisuals();
    resetStats();
    lastRunAlgorithm = selectedAlgorithm;
    lastRunHeuristic = usesHeuristic(selectedAlgorithm) ? selectedHeuristic : Heuristic.None;
    algorithm = createAlgorithm();
    algorithm.initialize(graph);
    setControlsEnabled(true);
  }
}

function recoverPath() {
  const vertexInfo = algorithm.getVertexInfo();
  const startId = graph.getStartId();
  const endId = graph.getEndId();

  if (endId !== startId && vertexInfo[endId].getPreviousVertex() === null) {
    return null;
  }

  const path = [endId];
  let currentId = endId;
  const maxHops = graph.getVertexCount();
  for (let hops = 0; currentId !== startId; hops++) {
    if (hops >= maxHops) return null;
    currentId = vertexInfo[currentId].getPreviousVertex();
    path.push(currentId);
  }
  return path.reverse();
}

function finishRun() {
  const path = recoverPath();
  const pathLength = path === null ? null : path.length - 1;
  if (path !== null) {
    // path[0] and path[path.length - 1] are Start/End - leave their state alone.
    for (const id of path.slice(1, -1)) {
      graph.setState(id, VertexState.Path);
    }
  }
  renderBoard();

  document.getElementById("stat-path-length").textContent =
    pathLength === null ? "N/A" : String(pathLength);
  document.getElementById("stat-elapsed").textContent = `${elapsedMs.toFixed(1)} ms`;

  if (pathLength === null) {
    resultNote.textContent = "End is unreachable from Start.";
    resultNote.className = "mt-2.5 min-h-4 text-xs text-rose-700";
  } else {
    resultNote.textContent = `Path found! ${pathLength} steps.`;
    resultNote.className = "mt-2.5 min-h-4 text-xs text-emerald-700";
  }

  lastRunStats = new Statistics(pathLength, operationsCount, expandedCount, elapsedMs);

  algorithm = null;
  setControlsEnabled(false);
  setRunToggleAvailability(false);
  runButton.textContent = "Run";
}

function stepOnce() {
  ensureAlgorithm();
  const t0 = performance.now();
  const status = algorithm.step();
  elapsedMs += performance.now() - t0;

  if (status === SearchStatus.Complete) {
    finishRun();
    return true;
  }
  return false;
}

stepButton.addEventListener("click", () => {
  if (isRunning) return;
  stepOnce();
});

runButton.addEventListener("click", () => {
  if (isRunning) {
    clearInterval(runTimer);
    setRunToggleAvailability(false);
    runButton.textContent = "Run";
    return;
  }
  ensureAlgorithm();
  setRunToggleAvailability(true);
  runButton.textContent = "Pause";
  runTimer = setInterval(() => {
    const done = stepOnce();
    if (done) clearInterval(runTimer);
  }, SPEED_DELAYS[speed]);
});

resetButton.addEventListener("click", () => {
  if (isRunning) return;
  clearInterval(runTimer);
  algorithm = null;
  clearRunVisuals();
  resetStats();
  setControlsEnabled(false);
  runButton.textContent = "Run";
});

// ---- Saved analyses ----

const analysisListEl = document.getElementById("analysis-list");
const analysisEmptyStateEl = document.getElementById("analysis-empty-state");
const analysisSourceEl = document.getElementById("analysis-source");

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

function renderAnalysisList() {
  analysisListEl.innerHTML = "";
  analysisEmptyStateEl.hidden = savedAnalyses.length > 0;

  savedAnalyses.forEach((analysis, index) => {
    const li = document.createElement("li");
    li.className = "relative";

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "w-full rounded-md border px-2.5 py-1.5 pr-7 text-left text-xs " +
      (index === selectedAnalysisIndex
        ? "border-slate-600 bg-stone-200"
        : "border-stone-300");
    button.textContent = analysisLabel(analysis);
    button.addEventListener("click", () => selectAnalysis(index));

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "X";
    removeButton.setAttribute("aria-label", "Remove saved analysis");
    removeButton.className =
      "absolute right-1.5 top-1/2 -translate-y-1/2 rounded px-1 text-xs font-semibold text-stone-600 hover:text-rose-700";
    removeButton.addEventListener("click", () => removeAnalysis(index));

    li.appendChild(button);
    li.appendChild(removeButton);
    analysisListEl.appendChild(li);
  });
}

function deselectAnalysis() {
  selectedAnalysisIndex = -1;
  for (const el of analysisCellEls) {
    el.className = "h-5 w-5 " + CELL_STATE_CLASS[VertexState.Idle];
  }
  analysisBoardEl.parentElement.classList.add("opacity-40");
  analysisSourceEl.textContent = ""; //"No analysis selected";
  document.getElementById("analysis-stat-path-length").textContent = "N/A";
  document.getElementById("analysis-stat-operations").textContent = "N/A";
  document.getElementById("analysis-stat-expanded").textContent = "N/A";
  document.getElementById("analysis-stat-elapsed").textContent = "N/A";
}

function removeAnalysis(index) {
  savedAnalyses.splice(index, 1);

  if (selectedAnalysisIndex === index) {
    deselectAnalysis();
  } else if (selectedAnalysisIndex > index) {
    selectedAnalysisIndex -= 1;
  }

  renderAnalysisList();
}

function selectAnalysis(index) {
  selectedAnalysisIndex = index;
  const analysis = savedAnalyses[index];
  const analysisGraph = analysis.getGraph();
  const stats = analysis.getStats();

  for (let id = 0; id < COLS * ROWS; id++) {
    const state = analysisGraph.getState(id);
    analysisCellEls[id].className = "h-5 w-5 " + CELL_STATE_CLASS[state];
  }
  analysisBoardEl.parentElement.classList.remove("opacity-40");

  analysisSourceEl.textContent = analysisLabel(analysis);
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

  renderAnalysisList();
}

saveButton.addEventListener("click", () => {
  if (!lastRunStats) return;
  const analysis = new Analysis(
    lastRunAlgorithm,
    lastRunHeuristic,
    graph,
    lastRunStats,
    formatTime(new Date()),
  );
  savedAnalyses.push(analysis);
  renderAnalysisList();
  selectAnalysis(savedAnalyses.length - 1);
});

renderAnalysisList();
