import {
  assessLldWorldDefense,
  createLldVerificationState,
  isLldWorldVerified,
  simulateLldIncident,
  type LldVerificationState,
} from "@/arena/lldVerificationEngine";
import {
  LLD_VERIFICATION_WORLDS,
  type LldVerificationWorld,
  type LldVerificationWorldId,
} from "@/arena/lldVerificationWorlds";

export interface LldVerificationRecord {
  bestScore: number;
  attempts: number;
  completedAt: number;
  completions: number;
  incidentsVerified: number;
}

export interface LldVerificationProgress {
  record?: LldVerificationRecord;
  draft?: LldVerificationState;
}

export function lldVerificationStorageKey(worldId: LldVerificationWorldId): string {
  return `patterncache.lld-verification.${worldId}.v1`;
}

export function loadLldVerificationProgress(world: LldVerificationWorld): LldVerificationProgress {
  try {
    const raw = globalThis.localStorage?.getItem(lldVerificationStorageKey(world.id));
    return raw ? sanitizeLldVerificationProgress(world, JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function loadCompletedLldVerificationWorldIds(): Set<LldVerificationWorldId> {
  return new Set(
    LLD_VERIFICATION_WORLDS
      .filter((world) => !!loadLldVerificationProgress(world).record)
      .map((world) => world.id),
  );
}

export function sanitizeLldVerificationProgress(world: LldVerificationWorld, value: unknown): LldVerificationProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const record = sanitizeRecord(world, source.record);
  const draft = sanitizeDraft(world, source.draft);
  return { ...(record ? { record } : {}), ...(draft ? { draft } : {}) };
}

export function saveLldVerificationDraft(world: LldVerificationWorld, state: LldVerificationState): LldVerificationProgress {
  const current = loadLldVerificationProgress(world);
  return persist(world, { ...current, draft: sanitizeDraft(world, state) ?? createLldVerificationState(world) });
}

export function resetLldVerificationDraft(world: LldVerificationWorld): LldVerificationProgress {
  const current = loadLldVerificationProgress(world);
  return persist(world, { ...(current.record ? { record: current.record } : {}) });
}

export function recordLldVerificationCompletion(
  world: LldVerificationWorld,
  state: LldVerificationState,
  defenseAnswer: string,
  now = Date.now(),
): { completed: boolean; progress: LldVerificationProgress } {
  const current = loadLldVerificationProgress(world);
  const defense = assessLldWorldDefense(world, defenseAnswer);
  if (!isLldWorldVerified(world, state) || !defense.ready) return { completed: false, progress: current };
  const previous = current.record;
  const record: LldVerificationRecord = {
    bestScore: Math.max(previous?.bestScore ?? 0, defense.score),
    attempts: (previous?.attempts ?? 0) + Math.max(1, state.runs),
    completedAt: Math.max(0, Math.round(now)),
    completions: (previous?.completions ?? 0) + 1,
    incidentsVerified: world.incidents.length,
  };
  return { completed: true, progress: persist(world, { record }) };
}

function sanitizeRecord(world: LldVerificationWorld, value: unknown): LldVerificationRecord | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const values = [source.bestScore, source.attempts, source.completedAt, source.completions, source.incidentsVerified];
  if (values.some((item) => typeof item !== "number" || !Number.isFinite(item))) return undefined;
  return {
    bestScore: clamp(Math.round(source.bestScore as number), 0, 100),
    attempts: Math.max(1, Math.round(source.attempts as number)),
    completedAt: Math.max(0, Math.round(source.completedAt as number)),
    completions: Math.max(1, Math.round(source.completions as number)),
    incidentsVerified: clamp(Math.round(source.incidentsVerified as number), 0, world.incidents.length),
  };
}

function sanitizeDraft(world: LldVerificationWorld, value: unknown): LldVerificationState | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const defaults = createLldVerificationState(world);
  const nodeIds = new Set(world.nodes.map((node) => node.id));
  const rawPlacements = source.placements && typeof source.placements === "object" && !Array.isArray(source.placements)
    ? source.placements as Record<string, unknown>
    : {};
  const placements = Object.fromEntries(world.artifacts.map((artifact) => {
    const owner = rawPlacements[artifact.id];
    return [artifact.id, typeof owner === "string" && nodeIds.has(owner) ? owner : defaults.placements[artifact.id]];
  }));
  const incidentIds = new Set(world.incidents.map((incident) => incident.id));
  const observed = unique(stringArray(source.observedIncidentIds).filter((id) => incidentIds.has(id)));
  const cleared = unique(stringArray(source.clearedIncidentIds).filter((id) => {
    const incident = world.incidents.find((candidate) => candidate.id === id);
    return !!incident && observed.includes(id) && simulateLldIncident(world, incident, placements).passed;
  }));
  const currentIncidentIndex = typeof source.currentIncidentIndex === "number" && Number.isFinite(source.currentIncidentIndex)
    ? clamp(Math.round(source.currentIncidentIndex), 0, world.incidents.length - 1)
    : 0;
  const runs = typeof source.runs === "number" && Number.isFinite(source.runs)
    ? Math.max(0, Math.round(source.runs))
    : 0;
  return { placements, currentIncidentIndex, observedIncidentIds: observed, clearedIncidentIds: cleared, runs };
}

function persist(world: LldVerificationWorld, progress: LldVerificationProgress): LldVerificationProgress {
  try {
    globalThis.localStorage?.setItem(lldVerificationStorageKey(world.id), JSON.stringify(progress));
  } catch {
    // The world remains playable when persistence is blocked or full.
  }
  return progress;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
