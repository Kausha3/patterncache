import type { ArenaScoreRecord, CodingCombatScores } from "@/arena/types";
import type { HldVerificationRecord } from "@/game/hldVerificationProgress";
import type { LldVerificationRecord } from "@/game/lldVerificationProgress";
import type { ParkingLotGauntletRecord } from "@/game/parkingLotGauntletProgress";
import type { AmazonPrepEvidence, AmazonPrepRecord } from "@/hooks/useAmazonPrepProgress";
import { isReviewDue } from "@/hooks/useAmazonPrepProgress";
import type { ProgressMap } from "@/types";
import type { CourseDay, CourseTask } from "./coursePlan";

export type CourseCompletionKind = "verified" | "self-attested" | "incomplete";

export interface CourseTaskCompletion {
  kind: CourseCompletionKind;
  complete: boolean;
  label: string;
  completedAt?: number;
}

export interface CourseEvidenceSnapshot {
  codingCombatScores: CodingCombatScores;
  hldWorldRecords: Record<string, HldVerificationRecord | undefined>;
  lldWorldRecords: Record<string, LldVerificationRecord | undefined>;
  parkingLotRecord?: ParkingLotGauntletRecord;
  lessonProgress: ProgressMap;
  manuallyCompletedTaskIds: string[];
}

export interface ScheduledCourseTask {
  day: number;
  task: CourseTask;
  completion: CourseTaskCompletion;
}

export function getCourseTaskCompletion(task: CourseTask, snapshot: CourseEvidenceSnapshot): CourseTaskCompletion {
  if (task.evidence?.kind === "coding-combat") {
    return verifiedRecordCompletion(snapshot.codingCombatScores[task.evidence.refId], task.evidence.label);
  }
  if (task.evidence?.kind === "hld-world") {
    return verifiedRecordCompletion(snapshot.hldWorldRecords[task.evidence.refId], task.evidence.label);
  }
  if (task.evidence?.kind === "lld-world") {
    return verifiedRecordCompletion(snapshot.lldWorldRecords[task.evidence.refId], task.evidence.label);
  }
  if (task.evidence?.kind === "parking-lot-world") {
    return verifiedRecordCompletion(snapshot.parkingLotRecord, task.evidence.label);
  }
  if (task.lessonId && snapshot.lessonProgress[task.lessonId]?.status === "completed") {
    return {
      kind: "self-attested",
      complete: true,
      label: "Lesson interaction completed",
      completedAt: snapshot.lessonProgress[task.lessonId]?.lastVisited,
    };
  }
  if (snapshot.manuallyCompletedTaskIds.includes(task.id)) {
    return { kind: "self-attested", complete: true, label: "Reflection or mock recorded" };
  }
  return {
    kind: "incomplete",
    complete: false,
    label: task.lessonId ? "Finish the lesson interaction" : "Record this reflection or mock",
  };
}

export function getScheduledCourseTasks(plan: CourseDay[], snapshot: CourseEvidenceSnapshot): ScheduledCourseTask[] {
  return plan.flatMap((day) => day.tasks.map((task) => ({
    day: day.day,
    task,
    completion: getCourseTaskCompletion(task, snapshot),
  })));
}

export function getNextCourseTask(plan: CourseDay[], currentDay: number, snapshot: CourseEvidenceSnapshot): ScheduledCourseTask | undefined {
  const scheduled = getScheduledCourseTasks(plan, snapshot);
  return scheduled.find((item) => item.day <= currentDay && !item.completion.complete)
    ?? scheduled.find((item) => item.day > currentDay && !item.completion.complete);
}

export function getDueCourseReviews(
  plan: CourseDay[],
  snapshot: CourseEvidenceSnapshot,
  amazonRecords: Record<string, AmazonPrepRecord | undefined>,
  today = new Date(),
): ScheduledCourseTask[] {
  return getScheduledCourseTasks(plan, snapshot)
    .filter((item) => item.task.questionId && item.completion.complete && isReviewDue(amazonRecords[item.task.questionId], today))
    .sort((left, right) => {
      const leftDate = amazonRecords[left.task.questionId!]?.nextReview ?? "";
      const rightDate = amazonRecords[right.task.questionId!]?.nextReview ?? "";
      return leftDate.localeCompare(rightDate) || left.day - right.day;
    });
}

export function getCourseRetryQueue(
  plan: CourseDay[],
  currentDay: number,
  snapshot: CourseEvidenceSnapshot,
  amazonRecords: Record<string, AmazonPrepRecord | undefined>,
): ScheduledCourseTask[] {
  return getScheduledCourseTasks(plan, snapshot)
    .filter((item) => item.day <= currentDay && item.task.questionId && !item.completion.complete && amazonRecords[item.task.questionId]?.status === "learning")
    .sort((left, right) => left.day - right.day);
}

export function buildCourseAmazonEvidence(
  task: CourseTask,
  completion: CourseTaskCompletion,
): Extract<AmazonPrepEvidence, { verified: true }> | undefined {
  if (!task.questionId || !task.evidence || completion.kind !== "verified" || !completion.completedAt) return undefined;
  return {
    kind: task.evidence.kind === "coding-combat" ? "combat-clear" : "verified-practice",
    verified: true,
    recordedAt: new Date(completion.completedAt).toISOString(),
    refId: task.evidence.refId,
    summary: `${completion.label} verified ${task.title}.`,
  };
}

function verifiedRecordCompletion(
  record: Pick<ArenaScoreRecord, "completedAt"> | Pick<HldVerificationRecord, "completedAt"> | Pick<LldVerificationRecord, "completedAt"> | Pick<ParkingLotGauntletRecord, "completedAt"> | undefined,
  label: string,
): CourseTaskCompletion {
  return record
    ? { kind: "verified", complete: true, label, completedAt: record.completedAt }
    : { kind: "incomplete", complete: false, label };
}
