import { describe, expect, it } from "vitest";
import { ALGORITHM_REPLAY_WORLDS } from "./algorithmReplayWorlds";
import { assessAlgorithmReplayDefense, createAlgorithmReplayState, observeNaiveFailure, recordReplayFrame, replayIsComplete } from "./algorithmReplayEngine";

describe("algorithm replay worlds", () => {
  it("covers six major patterns without replacing the two code-driven worlds", () => {
    expect(ALGORITHM_REPLAY_WORLDS.map((world) => world.missionId)).toEqual([
      "product-except-self",
      "top-k-frequent",
      "merge-intervals",
      "validate-bst",
      "word-search",
      "coin-change",
    ]);
    for (const world of ALGORITHM_REPLAY_WORLDS) {
      expect(world.canonical.frames.length).toBeGreaterThan(1);
      expect(world.variant.frames.length).toBeGreaterThan(1);
      expect(world.defenseSignals.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("requires the failure, every canonical frame, and every variant frame", () => {
    const world = ALGORITHM_REPLAY_WORLDS[0];
    let state = createAlgorithmReplayState();
    expect(replayIsComplete(world, state)).toBe(false);
    state = observeNaiveFailure(state);
    world.canonical.frames.forEach((_, index) => { state = recordReplayFrame(state, "canonical", index, world.canonical.frames.length); });
    expect(replayIsComplete(world, state)).toBe(false);
    world.variant.frames.forEach((_, index) => { state = recordReplayFrame(state, "variant", index, world.variant.frames.length); });
    expect(replayIsComplete(world, state)).toBe(true);
  });

  it("ignores invalid or repeated replay frames", () => {
    let state = createAlgorithmReplayState();
    expect(recordReplayFrame(state, "canonical", -1, 3)).toBe(state);
    state = recordReplayFrame(state, "canonical", 1, 3);
    expect(recordReplayFrame(state, "canonical", 1, 3)).toBe(state);
  });

  it("rejects long generic defenses and accepts concrete transfer reasoning", () => {
    const world = ALGORITHM_REPLAY_WORLDS[5];
    expect(assessAlgorithmReplayDefense(world, "I used an algorithm. ".repeat(20)).ready).toBe(false);
    expect(assessAlgorithmReplayDefense(world, "My dp state stores the minimum coins for each smaller amount, with dp[0] as the base and infinity for unreachable states. This is O(amount times coins) time. The unreachable variant proves why zero is unsafe. With limited inventory, I would change the transition or add coin-index state instead of reusing the unbounded recurrence.").ready).toBe(true);
  });
});
