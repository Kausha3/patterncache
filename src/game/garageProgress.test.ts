import { describe, expect, it } from "vitest";
import { isCampaignComplete, sanitizeGarageProgress } from "./garageProgress";
import type { GarageProgress } from "./garageProgress";

const RECORD = { bestScore: 90, attempts: 1, completedAt: 100, completions: 1 };

describe("isCampaignComplete", () => {
  it("is false for a fresh learner and for partial progress", () => {
    expect(isCampaignComplete({})).toBe(false);
    expect(isCampaignComplete({ firstShift: RECORD })).toBe(false);
    expect(
      isCampaignComplete({ firstShift: RECORD, chapters: { ocp: RECORD, lsp: RECORD, isp: RECORD } }),
    ).toBe(false);
  });

  it("is false when the chapters are done but the first shift is not", () => {
    const progress: GarageProgress = { chapters: { ocp: RECORD, lsp: RECORD, isp: RECORD, dip: RECORD } };
    expect(isCampaignComplete(progress)).toBe(false);
  });

  it("is true only when the first shift and all four chapters have records", () => {
    const progress: GarageProgress = {
      firstShift: RECORD,
      chapters: { ocp: RECORD, lsp: RECORD, isp: RECORD, dip: RECORD },
    };
    expect(isCampaignComplete(progress)).toBe(true);
  });

  it("stays consistent with sanitize: junk records do not count as completions", () => {
    const progress = sanitizeGarageProgress({
      firstShift: RECORD,
      chapters: { ocp: RECORD, lsp: RECORD, isp: RECORD, dip: { bestScore: "high" } },
    });
    expect(isCampaignComplete(progress)).toBe(false);
  });
});
