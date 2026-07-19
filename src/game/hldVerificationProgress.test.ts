import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHldVerificationState } from "@/arena/hldVerificationEngine";
import { HLD_VERIFICATION_WORLDS } from "@/arena/hldVerificationWorlds";
import { HLD_PROGRESS_KEY, loadHldWorldProgress, recordHldWorldCompletion, saveHldWorldDraft } from "./hldVerificationProgress";

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

describe("HLD verification progress", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it("persists a valid draft and completion record", () => {
    const world = HLD_VERIFICATION_WORLDS[0];
    const draft = { ...createHldVerificationState(world), runs: 3 };
    saveHldWorldDraft(world, draft);
    recordHldWorldCompletion(world, draft, 91);
    expect(loadHldWorldProgress(world)).toMatchObject({ draft: { runs: 3 }, record: { worldId: world.id, bestScore: 91, runs: 3 } });
  });

  it("repairs hostile placements, indexes, counters, and forged clears", () => {
    const world = HLD_VERIFICATION_WORLDS[0];
    localStorage.setItem(HLD_PROGRESS_KEY, JSON.stringify({
      records: { [world.id]: { worldId: "other", completedAt: "yesterday", bestScore: 900, runs: -4 } },
      drafts: { [world.id]: {
        currentIncidentIndex: 999,
        placements: { [world.modules[0].id]: "invented-zone", injected: "door" },
        observedIncidentIds: [world.incidents[0].id, world.incidents[0].id, "invented-incident"],
        clearedIncidentIds: [world.incidents[0].id, "invented-incident"],
        runs: -12,
      } },
    }));
    const loaded = loadHldWorldProgress(world);
    expect(loaded.record).toBeUndefined();
    expect(loaded.draft.currentIncidentIndex).toBe(world.incidents.length - 1);
    expect(loaded.draft.runs).toBe(0);
    expect(loaded.draft.placements[world.modules[0].id]).toBe(world.modules[0].startsInZoneId);
    expect(loaded.draft.placements).not.toHaveProperty("injected");
    expect(loaded.draft.observedIncidentIds).toEqual([world.incidents[0].id]);
    expect(loaded.draft.clearedIncidentIds).toEqual([]);
  });
});
