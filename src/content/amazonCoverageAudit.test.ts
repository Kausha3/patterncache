import { describe, expect, it } from "vitest";
import { getCodingCombatMission } from "@/arena/codingCombatMissions";
import { AMAZON_SDE1_QUESTIONS, getAmazonCombatMissionId } from "./amazonSde1Prep";
import { AMAZON_MUST_DO_COVERAGE, AMAZON_MUST_DO_COVERAGE_SUMMARY } from "./amazonCoverageAudit";

describe("Amazon must-do product coverage audit", () => {
  it("classifies every must-do exactly once and never counts a board link as verified practice", () => {
    const mustDoIds = AMAZON_SDE1_QUESTIONS.filter((question) => question.tier === "must").map((question) => question.id).sort();
    const auditedIds = AMAZON_MUST_DO_COVERAGE.map((entry) => entry.questionId).sort();
    expect(auditedIds).toEqual(mustDoIds);
    expect(new Set(auditedIds).size).toBe(auditedIds.length);
    expect(AMAZON_MUST_DO_COVERAGE.every((entry) => entry.reason.length > 40)).toBe(true);
  });

  it("requires every machine-verified DSA entry to resolve to a real executable mission", () => {
    const verified = AMAZON_MUST_DO_COVERAGE.filter((entry) => entry.level === "machine-verified");
    expect(verified).toHaveLength(17);
    for (const entry of verified) {
      const missionId = getAmazonCombatMissionId(entry.questionId);
      expect(missionId, entry.questionId).toBeDefined();
      expect(getCodingCombatMission(missionId!), entry.questionId).toBeDefined();
      expect(entry.route, entry.questionId).toMatch(/^\/arena\//);
    }
  });

  it("reports the current DSA and LLD gaps without rounding them away", () => {
    expect(AMAZON_MUST_DO_COVERAGE_SUMMARY).toEqual({
      dsa: { total: 28, machineVerified: 17, guidedOnly: 0, uncovered: 11 },
      lld: { total: 6, machineVerified: 0, guidedOnly: 6, uncovered: 0 },
    });
  });

  it("does not call option-based or self-reviewed LLD practice machine verified", () => {
    const lld = AMAZON_MUST_DO_COVERAGE.filter((entry) => entry.track === "lld");
    expect(lld.every((entry) => entry.level === "guided-only" && entry.route?.startsWith("/"))).toBe(true);
  });
});
