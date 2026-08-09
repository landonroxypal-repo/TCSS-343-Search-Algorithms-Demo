import { Board } from "./controller-classes/Board.js";
import { SearchSession } from "./controller-classes/SearchSession.js";
import { AnalysisPanel } from "./controller-classes/AnalysisPanel.js";

const COLS = 30;
const ROWS = 20;

const board = new Board(document.getElementById("board"), COLS, ROWS);
const searchSession = new SearchSession(board);
const analysisPanel = new AnalysisPanel(document.getElementById("analysis-board"), COLS, ROWS);

document.getElementById("save-button").addEventListener("click", () => {
  const stats = searchSession.getLastRunStats();
  if (!stats) return;
  analysisPanel.save(searchSession.getLastRunSelection(), board.graph, stats);
});
