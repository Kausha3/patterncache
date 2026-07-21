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
  it("builds complete 15-day, 20-day, and 30-day plans with unique task ids", () => {
    for (const length of [15, 20, 30] as const) {
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
    expect(getCurrentCourseDay("2026-07-01", 20, new Date("2026-08-01T12:00:00"))).toBe(20);
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

    for (const length of [15, 20, 30] as const) {
      const plan = buildCoursePlan(length);
      const exactTasks = plan.flatMap((day) => day.tasks).filter((task) => task.questionId);
      const mustTasks = exactTasks.filter((task) => mustDoIds.includes(task.questionId!));
      expect(mustTasks.map((task) => task.questionId).sort()).toEqual(mustDoIds);
      for (const item of mustTasks) {
        expect(item.evidence, item.questionId).toBeDefined();
        expect(item.route, item.questionId).toMatch(/^\/arena\//);
      }
    }
  });

  it("schedules every Must-do and Good-to-do exactly once in the 20-day and 30-day courses", () => {
    const requiredIds = AMAZON_SDE1_QUESTIONS
      .filter((question) => question.tier === "must" || question.tier === "good")
      .map((question) => question.id)
      .sort();

    for (const length of [20, 30] as const) {
      const tasks = buildCoursePlan(length).flatMap((day) => day.tasks).filter((task) => task.questionId);
      expect(tasks.map((task) => task.questionId).sort()).toEqual(requiredIds);
      expect(tasks.every((task) => typeof task.route === "string" && task.route.length > 0)).toBe(true);
    }
  });

  it("keeps system design out of the recruiter-directed Amazon course", () => {
    for (const length of [15, 20, 30] as const) {
      const evidence = buildCoursePlan(length).flatMap((day) => day.tasks.map((task) => task.evidence));
      expect(evidence.some((item) => item?.kind === "hld-world")).toBe(false);
    }
  });

  it("includes ten STAR missions, all technical concept checks, and four complete rounds in the 20-day plan", () => {
    const tasks = buildCoursePlan(20).flatMap((day) => day.tasks);
    expect(tasks.filter((task) => task.id.startsWith("amazon-story-")).length).toBe(10);
    expect(tasks.filter((task) => task.id.startsWith("amazon-concept-")).length).toBe(11);
    for (const round of [1, 2, 3, 4]) {
      expect(tasks.filter((task) => task.id.startsWith(`amazon-round-${round}-`)).length).toBe(3);
    }
    const blindTransfers = tasks.filter((task) => task.id.startsWith("amazon-blind-"));
    expect(blindTransfers).toHaveLength(6);
    expect(blindTransfers.every((task) => task.evidence?.kind === "coding-combat" && task.route?.includes("coding-lab"))).toBe(true);
  });
});
