import { PATTERN_GENOME_MAX_SCORE } from "@/arena/patternGenomeEngine";
import { PATTERN_GENOME_MISSIONS } from "@/arena/patternGenomeMissions";
import { CODING_COMBAT_MISSIONS } from "@/arena/codingCombatMissions";
import { LLD_STUDIO_MISSIONS } from "@/arena/lldStudioMissions";
import type { PatternGenomeProgress } from "@/hooks/usePatternGenomeProgress";
import type { ArenaScores, CodingCombatScores, LldStudioScores } from "@/arena/types";
import { AMAZON_SDE1_QUESTIONS } from "@/content/amazonSde1Prep";
import type { AmazonPrepRecord } from "@/hooks/useAmazonPrepProgress";

/**
 * The competency ledger: one read-model over everything the learner has
 * actually demonstrated, expressed as evidence, not points.
 *
 * Mastery evidence comes only from doing: observing a failure in a running
 * simulation, repairing the design, transferring the idea to a new prompt,
 * writing code that passes tests, and explaining the design out loud.
 * Quick checks (pick-an-owner, spot-the-pattern, edge-case options) support
 * recall and are recorded, but they can never count as mastery.
 *
 * XP, ranks, and streaks are decoration DERIVED from the same underlying
 * stores this ledger reads. There is no separate progress system.
 */

export type MasteryEvidenceKind =
  | "observed-failure"
  | "repaired-design"
  | "transferred"
  | "coded"
  | "explained";

export type EvidenceKind = MasteryEvidenceKind | "recall";

export type EvidenceSource =
  | "system-forge"
  | "coding-combat"
  | "lld-studio"
  | "arena"
  | "daily-challenge"
  | "amazon-board"
  | "lesson"
  | "quick-check";

export interface EvidenceEntry {
  /** Stable id so re-derivation never duplicates an entry. */
  id: string;
  kind: EvidenceKind;
  source: EvidenceSource;
  /** Mission / lesson / question id the evidence came from. */
  refId: string;
  /** Human-readable line for the ledger, e.g. "Repaired Parking Lot's spot allocation". */
  label: string;
  /** True when a machine graded it (tests ran, simulation reran). False for self-attested work. */
  verified: boolean;
  at?: number;
}

export const MASTERY_KINDS: MasteryEvidenceKind[] = [
  "observed-failure",
  "repaired-design",
  "transferred",
  "coded",
  "explained",
];

export const EVIDENCE_KIND_META: Record<EvidenceKind, { label: string; description: string }> = {
  "observed-failure": {
    label: "Observed the failure",
    description: "Ran a system and watched the exact failure the design decision exists to prevent.",
  },
  "repaired-design": {
    label: "Repaired the design",
    description: "Moved real state and behavior until the same incident passed on a rerun.",
  },
  transferred: {
    label: "Transferred it",
    description: "Applied the idea to a prompt it was never taught on, without hints.",
  },
  coded: {
    label: "Coded it",
    description: "Wrote code and it passed visible and hidden tests, or worked a scheduled problem.",
  },
  explained: {
    label: "Explained it",
    description: "Defended the design out loud in interview language.",
  },
  recall: {
    label: "Quick check",
    description: "Recall support. Useful for memory, never counted as mastery.",
  },
};

// Star thresholds for System Forge missions: 2 stars means the mutation
// (repair) phase scored, 3 stars means the transfer phase scored too.
const FORGE_REPAIR_STARS = 2;
const FORGE_TRANSFER_STARS = 3;

export interface LedgerInputs {
  patternGenome: PatternGenomeProgress;
  codingCombatScores: CodingCombatScores;
  lldStudioScores: LldStudioScores;
  arenaScores: ArenaScores;
  /** Map of ISO date -> completed daily-challenge checkpoint ids. */
  challengeCheckpoints: Record<string, string[]>;
  /** Titles of daily-challenge target lessons keyed by date, for labels. */
  dailyTargets?: Record<string, string>;
  /** Amazon SDE1 board records keyed by question id. */
  amazonPrepRecords?: Record<string, AmazonPrepRecord>;
}

const forgeTitle = (missionId: string): string =>
  PATTERN_GENOME_MISSIONS.find((mission) => mission.id === missionId)?.title ?? missionId;
const combatTitle = (missionId: string): string =>
  CODING_COMBAT_MISSIONS.find((mission) => mission.id === missionId)?.title ?? missionId;
const studioTitle = (missionId: string): string =>
  LLD_STUDIO_MISSIONS.find((mission) => mission.id === missionId)?.title ?? missionId;
const ARENA_MODE_LABELS: Record<string, string> = {
  coding: "Pattern Combat",
  hld: "Incident Command",
  lld: "Model Defense",
};
const arenaTitle = (mode: string): string => ARENA_MODE_LABELS[mode] ?? mode;

/**
 * Derive the full evidence ledger from the persisted stores. Pure and
 * deterministic: same inputs always produce the same entries with the same
 * ids, so re-running derivation never double-counts.
 */
export function deriveLedger(inputs: LedgerInputs): EvidenceEntry[] {
  const entries: EvidenceEntry[] = [];

  // System Forge: the canonical LLD experience. Completing a mission means
  // the learner ran the scenario and saw its failing constraint; higher star
  // tiers mean the repair (mutation) and transfer phases actually scored.
  for (const [missionId, record] of Object.entries(inputs.patternGenome)) {
    if (!record) continue;
    const title = forgeTitle(missionId);
    entries.push({
      id: `forge-${missionId}-observed`,
      kind: "observed-failure",
      source: "system-forge",
      refId: missionId,
      label: `Ran ${title} and worked its failing constraint`,
      verified: true,
      at: record.completedAt,
    });
    if (record.stars >= FORGE_REPAIR_STARS) {
      entries.push({
        id: `forge-${missionId}-repaired`,
        kind: "repaired-design",
        source: "system-forge",
        refId: missionId,
        label: `Repaired the design in ${title}`,
        verified: true,
        at: record.completedAt,
      });
    }
    if (record.stars >= FORGE_TRANSFER_STARS && record.maxScore === PATTERN_GENOME_MAX_SCORE) {
      entries.push({
        id: `forge-${missionId}-transferred`,
        kind: "transferred",
        source: "system-forge",
        refId: missionId,
        label: `Transferred ${title} to its unseen variant`,
        verified: true,
        at: record.completedAt,
      });
    }
  }

  // Coding Combat: hidden tests are machine verification. A clear is coded
  // evidence; a perfect run also demonstrates transfer (the defense round
  // asks for invariant, complexity, and counterexample on top of the tests).
  for (const [missionId, record] of Object.entries(inputs.codingCombatScores)) {
    if (!record) continue;
    const title = combatTitle(missionId);
    entries.push({
      id: `combat-${missionId}-coded`,
      kind: "coded",
      source: "coding-combat",
      refId: missionId,
      label: `Passed visible and hidden tests on ${title}`,
      verified: true,
      at: record.completedAt,
    });
    if (record.maxScore > 0 && record.bestScore >= record.maxScore) {
      entries.push({
        id: `combat-${missionId}-explained`,
        kind: "explained",
        source: "coding-combat",
        refId: missionId,
        label: `Defended invariant, complexity, and counterexample on ${title}`,
        verified: true,
        at: record.completedAt,
      });
    }
  }

  // LLD Studio: responsibility assignment against requirement mutations with
  // deterministic metrics. A recorded clear is repair evidence.
  for (const [missionId, record] of Object.entries(inputs.lldStudioScores)) {
    if (!record) continue;
    const title = studioTitle(missionId);
    entries.push({
      id: `studio-${missionId}-repaired`,
      kind: "repaired-design",
      source: "lld-studio",
      refId: missionId,
      label: `Held ${title} together through requirement mutations`,
      verified: true,
      at: record.completedAt,
    });
  }

  // Arena timed runs: each rejected answer explains the signal, and the run
  // is scored, so a completed run is observed-failure evidence at minimum.
  for (const [mode, record] of Object.entries(inputs.arenaScores)) {
    if (!record) continue;
    entries.push({
      id: `arena-${mode}-observed`,
      kind: "observed-failure",
      source: "arena",
      refId: mode,
      label: `Completed ${arenaTitle(mode)} under the clock`,
      verified: true,
      at: record.completedAt,
    });
  }

  // Daily challenge "defend" checkpoints: explaining the design out loud.
  // Self-attested, and the ledger says so.
  for (const [date, checkpointIds] of Object.entries(inputs.challengeCheckpoints)) {
    if (!checkpointIds.includes("defend")) continue;
    const target = inputs.dailyTargets?.[date];
    entries.push({
      id: `defend-${date}`,
      kind: "explained",
      source: "daily-challenge",
      refId: target ?? date,
      label: target ? `Explained ${target} out loud (${date})` : `Explained the daily target out loud (${date})`,
      verified: false,
      at: Date.parse(date) || undefined,
    });
  }

  // Amazon board: scheduled problems worked outside the app. Real coding
  // practice, self-attested. "ready" means the learner marked the problem
  // solved plus its follow-up variations understood.
  if (inputs.amazonPrepRecords) {
    for (const [questionId, record] of Object.entries(inputs.amazonPrepRecords)) {
      if (record.status !== "ready" || record.practiceCount < 1) continue;
      const question = AMAZON_SDE1_QUESTIONS.find((entry) => entry.id === questionId);
      if (!question) continue;
      entries.push({
        id: `amazon-${questionId}-coded`,
        kind: "coded",
        source: "amazon-board",
        refId: questionId,
        label: `Worked ${question.title} to ready (${question.pattern})`,
        verified: false,
        at: record.lastPracticed ? Date.parse(record.lastPracticed) || undefined : undefined,
      });
    }
  }

  return entries.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}

export interface CompetencySummary {
  /** Counts per evidence kind, mastery kinds only. */
  mastery: Record<MasteryEvidenceKind, { total: number; verified: number }>;
  totalMastery: number;
  totalVerified: number;
  recallCount: number;
  /** Mastery kinds with at least one entry, in canonical order. */
  demonstratedKinds: MasteryEvidenceKind[];
}

export function summarizeLedger(entries: EvidenceEntry[]): CompetencySummary {
  const mastery = Object.fromEntries(
    MASTERY_KINDS.map((kind) => [kind, { total: 0, verified: 0 }]),
  ) as Record<MasteryEvidenceKind, { total: number; verified: number }>;
  let recallCount = 0;

  for (const entry of entries) {
    if (entry.kind === "recall") {
      recallCount += 1;
      continue;
    }
    mastery[entry.kind].total += 1;
    if (entry.verified) mastery[entry.kind].verified += 1;
  }

  const totalMastery = MASTERY_KINDS.reduce((total, kind) => total + mastery[kind].total, 0);
  const totalVerified = MASTERY_KINDS.reduce((total, kind) => total + mastery[kind].verified, 0);

  return {
    mastery,
    totalMastery,
    totalVerified,
    recallCount,
    demonstratedKinds: MASTERY_KINDS.filter((kind) => mastery[kind].total > 0),
  };
}

/**
 * XP decoration derived from the ledger. Verified evidence is worth more
 * than self-attested evidence; recall is worth a token amount. This feeds
 * the existing rank curve; it is not a second progress system.
 */
export const EVIDENCE_XP: Record<EvidenceKind, { verified: number; attested: number }> = {
  "observed-failure": { verified: 60, attested: 25 },
  "repaired-design": { verified: 90, attested: 35 },
  transferred: { verified: 120, attested: 45 },
  coded: { verified: 90, attested: 35 },
  explained: { verified: 70, attested: 30 },
  recall: { verified: 10, attested: 5 },
};

export function getLedgerXp(entries: EvidenceEntry[]): number {
  return entries.reduce((total, entry) => {
    const value = EVIDENCE_XP[entry.kind];
    return total + (entry.verified ? value.verified : value.attested);
  }, 0);
}
