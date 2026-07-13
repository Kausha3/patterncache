import type { ReactNode } from "react";
import type { TraceStep, SandboxOutcome } from "@/types";
import { color, font, motion } from "@/theme/tokens";

/**
 * BFS on a grid — shortest path from S to T. This lesson exists to prove the
 * trace renderer is genuinely generic: the grammar here is a grid + a FIFO
 * queue + a visited set, nothing like the pointer-and-boxes lessons, yet it
 * plugs into the same TraceVisualizer and SandboxPractice.
 */

export interface BFSState {
  grid: string[];
  rows: number;
  cols: number;
  startKey: string;
  targetKey: string;
  visited: string[];
  queue: string[]; // frontier (FIFO order)
  current: string | null;
  dist: Record<string, number>;
  parent: Record<string, string>;
  path?: string[];
}

const key = (r: number, c: number) => `${r},${c}`;
const parse = (k: string) => k.split(",").map(Number) as [number, number];

export function parseGrid(input: string) {
  const grid = input.split("/");
  const rows = grid.length;
  const cols = grid[0].length;
  let startKey = "0,0";
  let targetKey = "0,0";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "S") startKey = key(r, c);
      if (grid[r][c] === "T") targetKey = key(r, c);
    }
  }
  return { grid, rows, cols, startKey, targetKey };
}

function neighbors(k: string, rows: number, cols: number): string[] {
  const [r, c] = parse(k);
  const cand: [number, number][] = [
    [r - 1, c],
    [r, c + 1],
    [r + 1, c],
    [r, c - 1],
  ];
  return cand.filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols).map(([nr, nc]) => key(nr, nc));
}
const isOpen = (grid: string[], k: string) => {
  const [r, c] = parse(k);
  return grid[r][c] !== "#";
};

function reconstruct(parent: Record<string, string>, startKey: string, targetKey: string): string[] {
  const path: string[] = [];
  let cur: string | undefined = targetKey;
  while (cur && cur !== startKey) {
    path.push(cur);
    cur = parent[cur];
  }
  path.push(startKey);
  return path.reverse();
}

export const BFS_PSEUDOCODE = [
  "queue = [start];  seen = {start}",
  "while queue not empty:",
  "    cell = queue.pop_front()      // FIFO ⇒ breadth-first",
  "    if cell == target:  return dist[cell]",
  "    for nb in neighbors(cell):",
  "        if open(nb) and nb not in seen:",
  "            seen.add(nb); dist[nb] = dist[cell]+1",
  "            queue.push_back(nb)",
  "return  \"unreachable\"",
];

// ---------------------------------------------------------------------------
// Visual grammar — grid + queue
// ---------------------------------------------------------------------------

function BFSGrid({ state }: { state: BFSState }) {
  const { grid, rows, cols } = state;
  const visited = new Set(state.visited);
  const frontier = new Set(state.queue);
  const path = new Set(state.path ?? []);
  const cells: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = key(r, c);
      const wall = grid[r][c] === "#";
      const isStart = k === state.startKey;
      const isTarget = k === state.targetKey;
      const isCurrent = k === state.current;
      const inPath = path.has(k);
      const inFrontier = frontier.has(k);
      const isVisited = visited.has(k);
      const d = state.dist[k];

      let bg: string = "rgba(255,255,255,0.015)";
      let border: string = color.panelBorder;
      let fg: string = color.textFaint;
      let label: string | number = "";

      if (wall) { bg = "#0F1013"; border = "#0F1013"; }
      else if (inPath) { bg = "rgba(130,184,114,0.2)"; border = color.green; fg = color.text; label = d ?? ""; }
      else if (isVisited || inFrontier) {
        bg = inFrontier ? "rgba(217,169,78,0.14)" : "rgba(91,176,173,0.13)";
        border = inFrontier ? color.amber : color.teal;
        fg = color.text;
        label = d ?? "";
      }
      if (isStart) { label = "S"; bg = "rgba(130,184,114,0.2)"; border = color.green; fg = color.green; }
      if (isTarget) { label = "T"; border = inPath ? color.green : color.blue; bg = inPath ? "rgba(130,184,114,0.2)" : "rgba(106,166,219,0.16)"; fg = inPath ? color.text : color.blue; }
      if (isCurrent && !isStart && !isTarget) { border = color.teal; bg = "rgba(91,176,173,0.28)"; }

      cells.push(
        <div
          key={k}
          style={{
            width: 40,
            height: 40,
            display: "grid",
            placeItems: "center",
            fontFamily: font.mono,
            fontSize: 13,
            fontWeight: 700,
            color: fg,
            background: bg,
            border: `1.5px solid ${border}`,
            borderRadius: 7,
            boxShadow: isCurrent ? `0 0 0 2px ${color.teal}55` : undefined,
            transition: `all ${motion.step}`,
          }}
        >
          {label}
        </div>,
      );
    }
  }
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 40px)`, gap: 4 }}>{cells}</div>;
}

function BFSQueue({ state }: { state: BFSState }) {
  return (
    <div style={{ display: "grid", gap: 8, minWidth: 190 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: color.amber }}>queue · front → back</span>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", minHeight: 26 }}>
          {state.queue.length === 0 && <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>empty</span>}
          {state.queue.map((k, i) => (
            <span
              key={k}
              style={{
                fontFamily: font.mono,
                fontSize: 11,
                color: i === 0 ? color.text : color.textDim,
                background: i === 0 ? "rgba(217,169,78,0.18)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${i === 0 ? color.amber : color.panelBorder}`,
                borderRadius: 5,
                padding: "2px 6px",
              }}
            >
              ({k})
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, fontFamily: font.mono, fontSize: 11, color: color.textDim }}>
        <span>visited <b style={{ color: color.teal }}>{state.visited.length}</b></span>
        {state.current && <span>at <b style={{ color: color.text }}>({state.current})</b></span>}
      </div>
    </div>
  );
}

function BFSViz({ state }: { state: BFSState }) {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ overflowX: "auto" }}><BFSGrid state={state} /></div>
      <BFSQueue state={state} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trace generator
// ---------------------------------------------------------------------------

export function runBFS(input: string): TraceStep<BFSState>[] {
  const { grid, rows, cols, startKey, targetKey } = parseGrid(input);
  const steps: TraceStep<BFSState>[] = [];
  const visited = [startKey];
  const dist: Record<string, number> = { [startKey]: 0 };
  const parent: Record<string, string> = {};
  let queue = [startKey];

  const snap = (current: string | null, path?: string[]): BFSState => ({
    grid, rows, cols, startKey, targetKey,
    visited: [...visited], queue: [...queue], current, dist: { ...dist }, parent: { ...parent }, path,
  });

  steps.push({ state: snap(null), explanation: "Seed the queue with the start cell at distance 0. BFS explores strictly in order of distance.", line: 0 });

  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === targetKey) {
      const path = reconstruct(parent, startKey, targetKey);
      steps.push({ state: snap(cur, path), explanation: `Dequeued the target at distance ${dist[cur]}. Because BFS pulls cells in distance order, this is guaranteed shortest — ${dist[cur]} steps.`, line: 3, tag: "target", milestone: true });
      return steps;
    }
    const added: string[] = [];
    for (const nb of neighbors(cur, rows, cols)) {
      if (isOpen(grid, nb) && !dist.hasOwnProperty(nb)) {
        dist[nb] = dist[cur] + 1;
        parent[nb] = cur;
        visited.push(nb);
        queue.push(nb);
        added.push(nb);
      }
    }
    steps.push({
      state: snap(cur),
      explanation: added.length
        ? `Dequeue (${cur}) at distance ${dist[cur]}. Enqueue its open, unseen neighbors — ${added.map((k) => `(${k})`).join(", ")} — each at distance ${dist[cur] + 1}.`
        : `Dequeue (${cur}) at distance ${dist[cur]}. No open, unseen neighbors — nothing to add.`,
      line: 2,
      tag: "expand",
    });
  }

  steps.push({ state: snap(null), explanation: "The queue drained without reaching the target — it's unreachable.", line: 8, tag: "unreachable" });
  return steps;
}

export function renderBFSStep(step: TraceStep<BFSState>): ReactNode {
  return <BFSViz state={step.state} />;
}

// ---------------------------------------------------------------------------
// Sandbox — the learner chooses which end of the queue to pull from, so the
// difference between FIFO (BFS, shortest) and LIFO (deep, not shortest) is felt.
// ---------------------------------------------------------------------------

function bfsOptimal(input: string): number {
  const { grid, rows, cols, startKey, targetKey } = parseGrid(input);
  const dist: Record<string, number> = { [startKey]: 0 };
  const q = [startKey];
  while (q.length) {
    const cur = q.shift()!;
    if (cur === targetKey) return dist[cur];
    for (const nb of neighbors(cur, rows, cols)) {
      if (isOpen(grid, nb) && !dist.hasOwnProperty(nb)) { dist[nb] = dist[cur] + 1; q.push(nb); }
    }
  }
  return -1;
}

export function initBFSSandbox(input: string): BFSState {
  const { grid, rows, cols, startKey, targetKey } = parseGrid(input);
  return { grid, rows, cols, startKey, targetKey, visited: [startKey], queue: [startKey], current: null, dist: { [startKey]: 0 }, parent: {} };
}

function processCell(state: BFSState, cur: string): { state: BFSState; added: string[]; foundTarget: boolean } {
  const dist = { ...state.dist };
  const parent = { ...state.parent };
  const visited = [...state.visited];
  const queue = [...state.queue];
  const added: string[] = [];
  let foundTarget = false;
  for (const nb of neighbors(cur, state.rows, state.cols)) {
    if (isOpen(state.grid, nb) && !dist.hasOwnProperty(nb)) {
      dist[nb] = dist[cur] + 1;
      parent[nb] = cur;
      visited.push(nb);
      queue.push(nb);
      added.push(nb);
      if (nb === state.targetKey) foundTarget = true;
    }
  }
  return { state: { ...state, dist, parent, visited, queue, current: cur }, added, foundTarget };
}

export function applyBFSSandbox(state: BFSState, actionId: string): SandboxOutcome<BFSState> {
  if (state.path) return { state, valid: false, done: true, message: "Target already reached — the run is over." };
  if (state.queue.length === 0) return { state, valid: false, done: true, message: "The queue is empty — nowhere left to explore." };

  const queue = [...state.queue];
  const cur = actionId === "newest" ? queue.pop()! : queue.shift()!;
  const base = { ...state, queue };
  const { state: after, added, foundTarget } = processCell(base, cur);

  if (foundTarget) {
    const path = reconstruct(after.parent, after.startKey, after.targetKey);
    return { state: { ...after, path }, valid: true, done: true, message: `Reached the target from (${cur}) — path length ${after.dist[after.targetKey]}.` };
  }

  const how = actionId === "newest" ? "newest (LIFO — goes deep)" : "oldest (FIFO — stays shallow)";
  return {
    state: after,
    valid: true,
    done: false,
    message: added.length
      ? `Pulled the ${how} cell (${cur}). Added ${added.map((k) => `(${k})`).join(", ")} to the back of the queue.`
      : `Pulled the ${how} cell (${cur}). It had no new neighbors.`,
  };
}

export function scoreBFSSandbox(state: BFSState): { solved: boolean; message: string; note?: string } {
  const inputRebuilt = state.grid.join("/");
  const optimal = bfsOptimal(inputRebuilt);
  const found = state.path ? state.dist[state.targetKey] : -1;
  if (found < 0) {
    return { solved: false, message: "You didn't reach the target. Reset and keep pulling from the queue until T is found." };
  }
  if (found === optimal) {
    return { solved: true, message: `You reached T in ${found} steps — the shortest possible path.`, note: "Pulling oldest-first (FIFO) is what guarantees shortest paths." };
  }
  return {
    solved: false,
    message: `You reached T in ${found} steps, but the shortest path is ${optimal}. Pulling the newest cell explores deep and can stumble onto T by a longer route — FIFO (oldest-first) is what makes BFS optimal.`,
    note: `your path length ${found} · shortest ${optimal}`,
  };
}

export function renderBFSSandbox(state: BFSState): ReactNode {
  return <BFSViz state={state} />;
}
