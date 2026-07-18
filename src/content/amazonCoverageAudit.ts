import { getCodingCombatMission, getCodingCombatMissionRoute } from "@/arena/codingCombatMissions";
import {
  AMAZON_SDE1_QUESTIONS,
  getAmazonCombatMissionId,
  type AmazonPrepQuestion,
  type AmazonPrepTrack,
} from "./amazonSde1Prep";

export type AmazonCoverageLevel = "machine-verified" | "guided-only" | "uncovered";

export interface AmazonCoverageEntry {
  questionId: string;
  title: string;
  track: AmazonPrepTrack;
  level: AmazonCoverageLevel;
  route?: string;
  practiceLabel: string;
  reason: string;
}

export interface AmazonTrackCoverageSummary {
  total: number;
  machineVerified: number;
  guidedOnly: number;
  uncovered: number;
}

export interface AmazonCoverageSummary {
  dsa: AmazonTrackCoverageSummary;
  lld: AmazonTrackCoverageSummary;
}

/**
 * Product coverage, not learner confidence. A question is machine-verified
 * only when the exact prompt has executable tests and a saved completion
 * signal. Lessons and drills remain useful, but are reported as guided-only
 * because reading or self-review cannot prove interview readiness.
 */
export const AMAZON_MUST_DO_COVERAGE: AmazonCoverageEntry[] = AMAZON_SDE1_QUESTIONS
  .filter((question) => question.tier === "must")
  .map(auditQuestion);

export const AMAZON_MUST_DO_COVERAGE_SUMMARY = summarizeAmazonCoverage(AMAZON_MUST_DO_COVERAGE);

export function getAmazonCoverageEntry(questionId: string): AmazonCoverageEntry | undefined {
  return AMAZON_MUST_DO_COVERAGE.find((entry) => entry.questionId === questionId);
}

export function summarizeAmazonCoverage(entries: AmazonCoverageEntry[]): AmazonCoverageSummary {
  return {
    dsa: summarizeTrack(entries, "dsa"),
    lld: summarizeTrack(entries, "lld"),
  };
}

function auditQuestion(question: AmazonPrepQuestion): AmazonCoverageEntry {
  const combatMissionId = getAmazonCombatMissionId(question.id);
  const mission = combatMissionId ? getCodingCombatMission(combatMissionId) : undefined;
  if (question.track === "dsa" && mission) {
    return {
      questionId: question.id,
      title: question.title,
      track: question.track,
      level: "machine-verified",
      route: getCodingCombatMissionRoute(mission.id),
      practiceLabel: mission.worldRoute ? "Code-driven Algorithm World" : "Executable Java mission",
      reason: mission.worldRoute
        ? "Actual Java drives the simulation, hidden JVM incidents, and a free-form defense."
        : "Visible and hidden JVM tests verify the exact problem contract.",
    };
  }
  if (question.id === "lld-parking-lot") {
    return {
      questionId: question.id,
      title: question.title,
      track: question.track,
      level: "machine-verified",
      route: "/arena/lld-world/parking-lot",
      practiceLabel: "Six-incident Parking Lot gauntlet",
      reason: "The exact design is verified by six persistent system incidents, live responsibility mutation, reruns against the complete model, and a rubric-graded free-form defense.",
    };
  }
  if (question.track === "lld") {
    return {
      questionId: question.id,
      title: question.title,
      track: question.track,
      level: "guided-only",
      route: question.href,
      practiceLabel: question.href.startsWith("/drill/") ? "Cold design drill" : "Guided LLD lesson",
      reason: "Internal teaching material exists, but this exact design is not yet verified by a simulation, mutation transfer, and free-form defense.",
    };
  }
  return {
    questionId: question.id,
    title: question.title,
    track: question.track,
    level: "uncovered",
    practiceLabel: "External problem only",
    reason: "The board schedules this must-do, but the product does not yet provide an executable mission for it.",
  };
}

function summarizeTrack(entries: AmazonCoverageEntry[], track: AmazonPrepTrack): AmazonTrackCoverageSummary {
  const selected = entries.filter((entry) => entry.track === track);
  return {
    total: selected.length,
    machineVerified: selected.filter((entry) => entry.level === "machine-verified").length,
    guidedOnly: selected.filter((entry) => entry.level === "guided-only").length,
    uncovered: selected.filter((entry) => entry.level === "uncovered").length,
  };
}
