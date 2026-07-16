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
});
