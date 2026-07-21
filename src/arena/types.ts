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
  "merge-intervals",
  "insert-interval",
  "k-closest-points",
  "number-of-islands",
  "rotting-oranges",
  "unique-paths-obstacles",
  "validate-bst",
  "tree-level-order",
  "lowest-common-ancestor",
  "path-sum-tree",
  "distance-k-tree",
  "reorder-list",
  "reverse-linked-list",
  "linked-list-cycle",
  "sliding-window-max",
  "course-schedule-ii",
  "product-except-self",
  "subarray-sum-k",
  "min-stack",
  "top-k-frequent",
  "task-scheduler",
  "lru-cache",
  "generate-parentheses",
  "word-search",
  "house-robber-ii",
  "coin-change",
  "maximum-subarray",
  "blind-budget-window",
  "blind-ring-pairs",
  "blind-cooldown-value",
  "blind-release-order",
  "blind-failure-groups",
  "blind-capacity-split",
] as const;
export type CodingCombatMissionId = (typeof CODING_COMBAT_MISSION_IDS)[number];
export type CodingCombatScores = Partial<Record<CodingCombatMissionId, ArenaScoreRecord>>;

export const LLD_STUDIO_MISSION_IDS = ["parking-model", "coupon-policies", "vending-recovery"] as const;
export type LldStudioMissionId = (typeof LLD_STUDIO_MISSION_IDS)[number];
export type LldStudioScores = Partial<Record<LldStudioMissionId, ArenaScoreRecord>>;
