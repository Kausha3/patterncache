import { describe, expect, it } from "vitest";
import {
  PATTERN_GENOME_MAX_SCORE,
  getGenomeStars,
  getNextGenomePhase,
  gradeGenomeChoice,
  gradeGenomeSignals,
  scoreGenomePhase,
} from "./patternGenomeEngine";
import { PATTERN_GENOME_MISSIONS } from "./patternGenomeMissions";

const mission = PATTERN_GENOME_MISSIONS[0];

describe("Pattern Genome engine", () => {
  it("accepts the durable signal set regardless of click order or duplicates", () => {
    const required = mission.signals.filter((signal) => signal.required).map((signal) => signal.id);
    expect(gradeGenomeSignals(mission, [...required].reverse()).correct).toBe(true);
    expect(gradeGenomeSignals(mission, [...required, required[0]]).correct).toBe(true);
  });

  it("rejects missing durable signals and convenient assumptions", () => {
    const required = mission.signals.filter((signal) => signal.required).map((signal) => signal.id);
    const missing = gradeGenomeSignals(mission, required.slice(1));
    const extra = gradeGenomeSignals(mission, [...required, "non-negative"]);
    expect(missing).toMatchObject({ correct: false, missingIds: [required[0]], extraIds: [] });
    expect(extra).toMatchObject({ correct: false, missingIds: [], extraIds: ["non-negative"] });
  });

  it("ignores unknown signal ids instead of letting corrupt UI state affect grading", () => {
    const required = mission.signals.filter((signal) => signal.required).map((signal) => signal.id);
    expect(gradeGenomeSignals(mission, [...required, "not-a-real-signal"]).correct).toBe(true);
  });

  it("grades choices and explains both success and failure", () => {
    const correct = mission.invariantChoices.find((choice) => choice.correct)!;
    const wrong = mission.invariantChoices.find((choice) => !choice.correct)!;
    expect(gradeGenomeChoice(mission.invariantChoices, correct.id)).toEqual({ correct: true, feedback: correct.feedback });
    expect(gradeGenomeChoice(mission.invariantChoices, wrong.id)).toEqual({ correct: false, feedback: wrong.feedback });
    expect(gradeGenomeChoice(mission.invariantChoices, "missing").correct).toBe(false);
  });

  it("penalizes retries without making recovery pointless", () => {
    expect(scoreGenomePhase("mutation", 0)).toBe(300);
    expect(scoreGenomePhase("mutation", 1)).toBe(265);
    expect(scoreGenomePhase("mutation", 100)).toBe(150);
  });

  it("advances through the complete learning loop", () => {
    expect(getNextGenomePhase("signals")).toBe("invariant");
    expect(getNextGenomePhase("invariant")).toBe("mutation");
    expect(getNextGenomePhase("mutation")).toBe("transfer");
    expect(getNextGenomePhase("transfer")).toBe("complete");
  });

  it("maps scores to stable mastery stars", () => {
    expect(PATTERN_GENOME_MAX_SCORE).toBe(1_000);
    expect(getGenomeStars(0)).toBe(0);
    expect(getGenomeStars(600)).toBe(1);
    expect(getGenomeStars(720)).toBe(2);
    expect(getGenomeStars(900)).toBe(3);
    expect(getGenomeStars(99_999)).toBe(3);
  });
});
