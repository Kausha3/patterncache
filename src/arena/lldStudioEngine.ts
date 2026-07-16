import type {
  LldStudioMission,
  LldStudioMutationOption,
  LldStudioResponsibility,
} from "./lldStudioMissions";

export const LLD_STUDIO_MAX_SCORE = 500;

export type LldStudioAssignments = Record<string, string>;

export interface LldPlacementResult {
  responsibilityId: string;
  selectedOwnerId?: string;
  correctOwnerId: string;
  correct: boolean;
  why: string;
  riskIfMisplaced: string;
}

export interface LldDecisionResult {
  id: string;
  selectedOptionId?: string;
  correct: boolean;
  feedback: string;
  correctLabel: string;
}

export interface LldStudioMetrics {
  cohesion: number;
  couplingControl: number;
  extensibility: number;
}

export interface LldStudioGrade {
  score: number;
  maxScore: number;
  placementPoints: number;
  mutationPoints: number;
  defensePoints: number;
  correctPlacements: number;
  correctMutations: number;
  placementResults: LldPlacementResult[];
  mutationResults: LldDecisionResult[];
  defenseResult: LldDecisionResult;
  metrics: LldStudioMetrics;
}

export function gradeLldStudio({
  mission,
  assignments,
  mutationAnswers,
  defenseAnswer,
}: {
  mission: LldStudioMission;
  assignments: LldStudioAssignments;
  mutationAnswers: Record<string, string>;
  defenseAnswer?: string;
}): LldStudioGrade {
  const placementResults = mission.responsibilities.map((responsibility) => ({
    responsibilityId: responsibility.id,
    selectedOwnerId: assignments[responsibility.id],
    correctOwnerId: responsibility.correctOwnerId,
    correct: assignments[responsibility.id] === responsibility.correctOwnerId,
    why: responsibility.why,
    riskIfMisplaced: responsibility.riskIfMisplaced,
  }));
  const mutationResults = mission.mutations.map((mutation) =>
    gradeDecision(mutation.id, mutation.options, mutationAnswers[mutation.id]),
  );
  const defenseResult = gradeDecision("design-defense", mission.defense.options, defenseAnswer);
  const correctPlacements = placementResults.filter((result) => result.correct).length;
  const correctMutations = mutationResults.filter((result) => result.correct).length;
  const placementPoints = correctPlacements * 50;
  const mutationPoints = correctMutations * 50;
  const defensePoints = defenseResult.correct ? 50 : 0;
  const score = placementPoints + mutationPoints + defensePoints;

  return {
    score,
    maxScore: LLD_STUDIO_MAX_SCORE,
    placementPoints,
    mutationPoints,
    defensePoints,
    correctPlacements,
    correctMutations,
    placementResults,
    mutationResults,
    defenseResult,
    metrics: calculateLldMetrics(mission, assignments, correctPlacements, correctMutations, defenseResult.correct),
  };
}

export function generateJavaSkeleton(
  mission: LldStudioMission,
  assignments: LldStudioAssignments,
): string {
  const validTypeIds = new Set(mission.types.map((type) => type.id));
  const lines = [
    `// ${mission.title}`,
    "// Generated from your responsibility assignments.",
    "// Method bodies are intentionally empty: defend the model before implementation detail.",
    "",
  ];

  for (const type of mission.types) {
    const responsibilities = mission.responsibilities.filter(
      (responsibility) => assignments[responsibility.id] === type.id,
    );
    // Package-private top-level types keep the generated multi-type artifact valid
    // as a single Java file instead of pretending each type lives in its own file.
    lines.push(`${type.kind} ${type.name} {`);
    if (type.kind === "class") {
      for (const field of type.fields) lines.push(`    private ${field};`);
      if (type.fields.length > 0 && responsibilities.length > 0) lines.push("");
      if (responsibilities.length === 0) lines.push("    // No responsibilities assigned.");
      for (const responsibility of responsibilities) {
        lines.push(`    public ${responsibility.signature} {`);
        lines.push(`        throw new UnsupportedOperationException("TODO: ${escapeJavaString(responsibility.label)}");`);
        lines.push("    }");
        lines.push("");
      }
      if (lines[lines.length - 1] === "") lines.pop();
    } else {
      if (responsibilities.length === 0) lines.push("    // No responsibilities assigned.");
      for (const responsibility of responsibilities) lines.push(`    ${responsibility.signature};`);
    }
    lines.push("}", "");
  }

  const unassigned = mission.responsibilities.filter(
    (responsibility) => !validTypeIds.has(assignments[responsibility.id]),
  );
  if (unassigned.length > 0) {
    lines.push("// Unassigned responsibilities:");
    for (const responsibility of unassigned) lines.push(`// - ${safeJavaComment(responsibility.signature)}`);
  }

  return lines.join("\n").trimEnd();
}

export function generateReferenceAssignments(mission: LldStudioMission): LldStudioAssignments {
  return Object.fromEntries(
    mission.responsibilities.map((responsibility) => [responsibility.id, responsibility.correctOwnerId]),
  );
}

export function getLldMetricBand(value: number): { label: string; tone: "critical" | "developing" | "strong" } {
  if (value >= 85) return { label: "Strong boundary", tone: "strong" };
  if (value >= 60) return { label: "Developing", tone: "developing" };
  return { label: "Boundary risk", tone: "critical" };
}

function calculateLldMetrics(
  mission: LldStudioMission,
  assignments: LldStudioAssignments,
  correctPlacements: number,
  correctMutations: number,
  defenseCorrect: boolean,
): LldStudioMetrics {
  const responsibilityCount = Math.max(1, mission.responsibilities.length);
  const cohesion = Math.round((correctPlacements / responsibilityCount) * 100);
  const ownerLoads = mission.types.map((type) =>
    mission.responsibilities.filter((responsibility) => assignments[responsibility.id] === type.id).length,
  );
  const largestOwnerLoad = Math.max(0, ...ownerLoads);
  const concentrationThreshold = Math.ceil(responsibilityCount / 2);
  const concentrationPenalty = Math.max(0, largestOwnerLoad - concentrationThreshold) * 10;
  const incorrectPlacements = responsibilityCount - correctPlacements;
  const couplingControl = clampMetric(100 - incorrectPlacements * 14 - concentrationPenalty);
  const extensibility = Math.round(
    ((correctMutations + (defenseCorrect ? 1 : 0)) / Math.max(1, mission.mutations.length + 1)) * 100,
  );

  return { cohesion, couplingControl, extensibility };
}

function gradeDecision(id: string, options: LldStudioMutationOption[], selectedOptionId?: string): LldDecisionResult {
  const selected = options.find((option) => option.id === selectedOptionId);
  const correct = options.find((option) => option.correct)!;
  return {
    id,
    selectedOptionId,
    correct: selected?.correct === true,
    feedback: selected?.feedback ?? "No decision was selected.",
    correctLabel: correct.label,
  };
}

function clampMetric(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function escapeJavaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ");
}

function safeJavaComment(value: string): string {
  return value.replace(/\*\//g, "* /").replace(/[\r\n]+/g, " ");
}

export function findResponsibility(mission: LldStudioMission, responsibilityId: string): LldStudioResponsibility | undefined {
  return mission.responsibilities.find((responsibility) => responsibility.id === responsibilityId);
}
