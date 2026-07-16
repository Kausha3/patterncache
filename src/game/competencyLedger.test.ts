import { describe, expect, it } from "vitest";
import {
  deriveLedger,
  getLedgerXp,
  summarizeLedger,
  MASTERY_KINDS,
  EVIDENCE_XP,
} from "./competencyLedger";
import type { LedgerInputs } from "./competencyLedger";
import { PATTERN_GENOME_MAX_SCORE } from "@/arena/patternGenomeEngine";
import { PATTERN_GENOME_MISSION_IDS } from "@/arena/patternGenomeMissions";
import { CODING_COMBAT_MISSION_IDS, LLD_STUDIO_MISSION_IDS } from "@/arena/types";

const FORGE_ID = PATTERN_GENOME_MISSION_IDS[0];
const COMBAT_ID = CODING_COMBAT_MISSION_IDS[0];
const STUDIO_ID = LLD_STUDIO_MISSION_IDS[0];

function emptyInputs(): LedgerInputs {
  return {
    patternGenome: {},
    codingCombatScores: {},
    lldStudioScores: {},
    arenaScores: {},
    challengeCheckpoints: {},
  };
}

describe("competency ledger derivation", () => {
  it("returns no evidence for a fresh learner", () => {
    const entries = deriveLedger(emptyInputs());
    expect(entries).toHaveLength(0);
    const summary = summarizeLedger(entries);
    expect(summary.totalMastery).toBe(0);
    expect(summary.demonstratedKinds).toHaveLength(0);
  });

  it("grants observed-failure for any completed System Forge mission", () => {
    const inputs = emptyInputs();
    inputs.patternGenome = {
      [FORGE_ID]: { bestScore: 300, maxScore: PATTERN_GENOME_MAX_SCORE, stars: 1, attempts: 2, completedAt: 1000 },
    };
    const entries = deriveLedger(inputs);
    expect(entries.map((entry) => entry.kind)).toEqual(["observed-failure"]);
    expect(entries[0].verified).toBe(true);
    expect(entries[0].source).toBe("system-forge");
  });

  it("adds repair and transfer evidence as Forge star tiers rise", () => {
    const inputs = emptyInputs();
    inputs.patternGenome = {
      [FORGE_ID]: { bestScore: PATTERN_GENOME_MAX_SCORE, maxScore: PATTERN_GENOME_MAX_SCORE, stars: 3, attempts: 1, completedAt: 1000 },
    };
    const kinds = deriveLedger(inputs).map((entry) => entry.kind).sort();
    expect(kinds).toEqual(["observed-failure", "repaired-design", "transferred"]);
  });

  it("keeps derivation idempotent: same inputs, same ids, no duplicates", () => {
    const inputs = emptyInputs();
    inputs.patternGenome = {
      [FORGE_ID]: { bestScore: PATTERN_GENOME_MAX_SCORE, maxScore: PATTERN_GENOME_MAX_SCORE, stars: 3, attempts: 4, completedAt: 1000 },
    };
    const first = deriveLedger(inputs).map((entry) => entry.id);
    const second = deriveLedger(inputs).map((entry) => entry.id);
    expect(first).toEqual(second);
    expect(new Set(first).size).toBe(first.length);
  });

  it("treats Coding Combat clears as verified coded evidence, perfect runs as explained too", () => {
    const inputs = emptyInputs();
    inputs.codingCombatScores = {
      [COMBAT_ID]: { bestScore: 5, maxScore: 10, attempts: 1, completedAt: 2000 },
    };
    let kinds = deriveLedger(inputs).map((entry) => entry.kind);
    expect(kinds).toEqual(["coded"]);

    inputs.codingCombatScores = {
      [COMBAT_ID]: { bestScore: 10, maxScore: 10, attempts: 2, completedAt: 2000 },
    };
    kinds = deriveLedger(inputs).map((entry) => entry.kind).sort();
    expect(kinds).toEqual(["coded", "explained"]);
  });

  it("treats LLD Studio records as verified repair evidence", () => {
    const inputs = emptyInputs();
    inputs.lldStudioScores = {
      [STUDIO_ID]: { bestScore: 8, maxScore: 10, attempts: 1, completedAt: 3000 },
    };
    const entries = deriveLedger(inputs);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("repaired-design");
    expect(entries[0].verified).toBe(true);
  });

  it("records defend checkpoints as self-attested explanation evidence", () => {
    const inputs = emptyInputs();
    inputs.challengeCheckpoints = { "2026-07-15": ["recall", "defend"] };
    inputs.dailyTargets = { "2026-07-15": "parking-lot" };
    const entries = deriveLedger(inputs);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("explained");
    expect(entries[0].verified).toBe(false);
  });

  it("counts Amazon board questions only when marked ready with real practice", () => {
    const inputs = emptyInputs();
    inputs.amazonPrepRecords = {
      "dsa-two-sum": { status: "ready", practiceCount: 2, lastPracticed: "2026-07-14" },
      "dsa-merge-intervals": { status: "learning", practiceCount: 1 },
      "not-a-real-question": { status: "ready", practiceCount: 3 },
    };
    const entries = deriveLedger(inputs);
    expect(entries).toHaveLength(1);
    expect(entries[0].refId).toBe("dsa-two-sum");
    expect(entries[0].kind).toBe("coded");
    expect(entries[0].verified).toBe(false);
  });
});

describe("competency summary", () => {
  it("separates verified from self-attested evidence and never counts recall as mastery", () => {
    const summary = summarizeLedger([
      { id: "a", kind: "repaired-design", source: "system-forge", refId: "x", label: "", verified: true },
      { id: "b", kind: "explained", source: "daily-challenge", refId: "y", label: "", verified: false },
      { id: "c", kind: "recall", source: "quick-check", refId: "z", label: "", verified: false },
    ]);
    expect(summary.totalMastery).toBe(2);
    expect(summary.totalVerified).toBe(1);
    expect(summary.recallCount).toBe(1);
    expect(summary.demonstratedKinds).toEqual(["repaired-design", "explained"]);
    expect(summary.mastery["repaired-design"]).toEqual({ total: 1, verified: 1 });
    expect(summary.mastery.explained).toEqual({ total: 1, verified: 0 });
  });

  it("keeps the canonical mastery kind order stable", () => {
    expect(MASTERY_KINDS).toEqual([
      "observed-failure",
      "repaired-design",
      "transferred",
      "coded",
      "explained",
    ]);
  });
});

describe("ledger XP decoration", () => {
  it("pays more for verified evidence than self-attested, and least for recall", () => {
    for (const kind of MASTERY_KINDS) {
      expect(EVIDENCE_XP[kind].verified).toBeGreaterThan(EVIDENCE_XP[kind].attested);
      expect(EVIDENCE_XP[kind].attested).toBeGreaterThan(EVIDENCE_XP.recall.verified);
    }
  });

  it("sums entry XP by kind and verification", () => {
    const xp = getLedgerXp([
      { id: "a", kind: "transferred", source: "system-forge", refId: "x", label: "", verified: true },
      { id: "b", kind: "coded", source: "amazon-board", refId: "y", label: "", verified: false },
    ]);
    expect(xp).toBe(EVIDENCE_XP.transferred.verified + EVIDENCE_XP.coded.attested);
  });
});
