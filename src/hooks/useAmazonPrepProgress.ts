import { useCallback, useEffect, useMemo, useState } from "react";

export type AmazonPrepStatus = "not-started" | "learning" | "ready";
export type EditableAmazonPrepStatus = Exclude<AmazonPrepStatus, "ready">;

export type AmazonPrepEvidence =
  | {
      kind: "combat-clear";
      verified: true;
      recordedAt: string;
      refId: string;
      summary: string;
    }
  | {
      kind: "cold-proof";
      verified: false;
      recordedAt: string;
      summary: string;
    };

export interface AmazonPrepRecord {
  status: AmazonPrepStatus;
  practiceCount: number;
  lastPracticed?: string;
  nextReview?: string;
  evidence?: AmazonPrepEvidence;
}

interface AmazonPrepState {
  version: 2;
  records: Record<string, AmazonPrepRecord>;
}

// Keep the original key so version-1 boards migrate in place.
const STORAGE_KEY = "patterncache.amazon-sde1.v1";
const REVIEW_INTERVALS = [1, 3, 7] as const;
const EMPTY_STATE: AmazonPrepState = { version: 2, records: {} };

function isStatus(value: unknown): value is AmazonPrepStatus {
  return value === "not-started" || value === "learning" || value === "ready";
}

function parseEvidence(value: unknown): AmazonPrepEvidence | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<AmazonPrepEvidence>;
  const summary = typeof candidate.summary === "string" ? candidate.summary.trim().slice(0, 1600) : "";
  if (!summary || typeof candidate.recordedAt !== "string") return undefined;
  if (candidate.kind === "combat-clear" && candidate.verified === true && typeof candidate.refId === "string" && candidate.refId.trim()) {
    return {
      kind: "combat-clear",
      verified: true,
      recordedAt: candidate.recordedAt,
      refId: candidate.refId.trim().slice(0, 120),
      summary,
    };
  }
  if (candidate.kind === "cold-proof" && candidate.verified === false) {
    return { kind: "cold-proof", verified: false, recordedAt: candidate.recordedAt, summary };
  }
  return undefined;
}

export function parseAmazonPrepState(raw: string | null): AmazonPrepState {
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as { records?: unknown };
    if (!parsed.records || typeof parsed.records !== "object" || Array.isArray(parsed.records)) return EMPTY_STATE;
    const records = Object.fromEntries(
      Object.entries(parsed.records).flatMap(([id, value]) => {
        if (!value || typeof value !== "object") return [];
        const candidate = value as Partial<AmazonPrepRecord>;
        if (!isStatus(candidate.status)) return [];
        const evidence = parseEvidence(candidate.evidence);
        // Integrity migration: old "ready" clicks had no proof. Keep the
        // learner's history, but move the question back to Learning.
        const status = candidate.status === "ready" && !evidence ? "learning" : candidate.status;
        const practiceCount = Number.isFinite(candidate.practiceCount) && (candidate.practiceCount ?? 0) >= 0
          ? Math.floor(candidate.practiceCount ?? 0)
          : 0;
        const record: AmazonPrepRecord = {
          status,
          practiceCount: status === "ready" ? Math.max(1, practiceCount) : practiceCount,
          ...(typeof candidate.lastPracticed === "string" ? { lastPracticed: candidate.lastPracticed } : {}),
          ...(typeof candidate.nextReview === "string" ? { nextReview: candidate.nextReview } : {}),
          ...(status === "ready" && evidence ? { evidence } : {}),
        };
        return [[id, record] as const];
      }),
    );
    return { version: 2, records };
  } catch {
    return EMPTY_STATE;
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nextReviewDate(practiceCount: number, practicedAt: Date): string {
  const intervalIndex = Math.min(Math.max(practiceCount - 1, 0), REVIEW_INTERVALS.length - 1);
  const next = new Date(practicedAt);
  next.setDate(next.getDate() + REVIEW_INTERVALS[intervalIndex]);
  return formatDate(next);
}

export function isReviewDue(record: AmazonPrepRecord | undefined, today = new Date()): boolean {
  if (!record?.nextReview || record.status === "not-started") return false;
  return record.nextReview <= formatDate(today);
}

export function buildStatusRecord(
  status: EditableAmazonPrepStatus,
  previous?: AmazonPrepRecord,
): AmazonPrepRecord {
  if (status === "not-started") return { status, practiceCount: 0 };
  return {
    status: "learning",
    practiceCount: previous?.practiceCount ?? 0,
    ...(previous?.lastPracticed ? { lastPracticed: previous.lastPracticed } : {}),
    ...(previous?.nextReview ? { nextReview: previous.nextReview } : {}),
  };
}

export function buildProofRecord(
  evidence: AmazonPrepEvidence,
  previous: AmazonPrepRecord | undefined,
  now: Date,
): AmazonPrepRecord {
  const practiceCount = (previous?.practiceCount ?? 0) + 1;
  return {
    status: "ready",
    practiceCount,
    lastPracticed: formatDate(now),
    nextReview: nextReviewDate(practiceCount, now),
    evidence,
  };
}

export function buildReviewRecord(previous: AmazonPrepRecord, now: Date): AmazonPrepRecord {
  const practiceCount = previous.practiceCount + 1;
  return {
    ...previous,
    practiceCount,
    lastPracticed: formatDate(now),
    nextReview: nextReviewDate(practiceCount, now),
  };
}

function loadState(): AmazonPrepState {
  try {
    return parseAmazonPrepState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_STATE;
  }
}

function saveState(state: AmazonPrepState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep the session usable when storage is unavailable or full.
  }
}

export function useAmazonPrepProgress() {
  const [state, setState] = useState<AmazonPrepState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setStatus = useCallback((questionId: string, status: EditableAmazonPrepStatus) => {
    setState((current) => ({
      ...current,
      records: {
        ...current.records,
        [questionId]: buildStatusRecord(status, current.records[questionId]),
      },
    }));
  }, []);

  const recordProof = useCallback((questionId: string, evidence: AmazonPrepEvidence) => {
    setState((current) => ({
      ...current,
      records: {
        ...current.records,
        [questionId]: buildProofRecord(evidence, current.records[questionId], new Date()),
      },
    }));
  }, []);

  const logReview = useCallback((questionId: string) => {
    setState((current) => {
      const previous = current.records[questionId];
      if (!previous || previous.status === "not-started") return current;
      return {
        ...current,
        records: {
          ...current.records,
          [questionId]: buildReviewRecord(previous, new Date()),
        },
      };
    });
  }, []);

  const resetAll = useCallback(() => setState(EMPTY_STATE), []);

  return useMemo(
    () => ({ records: state.records, setStatus, recordProof, logReview, resetAll }),
    [state.records, setStatus, recordProof, logReview, resetAll],
  );
}
