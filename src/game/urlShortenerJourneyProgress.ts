import {
  assessTransferExplanation,
  assessUrlShortenerInterview,
  createIndependentUrlGraph,
  evaluateUrlShortenerTransfer,
  getInterviewRemainingSeconds,
  type InterviewAssessment,
} from "@/arena/urlShortenerJourneyEngine";
import type { UrlArchitectState } from "@/arena/urlShortenerArchitectEngine";
import { sanitizeUrlArchitectState } from "@/game/urlShortenerArchitectProgress";

export const URL_SHORTENER_JOURNEY_KEY = "patterncache.url-shortener-journey.v1";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface UrlShortenerTransferRecord {
  completedAt: number;
  runs: number;
}

export interface UrlShortenerInterviewSession {
  startedAt: number;
  durationSeconds: number;
  graph: UrlArchitectState;
  reasoning: string;
}

export interface UrlShortenerInterviewRecord {
  completedAt: number;
  durationSeconds: number;
  elapsedSeconds: number;
  graph: UrlArchitectState;
  reasoning: string;
  assessment: InterviewAssessment;
}

export interface UrlShortenerJourneyProgress {
  experienceCompletedAt?: number;
  transferDraft: UrlArchitectState;
  transferReasoning: string;
  transferRuns: number;
  transferRecord?: UrlShortenerTransferRecord;
  interviewSession?: UrlShortenerInterviewSession;
  /** Most recently completed attempt, shown in the debrief. */
  interviewRecord?: UrlShortenerInterviewRecord;
  /** Highest-scoring attempt, used as durable competency evidence. */
  bestInterviewRecord?: UrlShortenerInterviewRecord;
  reviewDueAt?: number;
}

export function createUrlShortenerJourneyProgress(): UrlShortenerJourneyProgress {
  return {
    transferDraft: createIndependentUrlGraph(),
    transferReasoning: "",
    transferRuns: 0,
  };
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function loadUrlShortenerJourneyProgress(): UrlShortenerJourneyProgress {
  try {
    const raw = safeStorage()?.getItem(URL_SHORTENER_JOURNEY_KEY);
    return raw ? sanitizeUrlShortenerJourneyProgress(JSON.parse(raw)) : createUrlShortenerJourneyProgress();
  } catch {
    return createUrlShortenerJourneyProgress();
  }
}

export function saveUrlShortenerJourneyProgress(progress: UrlShortenerJourneyProgress): void {
  try {
    safeStorage()?.setItem(URL_SHORTENER_JOURNEY_KEY, JSON.stringify(progress));
  } catch {
    // Keep the active journey usable when browser storage is unavailable.
  }
}

export function completeUrlShortenerExperience(progress: UrlShortenerJourneyProgress, now = Date.now()): UrlShortenerJourneyProgress {
  return { ...progress, experienceCompletedAt: progress.experienceCompletedAt ?? now };
}

export function saveUrlShortenerTransferDraft(
  progress: UrlShortenerJourneyProgress,
  graph: UrlArchitectState,
  reasoning: string,
  runs = progress.transferRuns,
): UrlShortenerJourneyProgress {
  const next = { ...progress, transferDraft: graph, transferReasoning: reasoning, transferRuns: Math.max(0, Math.floor(runs)) };
  const stillProven = evaluateUrlShortenerTransfer(graph).passed && assessTransferExplanation(reasoning).ready;
  return stillProven ? next : { ...next, transferRecord: undefined };
}

export function completeUrlShortenerTransfer(
  progress: UrlShortenerJourneyProgress,
  graph: UrlArchitectState,
  reasoning: string,
  runs: number,
  now = Date.now(),
): UrlShortenerJourneyProgress {
  if (!evaluateUrlShortenerTransfer(graph).passed || !assessTransferExplanation(reasoning).ready) return saveUrlShortenerTransferDraft(progress, graph, reasoning, runs);
  return {
    ...progress,
    transferDraft: graph,
    transferReasoning: reasoning,
    transferRuns: Math.max(0, Math.floor(runs)),
    transferRecord: { completedAt: now, runs: Math.max(0, Math.floor(runs)) },
  };
}

export function startUrlShortenerInterview(
  progress: UrlShortenerJourneyProgress,
  durationMinutes: number,
  now = Date.now(),
): UrlShortenerJourneyProgress {
  const durationSeconds = [30, 45, 60].includes(durationMinutes) ? durationMinutes * 60 : 45 * 60;
  return {
    ...progress,
    interviewSession: { startedAt: now, durationSeconds, graph: createIndependentUrlGraph(), reasoning: "" },
  };
}

export function updateUrlShortenerInterview(
  progress: UrlShortenerJourneyProgress,
  graph: UrlArchitectState,
  reasoning: string,
): UrlShortenerJourneyProgress {
  if (!progress.interviewSession) return progress;
  return { ...progress, interviewSession: { ...progress.interviewSession, graph, reasoning } };
}

export function finishUrlShortenerInterview(progress: UrlShortenerJourneyProgress, now = Date.now()): UrlShortenerJourneyProgress {
  const session = progress.interviewSession;
  if (!session) return progress;
  const elapsedSeconds = Math.min(
    session.durationSeconds,
    Math.max(0, session.durationSeconds - getInterviewRemainingSeconds(session.startedAt, session.durationSeconds, now)),
  );
  const assessment = assessUrlShortenerInterview(session.graph, session.reasoning);
  const interviewRecord: UrlShortenerInterviewRecord = {
    completedAt: now,
    durationSeconds: session.durationSeconds,
    elapsedSeconds,
    graph: session.graph,
    reasoning: session.reasoning,
    assessment,
  };
  const previousBest = progress.bestInterviewRecord ?? progress.interviewRecord;
  return {
    ...progress,
    interviewSession: undefined,
    interviewRecord,
    bestInterviewRecord: chooseBestInterviewRecord(previousBest, interviewRecord),
    reviewDueAt: now + ONE_DAY_MS,
  };
}

export function resetUrlShortenerInterview(progress: UrlShortenerJourneyProgress): UrlShortenerJourneyProgress {
  return { ...progress, interviewSession: undefined };
}

export function sanitizeUrlShortenerJourneyProgress(value: unknown): UrlShortenerJourneyProgress {
  const base = createUrlShortenerJourneyProgress();
  if (!value || typeof value !== "object") return base;
  const raw = value as Partial<UrlShortenerJourneyProgress>;
  const transferDraft = sanitizeIndependentGraph(raw.transferDraft);
  const transferReasoning = typeof raw.transferReasoning === "string" ? raw.transferReasoning.slice(0, 10_000) : "";
  const transferRuns = Number.isFinite(raw.transferRuns) ? Math.max(0, Math.floor(raw.transferRuns!)) : 0;
  const experienceCompletedAt = validTimestamp(raw.experienceCompletedAt);
  const claimedTransfer = raw.transferRecord && typeof raw.transferRecord === "object"
    ? validTimestamp(raw.transferRecord.completedAt)
    : undefined;
  const transferRecord = claimedTransfer && evaluateUrlShortenerTransfer(transferDraft).passed && assessTransferExplanation(transferReasoning).ready
    ? { completedAt: claimedTransfer, runs: transferRuns }
    : undefined;
  const interviewSession = sanitizeInterviewSession(raw.interviewSession);
  const interviewRecord = sanitizeInterviewRecord(raw.interviewRecord);
  const claimedBestInterviewRecord = sanitizeInterviewRecord(raw.bestInterviewRecord);
  const bestInterviewRecord = interviewRecord
    ? chooseBestInterviewRecord(claimedBestInterviewRecord, interviewRecord)
    : claimedBestInterviewRecord;
  const reviewDueAt = interviewRecord ? validTimestamp(raw.reviewDueAt) : undefined;
  return {
    experienceCompletedAt,
    transferDraft,
    transferReasoning,
    transferRuns,
    transferRecord,
    interviewSession,
    interviewRecord,
    bestInterviewRecord,
    reviewDueAt,
  };
}

function chooseBestInterviewRecord(
  previous: UrlShortenerInterviewRecord | undefined,
  candidate: UrlShortenerInterviewRecord,
): UrlShortenerInterviewRecord {
  if (!previous) return candidate;
  if (candidate.assessment.score > previous.assessment.score) return candidate;
  if (candidate.assessment.score === previous.assessment.score && candidate.completedAt > previous.completedAt) return candidate;
  return previous;
}

function sanitizeIndependentGraph(value: unknown): UrlArchitectState {
  const graph = sanitizeUrlArchitectState(value);
  return { ...graph, currentIncidentIndex: 3, observedIncidentIds: [], clearedIncidentIds: [] };
}

function sanitizeInterviewSession(value: unknown): UrlShortenerInterviewSession | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Partial<UrlShortenerInterviewSession>;
  const startedAt = validTimestamp(raw.startedAt);
  const durationSeconds = Number.isFinite(raw.durationSeconds) && [1_800, 2_700, 3_600].includes(raw.durationSeconds!) ? raw.durationSeconds! : undefined;
  if (!startedAt || !durationSeconds) return undefined;
  return {
    startedAt,
    durationSeconds,
    graph: sanitizeIndependentGraph(raw.graph),
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning.slice(0, 20_000) : "",
  };
}

function sanitizeInterviewRecord(value: unknown): UrlShortenerInterviewRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Partial<UrlShortenerInterviewRecord>;
  const completedAt = validTimestamp(raw.completedAt);
  const durationSeconds = Number.isFinite(raw.durationSeconds) && [1_800, 2_700, 3_600].includes(raw.durationSeconds!) ? raw.durationSeconds! : undefined;
  if (!completedAt || !durationSeconds) return undefined;
  const graph = sanitizeIndependentGraph(raw.graph);
  const reasoning = typeof raw.reasoning === "string" ? raw.reasoning.slice(0, 20_000) : "";
  const elapsedSeconds = Number.isFinite(raw.elapsedSeconds)
    ? Math.min(durationSeconds, Math.max(0, Math.floor(raw.elapsedSeconds!)))
    : durationSeconds;
  return { completedAt, durationSeconds, elapsedSeconds, graph, reasoning, assessment: assessUrlShortenerInterview(graph, reasoning) };
}

function validTimestamp(value: unknown): number | undefined {
  return Number.isFinite(value) && (value as number) > 0 ? Math.floor(value as number) : undefined;
}
