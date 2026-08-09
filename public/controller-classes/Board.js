import { Graph } from "../../src/datamodel/Graph.js";
import { VertexState } from "../../src/datamodel/VertexState.js";

export const CELL_STATE_CLASS = {
  [VertexState.Idle]: "bg-white",
  [VertexState.Wall]: "bg-zinc-900",
  [VertexState.Start]: "bg-emerald-700",
  [VertexState.End]: "bg-rose-700",
  [VertexState.Visited]: "bg-emerald-100",
  [VertexState.Expanded]: "bg-emerald-400",
  [VertexState.Path]: "bg-amber-500",
};

// Each strategy mutates the graph for the given id and returns the list of
// cell ids that changed (so _applyTool knows what to re-render), or [] if
// the tool declined to apply (e.g. painting a Wall over Start/End).
const PAINT_TOOLS = {
  wall: {
    apply(graph, id) {
      const state = graph.getState(id);
      if (state === VertexState.Start || state === VertexState.End) {
        return [];
      }
      graph.setState(id, VertexState.Wall);
      return [id];
    },
  },
  erase: {
    apply(graph, id) {
      const state = graph.getState(id);
      if (state === VertexState.Start || state === VertexState.End) {
        return [];
      }
      graph.setState(id, VertexState.Idle);
      return [id];
    },
  },
  start: {
    apply(graph, id) {
      const state = graph.getState(id);
      if (state === VertexState.Wall || state === VertexState.End) {
        return [];
      }
      const previousStart = graph.getStartId();
      const changedIds = [id];
      if (previousStart !== -1 && previousStart !== id) {
        graph.setState(previousStart, VertexState.Idle);
        changedIds.push(previousStart);
      }
      graph.setState(id, VertexState.Start);
      return changedIds;
    },
  },
  end: {
    apply(graph, id) {
      const state = graph.getState(id);
      if (state === VertexState.Wall || state === VertexState.Start) {
        return [];
      }
      const previousEnd = graph.getEndId();
      const changedIds = [id];
      if (previousEnd !== -1 && previousEnd !== id) {
        graph.setState(previousEnd, VertexState.Idle);
        changedIds.push(previousEnd);
      }
      graph.setState(id, VertexState.End);
      return changedIds;
    },
  },
};

function seedDefaultStartEnd(graph, cols, rows) {
  graph.setState(graph.toId(0, 0), VertexState.Start);
  graph.setState(graph.toId(rows - 1, cols - 1), VertexState.End);
}

// Owns the interactive board: the graph, paint tools, hover/dims readout.
// Locking (setLocked) is generic - it doesn't know or care *why* it's
// locked (a run session, etc.), only whether it currently is.
export class Board {
  constructor(boardEl, cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.graph = new Graph(cols, rows);
    seedDefaultStartEnd(this.graph, cols, rows);

    this._boardEl = boardEl;
    this._tool = "wall";
    this._locked = false;
    this._isPointerDown = false;

    boardEl.classList.add("grid", "gap-px", "cursor-pointer");
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

    document.getElementById("dims-readout").textContent = `${cols} × ${rows}`;

    this._toolInputs = document.querySelectorAll('input[name="tool"]');
    this._toolInputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        this._tool = e.target.value;
      });
    });

    boardEl.addEventListener("pointerdown", (e) => {
      const target = e.target.closest("[data-id]");
      if (!target) return;
      this._isPointerDown = true;
      this._applyTool(Number(target.dataset.id));
    });

    boardEl.addEventListener("pointermove", (e) => {
      const target = e.target.closest("[data-id]");
      if (!target) return;
      const id = Number(target.dataset.id);
      const rc = this.graph.toRowColumn(id);
      document.getElementById("hover-readout").textContent =
        `(${rc.getRow()}, ${rc.getColumn()}) → id ${id} · ${this.graph.getState(id)}`;
      if (this._isPointerDown) this._applyTool(id);
    });

    const stopPainting = () => {
      this._isPointerDown = false;
    };
    window.addEventListener("pointerup", stopPainting);
    window.addEventListener("pointercancel", stopPainting);

    this.render();
  }

  setLocked(locked) {
    this._locked = locked;
    this._toolInputs.forEach((i) => (i.disabled = locked));
  }

  clear() {
    this.graph.reset();
    seedDefaultStartEnd(this.graph, this.cols, this.rows);
    this.render();
  }

  clearRunVisuals() {
    for (let id = 0; id < this.cols * this.rows; id++) {
      const state = this.graph.getState(id);
      if (
        state === VertexState.Visited ||
        state === VertexState.Expanded ||
        state === VertexState.Path
      ) {
        this.graph.setState(id, VertexState.Idle);
      }
    }
    this.render();
  }

  renderCell(id) {
    this._cellEls[id].className = "h-5 w-5 " + CELL_STATE_CLASS[this.graph.getState(id)];
  }

  render() {
    for (let id = 0; id < this.cols * this.rows; id++) this.renderCell(id);
  }

  _applyTool(id) {
    if (this._locked) return;
    const changedIds = PAINT_TOOLS[this._tool].apply(this.graph, id);
    for (const changedId of changedIds) {
      this.renderCell(changedId);
    }
  }
}
