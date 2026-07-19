import { createAlgorithmReplayState, type AlgorithmReplayState } from "@/arena/algorithmReplayEngine";
import { ALGORITHM_REPLAY_WORLDS, type AlgorithmReplayWorld } from "@/arena/algorithmReplayWorlds";

export const ALGORITHM_REPLAY_PROGRESS_KEY = "patterncache.algorithm-replays.v1";

export interface AlgorithmReplayRecord {
  worldId: string;
  missionId: string;
  completedAt: number;
  bestScore: number;
}

export interface AlgorithmReplayProgress {
  drafts: Record<string, AlgorithmReplayState | undefined>;
  records: Record<string, AlgorithmReplayRecord | undefined>;
}

const EMPTY: AlgorithmReplayProgress = { drafts: {}, records: {} };

export function loadAlgorithmReplayProgress(): AlgorithmReplayProgress {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(ALGORITHM_REPLAY_PROGRESS_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<AlgorithmReplayProgress>;
    const rawDrafts = parsed.drafts && typeof parsed.drafts === "object" ? parsed.drafts : {};
    const rawRecords = parsed.records && typeof parsed.records === "object" ? parsed.records : {};
    const drafts: AlgorithmReplayProgress["drafts"] = {};
    const records: AlgorithmReplayProgress["records"] = {};
    for (const world of ALGORITHM_REPLAY_WORLDS) {
      const draft = sanitizeDraft(world, rawDrafts[world.id]);
      const record = sanitizeRecord(world, rawRecords[world.id]);
      if (draft) drafts[world.id] = draft;
      if (record) records[world.id] = record;
    }
    return { drafts, records };
  } catch {
    return EMPTY;
  }
}

function persist(progress: AlgorithmReplayProgress): void {
  try {
    localStorage.setItem(ALGORITHM_REPLAY_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Keep the active session usable without persistence.
  }
}

function sanitizeIndexes(value: unknown, frameCount: number): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < frameCount))];
}

function sanitizeDraft(world: AlgorithmReplayWorld, value: unknown): AlgorithmReplayState | undefined {
  if (!value || typeof value !== "object") return undefined;
  const draft = value as Partial<AlgorithmReplayState>;
  return {
    observedNaiveFailure: draft.observedNaiveFailure === true,
    canonicalFramesSeen: sanitizeIndexes(draft.canonicalFramesSeen, world.canonical.frames.length),
    variantFramesSeen: sanitizeIndexes(draft.variantFramesSeen, world.variant.frames.length),
  };
}

function sanitizeRecord(world: AlgorithmReplayWorld, value: unknown): AlgorithmReplayRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Partial<AlgorithmReplayRecord>;
  if (record.worldId !== world.id || record.missionId !== world.missionId || !Number.isFinite(record.completedAt) || (record.completedAt ?? 0) <= 0 || !Number.isFinite(record.bestScore)) return undefined;
  return { worldId: world.id, missionId: world.missionId, completedAt: Math.floor(record.completedAt!), bestScore: Math.min(100, Math.max(0, record.bestScore!)) };
}

export function loadAlgorithmReplayState(world: AlgorithmReplayWorld): AlgorithmReplayState {
  return loadAlgorithmReplayProgress().drafts[world.id] ?? createAlgorithmReplayState();
}

export function saveAlgorithmReplayState(worldId: string, state: AlgorithmReplayState): void {
  const progress = loadAlgorithmReplayProgress();
  persist({ ...progress, drafts: { ...progress.drafts, [worldId]: state } });
}

export function recordAlgorithmReplay(worldId: string, missionId: string, score: number): AlgorithmReplayRecord {
  const progress = loadAlgorithmReplayProgress();
  const previous = progress.records[worldId];
  const record = { worldId, missionId, completedAt: Date.now(), bestScore: Math.max(previous?.bestScore ?? 0, Math.min(100, Math.max(0, score))) };
  persist({ ...progress, records: { ...progress.records, [worldId]: record } });
  return record;
}

export function resetAlgorithmReplay(worldId: string): void {
  const progress = loadAlgorithmReplayProgress();
  const drafts = { ...progress.drafts };
  delete drafts[worldId];
  persist({ ...progress, drafts });
}
