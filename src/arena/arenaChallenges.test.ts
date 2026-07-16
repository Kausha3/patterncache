import { describe, expect, it } from "vitest";
import { ARENA_CHALLENGES } from "./arenaChallenges";
import { getArenaPerformance, scoreArenaAnswer } from "./arenaSession";
import type { ArenaMode } from "./types";

describe("arena challenge packs", () => {
  it("ships three valid encounters for every arena mode", () => {
    for (const mode of ["coding", "hld", "lld"] as ArenaMode[]) {
      const challenges = ARENA_CHALLENGES[mode];
      expect(challenges).toHaveLength(3);
      expect(new Set(challenges.map((challenge) => challenge.id)).size).toBe(3);
      expect(challenges.every((challenge) => challenge.choices.filter((choice) => choice.correct).length === 1)).toBe(true);
    }
  });

  it("awards speed bonus only to correct committed answers", () => {
    const challenge = ARENA_CHALLENGES.coding[0];
    expect(scoreArenaAnswer(challenge, "pointers", challenge.seconds)).toMatchObject({ correct: true, points: 150, healthDelta: 5 });
    expect(scoreArenaAnswer(challenge, "nested", challenge.seconds)).toMatchObject({ correct: false, points: 0, healthDelta: -25 });
    expect(scoreArenaAnswer(challenge, undefined, 0)).toMatchObject({ correct: false, points: 0, healthDelta: -30 });
  });

  it("reports performance tiers from normalized scores", () => {
    expect(getArenaPerformance(400, 450).label).toBe("Bar-raiser signal");
    expect(getArenaPerformance(300, 450).label).toBe("Loop ready");
    expect(getArenaPerformance(150, 450).label).toBe("Training signal");
  });
});

