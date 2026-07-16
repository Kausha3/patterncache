import type { GenomeChoice, PatternGenomeMission } from "./patternGenomeMissions";

export type PatternGenomePhase = "signals" | "invariant" | "mutation" | "transfer";

export const PATTERN_GENOME_PHASES: PatternGenomePhase[] = ["signals", "invariant", "mutation", "transfer"];
export const PATTERN_GENOME_PHASE_POINTS: Record<PatternGenomePhase, number> = {
  signals: 250,
  invariant: 250,
  mutation: 300,
  transfer: 200,
};
export const PATTERN_GENOME_MAX_SCORE = Object.values(PATTERN_GENOME_PHASE_POINTS).reduce((total, points) => total + points, 0);

export interface GenomeGrade {
  correct: boolean;
  feedback: string;
  missingIds?: string[];
  extraIds?: string[];
}

export function gradeGenomeSignals(mission: PatternGenomeMission, selectedIds: string[]): GenomeGrade {
  const requiredIds = mission.signals.filter((signal) => signal.required).map((signal) => signal.id);
  const knownIds = new Set(mission.signals.map((signal) => signal.id));
  const uniqueSelected = [...new Set(selectedIds.filter((id) => knownIds.has(id)))];
  const selectedSet = new Set(uniqueSelected);
  const requiredSet = new Set(requiredIds);
  const missingIds = requiredIds.filter((id) => !selectedSet.has(id));
  const extraIds = uniqueSelected.filter((id) => !requiredSet.has(id));
  const correct = missingIds.length === 0 && extraIds.length === 0;

  if (correct) {
    return {
      correct: true,
      feedback: "Signal lock complete. These constraints describe the problem's durable shape without smuggling in a convenient assumption.",
    };
  }

  const pieces: string[] = [];
  if (missingIds.length) pieces.push(`${missingIds.length} durable signal${missingIds.length === 1 ? " is" : "s are"} still missing`);
  if (extraIds.length) pieces.push(`${extraIds.length} assumption${extraIds.length === 1 ? " does" : "s do"} not survive the full problem`);
  return {
    correct: false,
    feedback: `${pieces.join("; ")}. Read the nouns for structure and the verbs for the required operation.`,
    missingIds,
    extraIds,
  };
}

export function gradeGenomeChoice(choices: GenomeChoice[], selectedId?: string): GenomeGrade {
  const selected = choices.find((choice) => choice.id === selectedId);
  if (!selected) return { correct: false, feedback: "Choose one pattern before locking the decision." };
  return { correct: selected.correct, feedback: selected.feedback };
}

export function scoreGenomePhase(phase: PatternGenomePhase, wrongAttempts: number): number {
  const base = PATTERN_GENOME_PHASE_POINTS[phase];
  return Math.max(Math.round(base * 0.5), base - Math.max(0, Math.floor(wrongAttempts)) * 35);
}

export function getGenomeStars(score: number): number {
  const ratio = Math.max(0, Math.min(PATTERN_GENOME_MAX_SCORE, score)) / PATTERN_GENOME_MAX_SCORE;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.72) return 2;
  return score > 0 ? 1 : 0;
}

export function getNextGenomePhase(phase: PatternGenomePhase): PatternGenomePhase | "complete" {
  const index = PATTERN_GENOME_PHASES.indexOf(phase);
  return index === PATTERN_GENOME_PHASES.length - 1 ? "complete" : PATTERN_GENOME_PHASES[index + 1];
}
