import type { ReactNode } from "react";
import type { AlgorithmKey, TraceStep, SandboxAction, SandboxOutcome } from "@/types";
import {
  runSlidingWindow,
  renderSlidingWindowStep,
  initSWSandbox,
  applySWSandbox,
  scoreSWSandbox,
  renderSWSandbox,
  SW_PSEUDOCODE,
} from "./slidingWindow";
import {
  runTwoPointer,
  renderTwoPointerStep,
  initTPSandbox,
  applyTPSandbox,
  scoreTPSandbox,
  renderTPSandbox,
  TP_PSEUDOCODE,
} from "./twoPointer";
import {
  runBFS,
  renderBFSStep,
  initBFSSandbox,
  applyBFSSandbox,
  scoreBFSSandbox,
  renderBFSSandbox,
  BFS_PSEUDOCODE,
} from "./bfs";

/**
 * ALGORITHMS registry — the seam that keeps <TraceVisualizer /> and
 * <SandboxPractice /> generic. A DSA lesson names an algorithm; the component
 * looks up how to run it, how to draw a step, and how to drive the sandbox.
 *
 * To add a new algorithm (BFS, DP, ...), implement one of these and register
 * it here — no component changes required.
 */

/** Terminal assessment shown when the learner finishes — algorithm-agnostic. */
export interface SandboxScore {
  solved: boolean; // reached the optimal/correct outcome
  message: string; // the comparison, in plain language
  note?: string; // secondary mono line (e.g. the winning window / pair / path)
}

export interface SandboxEngine {
  actions: SandboxAction[];
  init(input: string): unknown;
  apply(state: unknown, actionId: string): SandboxOutcome;
  render(state: unknown): ReactNode;
  score(state: unknown): SandboxScore;
}

export interface AlgorithmDef {
  key: AlgorithmKey;
  run(input: string): TraceStep[];
  renderStep(step: TraceStep): ReactNode;
  /** Pseudocode shown beside the trace; TraceStep.line points at the row. */
  pseudocode: string[];
  sandbox: SandboxEngine;
}

export const ALGORITHMS: Partial<Record<AlgorithmKey, AlgorithmDef>> = {
  "sliding-window": {
    key: "sliding-window",
    run: runSlidingWindow as (input: string) => TraceStep[],
    renderStep: renderSlidingWindowStep as (step: TraceStep) => ReactNode,
    pseudocode: SW_PSEUDOCODE,
    sandbox: {
      actions: [
        { id: "expand", label: "Expand →", key: "ArrowRight" },
        { id: "shrink", label: "Shrink ←", key: "ArrowLeft" },
      ],
      init: initSWSandbox as (input: string) => unknown,
      apply: applySWSandbox as (state: unknown, actionId: string) => SandboxOutcome,
      render: renderSWSandbox as (state: unknown) => ReactNode,
      score: scoreSWSandbox as (state: unknown) => SandboxScore,
    },
  },
  "two-pointer": {
    key: "two-pointer",
    run: runTwoPointer as (input: string) => TraceStep[],
    renderStep: renderTwoPointerStep as (step: TraceStep) => ReactNode,
    pseudocode: TP_PSEUDOCODE,
    sandbox: {
      actions: [
        { id: "moveL", label: "Move L →", key: "ArrowRight" },
        { id: "moveR", label: "Move R ←", key: "ArrowLeft" },
      ],
      init: initTPSandbox as (input: string) => unknown,
      apply: applyTPSandbox as (state: unknown, actionId: string) => SandboxOutcome,
      render: renderTPSandbox as (state: unknown) => ReactNode,
      score: scoreTPSandbox as (state: unknown) => SandboxScore,
    },
  },
  bfs: {
    key: "bfs",
    run: runBFS as (input: string) => TraceStep[],
    renderStep: renderBFSStep as (step: TraceStep) => ReactNode,
    pseudocode: BFS_PSEUDOCODE,
    sandbox: {
      actions: [
        { id: "oldest", label: "Pull oldest (BFS)" },
        { id: "newest", label: "Pull newest" },
      ],
      init: initBFSSandbox as (input: string) => unknown,
      apply: applyBFSSandbox as (state: unknown, actionId: string) => SandboxOutcome,
      render: renderBFSSandbox as (state: unknown) => ReactNode,
      score: scoreBFSSandbox as (state: unknown) => SandboxScore,
    },
  },
};

export function getAlgorithm(key: AlgorithmKey): AlgorithmDef | undefined {
  return ALGORITHMS[key];
}
