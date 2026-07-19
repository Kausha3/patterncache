import { describe, expect, it } from "vitest";
import {
  buildProofRecord,
  buildReviewRecord,
  buildStatusRecord,
  isReviewDue,
  nextReviewDate,
  parseAmazonPrepState,
  syncAmazonPrepProofRecord,
  type AmazonPrepEvidence,
} from "./useAmazonPrepProgress";

const VERIFIED_EVIDENCE: AmazonPrepEvidence = {
  kind: "combat-clear",
  verified: true,
  recordedAt: "2026-07-15T12:00:00.000Z",
  refId: "validate-bst",
  summary: "Passed hidden JVM tests and completed the defense round.",
};

const VERIFIED_LLD_EVIDENCE: AmazonPrepEvidence = {
  kind: "verified-practice",
  verified: true,
  recordedAt: "2026-07-18T12:00:00.000Z",
  refId: "parking-lot-gauntlet",
  summary: "All six incidents and the free-form defense passed.",
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

  it("round-trips generic verified practice without weakening legacy combat evidence", () => {
    const parsed = parseAmazonPrepState(JSON.stringify({
      records: {
        parking: { status: "ready", practiceCount: 1, evidence: VERIFIED_LLD_EVIDENCE },
        forged: { status: "ready", practiceCount: 1, evidence: { ...VERIFIED_LLD_EVIDENCE, verified: false } },
      },
    }));
    expect(parsed.records.parking?.evidence).toEqual(VERIFIED_LLD_EVIDENCE);
    expect(parsed.records.forged).toMatchObject({ status: "learning", practiceCount: 1 });
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

  it("syncs machine proof once and ignores the same or older completion", () => {
    const first = syncAmazonPrepProofRecord(VERIFIED_EVIDENCE, undefined);
    expect(first).toMatchObject({ status: "ready", practiceCount: 1, lastPracticed: "2026-07-15", nextReview: "2026-07-16" });
    expect(syncAmazonPrepProofRecord(VERIFIED_EVIDENCE, first)).toBe(first);
    expect(syncAmazonPrepProofRecord({
      ...VERIFIED_EVIDENCE,
      recordedAt: "2026-07-15T11:00:00.000Z",
    }, first)).toBe(first);
  });

  it("treats a newer machine clear as a real repeated practice", () => {
    const first = syncAmazonPrepProofRecord(VERIFIED_EVIDENCE, undefined);
    const second = syncAmazonPrepProofRecord({
      ...VERIFIED_EVIDENCE,
      recordedAt: "2026-07-16T12:00:00.000Z",
    }, first);
    expect(second).toMatchObject({ status: "ready", practiceCount: 2, lastPracticed: "2026-07-16", nextReview: "2026-07-19" });
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
