import { describe, expect, it } from "vitest";
import type { CourseDay, CourseTask } from "./coursePlan";
import {
  buildCourseAmazonEvidence,
  getCourseRetryQueue,
  getCourseTaskCompletion,
  getDueCourseReviews,
  getNextCourseTask,
  type CourseEvidenceSnapshot,
} from "./courseEvidence";

const combatTask: CourseTask = {
  id: "amazon-dsa-two-sum",
  title: "Two Sum",
  description: "Solve it.",
  minutes: 25,
  kind: "coding",
  route: "/arena/coding-lab/pair-sum-map",
  questionId: "dsa-two-sum",
  evidence: { kind: "coding-combat", refId: "pair-sum-map", label: "Visible and hidden JVM tests" },
};

const manualTask: CourseTask = {
  id: "mock",
  title: "Mock autopsy",
  description: "Record the misses.",
  minutes: 20,
  kind: "review",
};

const plan: CourseDay[] = [
  { day: 1, title: "Hashing", focus: "Complements", tasks: [combatTask, manualTask] },
];

function emptySnapshot(): CourseEvidenceSnapshot {
  return {
    codingCombatScores: {},
    hldWorldRecords: {},
    lldWorldRecords: {},
    lessonProgress: {},
    manuallyCompletedTaskIds: [],
  };
}

describe("course evidence", () => {
  it("does not let manual checkboxes satisfy machine-verified work", () => {
    const snapshot = emptySnapshot();
    snapshot.manuallyCompletedTaskIds = [combatTask.id];
    expect(getCourseTaskCompletion(combatTask, snapshot)).toMatchObject({ complete: false, kind: "incomplete" });
  });

  it("completes an exact mission only from its matching machine record", () => {
    const snapshot = emptySnapshot();
    snapshot.codingCombatScores["pair-sum-map"] = { bestScore: 450, maxScore: 500, attempts: 2, completedAt: 1_000 };
    const completion = getCourseTaskCompletion(combatTask, snapshot);
    expect(completion).toEqual({ complete: true, kind: "verified", label: "Visible and hidden JVM tests", completedAt: 1_000 });
    expect(buildCourseAmazonEvidence(combatTask, completion)).toMatchObject({
      kind: "combat-clear",
      verified: true,
      refId: "pair-sum-map",
      recordedAt: new Date(1_000).toISOString(),
    });
  });

  it("keeps reflections explicitly self-attested", () => {
    const snapshot = emptySnapshot();
    snapshot.manuallyCompletedTaskIds = [manualTask.id];
    expect(getCourseTaskCompletion(manualTask, snapshot)).toMatchObject({ complete: true, kind: "self-attested" });
  });

  it("selects the first incomplete task on the current day", () => {
    const snapshot = emptySnapshot();
    snapshot.manuallyCompletedTaskIds = [manualTask.id];
    expect(getNextCourseTask(plan, 1, snapshot)?.task.id).toBe(combatTask.id);
  });

  it("surfaces overdue work before today's new mission", () => {
    const twoDayPlan: CourseDay[] = [
      { day: 1, title: "One", focus: "One", tasks: [manualTask] },
      { day: 2, title: "Two", focus: "Two", tasks: [{ ...manualTask, id: "today-reflection" }] },
    ];
    expect(getNextCourseTask(twoDayPlan, 2, emptySnapshot())?.task.id).toBe(manualTask.id);
  });

  it("builds review and retry queues without treating an open route as proof", () => {
    const completed = emptySnapshot();
    completed.codingCombatScores["pair-sum-map"] = { bestScore: 500, maxScore: 500, attempts: 1, completedAt: 1_000 };
    const due = getDueCourseReviews(plan, completed, {
      "dsa-two-sum": { status: "ready", practiceCount: 1, nextReview: "2026-07-17" },
    }, new Date("2026-07-18T12:00:00"));
    expect(due.map((item) => item.task.id)).toEqual([combatTask.id]);

    const retry = getCourseRetryQueue(plan, 1, emptySnapshot(), {
      "dsa-two-sum": { status: "learning", practiceCount: 1 },
    });
    expect(retry.map((item) => item.task.id)).toEqual([combatTask.id]);
  });
});
