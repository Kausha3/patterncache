import { describe, expect, it } from "vitest";
import { SYSTEM_FORGE_MISSIONS } from "./systemForgeMissions";
import {
  assessForgeExplanation,
  evaluateForgeDesign,
  getForgeBeginnerComponents,
  getForgeVerdictLabel,
} from "./systemForgeEngine";

describe("System Forge engine", () => {
  const parking = SYSTEM_FORGE_MISSIONS[0];

  it("derives a breached world from overloaded ownership", () => {
    const result = evaluateForgeDesign(parking, "parking-lot");
    expect(result).toMatchObject({ verdict: "breach", goalMet: false, failures: 2, ownerId: "parking-lot" });
  });

  it("accepts more than one valid architecture when each meets the behavior goal", () => {
    const focusedPolicy = evaluateForgeDesign(parking, "charging-policy");
    const sharedPricing = evaluateForgeDesign(parking, "pricing-policy");
    expect(focusedPolicy.goalMet).toBe(true);
    expect(sharedPricing.goalMet).toBe(true);
    expect(focusedPolicy.changeRadius).toBeLessThan(sharedPricing.changeRadius);
  });

  it("fails safely for an owner with no configured behavior model", () => {
    const result = evaluateForgeDesign(parking, "floor");
    expect(result).toMatchObject({ verdict: "breach", goalMet: false, changeRadius: 6, failures: 3 });
  });

  it("labels simulation verdicts without implying one correct diagram", () => {
    expect(getForgeVerdictLabel("stable")).toBe("Stable behavior");
    expect(getForgeVerdictLabel("strained")).toBe("Design strained");
    expect(getForgeVerdictLabel("breach")).toBe("Mutation breached");
  });

  it("coaches a trade-off explanation using the player's own evidence", () => {
    const result = evaluateForgeDesign(parking, "charging-policy");
    const weak = assessForgeExplanation("It is better.", parking, result);
    const strong = assessForgeExplanation(
      "ChargingPolicy owns pricing responsibility so the change radius and coupling stay low; instead of changing ParkingLot, I can test this policy in isolation.",
      parking,
      result,
    );
    expect(weak.level).toBe("starting");
    expect(strong.level).toBe("strong");
    expect(strong.matchedConcepts).toContain("responsibility");
  });

  it("gives every first-time learner a small, meaningful choice set and a plain-language lesson", () => {
    for (const mission of SYSTEM_FORGE_MISSIONS) {
      const beginnerComponents = getForgeBeginnerComponents(mission);
      expect(beginnerComponents.length).toBeGreaterThanOrEqual(3);
      expect(beginnerComponents.length).toBeLessThanOrEqual(4);
      expect(beginnerComponents.some((component) => component.id === mission.responsibility.initialOwnerId)).toBe(true);
      expect(beginnerComponents.some((component) => evaluateForgeDesign(mission, component.id).goalMet)).toBe(true);
      expect(mission.learning.concept.length).toBeGreaterThan(5);
      expect(mission.learning.plainEnglish.length).toBeGreaterThan(40);
      expect(mission.learning.interviewFrame.length).toBeGreaterThan(120);
      expect(mission.learning.interviewFrame).not.toMatch(/_{2,}/);
      expect(mission.learning.interviewFrame).toMatch(/because|while|so /i);
    }
  });
});
