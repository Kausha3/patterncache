import { describe, expect, it } from "vitest";
import {
  advanceLldIncident,
  assessLldWorldDefense,
  createLldVerificationState,
  installLldArtifact,
  isLldWorldVerified,
  referenceLldPlacements,
  runCurrentLldIncident,
  simulateLldIncident,
} from "./lldVerificationEngine";
import { LLD_VERIFICATION_WORLDS } from "./lldVerificationWorlds";

function strongDefense(world: (typeof LLD_VERIFICATION_WORLDS)[number]): string {
  const owners = world.nodes.filter((node) => node.id !== world.initialOwnerId).slice(0, 3).map((node) => node.label).join(", ");
  return `${owners} own and protect their focused responsibilities as one invariant. The ${world.defense.evidenceTerms[0]} incident proved the boundary under failure. A future ${world.defense.changeTerms[0]} policy change stays contained instead of spreading through unrelated classes. I reject the coupled god object alternative because it scatters state changes and costs testability, even though the separated design introduces more collaboration.`;
}

describe("LLD verification world contracts", () => {
  it("keeps every world internally referential and every responsibility exercised", () => {
    expect(LLD_VERIFICATION_WORLDS).toHaveLength(5);
    for (const world of LLD_VERIFICATION_WORLDS) {
      const nodeIds = new Set(world.nodes.map((node) => node.id));
      const artifactIds = new Set(world.artifacts.map((artifact) => artifact.id));
      const incidentIds = new Set(world.incidents.map((incident) => incident.id));
      expect(nodeIds.size).toBe(world.nodes.length);
      expect(artifactIds.size).toBe(world.artifacts.length);
      expect(incidentIds.size).toBe(world.incidents.length);
      expect(nodeIds.has(world.initialOwnerId)).toBe(true);
      expect(world.incidents.length).toBeGreaterThanOrEqual(4);
      for (const artifact of world.artifacts) expect(nodeIds.has(artifact.referenceOwnerId)).toBe(true);
      const exercised = new Set(world.incidents.flatMap((incident) => incident.requiredArtifactIds));
      for (const artifact of world.artifacts) expect(exercised.has(artifact.id), `${world.id}:${artifact.id}`).toBe(true);
      for (const incident of world.incidents) {
        expect(incident.requiredArtifactIds.length).toBeGreaterThan(0);
        for (const artifactId of incident.requiredArtifactIds) expect(artifactIds.has(artifactId)).toBe(true);
      }
    }
  });

  it("starts every incident broken and passes every reference architecture", () => {
    for (const world of LLD_VERIFICATION_WORLDS) {
      const broken = createLldVerificationState(world).placements;
      const reference = referenceLldPlacements(world);
      for (const incident of world.incidents) {
        expect(simulateLldIncident(world, incident, broken).passed, `${world.id}:${incident.id} starts broken`).toBe(false);
        expect(simulateLldIncident(world, incident, reference).passed, `${world.id}:${incident.id} reference passes`).toBe(true);
      }
    }
  });

  it("cannot mutate before observation, skip a failure, or count a move before rerun", () => {
    const world = LLD_VERIFICATION_WORLDS[0];
    const initial = createLldVerificationState(world);
    const artifact = world.artifacts.find((candidate) => world.incidents[0].requiredArtifactIds.includes(candidate.id))!;
    expect(installLldArtifact(world, initial, artifact.id, artifact.referenceOwnerId)).toBe(initial);
    expect(advanceLldIncident(world, initial)).toBe(initial);
    const observed = runCurrentLldIncident(world, initial).state;
    const moved = installLldArtifact(world, observed, artifact.id, artifact.referenceOwnerId);
    expect(moved.clearedIncidentIds).toEqual([]);
    expect(advanceLldIncident(world, moved)).toBe(moved);
  });

  it("requires every live rerun before verifying all five worlds", () => {
    for (const world of LLD_VERIFICATION_WORLDS) {
      let state = createLldVerificationState(world);
      for (let index = 0; index < world.incidents.length; index += 1) {
        const failed = runCurrentLldIncident(world, state);
        expect(failed.simulation.passed).toBe(false);
        state = failed.state;
        for (const artifactId of world.incidents[index].requiredArtifactIds) {
          const artifact = world.artifacts.find((candidate) => candidate.id === artifactId)!;
          state = installLldArtifact(world, state, artifact.id, artifact.referenceOwnerId);
        }
        const proof = runCurrentLldIncident(world, state);
        expect(proof.simulation.passed, `${world.id}:${world.incidents[index].id}`).toBe(true);
        state = proof.state;
        if (index < world.incidents.length - 1) state = advanceLldIncident(world, state);
      }
      expect(isLldWorldVerified(world, state)).toBe(true);
      expect(assessLldWorldDefense(world, strongDefense(world))).toMatchObject({ ready: true, score: 100 });
    }
  });

  it("rejects generic confidence language without concrete evidence", () => {
    for (const world of LLD_VERIFICATION_WORLDS) {
      const grade = assessLldWorldDefense(world, "I used some classes and patterns. The design is clean, scalable, maintainable, and should work for future requirements after additional testing and improvements.");
      expect(grade.ready).toBe(false);
      expect(grade.score).toBeLessThan(100);
    }
  });
});
