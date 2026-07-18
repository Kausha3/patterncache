import {
  GARAGE_ARTIFACTS,
  GARAGE_INCIDENTS,
  GARAGE_NODES,
  assessGarageDefense,
  createGaragePlacements,
  simulateGarageIncident,
  type GarageNodeId,
  type GaragePlacements,
} from "@/arena/garageRefactorEngine";
import {
  createGarageGauntletState,
  isGarageGauntletArchitectureVerified,
  type GarageGauntletState,
} from "@/arena/garageGauntletEngine";

export interface ParkingLotGauntletRecord {
  bestScore: number;
  attempts: number;
  completedAt: number;
  completions: number;
  incidentsVerified: number;
}

export interface ParkingLotGauntletProgress {
  record?: ParkingLotGauntletRecord;
  draft?: GarageGauntletState;
}

export const PARKING_LOT_GAUNTLET_STORAGE_KEY = "patterncache.parking-lot-gauntlet.v1";

export function loadParkingLotGauntletProgress(): ParkingLotGauntletProgress {
  try {
    const raw = globalThis.localStorage?.getItem(PARKING_LOT_GAUNTLET_STORAGE_KEY);
    return raw ? sanitizeParkingLotGauntletProgress(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function sanitizeParkingLotGauntletProgress(value: unknown): ParkingLotGauntletProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const record = sanitizeRecord(source.record);
  const draft = sanitizeDraft(source.draft);
  return { ...(record ? { record } : {}), ...(draft ? { draft } : {}) };
}

export function saveParkingLotGauntletDraft(state: GarageGauntletState): ParkingLotGauntletProgress {
  const current = loadParkingLotGauntletProgress();
  return persist({ ...current, draft: sanitizeDraft(state) ?? createGarageGauntletState() });
}

export function resetParkingLotGauntletDraft(): ParkingLotGauntletProgress {
  const current = loadParkingLotGauntletProgress();
  return persist({ ...(current.record ? { record: current.record } : {}) });
}

export function recordParkingLotGauntletCompletion(
  state: GarageGauntletState,
  defenseAnswer: string,
): { completed: boolean; progress: ParkingLotGauntletProgress } {
  const defense = assessGarageDefense(defenseAnswer);
  const current = loadParkingLotGauntletProgress();
  if (!isGarageGauntletArchitectureVerified(state) || !defense.ready) {
    return { completed: false, progress: current };
  }
  const previous = current.record;
  const record: ParkingLotGauntletRecord = {
    bestScore: Math.max(previous?.bestScore ?? 0, defense.score),
    attempts: (previous?.attempts ?? 0) + Math.max(1, state.runs),
    completedAt: Date.now(),
    completions: (previous?.completions ?? 0) + 1,
    incidentsVerified: GARAGE_INCIDENTS.length,
  };
  return { completed: true, progress: persist({ record }) };
}

function sanitizeRecord(value: unknown): ParkingLotGauntletRecord | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const numbers = [source.bestScore, source.attempts, source.completedAt, source.completions, source.incidentsVerified];
  if (numbers.some((item) => typeof item !== "number" || !Number.isFinite(item))) return undefined;
  return {
    bestScore: clamp(Math.round(source.bestScore as number), 0, 100),
    attempts: Math.max(1, Math.round(source.attempts as number)),
    completedAt: Math.max(0, Math.round(source.completedAt as number)),
    completions: Math.max(1, Math.round(source.completions as number)),
    incidentsVerified: clamp(Math.round(source.incidentsVerified as number), 0, GARAGE_INCIDENTS.length),
  };
}

function sanitizeDraft(value: unknown): GarageGauntletState | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const validNodes = new Set(GARAGE_NODES.map((node) => node.id));
  const defaultPlacements = createGaragePlacements();
  const rawPlacements = source.placements && typeof source.placements === "object" && !Array.isArray(source.placements)
    ? source.placements as Record<string, unknown>
    : {};
  const placements = GARAGE_ARTIFACTS.reduce((next, artifact) => {
    const owner = rawPlacements[artifact.id];
    next[artifact.id] = typeof owner === "string" && validNodes.has(owner as GarageNodeId)
      ? owner as GarageNodeId
      : defaultPlacements[artifact.id];
    return next;
  }, {} as GaragePlacements);
  const incidentIds = new Set(GARAGE_INCIDENTS.map((incident) => incident.id));
  const observed = stringArray(source.observedIncidentIds).filter((id) => incidentIds.has(id));
  const cleared = stringArray(source.clearedIncidentIds).filter((id) => {
    const incident = GARAGE_INCIDENTS.find((candidate) => candidate.id === id);
    return !!incident && observed.includes(id) && simulateGarageIncident(incident, placements).passed;
  });
  const index = typeof source.currentIncidentIndex === "number" && Number.isFinite(source.currentIncidentIndex)
    ? clamp(Math.round(source.currentIncidentIndex), 0, GARAGE_INCIDENTS.length - 1)
    : 0;
  const runs = typeof source.runs === "number" && Number.isFinite(source.runs)
    ? Math.max(0, Math.round(source.runs))
    : 0;
  return {
    placements,
    currentIncidentIndex: index,
    observedIncidentIds: [...new Set(observed)],
    clearedIncidentIds: [...new Set(cleared)],
    runs,
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function persist(progress: ParkingLotGauntletProgress): ParkingLotGauntletProgress {
  try {
    globalThis.localStorage?.setItem(PARKING_LOT_GAUNTLET_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // The current run remains usable when storage is blocked or full.
  }
  return progress;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
