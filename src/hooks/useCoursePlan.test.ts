import { describe, expect, it } from "vitest";
import { parseCourseState } from "./useCoursePlan";

describe("course plan persistence", () => {
  it("recovers safely from missing and malformed storage", () => {
    expect(parseCourseState(null)).toEqual({ completedTaskIds: [], completedTaskDates: {} });
    expect(parseCourseState("not-json")).toEqual({ completedTaskIds: [], completedTaskDates: {} });
    expect(parseCourseState(JSON.stringify({
      preferences: { company: "amazon", level: "L4", length: 99, dailyMinutes: 0, startDate: "tomorrow" },
      completedTaskIds: ["mock", 42, "mock"],
    }))).toEqual({ preferences: undefined, completedTaskIds: ["mock"], completedTaskDates: {} });
  });

  it("migrates old higher-level selections to the honest SDE I scope", () => {
    expect(parseCourseState(JSON.stringify({
      preferences: {
        company: "amazon",
        level: "L5",
        length: 15,
        dailyMinutes: 120,
        startDate: "2026-07-15",
      },
      completedTaskIds: ["mock"],
      completedTaskDates: { mock: "2026-07-15" },
    }))).toEqual({
      preferences: {
        company: "amazon",
        level: "L4",
        length: 15,
        dailyMinutes: 120,
        startDate: "2026-07-15",
      },
      completedTaskIds: ["mock"],
      completedTaskDates: { mock: "2026-07-15" },
    });
  });

  it("persists the recommended 20-day runway", () => {
    const parsed = parseCourseState(JSON.stringify({
      preferences: {
        company: "amazon",
        level: "L4",
        length: 20,
        dailyMinutes: 150,
        startDate: "2026-07-21",
        interviewDate: "2026-08-10",
      },
      completedTaskIds: [],
    }));
    expect(parsed.preferences).toMatchObject({ length: 20, dailyMinutes: 150, interviewDate: "2026-08-10" });
  });
});
