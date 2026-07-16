import { describe, expect, it } from "vitest";
import { isReviewDue, nextReviewDate, parseAmazonPrepState } from "./useAmazonPrepProgress";

describe("Amazon preparation progress", () => {
  it("recovers safely from missing or malformed storage", () => {
    expect(parseAmazonPrepState(null)).toEqual({ version: 1, records: {} });
    expect(parseAmazonPrepState("not-json")).toEqual({ version: 1, records: {} });
    expect(parseAmazonPrepState(JSON.stringify({ records: [] }))).toEqual({ version: 1, records: {} });
  });

  it("drops invalid records while preserving valid progress", () => {
    const parsed = parseAmazonPrepState(JSON.stringify({
      version: 99,
      records: {
        valid: { status: "ready", practiceCount: 2.8, lastPracticed: "2026-07-15", nextReview: "2026-07-18" },
        badStatus: { status: "mastered", practiceCount: 3 },
        badValue: null,
      },
    }));
    expect(parsed).toEqual({
      version: 1,
      records: { valid: { status: "ready", practiceCount: 2, lastPracticed: "2026-07-15", nextReview: "2026-07-18" } },
    });
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
