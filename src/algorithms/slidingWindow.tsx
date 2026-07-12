import type { ReactNode } from "react";
import type { TraceStep, SandboxOutcome } from "@/types";
import { color, font } from "@/theme/tokens";

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

// ---------------------------------------------------------------------------
// Shared visual grammar
// ---------------------------------------------------------------------------

export function SWBoxes({
  input,
  left,
  right,
  bestWindow,
  touched,
}: {
  input: string;
  left: number;
  right: number;
  bestWindow?: [number, number];
  touched?: { index: number; kind: "add" | "drop" };
}) {
  const chars = input.split("");
  return (
    <div style={{ overflowX: "auto", padding: "8px 2px 4px" }}>
      <div style={{ display: "flex", gap: 6, minWidth: "min-content" }}>
        {chars.map((ch, i) => {
          const inWindow = i >= left && i <= right && right >= left;
          const isTouched = touched?.index === i;
          const border =
            isTouched && touched?.kind === "drop"
              ? color.red
              : inWindow
                ? color.teal
                : color.panelBorder;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                aria-label={`index ${i}, character ${ch}${inWindow ? ", in window" : ""}`}
                style={{
                  width: 38,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: font.mono,
                  fontSize: 18,
                  fontWeight: 700,
                  color: inWindow ? color.text : color.textFaint,
                  background: inWindow ? "rgba(79,163,161,0.14)" : "transparent",
                  border: `1.5px solid ${border}`,
                  borderRadius: 8,
                  transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
                  animation: isTouched ? "pc-node-in 300ms cubic-bezier(0.34,1.56,0.64,1)" : undefined,
                }}
              >
                {ch}
              </div>
              {/* pointer rail */}
              <div style={{ height: 16, display: "flex", gap: 3, fontFamily: font.mono, fontSize: 11, fontWeight: 700 }}>
                {i === left && right >= left && <span style={{ color: color.amber }}>L</span>}
                {i === right && right >= left && <span style={{ color: color.teal }}>R</span>}
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 10, color: color.textFaint }}>{i}</div>
            </div>
          );
        })}
      </div>
      {bestWindow && bestWindow[1] >= bestWindow[0] && (
        <div style={{ marginTop: 8, fontFamily: font.mono, fontSize: 12, color: color.amber }}>
          best so far: "{input.slice(bestWindow[0], bestWindow[1] + 1)}" ({bestWindow[1] - bestWindow[0] + 1})
        </div>
      )}
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

  const push = (s: SWState, explanation: string, tag?: string, milestone?: boolean) =>
    steps.push({ state: { ...s }, explanation, tag, milestone });

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
      "expand",
      milestone,
    );
  }

  if (steps.length === 0) {
    steps.push({
      state: { input, left: 0, right: -1, best: 0, bestWindow: [0, -1] },
      explanation: "Empty input — the answer is 0.",
    });
  }
  return steps;
}

export function renderSlidingWindowStep(step: TraceStep<SWState>): ReactNode {
  const s = step.state;
  return <SWBoxes input={s.input} left={s.left} right={s.right} bestWindow={s.bestWindow} touched={s.touched} />;
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

export function scoreSWSandbox(state: SWState): { achieved: number; optimal: number; label: string } {
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
  return {
    achieved: state.best,
    optimal,
    label: `longest window found: "${input.slice(state.bestWindow[0], state.bestWindow[1] + 1)}"`,
  };
}

export function renderSWSandbox(state: SWState): ReactNode {
  return <SWBoxes input={state.input} left={state.left} right={state.right} bestWindow={state.bestWindow} touched={state.touched} />;
}
