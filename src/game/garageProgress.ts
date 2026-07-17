/**
 * Persistence for the SOLID garage game (System Forge's beginner mode, the
 * canonical LLD experience). Completing a shift is real mastery evidence:
 * the learner ran the failing world, repaired it, transferred the fix with
 * hints off, and explained the ownership in interview language against a
 * rubric. Without this record the competency ledger would lose all of it.
 */

export interface GarageShiftRecord {
  /** Best interview-evidence score (0-100, rubric-graded free text). */
  bestScore: number;
  /** Total interview submissions across all runs. */
  attempts: number;
  completedAt: number;
  completions: number;
}

export interface GarageProgress {
  firstShift?: GarageShiftRecord;
}

const STORAGE_KEY = "patterncache.garage.v1";

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function sanitizeGarageProgress(value: unknown): GarageProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const candidate = source.firstShift;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return {};
  const record = candidate as Record<string, unknown>;
  const bestScore = finiteNumber(record.bestScore);
  const attempts = finiteNumber(record.attempts);
  const completedAt = finiteNumber(record.completedAt);
  const completions = finiteNumber(record.completions);
  if (bestScore === undefined || completedAt === undefined) return {};
  return {
    firstShift: {
      bestScore: Math.max(0, Math.min(100, Math.round(bestScore))),
      attempts: Math.max(1, Math.round(attempts ?? 1)),
      completedAt: Math.max(0, Math.round(completedAt)),
      completions: Math.max(1, Math.round(completions ?? 1)),
    },
  };
}

export function loadGarageProgress(): GarageProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return sanitizeGarageProgress(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function recordFirstShiftCompletion(score: number, attempts: number): GarageProgress {
  const current = loadGarageProgress();
  const previous = current.firstShift;
  const next: GarageProgress = {
    firstShift: {
      bestScore: Math.max(previous?.bestScore ?? 0, Math.max(0, Math.min(100, Math.round(score)))),
      attempts: (previous?.attempts ?? 0) + Math.max(1, Math.round(attempts)),
      completedAt: Date.now(),
      completions: (previous?.completions ?? 0) + 1,
    },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage pressure: the run still completes on screen.
  }
  return next;
}
