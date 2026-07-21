import { beforeEach, describe, expect, it, vi } from "vitest";
import { addUrlArchitectPart, connectUrlArchitectParts, removeUrlArchitectEdge, type UrlArchitectPartId, type UrlArchitectState } from "@/arena/urlShortenerArchitectEngine";
import { createIndependentUrlGraph } from "@/arena/urlShortenerJourneyEngine";
import {
  URL_SHORTENER_JOURNEY_KEY,
  completeUrlShortenerTransfer,
  createUrlShortenerJourneyProgress,
  finishUrlShortenerInterview,
  loadUrlShortenerJourneyProgress,
  resetUrlShortenerInterview,
  saveUrlShortenerJourneyProgress,
  saveUrlShortenerTransferDraft,
  sanitizeUrlShortenerJourneyProgress,
  startUrlShortenerInterview,
  updateUrlShortenerInterview,
} from "./urlShortenerJourneyProgress";

const TRANSFER_EXPLANATION = "The hot cache stays close to the profile reader because celebrity traffic needs low latency, while the permanent database remains the durable source of truth. A view event enters a queue so that ranking analytics can update later without blocking the response. Otherwise the user path would inherit every slow counter update.";

function graph(parts: UrlArchitectPartId[], edges: [UrlArchitectPartId, UrlArchitectPartId][]): UrlArchitectState {
  let state = createIndependentUrlGraph();
  for (const [index, part] of parts.entries()) state = addUrlArchitectPart(state, part, 120 + index * 55, 90 + index * 30);
  for (const [from, to] of edges) state = connectUrlArchitectParts(state, from, to);
  return state;
}

function transferGraph(): UrlArchitectState {
  return graph(["edge", "redirect", "cache", "link-store", "queue", "analytics"], [
    ["browser", "edge"], ["edge", "redirect"], ["redirect", "cache"], ["cache", "link-store"], ["redirect", "queue"], ["queue", "analytics"],
  ]);
}

function interviewGraph(): UrlArchitectState {
  return graph(["edge", "redirect", "cache", "link-store", "creator", "id-allocator", "queue", "analytics", "replicas", "monitor"], [
    ["browser", "edge"], ["edge", "redirect"], ["redirect", "cache"], ["cache", "link-store"],
    ["edge", "creator"], ["creator", "id-allocator"], ["creator", "link-store"],
    ["redirect", "queue"], ["queue", "analytics"], ["cache", "replicas"], ["monitor", "replicas"],
  ]);
}

const INTERVIEW_REASONING = "The system is read-heavy, so the cache protects redirect latency at scale while the primary store remains durable and authoritative. The ID allocator prevents a collision on concurrent writes. I accept replica cost because availability matters during an outage, and I reject synchronous analytics. A timeout should degrade to another healthy replica. This structure keeps throughput high and makes the consistency tradeoff explicit.";

function completeStrongInterview(now = 62_000) {
  let progress = startUrlShortenerInterview(createUrlShortenerJourneyProgress(), 45, 2_000);
  progress = updateUrlShortenerInterview(progress, interviewGraph(), INTERVIEW_REASONING);
  return finishUrlShortenerInterview(progress, now);
}

describe("URL Shortener journey progress", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));

  it("falls back safely when storage is invalid", () => {
    localStorage.setItem(URL_SHORTENER_JOURNEY_KEY, "broken");
    expect(loadUrlShortenerJourneyProgress()).toEqual(createUrlShortenerJourneyProgress());
  });

  it("drops forged transfer proof and recomputes interview evidence from the stored attempt", () => {
    const sanitized = sanitizeUrlShortenerJourneyProgress({
      experienceCompletedAt: 100,
      transferDraft: createIndependentUrlGraph(),
      transferReasoning: "I did it",
      transferRuns: 1,
      transferRecord: { completedAt: 200, runs: 1 },
      interviewRecord: { completedAt: 300, durationSeconds: 2_700, elapsedSeconds: 50, graph: createIndependentUrlGraph(), reasoning: "fake" },
    });
    expect(sanitized.transferRecord).toBeUndefined();
    expect(sanitized.interviewRecord?.assessment.score).toBe(0);
    expect(sanitized.interviewRecord?.assessment.gaps).toHaveLength(10);
  });

  it("persists an active timed session and recomputes the debrief from evidence", () => {
    let progress = completeUrlShortenerTransfer(createUrlShortenerJourneyProgress(), transferGraph(), TRANSFER_EXPLANATION, 2, 1_000);
    progress = startUrlShortenerInterview(progress, 45, 2_000);
    progress = updateUrlShortenerInterview(progress, transferGraph(), "Read-heavy traffic needs low latency, a durable source of truth, an explicit tradeoff, and graceful failure during an outage. ".repeat(4));
    progress = finishUrlShortenerInterview(progress, 62_000);
    expect(progress.interviewSession).toBeUndefined();
    expect(progress.interviewRecord?.elapsedSeconds).toBe(60);
    expect(progress.interviewRecord?.assessment.score).toBeGreaterThan(0);
    expect(progress.bestInterviewRecord).toEqual(progress.interviewRecord);
    expect(progress.reviewDueAt).toBe(62_000 + 86_400_000);
  });

  it("preserves prior evidence and its review schedule when another attempt starts or resets", () => {
    const completed = completeStrongInterview();
    const previousRecord = completed.interviewRecord;
    const previousBest = completed.bestInterviewRecord;
    const previousReview = completed.reviewDueAt;

    const started = startUrlShortenerInterview(completed, 30, 70_000);
    expect(started.interviewRecord).toEqual(previousRecord);
    expect(started.bestInterviewRecord).toEqual(previousBest);
    expect(started.reviewDueAt).toBe(previousReview);

    const reset = resetUrlShortenerInterview(started);
    expect(reset.interviewSession).toBeUndefined();
    expect(reset.interviewRecord).toEqual(previousRecord);
    expect(reset.bestInterviewRecord).toEqual(previousBest);
    expect(reset.reviewDueAt).toBe(previousReview);
  });

  it("shows the latest debrief without letting a weaker retry replace best evidence", () => {
    const completed = completeStrongInterview();
    const previousBest = completed.bestInterviewRecord;
    let retry = startUrlShortenerInterview(completed, 30, 70_000);
    retry = finishUrlShortenerInterview(retry, 71_000);

    expect(retry.interviewRecord?.assessment.score).toBe(0);
    expect(retry.bestInterviewRecord).toEqual(previousBest);
    expect(retry.reviewDueAt).toBe(71_000 + 86_400_000);
  });

  it("migrates an existing latest record into durable best evidence", () => {
    const completed = completeStrongInterview();
    const sanitized = sanitizeUrlShortenerJourneyProgress({
      ...completed,
      bestInterviewRecord: undefined,
    });
    expect(sanitized.bestInterviewRecord).toEqual(sanitized.interviewRecord);
    expect(sanitized.bestInterviewRecord?.assessment.score).toBe(100);
  });

  it("makes finishing idempotent after the active session has been consumed", () => {
    const completed = completeStrongInterview();
    const finishedAgain = finishUrlShortenerInterview(completed, 999_000);
    expect(finishedAgain).toBe(completed);
    expect(finishedAgain.reviewDueAt).toBe(completed.reviewDueAt);
    expect(finishedAgain.interviewRecord).toEqual(completed.interviewRecord);
    expect(finishedAgain.bestInterviewRecord).toEqual(completed.bestInterviewRecord);
  });

  it("revokes broken transfer proof without damaging completed interview evidence", () => {
    let progress = completeUrlShortenerTransfer(createUrlShortenerJourneyProgress(), transferGraph(), TRANSFER_EXPLANATION, 2, 1_000);
    const interview = completeStrongInterview();
    progress = {
      ...progress,
      interviewRecord: interview.interviewRecord,
      bestInterviewRecord: interview.bestInterviewRecord,
      reviewDueAt: interview.reviewDueAt,
    };

    const brokenGraph = removeUrlArchitectEdge(progress.transferDraft, "redirect->cache");
    const regressed = saveUrlShortenerTransferDraft(progress, brokenGraph, TRANSFER_EXPLANATION, 3);
    expect(regressed.transferRecord).toBeUndefined();
    expect(regressed.interviewRecord).toEqual(interview.interviewRecord);
    expect(regressed.bestInterviewRecord).toEqual(interview.bestInterviewRecord);
    expect(regressed.reviewDueAt).toBe(interview.reviewDueAt);
  });

  it("uses the safe default duration and rejects hostile persisted sessions", () => {
    const started = startUrlShortenerInterview(createUrlShortenerJourneyProgress(), 17, 5_000);
    expect(started.interviewSession?.durationSeconds).toBe(2_700);

    const sanitized = sanitizeUrlShortenerJourneyProgress({
      interviewSession: {
        startedAt: Number.POSITIVE_INFINITY,
        durationSeconds: 99_999,
        graph: { nodes: "not-a-graph" },
        reasoning: ["not", "text"],
      },
      transferRuns: Number.NaN,
    });
    expect(sanitized.interviewSession).toBeUndefined();
    expect(sanitized.transferRuns).toBe(0);
  });

  it("keeps the journey usable when browser storage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("storage blocked"); },
      setItem: () => { throw new Error("quota exceeded"); },
    });
    expect(loadUrlShortenerJourneyProgress()).toEqual(createUrlShortenerJourneyProgress());
    expect(() => saveUrlShortenerJourneyProgress(createUrlShortenerJourneyProgress())).not.toThrow();
  });
});

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}
