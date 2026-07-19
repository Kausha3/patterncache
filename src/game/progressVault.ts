/**
 * Export and import for everything the app persists.
 *
 * Progress lives in localStorage only, so a cleared browser or a new device
 * silently loses weeks of work. The vault snapshots every known store into
 * one versioned JSON document and can restore it later. It deliberately does
 * NOT physically merge the stores: each surface keeps its own key, so an
 * import can never corrupt a store it does not recognize, and old exports
 * keep working as new stores are added (unknown-to-the-export stores are
 * simply left alone on import).
 */

export const VAULT_FORMAT = "patterncache-progress";
export const VAULT_VERSION = 1;

/** Every store the app persists. Add new stores here so exports include them. */
export const KNOWN_STORES: { key: string; label: string }[] = [
  { key: "patterncache.progress.v1", label: "Lesson completions and confidence" },
  { key: "patterncache.course.v1", label: "Daily plan and task history" },
  { key: "patterncache.game.v1", label: "Arena, Coding Combat, XP and streaks" },
  { key: "patterncache.amazon-sde1.v1", label: "Amazon SDE I board records" },
  { key: "patterncache.pattern-genome.v1", label: "System Forge missions" },
  { key: "patterncache.garage.v1", label: "SOLID campaign" },
  { key: "patterncache.exercises.v1", label: "Runnable Java exercises" },
  { key: "patterncache.mock-interviews.v1", label: "Mock interview sessions" },
  { key: "patterncache.hld-worlds.v1", label: "Legacy HLD verification worlds" },
  { key: "patterncache.hld-worlds.v2", label: "HLD traffic labs" },
  { key: "patterncache.algorithm-replays.v1", label: "Algorithm replay worlds" },
  { key: "patterncache.beginner-study.v1", label: "Beginner learning-study sessions" },
  { key: "patterncache.parking-lot-gauntlet.v1", label: "Parking Lot verification world" },
  { key: "patterncache.lld-verification.circular-buffer.v1", label: "Circular Buffer verification world" },
  { key: "patterncache.lld-verification.lru-cache.v1", label: "LRU Cache verification world" },
  { key: "patterncache.lld-verification.amazon-locker.v1", label: "Amazon Locker verification world" },
  { key: "patterncache.lld-verification.vending-machine.v1", label: "Vending Machine verification world" },
  { key: "patterncache.lld-verification.elevator.v1", label: "Elevator verification world" },
];

export interface ProgressExport {
  format: typeof VAULT_FORMAT;
  version: number;
  exportedAt: number;
  stores: Record<string, unknown>;
}

export interface ImportSummary {
  restored: string[];
  /** Stores present in the file but not known to this build (left untouched). */
  skipped: string[];
}

/** Snapshot every known store that currently holds valid JSON. */
export function exportProgress(now: number = Date.now()): ProgressExport {
  const stores: Record<string, unknown> = {};
  for (const store of KNOWN_STORES) {
    try {
      const raw = localStorage.getItem(store.key);
      if (raw === null) continue;
      stores[store.key] = JSON.parse(raw);
    } catch {
      // A corrupt store is not worth failing the whole export over.
    }
  }
  return { format: VAULT_FORMAT, version: VAULT_VERSION, exportedAt: now, stores };
}

/**
 * Parse and validate an export file. Throws with a readable message when the
 * file is not a PatternCache export; never touches localStorage.
 */
export function parseProgressExport(raw: string): ProgressExport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("That file does not look like a PatternCache export.");
  }
  const candidate = parsed as Record<string, unknown>;
  if (candidate.format !== VAULT_FORMAT) {
    throw new Error("That file does not look like a PatternCache export.");
  }
  if (typeof candidate.version !== "number" || candidate.version > VAULT_VERSION) {
    throw new Error("That export came from a newer version of PatternCache. Update this device first.");
  }
  if (!candidate.stores || typeof candidate.stores !== "object" || Array.isArray(candidate.stores)) {
    throw new Error("That export holds no progress data.");
  }
  return {
    format: VAULT_FORMAT,
    version: candidate.version,
    exportedAt: typeof candidate.exportedAt === "number" ? candidate.exportedAt : 0,
    stores: candidate.stores as Record<string, unknown>,
  };
}

/**
 * Restore a parsed export into localStorage. Only known store keys are
 * written; anything else in the file is reported as skipped. Existing
 * values for the known keys are overwritten, which is the point.
 */
export function importProgress(data: ProgressExport): ImportSummary {
  const knownKeys = new Set(KNOWN_STORES.map((store) => store.key));
  const restored: string[] = [];
  const skipped: string[] = [];
  for (const [key, value] of Object.entries(data.stores)) {
    if (!knownKeys.has(key)) {
      skipped.push(key);
      continue;
    }
    localStorage.setItem(key, JSON.stringify(value));
    restored.push(key);
  }
  return { restored, skipped };
}

/** Human summary of what an export file contains, for the confirm step. */
export function describeExport(data: ProgressExport): string[] {
  const byKey = new Map(KNOWN_STORES.map((store) => [store.key, store.label]));
  return Object.keys(data.stores)
    .filter((key) => byKey.has(key))
    .map((key) => byKey.get(key)!);
}
