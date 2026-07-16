import { describe, expect, it } from "vitest";
import { LLD_STUDIO_MISSIONS } from "./lldStudioMissions";
import {
  LLD_STUDIO_MAX_SCORE,
  generateJavaSkeleton,
  generateReferenceAssignments,
  getLldMetricBand,
  gradeLldStudio,
} from "./lldStudioEngine";

describe("LLD Studio scoring and generation", () => {
  it("awards a clean 500 and perfect metrics to every reference design", () => {
    for (const mission of LLD_STUDIO_MISSIONS) {
      const assignments = generateReferenceAssignments(mission);
      const mutationAnswers = Object.fromEntries(
        mission.mutations.map((mutation) => [mutation.id, mutation.options.find((option) => option.correct)!.id]),
      );
      const defenseAnswer = mission.defense.options.find((option) => option.correct)!.id;
      const grade = gradeLldStudio({ mission, assignments, mutationAnswers, defenseAnswer });

      expect(grade.score, mission.id).toBe(LLD_STUDIO_MAX_SCORE);
      expect(grade.correctPlacements, mission.id).toBe(6);
      expect(grade.correctMutations, mission.id).toBe(3);
      expect(grade.metrics, mission.id).toEqual({ cohesion: 100, couplingControl: 100, extensibility: 100 });
    }
  });

  it("penalizes a god-object design and keeps every metric bounded", () => {
    const mission = LLD_STUDIO_MISSIONS[0];
    const assignments = Object.fromEntries(mission.responsibilities.map((responsibility) => [responsibility.id, "lot"]));
    const grade = gradeLldStudio({ mission, assignments, mutationAnswers: {}, defenseAnswer: undefined });

    expect(grade.correctPlacements).toBe(1);
    expect(grade.score).toBe(50);
    expect(grade.metrics.cohesion).toBe(17);
    expect(grade.metrics.couplingControl).toBeGreaterThanOrEqual(0);
    expect(grade.metrics.couplingControl).toBeLessThan(40);
    expect(grade.metrics.extensibility).toBe(0);
  });

  it("contains missing and unknown assignments instead of treating them as valid owners", () => {
    const mission = LLD_STUDIO_MISSIONS[1];
    const assignments = { [mission.responsibilities[0].id]: "not-a-real-type" };
    const grade = gradeLldStudio({ mission, assignments, mutationAnswers: {}, defenseAnswer: "missing" });
    const skeleton = generateJavaSkeleton(mission, assignments);

    expect(grade.score).toBe(0);
    expect(grade.placementResults.every((result) => !result.correct)).toBe(true);
    expect(grade.defenseResult.feedback).toBe("No decision was selected.");
    expect(skeleton).toContain("// Unassigned responsibilities:");
    expect(skeleton).not.toContain("not-a-real-type");
  });

  it("generates one balanced Java type model with every assigned method exactly once", () => {
    for (const mission of LLD_STUDIO_MISSIONS) {
      const skeleton = generateJavaSkeleton(mission, generateReferenceAssignments(mission));
      expect((skeleton.match(/{/g) ?? []).length, mission.id).toBe((skeleton.match(/}/g) ?? []).length);
      for (const type of mission.types) expect(skeleton).toContain(`${type.kind} ${type.name} {`);
      for (const responsibility of mission.responsibilities) {
        expect(skeleton.split(responsibility.signature).length - 1, `${mission.id}:${responsibility.id}`).toBe(1);
      }
    }
  });

  it("scores a mixed design by category and returns actionable feedback", () => {
    const mission = LLD_STUDIO_MISSIONS[0];
    const assignments = generateReferenceAssignments(mission);
    assignments.assign = "lot";
    const mutationAnswers = {
      "ev-charging": "capability",
      "reservation-expiry": "ticket-null",
      "surge-pricing": "compose-policy",
    };
    const grade = gradeLldStudio({
      mission,
      assignments,
      mutationAnswers,
      defenseAnswer: "coordinate-protect",
    });

    expect(grade.score).toBe(400);
    expect(grade).toMatchObject({
      placementPoints: 250,
      mutationPoints: 100,
      defensePoints: 50,
      correctPlacements: 5,
      correctMutations: 2,
      metrics: { cohesion: 83, couplingControl: 86, extensibility: 75 },
    });
    expect(grade.mutationResults[1]).toMatchObject({
      correct: false,
      correctLabel: "Introduce Reservation with its own status/expiry and make allocation consult active reservations",
    });
  });

  it("labels metric thresholds consistently", () => {
    expect(getLldMetricBand(100)).toEqual({ label: "Strong boundary", tone: "strong" });
    expect(getLldMetricBand(85).tone).toBe("strong");
    expect(getLldMetricBand(60).tone).toBe("developing");
    expect(getLldMetricBand(59).tone).toBe("critical");
  });
});
