import { describe, expect, it } from "vitest";
import { createColdProofEvidence, createCombatEvidence, createVerifiedPracticeEvidence, validateColdProof } from "./readinessProof";

const DSA_PROOF = {
  ownership: "The left pointer only moves past values that cannot improve the current best answer.",
  pressure: "Time is O(n) because each pointer moves once, and space is O(1) because only counters are stored.",
  tradeoff: "For an empty input I return immediately; if the input is unsorted, I must sort first or choose a hash map.",
};

const LLD_PROOF = {
  ownership: "ParkingLot coordinates levels, while each Level owns and searches only its collection of parking spots.",
  pressure: "When spot reservation is added, a reservation policy changes while ticket payment and vehicle identity remain untouched.",
  tradeoff: "I rejected putting every operation on ParkingLot because it is simpler initially but couples unrelated changes together.",
};

describe("Amazon readiness proof", () => {
  it("rejects thin, duplicated, and complexity-free DSA claims", () => {
    expect(validateColdProof("dsa", { ownership: "I know it", pressure: "It is fast enough", tradeoff: "I know it" }).valid).toBe(false);
    const noBigO = validateColdProof("dsa", { ...DSA_PROOF, pressure: "Each pointer moves once and only two counters are stored in memory." });
    expect(noBigO.errors.pressure).toMatch(/Big-O/i);
    const duplicate = validateColdProof("lld", { ...LLD_PROOF, pressure: LLD_PROOF.ownership });
    expect(duplicate.valid).toBe(false);
  });

  it("accepts concrete DSA and LLD defenses without checking against supplied answers", () => {
    expect(validateColdProof("dsa", DSA_PROOF)).toEqual({ valid: true, errors: {} });
    expect(validateColdProof("lld", LLD_PROOF)).toEqual({ valid: true, errors: {} });
  });

  it("records cold proof as self-reviewed and JVM proof as verified", () => {
    const at = new Date("2026-07-18T10:00:00.000Z");
    expect(createColdProofEvidence("dsa", DSA_PROOF, at)).toMatchObject({ kind: "cold-proof", verified: false, recordedAt: at.toISOString() });
    expect(createCombatEvidence("two-sum", "Two Sum", at)).toEqual({
      kind: "combat-clear",
      verified: true,
      recordedAt: at.toISOString(),
      refId: "two-sum",
      summary: "Passed visible and hidden JVM tests for Two Sum, then completed the defense round.",
    });
    expect(createVerifiedPracticeEvidence("parking-lot-gauntlet", "Six incidents and the defense passed.", at)).toEqual({
      kind: "verified-practice",
      verified: true,
      recordedAt: at.toISOString(),
      refId: "parking-lot-gauntlet",
      summary: "Six incidents and the defense passed.",
    });
  });
});
