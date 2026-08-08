/** @jest-environment jsdom */

// controller.js wires itself up to the DOM as a side effect of being
// imported and keeps all of its state (selectedAlgorithm, savedAnalyses,
// etc.) in module-level variables rather than exporting anything. So each
// test needs its own fresh copy of both the DOM (rebuilt from the real
// index.html, so the fixture can't drift out of sync with the markup
// controller.js actually queries) and the module itself. A cache-busting
// query string forces re-evaluation of controller.js on every import -
// otherwise every test after the first would reuse the first test's module
// instance and its leftover state.
import { jest } from "@jest/globals";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { Graph } from "../src/datamodel/Graph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(
  path.join(__dirname, "../public/index.html"),
  "utf8",
);
const bodyHtml = indexHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];

let moduleInstance = 0;

async function loadController() {
  document.body.innerHTML = bodyHtml;
  moduleInstance++;
  await import(`../public/controller.js?instance=${moduleInstance}`);
}

function selectRadio(name, value) {
  document.querySelector(`input[name="${name}"][value="${value}"]`).click();
}

function setSpeed(value) {
  const slider = document.getElementById("speed-slider");
  slider.value = String(value);
  slider.dispatchEvent(new Event("input", { bubbles: true }));
}

function runToCompletion() {
  const stepButton = document.getElementById("step-button");
  const saveButton = document.getElementById("save-button");
  for (let i = 0; i < 5000 && saveButton.disabled; i++) {
    stepButton.click();
  }
  if (saveButton.disabled) {
    throw new Error("runToCompletion did not finish within the step budget");
  }
}

describe("controller: saving an analysis", () => {
  test("saves the algorithm and heuristic that actually ran, not whatever is currently selected", async () => {
    await loadController();

    // Default selection is BFS with no heuristic - run it to completion.
    runToCompletion();

    // The user changes their mind about what to run *after* the run
    // finished, but before clicking Save.
    selectRadio("algorithm", "AStar");
    selectRadio("heuristic", "Euclidian");

    document.getElementById("save-button").click();

    const analysisListText = document.getElementById("analysis-list").textContent;
    expect(analysisListText).toContain("BFS");
    expect(analysisListText).not.toContain("A*");
    expect(analysisListText).not.toContain("Euclidian");
  });
});

describe("controller: algorithm and heuristic radio buttons", () => {
  // Label text as rendered by controller.js's own ALGORITHM_LABELS map -
  // run-to-completion-then-save is the only externally observable way to
  // tell which algorithm actually ran, since controller.js exports nothing.
  const ALGORITHM_LABELS_BY_VALUE = {
    NaiveDFS: "Naive DFS",
    BFS: "BFS",
    Dijkstra: "Dijkstra",
    AStar: "A*",
    BestFirst: "Best-First",
  };

  test.each(Object.entries(ALGORITHM_LABELS_BY_VALUE))(
    "selecting the %s radio runs and saves %s, not whatever was selected before",
    async (algorithmValue, expectedLabel) => {
      await loadController();

      selectRadio("algorithm", algorithmValue);
      runToCompletion();
      document.getElementById("save-button").click();

      const analysisListText = document.getElementById("analysis-list").textContent;
      expect(analysisListText).toContain(expectedLabel);
    },
  );

  // Heuristic radios only matter for AStar/BestFirst - exercised against
  // AStar alone, since that's enough to prove the radio-to-state wiring
  // works without a full algorithm x heuristic combinatorial sweep.
  test.each(["Manhattan", "Euclidian", "Chebyshev", "Octile"])(
    "selecting the %s heuristic radio runs and saves that heuristic",
    async (heuristicValue) => {
      await loadController();

      selectRadio("algorithm", "AStar");
      selectRadio("heuristic", heuristicValue);
      runToCompletion();
      document.getElementById("save-button").click();

      const analysisListText = document.getElementById("analysis-list").textContent;
      expect(analysisListText).toContain(heuristicValue);
    },
  );
});

describe("controller: board/run settings", () => {
  // Default board is 30x20 with Start at (0,0) and End at (19,29), so the
  // shortest-hop-count BFS path length is a fixed, exact number: the
  // Chebyshev distance (29) when diagonal moves are allowed, or the
  // Manhattan distance (48) when they're not. That gives a real,
  // deterministic behavioral signal that the checkbox's mutation actually
  // reached the Graph, rather than just checking a call was made.
  test("disabling diagonal movement forces a longer, all-orthogonal shortest path", async () => {
    await loadController();
    runToCompletion();
    const diagonalPathLength = Number(
      document.getElementById("stat-path-length").textContent,
    );
    expect(diagonalPathLength).toBe(29);

    await loadController();
    document.getElementById("diagonal-toggle").click();
    runToCompletion();
    const orthogonalPathLength = Number(
      document.getElementById("stat-path-length").textContent,
    );
    expect(orthogonalPathLength).toBe(48);
  });

  // Diagonal moves stay strictly cheaper per unit of displacement than
  // orthogonal ones even at the "realistic" sqrt(2) weight (documented
  // caveat in CLAUDE.md), so no board/path configuration can make this
  // setting observably change which path gets chosen or how many steps run
  // - there's no "weight" stat displayed anywhere to check either. The only
  // thing actually testable from the controller's public surface is that
  // the checkbox forwards its value to the Graph, so this spies on the
  // model method rather than asserting a behavioral difference.
  test("checking 'realistic diagonal weight' forwards the value to the graph", async () => {
    const spy = jest.spyOn(Graph.prototype, "setRealisticDiagonalWeights");
    await loadController();

    document.getElementById("diagonal-weight-toggle").click();
    expect(spy).toHaveBeenLastCalledWith(true);

    document.getElementById("diagonal-weight-toggle").click();
    expect(spy).toHaveBeenLastCalledWith(false);

    spy.mockRestore();
  });

  // The setInterval delay is read once, at the moment Run is clicked, so
  // the speed must be selected beforehand - matches the existing
  // controls-lock behavior that keeps the speed slider disabled once a run
  // session is active.
  test("a higher playback speed runs more algorithm steps in the same amount of time", async () => {
    jest.useFakeTimers();

    await loadController();
    setSpeed(1);
    document.getElementById("run-button").click();
    jest.advanceTimersByTime(300);
    const slowOperations = Number(
      document.getElementById("stat-operations").textContent,
    );
    jest.clearAllTimers();

    await loadController();
    setSpeed(5);
    document.getElementById("run-button").click();
    jest.advanceTimersByTime(300);
    const fastOperations = Number(
      document.getElementById("stat-operations").textContent,
    );

    expect(fastOperations).toBeGreaterThan(slowOperations);

    jest.useRealTimers();
  });
});

describe("controller: Run / Step / Reset / Save buttons", () => {
  test("clicking Step advances the algorithm by exactly one step per click", async () => {
    await loadController();
    const stepButton = document.getElementById("step-button");
    const opsEl = document.getElementById("stat-operations");

    expect(opsEl.textContent).toBe("0");

    stepButton.click();
    const afterOneClick = Number(opsEl.textContent);
    expect(afterOneClick).toBeGreaterThan(0);

    stepButton.click();
    const afterTwoClicks = Number(opsEl.textContent);
    expect(afterTwoClicks).toBeGreaterThan(afterOneClick);
  });

  test("clicking Run starts auto-stepping, and clicking it again pauses", async () => {
    jest.useFakeTimers();
    await loadController();
    const runButton = document.getElementById("run-button");
    const opsEl = document.getElementById("stat-operations");

    expect(runButton.textContent.trim()).toBe("Run");

    runButton.click();
    expect(runButton.textContent.trim()).toBe("Pause");

    jest.advanceTimersByTime(200);
    const opsWhileRunning = Number(opsEl.textContent);
    expect(opsWhileRunning).toBeGreaterThan(0);

    runButton.click();
    expect(runButton.textContent.trim()).toBe("Run");

    jest.advanceTimersByTime(200);
    const opsAfterPause = Number(opsEl.textContent);
    expect(opsAfterPause).toBe(opsWhileRunning);

    jest.useRealTimers();
  });

  test("clicking Reset clears progress, stats, and control locks back to their initial state", async () => {
    await loadController();
    const stepButton = document.getElementById("step-button");
    const resetButton = document.getElementById("reset-button");

    stepButton.click();
    stepButton.click();
    expect(Number(document.getElementById("stat-operations").textContent)).toBeGreaterThan(0);

    resetButton.click();

    expect(document.getElementById("stat-operations").textContent).toBe("0");
    expect(document.getElementById("stat-path-length").textContent).toBe("N/A");
    expect(document.getElementById("save-button").disabled).toBe(true);
    expect(
      document.querySelector('input[name="algorithm"][value="BFS"]').disabled,
    ).toBe(false);
  });

  test("clicking Save adds the completed run to the analysis list", async () => {
    await loadController();
    runToCompletion();

    expect(document.querySelectorAll("#analysis-list li")).toHaveLength(0);

    document.getElementById("save-button").click();

    expect(document.querySelectorAll("#analysis-list li")).toHaveLength(1);
  });
});

describe("controller: saved-analysis statistics panel", () => {
  function selectSavedAnalysis(index) {
    document
      .querySelectorAll("#analysis-list li")
      [index].querySelector("button")
      .click();
  }

  function readLiveStats() {
    return {
      pathLength: document.getElementById("stat-path-length").textContent,
      operations: document.getElementById("stat-operations").textContent,
      expanded: document.getElementById("stat-expanded").textContent,
      elapsed: document.getElementById("stat-elapsed").textContent,
    };
  }

  function readAnalysisStats() {
    return {
      pathLength: document.getElementById("analysis-stat-path-length").textContent,
      operations: document.getElementById("analysis-stat-operations").textContent,
      expanded: document.getElementById("analysis-stat-expanded").textContent,
      elapsed: document.getElementById("analysis-stat-elapsed").textContent,
    };
  }

  test("selecting a saved analysis updates the statistics panel to match that run, not whatever was already shown", async () => {
    await loadController();

    // Run 1: default board (diagonals on) with BFS.
    runToCompletion();
    const run1LiveStats = readLiveStats();
    document.getElementById("save-button").click();

    // Run 2: diagonals off forces a longer path, so its stats are
    // guaranteed to differ from run 1's - proof the panel is actually
    // switching per-selection rather than being frozen from the first save.
    document.getElementById("reset-button").click();
    document.getElementById("diagonal-toggle").click();
    runToCompletion();
    const run2LiveStats = readLiveStats();
    document.getElementById("save-button").click();

    expect(run2LiveStats.pathLength).not.toBe(run1LiveStats.pathLength);

    selectSavedAnalysis(0);
    expect(readAnalysisStats()).toEqual(run1LiveStats);

    selectSavedAnalysis(1);
    expect(readAnalysisStats()).toEqual(run2LiveStats);
  });
});
