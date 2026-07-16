import { describe, expect, it } from "vitest";
import { PATTERN_GENOME_MISSION_IDS, PATTERN_GENOME_MISSIONS } from "./patternGenomeMissions";

describe("Pattern Genome mission content", () => {
  it("ships a complete, uniquely identified mutation curriculum", () => {
    expect(PATTERN_GENOME_MISSIONS).toHaveLength(PATTERN_GENOME_MISSION_IDS.length);
    expect(new Set(PATTERN_GENOME_MISSIONS.map((mission) => mission.id)).size).toBe(PATTERN_GENOME_MISSIONS.length);
    expect(PATTERN_GENOME_MISSIONS.map((mission) => mission.order)).toEqual([1, 2, 3, 4]);
  });

  it.each(PATTERN_GENOME_MISSIONS)("keeps $id mechanically gradeable and teachable", (mission) => {
    expect(mission.signals.filter((signal) => signal.required).length).toBeGreaterThanOrEqual(3);
    expect(mission.signals.filter((signal) => !signal.required).length).toBeGreaterThanOrEqual(2);
    expect(mission.invariantChoices.filter((choice) => choice.correct)).toHaveLength(1);
    expect(mission.mutation.choices.filter((choice) => choice.correct)).toHaveLength(1);
    expect(mission.transfer.choices.filter((choice) => choice.correct)).toHaveLength(1);
    expect(mission.mutation.choices.every((choice) => choice.feedback.length >= 30)).toBe(true);
    expect(mission.transfer.signals.length).toBeGreaterThanOrEqual(4);
    expect(mission.recallCue.length).toBeGreaterThan(25);
  });

  it("uses the same pattern answer across mutation and transfer without copying the story", () => {
    for (const mission of PATTERN_GENOME_MISSIONS) {
      const mutationAnswer = mission.mutation.choices.find((choice) => choice.correct)!;
      const transferAnswer = mission.transfer.choices.find((choice) => choice.correct)!;
      expect(mutationAnswer.label.toLowerCase()).toContain(mission.survivingPattern.split(" ")[0].toLowerCase());
      expect(transferAnswer.label.toLowerCase()).toContain(mission.survivingPattern.split(" ")[0].toLowerCase());
      expect(mission.problem).not.toBe(mission.transfer.prompt);
    }
  });
});
