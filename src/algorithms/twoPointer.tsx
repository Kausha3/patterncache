import type { ReactNode } from "react";
import type { TraceStep, SandboxOutcome } from "@/types";
import { color, font, motion } from "@/theme/tokens";

/**
 * Two Pointers — converging pointers on a sorted array (two-sum).
 * The pattern *is* the movement decision: sum too small → move the left
 * pointer up; too big → move the right pointer down. Because the array is
 * sorted, each comparison eliminates a whole row of pairs.
 */

export interface TPState {
  nums: number[];
  target: number;
  left: number;
  right: number;
  found?: boolean;
}

/** input format: "2,7,11,15|9"  →  nums | target */
export function parseTP(input: string): { nums: number[]; target: number } {
  const [numsPart, targetPart] = input.split("|");
  return { nums: numsPart.split(",").map((n) => parseInt(n.trim(), 10)), target: parseInt(targetPart.trim(), 10) };
}

export const TP_PSEUDOCODE = [
  "left = 0, right = n - 1",
  "while left < right:",
  "    sum = a[left] + a[right]",
  "    if sum == target:  return (left, right)",
  "    if sum <  target:  left++      // too small → grow",
  "    else:              right--     // too big  → shrink",
  "return  \"no pair\"",
];
const LINE_MATCH = 3;
const LINE_LOW = 4;
const LINE_HIGH = 5;

// ---------------------------------------------------------------------------
// Visual grammar
// ---------------------------------------------------------------------------

function TPBoxes({ nums, left, right, found }: { nums: number[]; left: number; right: number; found?: boolean }) {
  return (
    <div style={{ overflowX: "auto", padding: "2px 2px 4px" }}>
      <div style={{ display: "flex", gap: 5, minWidth: "min-content" }}>
        {nums.map((n, i) => {
          const isL = i === left;
          const isR = i === right;
          const isPtr = isL || isR;
          const eliminated = i < left || i > right;
          const tone = found && isPtr ? color.green : isPtr ? color.teal : color.panelBorder;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ height: 17, fontFamily: font.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", color: isL ? color.amber : isR ? color.teal : "transparent" }}>
                {isL && isR ? "L·R" : isL ? "L" : isR ? "R" : "·"}
              </div>
              <div
                style={{
                  minWidth: 44,
                  height: 46,
                  padding: "0 8px",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: font.mono,
                  fontSize: 17,
                  fontWeight: 600,
                  color: eliminated ? color.textFaint : isPtr ? color.text : color.textDim,
                  background: found && isPtr ? "rgba(130,184,114,0.14)" : isPtr ? "rgba(91,176,173,0.12)" : "rgba(255,255,255,0.015)",
                  border: `1.5px solid ${tone}`,
                  borderRadius: 9,
                  textDecoration: eliminated ? "line-through" : "none",
                  transition: `all ${motion.step}`,
                }}
              >
                {n}
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 10.5, color: isPtr ? color.textDim : color.textFaint }}>{i}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TPReadout({ state }: { state: TPState }) {
  const a = state.nums[state.left];
  const b = state.nums[state.right];
  const sum = a + b;
  const cmp = sum === state.target ? "=" : sum < state.target ? "<" : ">";
  const cmpTone = sum === state.target ? color.green : sum < state.target ? color.amber : color.blue;
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap", fontFamily: font.mono, fontSize: 14 }}>
      <span style={{ color: color.textDim }}>
        a[{state.left}] + a[{state.right}] = <span style={{ color: color.text, fontWeight: 700 }}>{a} + {b} = {sum}</span>
      </span>
      <span style={{ color: cmpTone, fontWeight: 700 }}>
        {sum} {cmp} {state.target}
      </span>
    </div>
  );
}

function TPViz({ state }: { state: TPState }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <TPBoxes nums={state.nums} left={state.left} right={state.right} found={state.found} />
      {state.left < state.right && <TPReadout state={state} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trace generator
// ---------------------------------------------------------------------------

export function runTwoPointer(input: string): TraceStep<TPState>[] {
  const { nums, target } = parseTP(input);
  const steps: TraceStep<TPState>[] = [];
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) {
      steps.push({
        state: { nums, target, left, right, found: true },
        explanation: `a[${left}] + a[${right}] = ${nums[left]} + ${nums[right]} = ${target}. That's the target, done.`,
        line: LINE_MATCH,
        tag: "match",
        milestone: true,
      });
      return steps;
    }
    if (sum < target) {
      steps.push({
        state: { nums, target, left, right },
        explanation: `Sum ${sum} is below ${target}. Everything paired with a[${left}] is too small, so a[${left}] can't be the answer. Move L up to grow the sum.`,
        line: LINE_LOW,
        tag: "too small",
      });
      left++;
    } else {
      steps.push({
        state: { nums, target, left, right },
        explanation: `Sum ${sum} is above ${target}. Everything paired with a[${right}] is too big, so a[${right}] can't be the answer. Move R down to shrink the sum.`,
        line: LINE_HIGH,
        tag: "too big",
      });
      right--;
    }
  }

  steps.push({
    state: { nums, target, left, right },
    explanation: "The pointers met without a match. No pair sums to the target.",
    line: 6,
    tag: "no pair",
  });
  return steps;
}

export function renderTwoPointerStep(step: TraceStep<TPState>): ReactNode {
  return <TPViz state={step.state} />;
}

// ---------------------------------------------------------------------------
// Sandbox engine
// ---------------------------------------------------------------------------

export function initTPSandbox(input: string): TPState {
  const { nums, target } = parseTP(input);
  return { nums, target, left: 0, right: nums.length - 1 };
}

export function applyTPSandbox(state: TPState, actionId: string): SandboxOutcome<TPState> {
  const { nums, target, left, right } = state;
  const prevSum = nums[left] + nums[right];

  if (left >= right) {
    return { state, valid: false, done: true, message: "The pointers have already met. The run is over." };
  }

  if (actionId === "moveL") {
    const nl = left + 1;
    if (nl >= right) {
      return { state: { ...state, left: nl }, valid: true, done: true, message: "Pointers met. No pair sums to the target on this run." };
    }
    const sum = nums[nl] + nums[right];
    const next = { ...state, left: nl, found: sum === target };
    if (sum === target) return { state: next, valid: true, done: true, message: `a[${nl}] + a[${right}] = ${target}. You found the pair!` };
    const misstep = prevSum > target;
    return {
      state: next,
      valid: true,
      done: false,
      message: misstep
        ? `The sum was already too big (${prevSum} > ${target}); moving L up grew it to ${sum}. That moves away from the target. L should move when the sum is too small.`
        : `Moved L up. New sum ${nums[nl]} + ${nums[right]} = ${sum} ${sum < target ? "< " : "> "}${target}.`,
    };
  }

  if (actionId === "moveR") {
    const nr = right - 1;
    if (nr <= left) {
      return { state: { ...state, right: nr }, valid: true, done: true, message: "Pointers met. No pair sums to the target on this run." };
    }
    const sum = nums[left] + nums[nr];
    const next = { ...state, right: nr, found: sum === target };
    if (sum === target) return { state: next, valid: true, done: true, message: `a[${left}] + a[${nr}] = ${target}. You found the pair!` };
    const misstep = prevSum < target;
    return {
      state: next,
      valid: true,
      done: false,
      message: misstep
        ? `The sum was already too small (${prevSum} < ${target}); moving R down shrank it to ${sum}. That moves away from the target. R should move when the sum is too big.`
        : `Moved R down. New sum ${nums[left]} + ${nums[nr]} = ${sum} ${sum < target ? "< " : "> "}${target}.`,
    };
  }

  return { state, valid: false, done: false, message: "Unknown action." };
}

export function scoreTPSandbox(state: TPState): { solved: boolean; message: string; note?: string } {
  const { nums, target } = state;
  let pair: [number, number] | null = null;
  for (let i = 0; i < nums.length && !pair; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) { pair = [i, j]; break; }
    }
  }
  if (state.found) {
    return { solved: true, message: `You found a pair summing to ${target}.`, note: `a[${state.left}] + a[${state.right}] = ${nums[state.left]} + ${nums[state.right]}` };
  }
  if (!pair) {
    return { solved: true, message: `No pair sums to ${target}, and you correctly ran the pointers to that conclusion.` };
  }
  return {
    solved: false,
    message: `A pair does exist but you crossed past it. Reset and move only the pointer that brings the sum toward ${target}.`,
    note: `hint: a valid pair is a[${pair[0]}] + a[${pair[1]}] = ${nums[pair[0]]} + ${nums[pair[1]]}`,
  };
}

export function renderTPSandbox(state: TPState): ReactNode {
  return <TPViz state={state} />;
}
