import { describe, expect, it } from "vitest";
import { HLD_VERIFICATION_WORLDS } from "./hldVerificationWorlds";
import {
  advanceHldIncident,
  assessHldDefense,
  createHldVerificationState,
  getHldRepairTask,
  hldIncidentHealth,
  installHldModule,
  isHldWorldVerified,
  runCurrentHldIncident,
} from "./hldVerificationEngine";

describe("HLD verification worlds", () => {
  it("ships three distinct beginner-first worlds with complete incident coverage", () => {
    expect(HLD_VERIFICATION_WORLDS.map((world) => world.id)).toEqual(["url-shortener", "notification-service", "checkout"]);
    expect(HLD_VERIFICATION_WORLDS.map((world) => world.learningMode)).toEqual(["guided", "coached", "independent"]);
    for (const world of HLD_VERIFICATION_WORLDS) {
      expect(world.incidents.length).toBeGreaterThanOrEqual(4);
      expect(new Set(world.modules.map((module) => module.id)).size).toBe(world.modules.length);
      for (const incident of world.incidents) {
        expect(incident.requiredModuleIds.length).toBeGreaterThan(0);
        expect(incident.requiredModuleIds.every((id) => world.modules.some((module) => module.id === id))).toBe(true);
      }
    }
  });

  it("locks repair evidence behind a real run and revokes a clear when a coached module moves", () => {
    const world = HLD_VERIFICATION_WORLDS[1];
    let state = createHldVerificationState(world);
    const failed = runCurrentHldIncident(world, state);
    expect(failed.simulation.passed).toBe(false);
    expect(failed.state.observedIncidentIds).toContain(world.incidents[0].id);
    const module = world.modules.find((candidate) => candidate.id === world.incidents[0].requiredModuleIds[0])!;
    state = installHldModule(world, failed.state, module.id, module.expectedZoneId);
    state = runCurrentHldIncident(world, state).state;
    expect(state.clearedIncidentIds).toContain(world.incidents[0].id);
    state = installHldModule(world, state, module.id, world.zones.find((zone) => zone.id !== module.expectedZoneId)!.id);
    expect(state.clearedIncidentIds).not.toContain(world.incidents[0].id);
  });

  it("turns the first world into a guided action instead of a destination quiz", () => {
    const world = HLD_VERIFICATION_WORLDS[0];
    const state = runCurrentHldIncident(world, createHldVerificationState(world)).state;
    const task = getHldRepairTask(world, state)!;
    expect(task.mode).toBe("guided");
    expect(task.allowedZoneIds).toEqual([task.targetZoneId]);
    expect(installHldModule(world, state, task.moduleId, "tower")).toBe(state);
    const repaired = installHldModule(world, state, task.moduleId, task.targetZoneId);
    expect(hldIncidentHealth(world, state)).toMatchObject({ correct: 0, total: 1, availability: 55, p95Latency: 620, openFailureModes: 1 });
    expect(hldIncidentHealth(world, repaired)).toMatchObject({ correct: 1, total: 1, availability: 99, p95Latency: 120, openFailureModes: 0 });
  });

  it("requires every incident to pass before verification", () => {
    const world = HLD_VERIFICATION_WORLDS[1];
    let state = createHldVerificationState(world);
    for (let index = 0; index < world.incidents.length; index += 1) {
      const incident = world.incidents[index];
      for (const id of incident.requiredModuleIds) {
        const module = world.modules.find((candidate) => candidate.id === id)!;
        state = installHldModule(world, state, id, module.expectedZoneId);
      }
      state = runCurrentHldIncident(world, state).state;
      if (index < world.incidents.length - 1) state = advanceHldIncident(world, state);
    }
    expect(isHldWorldVerified(world, state)).toBe(true);
  });

  it("grades concrete architecture evidence, not length alone", () => {
    const world = HLD_VERIFICATION_WORLDS[0];
    expect(assessHldDefense(world, "architecture ".repeat(30)).ready).toBe(false);
    expect(assessHldDefense(world, "I kept the read-through cache in the Edge Layer because the celebrity surge proved permanent storage was the latency bottleneck. I rejected synchronous analytics because a queue protects availability under load. A future expiry rule changes the durable mapping and cache policy, not redirect coordination.").ready).toBe(true);
  });
});
