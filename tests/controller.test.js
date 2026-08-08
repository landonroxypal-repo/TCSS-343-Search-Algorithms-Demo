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
import { VertexState } from "../src/datamodel/VertexState.js";

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

function boardCellEl(id) {
  return document.querySelectorAll("#board > div")[id];
}

// Board painting is wired to "pointerdown", not "click" - a plain Event
// with the right type is enough since the handler only reads e.target.
function paintWall(id) {
  boardCellEl(id).dispatchEvent(new Event("pointerdown", { bubbles: true }));
}

// Cell/swatch elements carry other utility classes (sizing, rounding) besides
// their color, so comparisons are done on just the bg-* token rather than
// the full class string.
function cellBgClass(el) {
  return [...el.classList].find((cls) => cls.startsWith("bg-"));
}

function legendSwatchBgClass(legendSelector, stateLabel) {
  const item = [...document.querySelectorAll(`${legendSelector} li`)].find(
    (li) => li.textContent.trim() === stateLabel,
  );
  if (!item) {
    throw new Error(`No legend entry for "${stateLabel}" in ${legendSelector}`);
  }
  return cellBgClass(item.querySelector("span"));
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

describe("controller: mutation controls lock during an active run session", () => {
  // Every input a user could use to change the board/algorithm setup mid-run,
  // except the speed slider (locked independently of session state - see the
  // "playback speed stays editable while paused" block below) and Save
  // (its own independent enabled condition), so both are checked separately.
  function lockedControlEls() {
    return [
      ...document.querySelectorAll('input[name="algorithm"]'),
      ...document.querySelectorAll('input[name="heuristic"]'),
      ...document.querySelectorAll('input[name="tool"]'),
      document.getElementById("diagonal-toggle"),
      document.getElementById("diagonal-weight-toggle"),
    ];
  }

  function allDisabled() {
    return lockedControlEls().every((el) => el.disabled);
  }

  function allEnabled() {
    return lockedControlEls().every((el) => !el.disabled);
  }

  test("starting a run session (Step) disables every mutation control, and Reset re-enables them", async () => {
    await loadController();
    expect(allEnabled()).toBe(true);

    document.getElementById("step-button").click();
    expect(allDisabled()).toBe(true);

    document.getElementById("reset-button").click();
    expect(allEnabled()).toBe(true);
  });

  test("controls stay locked while paused mid-run, not just while actively auto-stepping", async () => {
    await loadController();

    document.getElementById("run-button").click();
    document.getElementById("run-button").click();

    expect(allDisabled()).toBe(true);
  });

  test("finishing a run re-enables the controls and makes Save available", async () => {
    await loadController();
    runToCompletion();

    expect(allEnabled()).toBe(true);
    expect(document.getElementById("save-button").disabled).toBe(false);
  });
});

describe("controller: playback speed stays editable while paused", () => {
  // The interval delay is only ever read once, at the moment setInterval is
  // scheduled, so speed only actually needs to be locked while that interval
  // is ticking - there's no live-reconfiguration to protect against once
  // it's stopped, whether that's from an explicit Pause or just sitting
  // between manual Steps.
  test("the speed slider is disabled only while actively auto-running, not while paused or idle", async () => {
    await loadController();
    const speedSlider = document.getElementById("speed-slider");
    const runButton = document.getElementById("run-button");

    expect(speedSlider.disabled).toBe(false);

    runButton.click(); // start
    expect(speedSlider.disabled).toBe(true);

    runButton.click(); // pause
    expect(speedSlider.disabled).toBe(false);
  });

  test("while paused, the speed slider is editable but every other mutation control stays locked", async () => {
    await loadController();
    const runButton = document.getElementById("run-button");

    runButton.click();
    runButton.click();

    expect(document.getElementById("speed-slider").disabled).toBe(false);

    const otherControls = [
      ...document.querySelectorAll('input[name="algorithm"]'),
      ...document.querySelectorAll('input[name="heuristic"]'),
      ...document.querySelectorAll('input[name="tool"]'),
      document.getElementById("diagonal-toggle"),
      document.getElementById("diagonal-weight-toggle"),
    ];
    expect(otherControls.every((el) => el.disabled)).toBe(true);
  });
});

describe("controller: result-note reports whether a path was found", () => {
  test("reports the path length in steps when End is reachable", async () => {
    await loadController();
    runToCompletion();

    expect(document.getElementById("result-note").textContent).toBe(
      "Path found! 29 steps.",
    );
  });

  test("reports that End is unreachable when no path exists", async () => {
    await loadController();

    // A solid wall column fully separates Start (col 0) from End (col 29):
    // no orthogonal or diagonal move changes column by more than 1, so a
    // full-height wall column blocks every possible route regardless of
    // whether diagonal movement is enabled.
    for (let row = 0; row < 20; row++) {
      paintWall(row * 30 + 15);
    }

    runToCompletion();

    expect(document.getElementById("result-note").textContent).toBe(
      "End is unreachable from Start.",
    );
  });
});

describe("controller: legend covers every vertex state", () => {
  function legendLabels(legendSelector) {
    return [...document.querySelectorAll(`${legendSelector} li`)].map((li) =>
      li.textContent.trim(),
    );
  }

  test.each(["#legend", "#analysis-legend"])(
    "%s lists every VertexState exactly once",
    async (legendSelector) => {
      await loadController();
      expect(legendLabels(legendSelector).sort()).toEqual(
        Object.values(VertexState).sort(),
      );
    },
  );

  test.each(Object.values(VertexState))(
    "the grid legend and the saved-analysis legend agree on the color for %s",
    async (stateLabel) => {
      await loadController();
      expect(legendSwatchBgClass("#legend", stateLabel)).toBe(
        legendSwatchBgClass("#analysis-legend", stateLabel),
      );
    },
  );
});

describe("controller: cell coloring matches the legend for every vertex state", () => {
  test("an untouched Idle cell uses the legend's Idle color", async () => {
    await loadController();
    expect(cellBgClass(boardCellEl(5))).toBe(legendSwatchBgClass("#legend", "Idle"));
  });

  test("a painted Wall cell uses the legend's Wall color", async () => {
    await loadController();
    paintWall(5);
    expect(cellBgClass(boardCellEl(5))).toBe(legendSwatchBgClass("#legend", "Wall"));
  });

  test("the Start cell uses the legend's Start color", async () => {
    await loadController();
    expect(cellBgClass(boardCellEl(0))).toBe(legendSwatchBgClass("#legend", "Start"));
  });

  test("the End cell uses the legend's End color", async () => {
    await loadController();
    expect(cellBgClass(boardCellEl(19 * 30 + 29))).toBe(
      legendSwatchBgClass("#legend", "End"),
    );
  });

  test("Visited and Expanded cells that appear while stepping use the legend's colors", async () => {
    await loadController();
    const stepButton = document.getElementById("step-button");
    for (let i = 0; i < 5; i++) stepButton.click();

    const cells = [...document.querySelectorAll("#board > div")];
    expect(cells.some((cell) => cellBgClass(cell) === legendSwatchBgClass("#legend", "Visited"))).toBe(true);
    expect(cells.some((cell) => cellBgClass(cell) === legendSwatchBgClass("#legend", "Expanded"))).toBe(true);
  });

  test("Path cells that appear after a completed run use the legend's Path color", async () => {
    await loadController();
    runToCompletion();

    const cells = [...document.querySelectorAll("#board > div")];
    expect(cells.some((cell) => cellBgClass(cell) === legendSwatchBgClass("#legend", "Path"))).toBe(true);
  });
});

describe("controller: saved-analysis grid cell coloring matches its legend", () => {
  // Visited is deliberately excluded here: on a completed run every cell
  // that was ever visited generally ends up expanded too by the time End is
  // reached, so a leftover visited-but-unexpanded cell isn't a reliable
  // fixture on this board. It's still covered by the mid-run test above,
  // which uses the exact same CELL_STATE_CLASS mapping and rendering
  // pattern this describe block is really checking (that selectAnalysis's
  // cell-coloring loop stays consistent with the legend).
  test.each(["Wall", "Start", "End", "Expanded", "Path"])(
    "a saved run's %s cells use the saved-analysis legend's color",
    async (label) => {
      await loadController();

      // One wall that doesn't block the path, so the saved run still finds
      // one (exercising Path) while also having a Wall cell to check.
      paintWall(2);
      runToCompletion();
      document.getElementById("save-button").click();

      const cells = [...document.querySelectorAll("#analysis-board > div")];
      const expectedBg = legendSwatchBgClass("#analysis-legend", label);
      expect(cells.some((cell) => cellBgClass(cell) === expectedBg)).toBe(true);
    },
  );
});
