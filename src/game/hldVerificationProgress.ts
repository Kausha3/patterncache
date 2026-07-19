import { createHldVerificationState, type HldVerificationState } from "@/arena/hldVerificationEngine";
import { HLD_VERIFICATION_WORLDS, type HldVerificationWorld } from "@/arena/hldVerificationWorlds";

export const HLD_PROGRESS_KEY = "patterncache.hld-worlds.v2";

export interface HldVerificationRecord {
  worldId: string;
  completedAt: number;
  bestScore: number;
  runs: number;
}

export interface HldVerificationProgress {
  records: Record<string, HldVerificationRecord | undefined>;
  drafts: Record<string, HldVerificationState | undefined>;
}

const EMPTY: HldVerificationProgress = { records: {}, drafts: {} };

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function loadHldVerificationProgress(): HldVerificationProgress {
  try {
    const raw = safeStorage()?.getItem(HLD_PROGRESS_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<HldVerificationProgress>;
    const rawRecords = parsed.records && typeof parsed.records === "object" ? parsed.records : {};
    const rawDrafts = parsed.drafts && typeof parsed.drafts === "object" ? parsed.drafts : {};
    const records: HldVerificationProgress["records"] = {};
    const drafts: HldVerificationProgress["drafts"] = {};
    for (const world of HLD_VERIFICATION_WORLDS) {
      const record = sanitizeRecord(world, rawRecords[world.id]);
      const draft = sanitizeDraft(world, rawDrafts[world.id]);
      if (record) records[world.id] = record;
      if (draft) drafts[world.id] = draft;
    }
    return { records, drafts };
  } catch {
    return EMPTY;
  }
}

function persist(progress: HldVerificationProgress): void {
  try {
    safeStorage()?.setItem(HLD_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Keep the active session usable when storage is unavailable.
  }
}

function sanitizeRecord(world: HldVerificationWorld, value: unknown): HldVerificationRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Partial<HldVerificationRecord>;
  if (record.worldId !== world.id || !Number.isFinite(record.completedAt) || (record.completedAt ?? 0) <= 0) return undefined;
  if (!Number.isFinite(record.bestScore) || !Number.isFinite(record.runs)) return undefined;
  return {
    worldId: world.id,
    completedAt: Math.floor(record.completedAt!),
    bestScore: Math.min(100, Math.max(0, record.bestScore!)),
    runs: Math.max(0, Math.floor(record.runs!)),
  };
}

function sanitizeDraft(world: HldVerificationWorld, value: unknown): HldVerificationState | undefined {
  if (!value || typeof value !== "object") return undefined;
  const draft = value as Partial<HldVerificationState>;
  if (!draft.placements || typeof draft.placements !== "object") return undefined;

  const validZoneIds = new Set(world.zones.map((zone) => zone.id));
  const placements = Object.fromEntries(world.modules.map((module) => {
    const candidate = draft.placements?.[module.id];
    return [module.id, typeof candidate === "string" && validZoneIds.has(candidate) ? candidate : module.startsInZoneId];
  }));
  const validIncidentIds = new Set(world.incidents.map((incident) => incident.id));
  const observedIncidentIds = Array.isArray(draft.observedIncidentIds)
    ? [...new Set(draft.observedIncidentIds.filter((id): id is string => typeof id === "string" && validIncidentIds.has(id)))]
    : [];
  const claimedClears = Array.isArray(draft.clearedIncidentIds) ? new Set(draft.clearedIncidentIds) : new Set<unknown>();
  const clearedIncidentIds = world.incidents
    .filter((incident) => observedIncidentIds.includes(incident.id)
      && claimedClears.has(incident.id)
      && incident.requiredModuleIds.every((moduleId) => {
        const module = world.modules.find((candidate) => candidate.id === moduleId);
        return module && placements[moduleId] === module.expectedZoneId;
      }))
    .map((incident) => incident.id);
  const rawIndex = Number.isInteger(draft.currentIncidentIndex) ? draft.currentIncidentIndex! : 0;
  return {
    currentIncidentIndex: Math.min(world.incidents.length - 1, Math.max(0, rawIndex)),
    placements,
    observedIncidentIds,
    clearedIncidentIds,
    runs: Number.isFinite(draft.runs) ? Math.max(0, Math.floor(draft.runs!)) : 0,
  };
}

export function loadHldWorldProgress(world: HldVerificationWorld): { record?: HldVerificationRecord; draft: HldVerificationState } {
  const progress = loadHldVerificationProgress();
  const candidate = progress.drafts[world.id];
  return { record: progress.records[world.id], draft: candidate ?? createHldVerificationState(world) };
}

export function saveHldWorldDraft(world: HldVerificationWorld, draft: HldVerificationState): void {
  const progress = loadHldVerificationProgress();
  persist({ ...progress, drafts: { ...progress.drafts, [world.id]: draft } });
}

export function recordHldWorldCompletion(world: HldVerificationWorld, draft: HldVerificationState, score: number): HldVerificationRecord {
  const progress = loadHldVerificationProgress();
  const previous = progress.records[world.id];
  const record: HldVerificationRecord = {
    worldId: world.id,
    completedAt: Date.now(),
    bestScore: Math.max(previous?.bestScore ?? 0, Math.min(100, Math.max(0, score))),
    runs: draft.runs,
  };
  persist({ records: { ...progress.records, [world.id]: record }, drafts: { ...progress.drafts, [world.id]: draft } });
  return record;
}

export function resetHldWorldDraft(world: HldVerificationWorld): void {
  const progress = loadHldVerificationProgress();
  const drafts = { ...progress.drafts };
  delete drafts[world.id];
  persist({ ...progress, drafts });
}
