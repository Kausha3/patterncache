import type { AlgorithmReplayWorld } from "@/arena/algorithmReplayWorlds";

export interface AlgorithmReplayState {
  observedNaiveFailure: boolean;
  canonicalFramesSeen: number[];
  variantFramesSeen: number[];
}

export interface AlgorithmReplayDefense {
  score: number;
  ready: boolean;
  missing: string[];
}

export function createAlgorithmReplayState(): AlgorithmReplayState {
  return { observedNaiveFailure: false, canonicalFramesSeen: [], variantFramesSeen: [] };
}

export function observeNaiveFailure(state: AlgorithmReplayState): AlgorithmReplayState {
  return { ...state, observedNaiveFailure: true };
}

export function recordReplayFrame(state: AlgorithmReplayState, mode: "canonical" | "variant", frameIndex: number, frameCount: number): AlgorithmReplayState {
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= frameCount) return state;
  const key = mode === "canonical" ? "canonicalFramesSeen" : "variantFramesSeen";
  return state[key].includes(frameIndex) ? state : { ...state, [key]: [...state[key], frameIndex] };
}

export function replayIsComplete(world: AlgorithmReplayWorld, state: AlgorithmReplayState): boolean {
  return state.observedNaiveFailure
    && state.canonicalFramesSeen.length === world.canonical.frames.length
    && state.variantFramesSeen.length === world.variant.frames.length;
}

export function assessAlgorithmReplayDefense(world: AlgorithmReplayWorld, answer: string): AlgorithmReplayDefense {
  const text = answer.toLowerCase();
  const conceptHits = world.defenseSignals.filter((signal) => text.includes(signal)).length;
  const checks = [
    { label: "the invariant", hit: conceptHits >= 2 || text.includes("invariant") },
    { label: "a complexity consequence", hit: /o\(|linear|quadratic|log|space|time|complexity/.test(text) },
    { label: "an edge case from the replay", hit: /zero|duplicate|tie|nested|ancestor|reuse|unreachable|edge case|variant/.test(text) },
    { label: "the transfer change", hit: /change|new constraint|instead|would add|would replace|stream|limited|modulo|duplicate/.test(text) },
  ];
  const hits = checks.filter((check) => check.hit).length;
  const score = Math.min(100, hits * 20 + Math.min(20, Math.floor(answer.trim().length / 18)));
  return { score, ready: answer.trim().length >= 120 && hits >= 3 && score >= 80, missing: checks.filter((check) => !check.hit).map((check) => check.label) };
}
