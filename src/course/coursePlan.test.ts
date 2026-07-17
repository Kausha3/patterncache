import { describe, expect, it } from "vitest";
import {
  buildCoursePlan,
  formatLocalDate,
  getCurrentCourseDay,
  getDayMinutes,
  getDaysUntil,
} from "./coursePlan";

describe("course plan", () => {
  it("builds complete 15-day and 30-day plans with unique task ids", () => {
    for (const length of [15, 30] as const) {
      const plan = buildCoursePlan(length);
      const taskIds = plan.flatMap((day) => day.tasks.map((task) => task.id));

      expect(plan).toHaveLength(length);
      expect(plan.map((day) => day.day)).toEqual(Array.from({ length }, (_, index) => index + 1));
      expect(new Set(taskIds).size).toBe(taskIds.length);
      expect(plan.every((day) => getDayMinutes(day) > 0)).toBe(true);
    }
  });

  it("keeps the active day inside the selected course", () => {
    expect(getCurrentCourseDay("2026-07-01", 15, new Date("2026-07-01T12:00:00"))).toBe(1);
    expect(getCurrentCourseDay("2026-07-01", 15, new Date("2026-07-06T12:00:00"))).toBe(6);
    expect(getCurrentCourseDay("2026-07-01", 15, new Date("2026-08-01T12:00:00"))).toBe(15);
    expect(getCurrentCourseDay("2026-07-10", 15, new Date("2026-07-01T12:00:00"))).toBe(1);
  });

  it("calculates interview countdowns in local calendar days", () => {
    expect(getDaysUntil("2026-07-20", new Date("2026-07-15T23:30:00"))).toBe(5);
    expect(getDaysUntil("2026-07-15", new Date("2026-07-15T09:00:00"))).toBe(0);
    expect(getDaysUntil(undefined, new Date("2026-07-15T09:00:00"))).toBeUndefined();
  });

  it("formats dates without UTC shifting", () => {
    expect(formatLocalDate(new Date(2026, 6, 5, 23, 45))).toBe("2026-07-05");
  });

  it("schedules the complete LLD arc in both plans", () => {
    // The arc, per the July 2026 research pass: basics, then the six lessons
    // ordered responsibility -> allocation -> state machine -> policy, plus
    // the two constrained-structure drills with dated Amazon SDE-1 evidence
    // (LRU/LFU cache Dec 2024, Circular Buffer 2025), plus cold transfer.
    const lldLessons15 = ["lld-101", "parking-lot", "amazon-locker", "vending-machine", "discount-coupon-system"];
    const lldLessons30 = [...lldLessons15, "elevator-system", "chess-game"];
    const lldDrillRoutes = ["/drill/lru-cache", "/drill/circular-buffer"];

    for (const [length, lessons] of [[15, lldLessons15], [30, lldLessons30]] as const) {
      const plan = buildCoursePlan(length);
      const lessonIds = plan.flatMap((day) => day.tasks.map((task) => task.lessonId).filter(Boolean));
      const routes = plan.flatMap((day) => day.tasks.map((task) => task.route).filter(Boolean));

      for (const id of lessons) {
        expect(lessonIds, `${length}-day plan should schedule lesson ${id}`).toContain(id);
      }
      for (const route of lldDrillRoutes) {
        expect(routes, `${length}-day plan should route to ${route}`).toContain(route);
      }
      // Transfer practice: at least one open-ended cold drill day.
      expect(routes.some((route) => route === "/drill"), `${length}-day plan needs a cold transfer day`).toBe(true);
    }
  });

  it("keeps Chess out of the 15-day sprint (stretch tier, no dated SDE-1 evidence)", () => {
    const plan = buildCoursePlan(15);
    const lessonIds = plan.flatMap((day) => day.tasks.map((task) => task.lessonId).filter(Boolean));
    expect(lessonIds).not.toContain("chess-game");
  });
});
