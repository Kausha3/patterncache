import type { ForgeComponent, ForgeOutcome, ForgeVerdict, SystemForgeMission } from "./systemForgeMissions";

export interface ForgeRunResult extends ForgeOutcome {
  ownerId: string;
  goalMet: boolean;
}

const DEFAULT_BREACH: ForgeOutcome = {
  verdict: "breach",
  summary: "This component does not have the context required to own the behavior.",
  consequence: "Mutation breached · responsibilities are scattered",
  changeRadius: 6,
  coupling: 3.4,
  cohesion: 48,
  testsPassing: 9,
  testsTotal: 18,
  flowStability: 41,
  failures: 3,
  pressure: [],
  evidence: ["The chosen owner has no related state or policy", "The change crosses multiple unrelated components"],
};

export function evaluateForgeDesign(mission: SystemForgeMission, ownerId: string): ForgeRunResult {
  const configured = mission.outcomes[ownerId] ?? DEFAULT_BREACH;
  return {
    ...configured,
    ownerId,
    goalMet: configured.changeRadius <= mission.goal.maxChangeRadius
      && configured.flowStability >= mission.goal.minFlowStability
      && configured.failures === 0,
  };
}

export function getForgeVerdictLabel(verdict: ForgeVerdict): string {
  if (verdict === "stable") return "Stable behavior";
  if (verdict === "strained") return "Design strained";
  return "Mutation breached";
}

export function getForgeBeginnerComponents(mission: SystemForgeMission): ForgeComponent[] {
  return mission.components.filter((component) => mission.outcomes[component.id] !== undefined);
}

export interface CoachAssessment {
  level: "starting" | "developing" | "strong";
  matchedConcepts: string[];
  feedback: string;
}

export function assessForgeExplanation(
  explanation: string,
  mission: SystemForgeMission,
  result: ForgeRunResult,
): CoachAssessment {
  const normalized = explanation.toLowerCase();
  const matchedConcepts = mission.coachingKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
  const mentionsTradeoff = /trade.?off|alternative|instead|because|so that/.test(normalized);
  const mentionsEvidence = /test|change radius|queue|flow|failure|coupl|cohes/.test(normalized);
  const signalCount = matchedConcepts.length + Number(mentionsTradeoff) + Number(mentionsEvidence);

  if (explanation.trim().length < 25 || signalCount < 2) {
    return {
      level: "starting",
      matchedConcepts,
      feedback: `Name the owner's responsibility, then connect it to one visible consequence such as ${result.consequence.toLowerCase()}.`,
    };
  }

  if (signalCount < 5) {
    return {
      level: "developing",
      matchedConcepts,
      feedback: "Good ownership argument. Add the alternative you rejected and the change or test that becomes easier.",
    };
  }

  return {
    level: "strong",
    matchedConcepts,
    feedback: "Interview-ready: you connected responsibility, observable behavior, and a concrete change trade-off.",
  };
}
