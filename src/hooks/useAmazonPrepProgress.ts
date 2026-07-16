import { useCallback, useEffect, useMemo, useState } from "react";

export type AmazonPrepStatus = "not-started" | "learning" | "ready";

export interface AmazonPrepRecord {
  status: AmazonPrepStatus;
  practiceCount: number;
  lastPracticed?: string;
  nextReview?: string;
}

interface AmazonPrepState {
  version: 1;
  records: Record<string, AmazonPrepRecord>;
}

const STORAGE_KEY = "patterncache.amazon-sde1.v1";
const REVIEW_INTERVALS = [1, 3, 7] as const;

const EMPTY_STATE: AmazonPrepState = { version: 1, records: {} };

function isStatus(value: unknown): value is AmazonPrepStatus {
  return value === "not-started" || value === "learning" || value === "ready";
}

export function parseAmazonPrepState(raw: string | null): AmazonPrepState {
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<AmazonPrepState>;
    if (!parsed.records || typeof parsed.records !== "object") return EMPTY_STATE;
    const records = Object.fromEntries(
      Object.entries(parsed.records).flatMap(([id, value]) => {
        if (!value || typeof value !== "object") return [];
        const candidate = value as Partial<AmazonPrepRecord>;
        if (!isStatus(candidate.status)) return [];
        const record: AmazonPrepRecord = {
          status: candidate.status,
          practiceCount: Number.isFinite(candidate.practiceCount) && (candidate.practiceCount ?? 0) >= 0
            ? Math.floor(candidate.practiceCount ?? 0)
            : 0,
          ...(typeof candidate.lastPracticed === "string" ? { lastPracticed: candidate.lastPracticed } : {}),
          ...(typeof candidate.nextReview === "string" ? { nextReview: candidate.nextReview } : {}),
        };
        return [[id, record] as const];
      }),
    );
    return { version: 1, records };
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

function practicedRecord(status: AmazonPrepStatus, previous: AmazonPrepRecord | undefined, now: Date): AmazonPrepRecord {
  if (status === "not-started") return { status, practiceCount: 0 };
  const practiceCount = (previous?.practiceCount ?? 0) + 1;
  return {
    status,
    practiceCount,
    lastPracticed: formatDate(now),
    nextReview: nextReviewDate(practiceCount, now),
  };
}

export function useAmazonPrepProgress() {
  const [state, setState] = useState<AmazonPrepState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setStatus = useCallback((questionId: string, status: AmazonPrepStatus) => {
    setState((current) => ({
      ...current,
      records: {
        ...current.records,
        [questionId]: practicedRecord(status, current.records[questionId], new Date()),
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
          [questionId]: practicedRecord(previous.status, previous, new Date()),
        },
      };
    });
  }, []);

  const resetAll = useCallback(() => setState(EMPTY_STATE), []);

  return useMemo(() => ({ records: state.records, setStatus, logReview, resetAll }), [state.records, setStatus, logReview, resetAll]);
}
