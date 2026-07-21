/**
 * Persistence for runnable lesson code exercises (real Java compiler + JVM in the
 * browser). A pass here is verified mastery evidence: the learner's own
 * class compiled and survived the exercise's test suite. Attempts are
 * counted for every run so the ledger can distinguish a first-try pass
 * from a fought-for one.
 */

export interface ExerciseRecord {
  /** Human label for the ledger, e.g. "findAvailableSpot(vehicle) · Design a Parking Lot". */
  label: string;
  /** Total runs, passing or not. */
  attempts: number;
  /** Set on the first passing run; later passes refresh it. */
  passedAt?: number;
}

export type ExerciseProgress = Record<string, ExerciseRecord>;

const STORAGE_KEY = "patterncache.exercises.v1";

function sanitizeRecord(candidate: unknown): ExerciseRecord | undefined {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return undefined;
  const record = candidate as Record<string, unknown>;
  if (typeof record.label !== "string" || record.label.length === 0) return undefined;
  const attempts = typeof record.attempts === "number" && Number.isFinite(record.attempts) ? record.attempts : 1;
  const passedAt = typeof record.passedAt === "number" && Number.isFinite(record.passedAt) ? record.passedAt : undefined;
  return {
    label: record.label,
    attempts: Math.max(1, Math.round(attempts)),
    ...(passedAt !== undefined ? { passedAt: Math.max(0, Math.round(passedAt)) } : {}),
  };
}

export function sanitizeExerciseProgress(value: unknown): ExerciseProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const progress: ExerciseProgress = {};
  for (const [id, candidate] of Object.entries(value as Record<string, unknown>)) {
    const record = sanitizeRecord(candidate);
    if (record) progress[id] = record;
  }
  return progress;
}

export function loadExerciseProgress(): ExerciseProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return sanitizeExerciseProgress(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function recordExerciseRun(id: string, label: string, passed: boolean): ExerciseProgress {
  const current = loadExerciseProgress();
  const previous = current[id];
  const next: ExerciseProgress = {
    ...current,
    [id]: {
      label,
      attempts: (previous?.attempts ?? 0) + 1,
      ...(passed ? { passedAt: Date.now() } : previous?.passedAt !== undefined ? { passedAt: previous.passedAt } : {}),
    },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage pressure: the run still completes on screen.
  }
  return next;
}
