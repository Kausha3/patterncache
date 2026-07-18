import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  advanceLldIncident,
  createLldVerificationState,
  installLldArtifact,
  runCurrentLldIncident,
} from "@/arena/lldVerificationEngine";
import { LLD_VERIFICATION_WORLDS } from "@/arena/lldVerificationWorlds";
import {
  lldVerificationStorageKey,
  loadLldVerificationProgress,
  recordLldVerificationCompletion,
  sanitizeLldVerificationProgress,
  saveLldVerificationDraft,
} from "./lldVerificationProgress";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
}

function completedState(world: (typeof LLD_VERIFICATION_WORLDS)[number]) {
  let state = createLldVerificationState(world);
  for (let index = 0; index < world.incidents.length; index += 1) {
    state = runCurrentLldIncident(world, state).state;
    for (const artifactId of world.incidents[index].requiredArtifactIds) {
      const artifact = world.artifacts.find((candidate) => candidate.id === artifactId)!;
      state = installLldArtifact(world, state, artifact.id, artifact.referenceOwnerId);
    }
    state = runCurrentLldIncident(world, state).state;
    if (index < world.incidents.length - 1) state = advanceLldIncident(world, state);
  }
  return state;
}

function strongDefense(world: (typeof LLD_VERIFICATION_WORLDS)[number]): string {
  const owners = world.nodes.filter((node) => node.id !== world.initialOwnerId).slice(0, 3).map((node) => node.label).join(", ");
  return `${owners} own and protect their invariants. The ${world.defense.evidenceTerms[0]} incident proved this responsibility boundary. A future ${world.defense.changeTerms[0]} policy change remains contained. I reject the coupled god object alternative because it scatters unrelated state and creates a testing cost, even though separation adds collaborating classes.`;
}

describe("LLD verification progress", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it("sanitizes hostile placement, incident, and record data", () => {
    const world = LLD_VERIFICATION_WORLDS[0];
    const progress = sanitizeLldVerificationProgress(world, {
      record: { bestScore: "perfect" },
      draft: { placements: { storage: "attacker" }, currentIncidentIndex: 99, observedIncidentIds: ["fake"], clearedIncidentIds: ["wrap"], runs: -4 },
    });
    expect(progress.record).toBeUndefined();
    expect(progress.draft?.placements.storage).toBe(world.initialOwnerId);
    expect(progress.draft?.currentIncidentIndex).toBe(world.incidents.length - 1);
    expect(progress.draft?.clearedIncidentIds).toEqual([]);
    expect(progress.draft?.runs).toBe(0);
  });

  it("round-trips independent drafts for every world", () => {
    for (const world of LLD_VERIFICATION_WORLDS) {
      const observed = runCurrentLldIncident(world, createLldVerificationState(world)).state;
      saveLldVerificationDraft(world, observed);
      expect(loadLldVerificationProgress(world).draft?.observedIncidentIds).toEqual([world.incidents[0].id]);
      expect(localStorage.getItem(lldVerificationStorageKey(world.id))).toContain(world.incidents[0].id);
    }
  });

  it("records only a complete live architecture plus strong defense", () => {
    for (const world of LLD_VERIFICATION_WORLDS) {
      expect(recordLldVerificationCompletion(world, createLldVerificationState(world), strongDefense(world)).completed).toBe(false);
      const state = completedState(world);
      const result = recordLldVerificationCompletion(world, state, strongDefense(world), 123456);
      expect(result.completed).toBe(true);
      expect(result.progress.record).toMatchObject({ bestScore: 100, completedAt: 123456, incidentsVerified: world.incidents.length, completions: 1 });
      expect(result.progress.draft).toBeUndefined();
    }
  });

  it("keeps the world playable when storage throws", () => {
    const world = LLD_VERIFICATION_WORLDS[0];
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } });
    expect(saveLldVerificationDraft(world, createLldVerificationState(world)).draft).toBeDefined();
    expect(loadLldVerificationProgress(world)).toEqual({});
  });
});
