import { describe, expect, it } from "vitest";
import { addUrlArchitectPart, connectUrlArchitectParts, type UrlArchitectPartId, type UrlArchitectState } from "./urlShortenerArchitectEngine";
import {
  assessTransferExplanation,
  assessUrlShortenerInterview,
  createIndependentUrlGraph,
  evaluateUrlShortenerTransfer,
  formatInterviewClock,
  getInterviewRemainingSeconds,
  recommendedJourneyStage,
} from "./urlShortenerJourneyEngine";

function build(parts: UrlArchitectPartId[], edges: [UrlArchitectPartId, UrlArchitectPartId][]): UrlArchitectState {
  let state = createIndependentUrlGraph();
  for (const [index, part] of parts.entries()) state = addUrlArchitectPart(state, part, 140 + index * 50, 120 + index * 25);
  for (const [from, to] of edges) state = connectUrlArchitectParts(state, from, to);
  return state;
}

describe("URL Shortener golden journey", () => {
  it("orders experience, repair, transfer, interview, and debrief without locking earlier stages", () => {
    expect(recommendedJourneyStage({ experienced: false, repaired: false, transferred: false, interviewed: false })).toBe("experience");
    expect(recommendedJourneyStage({ experienced: true, repaired: false, transferred: false, interviewed: false })).toBe("repair");
    expect(recommendedJourneyStage({ experienced: true, repaired: true, transferred: false, interviewed: false })).toBe("transfer");
    expect(recommendedJourneyStage({ experienced: true, repaired: true, transferred: true, interviewed: false })).toBe("interview");
    expect(recommendedJourneyStage({ experienced: true, repaired: true, transferred: true, interviewed: true })).toBe("debrief");
  });

  it("requires behavior transfer in a new domain instead of matching named boxes", () => {
    const parts: UrlArchitectPartId[] = ["edge", "redirect", "cache", "link-store", "queue", "analytics"];
    let state = build(parts, [["browser", "edge"], ["edge", "redirect"], ["redirect", "cache"], ["cache", "link-store"], ["redirect", "queue"], ["queue", "analytics"]]);
    expect(evaluateUrlShortenerTransfer(state).passed).toBe(true);
    state = connectUrlArchitectParts(state, "redirect", "analytics");
    expect(evaluateUrlShortenerTransfer(state).passed).toBe(false);
    expect(evaluateUrlShortenerTransfer(state).message).toContain("slow analytics");
  });

  it("requires an explanation that connects fast reads, durability, and asynchronous work", () => {
    expect(assessTransferExplanation("Cache is fast.").ready).toBe(false);
    expect(assessTransferExplanation("cache reader database durable source of truth queue event ranking analytics response because ".repeat(4)).ready).toBe(false);
    expect(assessTransferExplanation(
      "The hot profile cache stays beside the reader because celebrity profiles need low latency, while the permanent database remains the durable source of truth. The reader publishes a view event to a queue so that the ranking counter can update later without delaying the response. Otherwise slow analytics would block every viewer.",
    ).ready).toBe(true);
  });

  it("keeps the interview clock deterministic across reloads", () => {
    expect(getInterviewRemainingSeconds(1_000, 2_700, 11_000)).toBe(2_690);
    expect(getInterviewRemainingSeconds(1_000, 5, 7_000)).toBe(0);
    expect(getInterviewRemainingSeconds(20_000, 60, 10_000)).toBe(60);
    expect(getInterviewRemainingSeconds(1_000, -5, 1_000)).toBe(0);
    expect(formatInterviewClock(2_690)).toBe("44:50");
    expect(formatInterviewClock(Number.POSITIVE_INFINITY)).toBe("00:00");
  });

  it("grades the architecture and spoken reasoning only after the interview finishes", () => {
    const parts: UrlArchitectPartId[] = ["edge", "redirect", "cache", "link-store", "creator", "id-allocator", "queue", "analytics", "replicas", "monitor"];
    const state = build(parts, [
      ["browser", "edge"], ["edge", "redirect"], ["redirect", "cache"], ["cache", "link-store"],
      ["edge", "creator"], ["creator", "id-allocator"], ["creator", "link-store"],
      ["redirect", "queue"], ["queue", "analytics"], ["cache", "replicas"], ["monitor", "replicas"],
    ]);
    const assessment = assessUrlShortenerInterview(
      state,
      "The system is read-heavy, so the cache protects redirect latency at scale while the primary store remains durable and authoritative. The ID allocator prevents a collision on concurrent writes. I accept replica cost because availability matters during an outage, and I reject synchronous analytics. A timeout should degrade to another healthy replica. This structure keeps throughput high and makes the consistency tradeoff explicit.",
    );
    expect(assessment.score).toBe(100);
    expect(assessment.gaps).toEqual([]);

    const keywordSoup = assessUrlShortenerInterview(
      state,
      "scale traffic latency throughput durable database source of truth consistency collision unique replica tradeoff reject cost accept because outage failure retry timeout unavailable degrade ".repeat(3),
    );
    expect(keywordSoup.score).toBeLessThan(100);
    expect(keywordSoup.gaps).toContain("Structured interview communication");
  });
});
