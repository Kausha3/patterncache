import { describe, expect, it } from "vitest";
import {
  assessFoundationInterview,
  CHANGE_MEMBER,
  createFoundationCampaignState,
  FOUNDATION_CLASSES,
  FOUNDATION_METHODS,
  FOUNDATION_PROPERTIES,
  FOUNDATION_RELATIONSHIPS,
  FOUNDATION_SIMULATION_TRACE,
  foundationCampaignReducer,
  isFoundationPhaseReady,
} from "./lldFoundationCampaign";

describe("lldFoundationCampaign", () => {
  it("turns discovered world objects into the first five classes", () => {
    let state = foundationCampaignReducer(createFoundationCampaignState(), { type: "START" });
    for (const item of FOUNDATION_CLASSES.filter((item) => item.id !== "pricing-policy")) {
      state = foundationCampaignReducer(state, { type: "DISCOVER_CLASS", classId: item.id });
    }
    expect(isFoundationPhaseReady(state)).toBe(true);
    state = foundationCampaignReducer(state, { type: "ADVANCE" });
    expect(state.phase).toBe("properties");
  });

  it("rejects a property owner that does not own the described information", () => {
    let state = readyAt("properties");
    state = foundationCampaignReducer(state, { type: "PICK_MEMBER", memberId: FOUNDATION_PROPERTIES[0].id });
    state = foundationCampaignReducer(state, { type: "PLACE_SELECTED", owner: "vehicle" });
    expect(state.propertyOwners.levels).toBeUndefined();
    expect(state.attempts).toBe(1);
    expect(state.lastFeedback).toContain("whole garage");
  });

  it("places every property and method, then unlocks relationships", () => {
    let state = readyAt("properties");
    for (const member of FOUNDATION_PROPERTIES) {
      state = foundationCampaignReducer(state, { type: "PICK_MEMBER", memberId: member.id });
      state = foundationCampaignReducer(state, { type: "PLACE_SELECTED", owner: member.owner });
    }
    expect(isFoundationPhaseReady(state)).toBe(true);
    state = foundationCampaignReducer(state, { type: "ADVANCE" });
    for (const member of FOUNDATION_METHODS) {
      state = foundationCampaignReducer(state, { type: "PICK_MEMBER", memberId: member.id });
      state = foundationCampaignReducer(state, { type: "PLACE_SELECTED", owner: member.owner });
    }
    state = foundationCampaignReducer(state, { type: "ADVANCE" });
    expect(state.phase).toBe("relationships");
  });

  it("requires relationship cables to start and end on the correct objects", () => {
    let state = readyAt("relationships");
    const relation = FOUNDATION_RELATIONSHIPS[0];
    state = foundationCampaignReducer(state, { type: "SELECT_RELATION_ENDPOINT", classId: "vehicle" });
    expect(state.pendingRelationSource).toBeUndefined();
    state = foundationCampaignReducer(state, { type: "SELECT_RELATION_ENDPOINT", classId: relation.source });
    state = foundationCampaignReducer(state, { type: "SELECT_RELATION_ENDPOINT", classId: relation.target });
    expect(state.relationships).toEqual([relation.id]);
  });

  it("runs the complete object collaboration trace", () => {
    let state = readyAt("simulation");
    state = foundationCampaignReducer(state, { type: "RUN_SIMULATION" });
    for (let index = 0; index < FOUNDATION_SIMULATION_TRACE.length; index += 1) {
      state = foundationCampaignReducer(state, { type: "SIMULATION_TICK" });
    }
    expect(state).toMatchObject({ simulationComplete: true, simulationRunning: false });
    expect(isFoundationPhaseReady(state)).toBe(true);
  });

  it("contains changing fee behavior inside PricingPolicy", () => {
    let state = readyAt("change");
    state = foundationCampaignReducer(state, { type: "PICK_MEMBER", memberId: CHANGE_MEMBER.id });
    state = foundationCampaignReducer(state, { type: "PLACE_SELECTED", owner: "level" });
    expect(state.changeOwner).toBe("parking-lot");
    state = foundationCampaignReducer(state, { type: "PLACE_SELECTED", owner: "pricing-policy" });
    expect(state.changeOwner).toBe("pricing-policy");
    expect(isFoundationPhaseReady(state)).toBe(true);
  });

  it("scores an interview explanation by evidence instead of answer choices", () => {
    const strong = assessFoundationInterview(
      "ParkingLot coordinates levels. Each Level owns a list of ParkingSpot objects and searches them with findSpot. A Level contains many spots. PricingPolicy keeps fee rules separate so pricing can change without changing the coordinator.",
    );
    expect(strong.score).toBe(100);
    expect(strong.missing).toEqual([]);
    expect(assessFoundationInterview("I would create some classes.").score).toBe(0);
  });
});

function readyAt(phase: ReturnType<typeof createFoundationCampaignState>["phase"]) {
  return { ...createFoundationCampaignState(), phase };
}
