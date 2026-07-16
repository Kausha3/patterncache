import { describe, expect, it } from "vitest";
import {
  createLldGameState,
  generateLldGameJava,
  getPhaseReadiness,
  reduceLldGame,
  scoreLldGame,
} from "./lldGameEngine";
import {
  PARKING_LOT_SRP_MISSION,
  SOLID_CAMPAIGN,
  SOLID_PRINCIPLE_IDS,
} from "./lldGameMissions";

const mission = PARKING_LOT_SRP_MISSION;

describe("LLD game architecture", () => {
  it("defines the complete SOLID learning order with a real mechanic and interview cue", () => {
    expect(SOLID_CAMPAIGN.map((chapter) => chapter.id)).toEqual(SOLID_PRINCIPLE_IDS);
    for (const chapter of SOLID_CAMPAIGN) {
      expect(chapter.learnerCan.length).toBeGreaterThan(30);
      expect(chapter.gameMechanic.length).toBeGreaterThan(40);
      expect(chapter.interviewCue.length).toBeGreaterThan(20);
    }
  });

  it("does not let a learner skip required clarification", () => {
    const initial = createLldGameState(mission);
    const blocked = reduceLldGame(mission, initial, { type: "advance" });
    expect(blocked.phase).toBe("briefing");
    expect(blocked.lastFeedback).toContain("Before continuing");
    expect(getPhaseReadiness(mission, blocked).missing.length).toBe(3);
  });

  it("supports the entire evidence-based LLD loop without exposing placeholder answers", () => {
    let state = createLldGameState(mission);

    for (const question of mission.questions.filter((candidate) => candidate.required)) {
      state = reduceLldGame(mission, state, { type: "ask-question", questionId: question.id });
    }
    state = reduceLldGame(mission, state, { type: "advance" });
    expect(state.phase).toBe("domain");

    for (const candidate of mission.domainCandidates) {
      state = reduceLldGame(mission, state, { type: "classify-domain", candidateId: candidate.id, kind: candidate.referenceKind });
      if (candidate.referenceKind === "class") {
        state = reduceLldGame(mission, state, {
          type: "set-class-purpose",
          classId: candidate.id,
          purpose: `This class owns ${candidate.purposeKeywords?.join(", ")}.`,
        });
      }
    }
    state = reduceLldGame(mission, state, { type: "advance" });
    expect(state.phase).toBe("model");

    for (const property of mission.properties) {
      state = reduceLldGame(mission, state, { type: "place-property", propertyId: property.id, ownerId: property.referenceOwnerId });
    }
    for (const method of mission.methods) {
      state = reduceLldGame(mission, state, { type: "place-method", methodId: method.id, ownerId: method.referenceOwnerId });
    }
    state = reduceLldGame(mission, state, { type: "advance" });
    expect(state.phase).toBe("relationships");

    for (const relationship of mission.relationships) {
      state = reduceLldGame(mission, state, { type: "decide-relationship", relationshipId: relationship.id, included: relationship.referenceIncluded });
    }
    state = reduceLldGame(mission, state, { type: "advance" });
    expect(state.phase).toBe("scenarios");

    for (const scenario of mission.scenarios) {
      state = reduceLldGame(mission, state, { type: "run-scenario", scenarioId: scenario.id });
      expect(state.scenarioRuns[scenario.id].passed).toBe(true);
    }
    state = reduceLldGame(mission, state, { type: "advance" });
    expect(state.phase).toBe("change");

    state = reduceLldGame(mission, state, { type: "choose-change", changeId: "ev-pricing", optionId: "pricing-policy" });
    expect(generateLldGameJava(mission, state)).toContain("interface PricingPolicy");
    state = reduceLldGame(mission, state, { type: "advance" });
    expect(state.phase).toBe("patterns");

    state = reduceLldGame(mission, state, { type: "choose-pattern", optionId: "strategy" });
    state = reduceLldGame(mission, state, { type: "advance" });
    expect(state.phase).toBe("interview");

    state = reduceLldGame(mission, state, { type: "submit-defense", answer: mission.interview.referenceAnswer });
    expect(state.phase).toBe("complete");
    expect(scoreLldGame(mission, state).total).toBe(100);
    expect(mission.interview.referenceAnswer).not.toMatch(/_{2,}/);
  });

  it("turns a bad model into visible scenario failure and allows repair without restarting", () => {
    let state = createLldGameState(mission);
    state = {
      ...state,
      phase: "scenarios",
      methodOwners: Object.fromEntries(mission.methods.map((method) => [method.id, "lot"])),
      relationshipDecisions: Object.fromEntries(mission.relationships.map((relationship) => [relationship.id, relationship.referenceIncluded])),
    };

    state = reduceLldGame(mission, state, { type: "run-scenario", scenarioId: "last-spot-race" });
    expect(state.scenarioRuns["last-spot-race"]).toMatchObject({ passed: false, missingMethodIds: ["assign-vehicle"] });

    state = reduceLldGame(mission, state, { type: "place-method", methodId: "assign-vehicle", ownerId: "spot" });
    expect(state.phase).toBe("model");
    expect(state.scenarioRuns).toEqual({});
    expect(state.changeDecisions).toEqual({});
  });

  it("teaches why Singleton and Factory are not automatic answers", () => {
    const singleton = mission.patternChallenge.options.find((option) => option.id === "singleton");
    const factory = mission.patternChallenge.options.find((option) => option.id === "factory");
    expect(singleton?.feedback).toContain("instance count");
    expect(singleton?.feedback).toContain("tests");
    expect(factory?.feedback).toContain("choose");
    expect(factory?.feedback).toContain("interchangeable pricing behavior");
  });

  it("requires a real interview defense instead of accepting a blank or one-line answer", () => {
    const interview = { ...createLldGameState(mission), phase: "interview" as const };
    const blank = reduceLldGame(mission, interview, { type: "submit-defense", answer: "PricingPolicy because it is better." });
    expect(blank.phase).toBe("interview");
    expect(blank.lastFeedback).toContain("complete sentences");
  });
});
