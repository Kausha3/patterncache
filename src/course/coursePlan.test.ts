import { describe, expect, it } from "vitest";
import {
  buildCoursePlan,
  formatLocalDate,
  getCurrentCourseDay,
  getDayMinutes,
  getDaysUntil,
} from "./coursePlan";
import { AMAZON_SDE1_QUESTIONS } from "@/content/amazonSde1Prep";

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

  it("schedules every Amazon must-do exactly once with an executable proof route", () => {
    const mustDoIds = AMAZON_SDE1_QUESTIONS
      .filter((question) => question.tier === "must")
      .map((question) => question.id)
      .sort();

    for (const length of [15, 30] as const) {
      const plan = buildCoursePlan(length);
      const exactTasks = plan.flatMap((day) => day.tasks).filter((task) => task.questionId);
      expect(exactTasks.map((task) => task.questionId).sort()).toEqual(mustDoIds);
      for (const item of exactTasks) {
        expect(item.evidence, item.questionId).toBeDefined();
        expect(item.route, item.questionId).toMatch(/^\/arena\//);
      }
    }
  });

  it("adds HLD transfer only to the longer runway without displacing must-dos", () => {
    const shortEvidence = buildCoursePlan(15).flatMap((day) => day.tasks.map((task) => task.evidence));
    const longEvidence = buildCoursePlan(30).flatMap((day) => day.tasks.map((task) => task.evidence));
    expect(shortEvidence.some((evidence) => evidence?.kind === "hld-world")).toBe(false);
    expect(longEvidence).toContainEqual(expect.objectContaining({ kind: "hld-world", refId: "url-shortener" }));
  });
});
