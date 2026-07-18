import { describe, expect, it } from "vitest";
import { GARAGE_ARTIFACTS, GARAGE_INCIDENTS } from "./garageRefactorEngine";
import {
  advanceGarageIncident,
  createGarageGauntletState,
  installCurrentGarageArtifact,
  isGarageGauntletArchitectureVerified,
  runCurrentGarageIncident,
} from "./garageGauntletEngine";

describe("Parking Lot gauntlet state machine", () => {
  it("does not expose mutation before the learner runs the world", () => {
    const fresh = createGarageGauntletState();
    expect(installCurrentGarageArtifact(fresh, "spots", "level")).toBe(fresh);
    expect(advanceGarageIncident(fresh)).toBe(fresh);
  });

  it("requires a rerun after a physical repair and cannot skip an incident", () => {
    let state = runCurrentGarageIncident(createGarageGauntletState()).state;
    state = installCurrentGarageArtifact(state, "spots", "level");
    state = installCurrentGarageArtifact(state, "find-level", "level");
    expect(advanceGarageIncident(state)).toBe(state);
    const rerun = runCurrentGarageIncident(state);
    expect(rerun.simulation.passed).toBe(true);
    expect(advanceGarageIncident(rerun.state).currentIncidentIndex).toBe(1);
  });

  it("ignores artifacts outside the active incident", () => {
    const observed = runCurrentGarageIncident(createGarageGauntletState()).state;
    expect(installCurrentGarageArtifact(observed, "fee", "pricing")).toBe(observed);
  });

  it("verifies only the complete currently-correct architecture", () => {
    let state = createGarageGauntletState();
    for (let index = 0; index < GARAGE_INCIDENTS.length; index += 1) {
      state = runCurrentGarageIncident(state).state;
      for (const artifactId of GARAGE_INCIDENTS[index].requiredArtifactIds) {
        const artifact = GARAGE_ARTIFACTS.find((candidate) => candidate.id === artifactId)!;
        state = installCurrentGarageArtifact(state, artifact.id, artifact.referenceOwnerId);
      }
      state = runCurrentGarageIncident(state).state;
      if (index < GARAGE_INCIDENTS.length - 1) state = advanceGarageIncident(state);
    }
    expect(state.clearedIncidentIds).toHaveLength(GARAGE_INCIDENTS.length);
    expect(isGarageGauntletArchitectureVerified(state)).toBe(true);

    const regressed = { ...state, placements: { ...state.placements, fee: "lot" as const } };
    expect(isGarageGauntletArchitectureVerified(regressed)).toBe(false);
  });
});
