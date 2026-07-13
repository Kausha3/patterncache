import type { ReactNode } from "react";
import type { TraceStep, SandboxOutcome } from "@/types";
import { color, font, motion } from "@/theme/tokens";

/**
 * Sliding Window — flagship DSA lesson.
 * Problem: length of the longest substring without repeating characters.
 * Both the trace and the sandbox share one visual grammar: character boxes
 * with L / R pointer labels and a highlighted window.
 */

export interface SWState {
  input: string;
  left: number;
  right: number; // inclusive right edge of the window
  best: number;
  bestWindow: [number, number];
  /** index just added (expand) or dropped (shrink), for one-frame emphasis. */
  touched?: { index: number; kind: "add" | "drop" };
}

const win = (s: SWState) => s.input.slice(s.left, s.right + 1);

/** Pseudocode shown beside the trace; step.line points at the active row. */
export const SW_PSEUDOCODE = [
  "seen = {}            // chars currently in window",
  "left = 0, best = 0",
  "for right in 0 … n-1:",
  "    while s[right] in seen:",
  "        seen.remove(s[left]); left++",
  "    seen.add(s[right])",
  "    best = max(best, right - left + 1)",
  "return best",
];
const LINE_SHRINK = 4;
const LINE_EXPAND = 6;

// ---------------------------------------------------------------------------
// Shared visual grammar
// ---------------------------------------------------------------------------

export function SWBoxes({
  input,
  left,
  right,
  touched,
}: {
  input: string;
  left: number;
  right: number;
  touched?: { index: number; kind: "add" | "drop" };
}) {
  const chars = input.split("");
  const active = right >= left;
  return (
    <div style={{ overflowX: "auto", padding: "2px 2px 4px" }}>
      <div style={{ display: "flex", gap: 5, minWidth: "min-content" }}>
        {chars.map((ch, i) => {
          const inWindow = active && i >= left && i <= right;
          const isL = active && i === left;
          const isR = active && i === right;
          const isTouched = touched?.index === i;
          const dropFlash = isTouched && touched?.kind === "drop";
          const border = dropFlash ? color.red : inWindow ? color.teal : color.panelBorder;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              {/* pointer chips above */}
              <div style={{ height: 17, display: "flex", gap: 2, alignItems: "center" }}>
                {(isL || isR) && (
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      color: isL && isR ? color.text : isL ? color.amber : color.teal,
                    }}
                  >
                    {isL && isR ? "L·R" : isL ? "L" : "R"}
                  </span>
                )}
              </div>
              <div
                aria-label={`index ${i}, character ${ch}${inWindow ? ", in window" : ""}`}
                style={{
                  width: 42,
                  height: 46,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: font.mono,
                  fontSize: 19,
                  fontWeight: 600,
                  color: inWindow ? color.text : color.textFaint,
                  background: inWindow ? "rgba(91,176,173,0.12)" : "rgba(255,255,255,0.015)",
                  border: `1.5px solid ${border}`,
                  borderRadius: 9,
                  transition: `all ${motion.step}`,
                  animation: isTouched ? `pc-fade 260ms ${motion.enter}` : undefined,
                }}
              >
                {ch}
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 10.5, color: isL || isR ? color.textDim : color.textFaint }}>{i}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Clean labelled stat strip: current window + best-so-far. */
function SWStats({ state }: { state: SWState }) {
  const cur = win(state);
  const best = state.bestWindow[1] >= state.bestWindow[0] ? state.input.slice(state.bestWindow[0], state.bestWindow[1] + 1) : "";
  const chip = (label: string, val: string, len: number, tone: string) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: color.textFaint }}>{label}</span>
      <span style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 700, color: tone }}>
        {val ? `"${val}"` : "∅"} <span style={{ color: color.textDim, fontWeight: 400 }}>· {len}</span>
      </span>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 22, flexWrap: "wrap", paddingTop: 4 }}>
      {chip("window", cur, cur.length, color.teal)}
      {chip("best", best, best.length, color.amber)}
    </div>
  );
}

export function SWViz({ state }: { state: SWState }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <SWBoxes input={state.input} left={state.left} right={state.right} touched={state.touched} />
      <SWStats state={state} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trace generator
// ---------------------------------------------------------------------------

export function runSlidingWindow(input: string): TraceStep<SWState>[] {
  const steps: TraceStep<SWState>[] = [];
  const seen = new Set<string>();
  let left = 0;
  let best = 0;
  let bestWindow: [number, number] = [0, -1];

  const push = (s: SWState, explanation: string, line: number, tag?: string, milestone?: boolean) =>
    steps.push({ state: { ...s }, explanation, line, tag, milestone });

  for (let right = 0; right < input.length; right++) {
    const c = input[right];

    // Shrink until the incoming char is no longer a duplicate.
    while (seen.has(c)) {
      const dropped = input[left];
      seen.delete(dropped);
      left++;
      push(
        { input, left, right: right - 1, best, bestWindow, touched: { index: left - 1, kind: "drop" } },
        `'${c}' is already in the window. Shrink from the left — drop '${dropped}' — until the duplicate is gone.`,
        LINE_SHRINK,
        "shrink",
      );
    }

    seen.add(c);
    const len = right - left + 1;
    let milestone = false;
    if (len > best) {
      best = len;
      bestWindow = [left, right];
      milestone = true;
    }
    push(
      { input, left, right, best, bestWindow, touched: { index: right, kind: "add" } },
      milestone
        ? `Add '${c}'. Window is "${input.slice(left, right + 1)}" (length ${len}) — a new best.`
        : `Add '${c}'. Window is "${input.slice(left, right + 1)}" (length ${len}).`,
      LINE_EXPAND,
      "expand",
      milestone,
    );
  }

  if (steps.length === 0) {
    steps.push({
      state: { input, left: 0, right: -1, best: 0, bestWindow: [0, -1] },
      explanation: "Empty input — the answer is 0.",
      line: 7,
    });
  }
  return steps;
}

export function renderSlidingWindowStep(step: TraceStep<SWState>): ReactNode {
  return <SWViz state={step.state} />;
}

// ---------------------------------------------------------------------------
// Sandbox engine — "Now you drive"
// ---------------------------------------------------------------------------

function hasDup(s: string): boolean {
  return new Set(s).size !== s.length;
}

export function initSWSandbox(input: string): SWState {
  return { input, left: 0, right: 0, best: 1, bestWindow: [0, 0] };
}

export function applySWSandbox(state: SWState, actionId: string): SandboxOutcome<SWState> {
  const { input } = state;
  const n = input.length;
  const atEnd = state.right >= n - 1;

  if (actionId === "expand") {
    if (atEnd) {
      return {
        state,
        valid: false,
        done: true,
        message: "Right pointer is already at the last character — nothing left to add.",
      };
    }
    const nextRight = state.right + 1;
    const candidate = input.slice(state.left, nextRight + 1);
    if (hasDup(candidate)) {
      const c = input[nextRight];
      return {
        state,
        valid: false,
        done: state.right >= n - 1,
        message: `Adding '${c}' would repeat a character already in the window "${win(state)}". A valid window has no repeats — shrink from the left first.`,
      };
    }
    const len = nextRight - state.left + 1;
    const improved = len > state.best;
    const next: SWState = {
      ...state,
      right: nextRight,
      best: improved ? len : state.best,
      bestWindow: improved ? [state.left, nextRight] : state.bestWindow,
      touched: { index: nextRight, kind: "add" },
    };
    return {
      state: next,
      valid: true,
      done: nextRight >= n - 1,
      message: improved
        ? `Added '${input[nextRight]}'. Window "${win(next)}" is length ${len} — a new best!`
        : `Added '${input[nextRight]}'. Window "${win(next)}" is length ${len}.`,
    };
  }

  if (actionId === "shrink") {
    // Guard only against shrinking an already-empty window. Shrinking a
    // single-char window to empty is allowed — it's how L advances past a
    // repeat before expanding again (otherwise the learner dead-ends).
    if (state.left > state.right) {
      return {
        state,
        valid: false,
        done: atEnd,
        message: "The window is already empty — expand to bring in the next character.",
      };
    }
    const dropped = input[state.left];
    const next: SWState = {
      ...state,
      left: state.left + 1,
      touched: { index: state.left, kind: "drop" },
    };
    const nowEmpty = next.left > next.right;
    return {
      state: next,
      valid: true,
      done: atEnd,
      message: nowEmpty
        ? `Dropped '${dropped}'. The window is now empty — expand to slide past the repeat.`
        : `Dropped '${dropped}' from the left. Window is now "${win(next)}".`,
    };
  }

  return { state, valid: false, done: atEnd, message: "Unknown action." };
}

export function scoreSWSandbox(state: SWState): { solved: boolean; message: string; note?: string } {
  // Brute-force the true optimum so the compare is honest.
  const { input } = state;
  let optimal = 0;
  for (let i = 0; i < input.length; i++) {
    for (let j = i; j < input.length; j++) {
      const sub = input.slice(i, j + 1);
      if (!hasDup(sub)) optimal = Math.max(optimal, sub.length);
      else break;
    }
  }
  const solved = state.best >= optimal;
  return {
    solved,
    message: `You found a window of ${state.best}. The optimum for "${input}" is ${optimal}. ${solved ? "You matched it." : "Reset and see if you can reach it."}`,
    note: `longest window found: "${input.slice(state.bestWindow[0], state.bestWindow[1] + 1)}"`,
  };
}

export function renderSWSandbox(state: SWState): ReactNode {
  return <SWViz state={state} />;
}
