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
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

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
