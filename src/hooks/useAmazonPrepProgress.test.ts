import { describe, expect, it } from "vitest";
import {
  buildProofRecord,
  buildReviewRecord,
  buildStatusRecord,
  isReviewDue,
  nextReviewDate,
  parseAmazonPrepState,
  type AmazonPrepEvidence,
} from "./useAmazonPrepProgress";

const VERIFIED_EVIDENCE: AmazonPrepEvidence = {
  kind: "combat-clear",
  verified: true,
  recordedAt: "2026-07-15T12:00:00.000Z",
  refId: "validate-bst",
  summary: "Passed hidden JVM tests and completed the defense round.",
};

describe("Amazon preparation progress", () => {
  it("recovers safely from missing or malformed storage", () => {
    expect(parseAmazonPrepState(null)).toEqual({ version: 2, records: {} });
    expect(parseAmazonPrepState("not-json")).toEqual({ version: 2, records: {} });
    expect(parseAmazonPrepState(JSON.stringify({ records: [] }))).toEqual({ version: 2, records: {} });
  });

  it("drops invalid records and downgrades legacy click-only readiness", () => {
    const parsed = parseAmazonPrepState(JSON.stringify({
      version: 1,
      records: {
        valid: { status: "ready", practiceCount: 2.8, lastPracticed: "2026-07-15", nextReview: "2026-07-18" },
        proved: { status: "ready", practiceCount: 1, evidence: VERIFIED_EVIDENCE },
        badStatus: { status: "mastered", practiceCount: 3 },
        badValue: null,
      },
    }));
    expect(parsed).toEqual({
      version: 2,
      records: {
        valid: { status: "learning", practiceCount: 2, lastPracticed: "2026-07-15", nextReview: "2026-07-18" },
        proved: { status: "ready", practiceCount: 1, evidence: VERIFIED_EVIDENCE },
      },
    });
  });

  it("does not count clicking Learning as a practice pass", () => {
    expect(buildStatusRecord("learning")).toEqual({ status: "learning", practiceCount: 0 });
    const downgraded = buildStatusRecord("learning", {
      status: "ready",
      practiceCount: 2,
      lastPracticed: "2026-07-15",
      nextReview: "2026-07-18",
      evidence: VERIFIED_EVIDENCE,
    });
    expect(downgraded).toEqual({ status: "learning", practiceCount: 2, lastPracticed: "2026-07-15", nextReview: "2026-07-18" });
  });

  it("creates readiness only from evidence and preserves it through reviews", () => {
    const proofDate = new Date(2026, 6, 15, 12);
    const proved = buildProofRecord(VERIFIED_EVIDENCE, undefined, proofDate);
    expect(proved).toMatchObject({ status: "ready", practiceCount: 1, nextReview: "2026-07-16", evidence: VERIFIED_EVIDENCE });
    const reviewed = buildReviewRecord(proved, new Date(2026, 6, 16, 12));
    expect(reviewed).toMatchObject({ status: "ready", practiceCount: 2, nextReview: "2026-07-19", evidence: VERIFIED_EVIDENCE });
  });

  it("uses the 1, 3, and 7-day review cadence", () => {
    const practicedAt = new Date(2026, 6, 15, 12);
    expect(nextReviewDate(1, practicedAt)).toBe("2026-07-16");
    expect(nextReviewDate(2, practicedAt)).toBe("2026-07-18");
    expect(nextReviewDate(3, practicedAt)).toBe("2026-07-22");
    expect(nextReviewDate(20, practicedAt)).toBe("2026-07-22");
  });

  it("marks reviews due by local calendar date only for started questions", () => {
    const today = new Date(2026, 6, 18, 23, 59);
    expect(isReviewDue({ status: "learning", practiceCount: 2, nextReview: "2026-07-18" }, today)).toBe(true);
    expect(isReviewDue({ status: "ready", practiceCount: 2, nextReview: "2026-07-19" }, today)).toBe(false);
    expect(isReviewDue({ status: "not-started", practiceCount: 0, nextReview: "2026-07-01" }, today)).toBe(false);
  });
});
