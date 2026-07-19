import { getCodingCombatMissionRoute } from "@/arena/codingCombatMissions";
import type { CodingCombatMissionId } from "@/arena/types";
import {
  getLldVerificationWorldByQuestion,
  getLldVerificationWorldRoute,
  type LldVerificationWorldId,
} from "@/arena/lldVerificationWorlds";
import type { HldVerificationWorldId } from "@/arena/hldVerificationWorlds";
import {
  AMAZON_SDE1_15_DAY_PLAN,
  getAmazonCombatMissionId,
  getAmazonPrepQuestion,
} from "@/content/amazonSde1Prep";

export type CourseLength = 15 | 30;
export type TargetLevel = "L4";
export type CourseTaskKind = "lesson" | "coding" | "design" | "behavioral" | "review" | "mock";

export type CourseTaskEvidence =
  | { kind: "coding-combat"; refId: CodingCombatMissionId; label: string }
  | { kind: "lld-world"; refId: LldVerificationWorldId; label: string }
  | { kind: "parking-lot-world"; refId: "parking-lot"; label: string }
  | { kind: "hld-world"; refId: HldVerificationWorldId; label: string };

export interface CoursePreferences {
  company: "amazon";
  level: TargetLevel;
  length: CourseLength;
  dailyMinutes: number;
  startDate: string;
  interviewDate?: string;
}

export interface CourseTask {
  id: string;
  title: string;
  description: string;
  minutes: number;
  kind: CourseTaskKind;
  lessonId?: string;
  route?: string;
  questionId?: string;
  evidence?: CourseTaskEvidence;
}

export interface CourseDay {
  day: number;
  title: string;
  focus: string;
  tasks: CourseTask[];
}

function task(
  id: string,
  title: string,
  minutes: number,
  description: string,
  kind: Exclude<CourseTaskKind, "lesson">,
  route?: string,
): CourseTask {
  return { id, title, description, minutes, kind, route };
}

const SPRINT_15: CourseDay[] = AMAZON_SDE1_15_DAY_PLAN.map((day) => ({
  day: day.day,
  title: day.title,
  focus: `${day.focus}. ${day.checkpoint}`,
  tasks: day.questionIds.length > 0 ? day.questionIds.map(amazonQuestionTask) : finalSprintTasks(day.day),
}));

const SPRINT_30: CourseDay[] = [
  ...AMAZON_SDE1_15_DAY_PLAN.slice(0, 13).flatMap((day, index) => {
    const splitAt = Math.ceil(day.questionIds.length / 2);
    const groups = [day.questionIds.slice(0, splitAt), day.questionIds.slice(splitAt)];
    return groups.map((questionIds, groupIndex) => {
      const courseDay = index * 2 + groupIndex + 1;
      return {
        day: courseDay,
        title: `${day.title} · ${groupIndex === 0 ? "Build" : "Transfer"}`,
        focus: groupIndex === 0 ? day.focus : day.checkpoint,
        tasks: questionIds.length > 0
          ? questionIds.map(amazonQuestionTask)
          : [task(
            `30-d${courseDay}-oa-autopsy`,
            "Coding assessment autopsy",
            20,
            "Explain the pattern, the slowest decision, one failed approach, and the test that would expose it next time.",
            "review",
          )],
      };
    });
  }),
  {
    day: 27,
    title: "System-design transfer",
    focus: "Learn one HLD boundary through failure, repair, rerun, and defense",
    tasks: [verifiedHldTask("30-hld-url-shortener", "url-shortener", "Complete the guided Link City traffic lab and defend the resulting architecture.")],
  },
  {
    day: 28,
    title: "Amazon loop rehearsal",
    focus: "One uninterrupted coding round plus a precise autopsy",
    tasks: [
      task("30-d28-coding-mock", "70-minute coding mock", 70, "Solve two unseen problems, narrate decisions, and finish with tests and complexity.", "mock", "/arena/coding-lab"),
      task("30-d28-autopsy", "Mock autopsy", 25, "Classify every lost minute: recognition, design, implementation, testing, or communication.", "review"),
    ],
  },
  {
    day: 29,
    title: "Design and behavioral rehearsal",
    focus: "Defend one unseen design and absorb probing follow-ups",
    tasks: [
      task("30-d29-lld-mock", "45-minute unseen LLD mock", 45, "Clarify, model, run a change through the design, and defend the tradeoffs.", "mock", "/arena/lld-worlds"),
      task("30-d29-behavior", "Leadership Principle interview", 35, "Answer four metric-backed stories and two follow-ups for each.", "behavioral", "/interview"),
    ],
  },
  {
    day: 30,
    title: "Final readiness",
    focus: "Use the evidence ledger to close only the remaining gaps",
    tasks: [
      task("30-d30-retry", "Clear the review and retry queue", 75, "Rerun every item surfaced by Today until the machine-verified proof is current.", "review", "/"),
      task("30-d30-checklist", "Interview-day checklist", 20, "Freeze recognition cues, design opening, LP story map, and logistics.", "review"),
    ],
  },
];

function amazonQuestionTask(questionId: string): CourseTask {
  const question = getAmazonPrepQuestion(questionId);
  if (!question) throw new Error(`Unknown Amazon course question: ${questionId}`);
  const combatMissionId = getAmazonCombatMissionId(question.id);
  if (combatMissionId) {
    return {
      id: `amazon-${question.id}`,
      title: question.title,
      description: `${question.recallCue} Prove it: ${question.proof}`,
      minutes: question.minutes,
      kind: "coding",
      route: getCodingCombatMissionRoute(combatMissionId),
      questionId: question.id,
      evidence: { kind: "coding-combat", refId: combatMissionId, label: "Visible and hidden JVM tests" },
    };
  }
  if (question.id === "lld-parking-lot") {
    return {
      id: `amazon-${question.id}`,
      title: question.title,
      description: `${question.recallCue} Prove the model across all six incidents and the free-form defense.`,
      minutes: question.minutes,
      kind: "design",
      route: "/arena/lld-world/parking-lot",
      questionId: question.id,
      evidence: { kind: "parking-lot-world", refId: "parking-lot", label: "Six incidents and design defense" },
    };
  }
  const world = getLldVerificationWorldByQuestion(question.id);
  if (!world) throw new Error(`Amazon course question has no exact verification world: ${question.id}`);
  return {
    id: `amazon-${question.id}`,
    title: question.title,
    description: `${question.recallCue} Prove the object model across ${world.incidents.length} incidents and the free-form defense.`,
    minutes: question.minutes,
    kind: "design",
    route: getLldVerificationWorldRoute(world.id),
    questionId: question.id,
    evidence: { kind: "lld-world", refId: world.id, label: `${world.incidents.length} incidents and design defense` },
  };
}

function verifiedHldTask(id: string, worldId: HldVerificationWorldId, description: string): CourseTask {
  return {
    id,
    title: "URL Shortener traffic lab",
    description,
    minutes: 55,
    kind: "design",
    route: `/arena/hld-world/${worldId}`,
    evidence: { kind: "hld-world", refId: worldId, label: "Traffic incidents and architecture defense" },
  };
}

function finalSprintTasks(day: number): CourseTask[] {
  if (day === 14) {
    return [
      task("d14-coding-mock", "70-minute coding mock", 70, "Use two unseen questions. Narrate, test, and state complexity before stopping.", "mock", "/arena/coding-lab"),
      task("d14-lld-mock", "45-minute LLD mock", 45, "Choose an unseen exact world, work without hints, and defend the change boundary.", "mock", "/arena/lld-worlds"),
      task("d14-behavior", "Leadership Principle follow-ups", 20, "Answer two metric-backed stories with probing follow-ups.", "behavioral", "/interview"),
    ];
  }
  return [
    task("d15-retry", "Clear the review and retry queue", 90, "Redo the weakest verified missions surfaced by Today. A reread does not count.", "review", "/"),
    task("d15-interview", "Final mock interview", 35, "Practice concise technical and Leadership Principle answers out loud.", "mock", "/interview"),
    task("d15-checklist", "Interview-day checklist", 15, "Freeze recognition cues, design opening, LP story map, and logistics.", "review"),
  ];
}

export function buildCoursePlan(length: CourseLength): CourseDay[] {
  return length === 15 ? SPRINT_15 : SPRINT_30;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function atLocalMidnight(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function getCurrentCourseDay(startDate: string, length: CourseLength, now = new Date()): number {
  const start = atLocalMidnight(startDate);
  const today = atLocalMidnight(formatLocalDate(now));
  const elapsed = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, Math.min(length, elapsed + 1));
}

export function getDaysUntil(interviewDate: string | undefined, now = new Date()): number | undefined {
  if (!interviewDate) return undefined;
  const interview = atLocalMidnight(interviewDate);
  const today = atLocalMidnight(formatLocalDate(now));
  return Math.ceil((interview.getTime() - today.getTime()) / 86_400_000);
}

export function getDayMinutes(day: CourseDay): number {
  return day.tasks.reduce((total, current) => total + current.minutes, 0);
}
