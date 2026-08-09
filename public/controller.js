import { Board } from "./Board.js";
import { SearchSession } from "./SearchSession.js";
import { AnalysisPanel } from "./AnalysisPanel.js";

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
