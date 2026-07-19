import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALGORITHM_REPLAY_WORLDS } from "@/arena/algorithmReplayWorlds";
import { ALGORITHM_REPLAY_PROGRESS_KEY, loadAlgorithmReplayProgress, loadAlgorithmReplayState, recordAlgorithmReplay, saveAlgorithmReplayState } from "./algorithmReplayProgress";

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

describe("algorithm replay progress", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it("persists valid frames and a matching mission record", () => {
    const world = ALGORITHM_REPLAY_WORLDS[0];
    saveAlgorithmReplayState(world.id, { observedNaiveFailure: true, canonicalFramesSeen: [0], variantFramesSeen: [] });
    recordAlgorithmReplay(world.id, world.missionId, 88);
    expect(loadAlgorithmReplayState(world)).toEqual({ observedNaiveFailure: true, canonicalFramesSeen: [0], variantFramesSeen: [] });
    expect(loadAlgorithmReplayProgress().records[world.id]).toMatchObject({ missionId: world.missionId, bestScore: 88 });
  });

  it("drops out-of-range frames, injected worlds, and forged records", () => {
    const world = ALGORITHM_REPLAY_WORLDS[0];
    localStorage.setItem(ALGORITHM_REPLAY_PROGRESS_KEY, JSON.stringify({
      drafts: {
        [world.id]: { observedNaiveFailure: "yes", canonicalFramesSeen: [-1, 0, 0, 999, "1"], variantFramesSeen: [0, 999] },
        injected: { observedNaiveFailure: true, canonicalFramesSeen: [0], variantFramesSeen: [0] },
      },
      records: { [world.id]: { worldId: world.id, missionId: "wrong", completedAt: 1, bestScore: 1000 } },
    }));
    expect(loadAlgorithmReplayState(world)).toEqual({ observedNaiveFailure: false, canonicalFramesSeen: [0], variantFramesSeen: [0] });
    const progress = loadAlgorithmReplayProgress();
    expect(progress.drafts).not.toHaveProperty("injected");
    expect(progress.records[world.id]).toBeUndefined();
  });
});
