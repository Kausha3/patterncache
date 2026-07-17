import { describe, expect, it } from "vitest";
import { buildCoursePlan } from "@/course/coursePlan";
import type { CourseDay } from "@/course/coursePlan";
import type { ProgressMap } from "@/types";
import { CODING_COMBAT_MISSION_IDS } from "@/arena/types";
import type { CodingCombatScores } from "@/arena/types";
import {
  calculateGameProgress,
  calculateStreak,
  getChallengeCheckpoints,
  getGameRank,
  selectDailyTarget,
} from "./gameEngine";

describe("game engine", () => {
  it("moves through named ranks at stable XP thresholds", () => {
    expect(getGameRank(0).rank.name).toBe("Pattern Scout");
    expect(getGameRank(1_200).rank.name).toBe("Systems Builder");
    expect(getGameRank(5_400).rank.name).toBe("Bar Raiser");
    expect(getGameRank(5_400).nextRank).toBeUndefined();
  });

  it("resurfaces shaky lessons before unfinished scheduled work", () => {
    const plan = buildCoursePlan(15);
    const progress: ProgressMap = {
      "two-pointer": { status: "completed", confidence: "shaky", lastVisited: 1 },
      "client-server": { status: "in-progress", lastVisited: 2 },
    };

    const target = selectDailyTarget(plan, 7, progress);
    expect(target.lessonId).toBe("two-pointer");
    expect(target.reason).toContain("shaky");
  });

  it("awards XP for real course work and a fully cleared boss battle", () => {
    const plan: CourseDay[] = [{
      day: 1,
      title: "Test day",
      focus: "Test",
      tasks: [
        { id: "lesson-two-pointer", lessonId: "two-pointer", route: "/lesson/two-pointer", title: "Two Pointers", description: "Lesson", minutes: 20, kind: "lesson" },
        { id: "mock", title: "Mock", description: "Timed", minutes: 90, kind: "mock" },
      ],
    }];
    const summary = calculateGameProgress({
      plan,
      completedTaskIds: ["mock"],
      completedTaskDates: { mock: "2026-07-15" },
      progress: { "two-pointer": { status: "completed", confidence: "solid", lastVisited: new Date("2026-07-15T12:00:00").getTime() } },
      dailyTargets: { "2026-07-15": "two-pointer" },
      challengeCheckpoints: { "2026-07-15": ["recall", "lesson", "defend"] },
      now: new Date("2026-07-15T18:00:00"),
    });

    expect(summary.xp).toBe(440);
    expect(summary.completedCourseTasks).toBe(2);
    expect(summary.bossesCleared).toBe(1);
    expect(summary.streak).toBe(1);
    expect(summary.achievements.find((achievement) => achievement.id === "boss-breaker")?.unlocked).toBe(true);
  });

  it("keeps a streak alive through yesterday and breaks after a gap", () => {
    const now = new Date("2026-07-15T10:00:00");
    expect(calculateStreak(["2026-07-12", "2026-07-13", "2026-07-14"], now)).toBe(3);
    expect(calculateStreak(["2026-07-12", "2026-07-13"], now)).toBe(0);
  });

  it("turns persistent Arena best scores into non-farmable XP and achievements", () => {
    const summary = calculateGameProgress({
      plan: [],
      completedTaskIds: [],
      completedTaskDates: {},
      progress: {},
      dailyTargets: {},
      challengeCheckpoints: {},
      arenaScores: {
        coding: { bestScore: 450, maxScore: 450, completedAt: new Date("2026-07-15T12:00:00").getTime(), attempts: 3 },
        hld: { bestScore: 315, maxScore: 450, completedAt: new Date("2026-07-15T13:00:00").getTime(), attempts: 1 },
      },
      now: new Date("2026-07-15T18:00:00"),
    });

    expect(summary.arenaClears).toBe(2);
    expect(summary.arenaXp).toBe(640);
    expect(summary.xp).toBe(640);
    expect(summary.achievements.find((achievement) => achievement.id === "code-combatant")?.unlocked).toBe(true);
    expect(summary.achievements.find((achievement) => achievement.id === "incident-commander")?.unlocked).toBe(true);
    expect(summary.achievements.find((achievement) => achievement.id === "full-loop")?.unlocked).toBe(false);
  });

  it("rewards best Coding Combat records once and unlocks build-based achievements", () => {
    const summary = calculateGameProgress({
      plan: [],
      completedTaskIds: [],
      completedTaskDates: {},
      progress: {},
      dailyTargets: {},
      challengeCheckpoints: {},
      codingCombatScores: {
        "target-pair": { bestScore: 500, maxScore: 500, completedAt: new Date("2026-07-15T12:00:00").getTime(), attempts: 9 },
        "unique-window": { bestScore: 250, maxScore: 500, completedAt: new Date("2026-07-15T13:00:00").getTime(), attempts: 2 },
      },
      now: new Date("2026-07-15T18:00:00"),
    });

    expect(summary.codingCombatClears).toBe(2);
    expect(summary.codingCombatXp).toBe(700);
    expect(summary.xp).toBe(700);
    expect(summary.achievements.find((achievement) => achievement.id === "code-author")?.unlocked).toBe(true);
    expect(summary.achievements.find((achievement) => achievement.id === "combat-engineer")?.unlocked).toBe(false);
  });

  it("reserves Combat Engineer for six distinct completed patterns", () => {
    const codingCombatScores = Object.fromEntries(
      CODING_COMBAT_MISSION_IDS.slice(0, 6).map((missionId, index) => [
        missionId,
        { bestScore: 500, maxScore: 500, completedAt: index + 1, attempts: 1 },
      ]),
    ) as CodingCombatScores;
    const summary = calculateGameProgress({
      plan: [],
      completedTaskIds: [],
      completedTaskDates: {},
      progress: {},
      dailyTargets: {},
      challengeCheckpoints: {},
      codingCombatScores,
      now: new Date("2026-07-15T18:00:00"),
    });

    expect(summary.achievements.find((achievement) => achievement.id === "combat-engineer")?.unlocked).toBe(true);
  });

  it("banks LLD Studio XP from best records without multiplying it by attempts", () => {
    const summary = calculateGameProgress({
      plan: [],
      completedTaskIds: [],
      completedTaskDates: {},
      progress: {},
      dailyTargets: {},
      challengeCheckpoints: {},
      lldStudioScores: {
        "parking-model": { bestScore: 500, maxScore: 500, completedAt: new Date("2026-07-15T12:00:00").getTime(), attempts: 12 },
        "coupon-policies": { bestScore: 250, maxScore: 500, completedAt: new Date("2026-07-15T13:00:00").getTime(), attempts: 2 },
      },
      now: new Date("2026-07-15T18:00:00"),
    });

    expect(summary.lldStudioClears).toBe(2);
    expect(summary.lldStudioXp).toBe(800);
    expect(summary.xp).toBe(800);
    expect(summary.achievements.find((achievement) => achievement.id === "model-builder")?.unlocked).toBe(true);
    expect(summary.achievements.find((achievement) => achievement.id === "change-proof")?.unlocked).toBe(false);
  });

  it("changes boss-battle coaching by lesson grammar", () => {
    expect(getChallengeCheckpoints("dsa")[0].description).toContain("invariant");
    expect(getChallengeCheckpoints("system-design")[2].description).toContain("tradeoff");
    expect(getChallengeCheckpoints("lld")[0].description).toContain("classes");
  });
});
