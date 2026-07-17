import type { InterviewPlan } from "./questionGenerator";

/**
 * Persistence for mock interview sessions. Stores the generated plan and
 * the learner's answers so a session can be reviewed later; deliberately
 * does NOT store the raw resume or job description text, only what the
 * learner confirmed on the review step, keeping the stored footprint as
 * small as the feature allows.
 */

export interface MockAnswerRecord {
  questionId: string;
  questionText: string;
  answer: string;
}

export interface MockSessionRecord {
  id: string;
  companyId: string;
  startedAt: number;
  completedAt?: number;
  plan: InterviewPlan;
  answers: MockAnswerRecord[];
  /** Summary strings for the ledger and history list. */
  weakestDimension?: string;
  answeredCount: number;
}

const STORAGE_KEY = "patterncache.mock-interviews.v1";
const MAX_SESSIONS = 10;

export function loadMockSessions(): MockSessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (candidate): candidate is MockSessionRecord =>
        !!candidate &&
        typeof candidate === "object" &&
        typeof (candidate as MockSessionRecord).id === "string" &&
        typeof (candidate as MockSessionRecord).companyId === "string" &&
        Array.isArray((candidate as MockSessionRecord).answers),
    );
  } catch {
    return [];
  }
}

export function saveMockSession(record: MockSessionRecord): MockSessionRecord[] {
  const others = loadMockSessions().filter((session) => session.id !== record.id);
  const next = [record, ...others].slice(0, MAX_SESSIONS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage pressure: the session still works on screen.
  }
  return next;
}
