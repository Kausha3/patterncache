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

/**
 * ALGORITHMS registry — the seam that keeps <TraceVisualizer /> and
 * <SandboxPractice /> generic. A DSA lesson names an algorithm; the component
 * looks up how to run it, how to draw a step, and how to drive the sandbox.
 *
 * To add a new algorithm (BFS, DP, ...), implement one of these and register
 * it here — no component changes required.
 */

export interface SandboxEngine {
  actions: SandboxAction[];
  init(input: string): unknown;
  apply(state: unknown, actionId: string): SandboxOutcome;
  render(state: unknown): ReactNode;
  score(state: unknown): { achieved: number; optimal: number; label: string };
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
      score: scoreSWSandbox as (state: unknown) => { achieved: number; optimal: number; label: string },
    },
  },
};

export function getAlgorithm(key: AlgorithmKey): AlgorithmDef | undefined {
  return ALGORITHMS[key];
}
