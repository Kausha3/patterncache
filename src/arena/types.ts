export type ArenaMode = "coding" | "hld" | "lld";

export type ArenaNodeKind = "input" | "compute" | "cache" | "data" | "async" | "entity" | "rule";

export interface ArenaVisualNode {
  id: string;
  label: string;
  kind: ArenaNodeKind;
  detail: string;
  critical?: boolean;
}

export interface ArenaChoice {
  id: string;
  label: string;
  correct: boolean;
  feedback: string;
}

export interface ArenaChallenge {
  id: string;
  mode: ArenaMode;
  title: string;
  signal: string;
  context: string;
  prompt: string;
  seconds: number;
  takeaway: string;
  visualNodes: ArenaVisualNode[];
  choices: ArenaChoice[];
}

export interface ArenaScoreRecord {
  bestScore: number;
  maxScore: number;
  completedAt: number;
  attempts: number;
}

export type ArenaScores = Partial<Record<ArenaMode, ArenaScoreRecord>>;

export const CODING_COMBAT_MISSION_IDS = [
  "target-pair",
  "unique-window",
  "shortest-hop",
  "pair-sum-map",
  "rotated-search",
  "balanced-brackets",
] as const;
export type CodingCombatMissionId = (typeof CODING_COMBAT_MISSION_IDS)[number];
export type CodingCombatScores = Partial<Record<CodingCombatMissionId, ArenaScoreRecord>>;

export const LLD_STUDIO_MISSION_IDS = ["parking-model", "coupon-policies", "vending-recovery"] as const;
export type LldStudioMissionId = (typeof LLD_STUDIO_MISSION_IDS)[number];
export type LldStudioScores = Partial<Record<LldStudioMissionId, ArenaScoreRecord>>;
