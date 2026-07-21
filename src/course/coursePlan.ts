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
import {
  getAmazonBehavioralMissionForDay,
  getAmazonTechnicalConceptForDay,
  type AmazonBehavioralMission,
  type AmazonTechnicalConceptCheck,
} from "@/content/amazonInterviewReadiness";

export type CourseLength = 15 | 20 | 30;
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
  tasks: sprintDayTasks(day.day, day.questionIds),
}));

interface TechnicalCourseDay {
  title: string;
  focus: string;
  questionIds: string[];
}

/**
 * All 28 Must-do DSA, 14 Good-to-do DSA, 6 Must-do LLD, and 5 Good-to-do
 * LLD questions. The first fourteen days interleave DSA patterns; the next
 * four move into object-oriented design. Amazon explicitly told this candidate
 * to disregard system design, so HLD never displaces interview-critical work.
 */
const AMAZON_20_DAY_TECHNICAL_SEQUENCE: TechnicalCourseDay[] = [
  { title: "Hash maps and prefix state", focus: "Build lookup and prefix invariants that survive negative values and duplicate inputs", questionIds: ["dsa-two-sum", "dsa-product-except-self", "dsa-subarray-sum-k"] },
  { title: "Windows and monotonic state", focus: "Control a moving boundary and keep only unresolved stack state", questionIds: ["dsa-longest-substring", "dsa-min-stack", "dsa-daily-temperatures"] },
  { title: "Deque and interval invariants", focus: "Remove dominated candidates and normalize overlapping ranges", questionIds: ["dsa-sliding-window-max", "dsa-merge-intervals", "dsa-insert-interval"] },
  { title: "Heaps and selection", focus: "Choose between sorting, bounded heaps, buckets, and quickselect from the constraints", questionIds: ["dsa-top-k-frequent", "dsa-k-closest", "dsa-kth-largest"] },
  { title: "Greedy scheduling and partitioning", focus: "Name the greedy invariant before writing the loop", questionIds: ["dsa-task-scheduler", "dsa-jump-game", "dsa-sort-colors"] },
  { title: "Mutable structures and sequence transforms", focus: "Protect O(1) structure invariants while pointers and array order change", questionIds: ["dsa-lru-cache", "dsa-reorder-list", "dsa-next-permutation"] },
  { title: "Trees from leaves upward", focus: "Choose BFS or postorder from the information each parent needs", questionIds: ["dsa-level-order", "dsa-validate-bst", "dsa-count-univalue"] },
  { title: "Tree paths and neighborhoods", focus: "Define each recursive return value and when parent traversal is required", questionIds: ["dsa-lca", "dsa-distance-k", "dsa-path-sum"] },
  { title: "Grid and graph traversal", focus: "Make visited state, sources, and component boundaries explicit", questionIds: ["dsa-number-islands", "dsa-rotting-oranges", "dsa-clone-graph"] },
  { title: "Dependencies and shortest transformations", focus: "Model implicit edges, connected components, and valid dependency order", questionIds: ["dsa-course-schedule-ii", "dsa-word-ladder", "dsa-accounts-merge"] },
  { title: "Binary-search boundaries", focus: "Prove which half still contains the answer before moving a pointer", questionIds: ["dsa-search-rotated", "dsa-single-sorted", "dsa-trapping-water"] },
  { title: "Backtracking without duplicate work", focus: "Build only valid prefixes, restore state, and explain the decision tree", questionIds: ["dsa-generate-parentheses", "dsa-word-search", "dsa-subsets"] },
  { title: "Dynamic programming foundations", focus: "State the subproblem, transition, base cases, and memory reduction", questionIds: ["dsa-unique-paths-ii", "dsa-house-robber-ii", "dsa-coin-change"] },
  { title: "Dynamic programming transfer", focus: "Derive unfamiliar recurrences instead of recalling finished code", questionIds: ["dsa-maximum-subarray", "dsa-falling-path", "dsa-maximal-square"] },
  { title: "LLD ownership foundations", focus: "Clarify scope, identify objects, and keep data beside the behavior that protects it", questionIds: ["lld-parking-lot", "lld-circular-buffer", "lld-coupon"] },
  { title: "LLD performance and lifecycle", focus: "Model eviction, delivery, inventory, and lifecycle changes with explicit invariants", questionIds: ["lld-lru-cache", "lld-amazon-locker", "lld-library"] },
  { title: "LLD state machines", focus: "Make transitions, invalid actions, recovery, and concurrency visible", questionIds: ["lld-vending-machine", "lld-elevator", "lld-atm"] },
  { title: "LLD transfer and resume defense", focus: "Build two unseen object models, then defend the strongest technical claim on your resume", questionIds: ["lld-file-system", "lld-splitwise"] },
];

const BLIND_TRANSFER_BY_DAY: Partial<Record<number, CodingCombatMissionId>> = {
  4: "blind-budget-window",
  7: "blind-ring-pairs",
  9: "blind-failure-groups",
  12: "blind-release-order",
  14: "blind-cooldown-value",
  18: "blind-capacity-split",
};

const AMAZON_20_DAY_TECHNICAL_DAYS: CourseDay[] = AMAZON_20_DAY_TECHNICAL_SEQUENCE.map((day, index) => {
  const courseDay = index + 1;
  const tasks = [
    ...day.questionIds.map(amazonQuestionTask),
    ...optionalBehavioralTask(courseDay),
    ...optionalConceptTask(courseDay),
  ];
  const blindMissionId = BLIND_TRANSFER_BY_DAY[courseDay];
  if (blindMissionId) tasks.push(blindTransferTask(blindMissionId));
  if (courseDay === 18) {
    tasks.push(task(
      "20-d18-resume-defense",
      "Resume technical cross-examination",
      30,
      "Paste the submitted resume and job description. Defend one quantified claim, one technology choice, one rejected alternative, the tests, failure modes, and exactly what you owned.",
      "behavioral",
      "/interview?company=amazon",
    ));
  }
  return { day: courseDay, title: day.title, focus: day.focus, tasks };
});

const SPRINT_20: CourseDay[] = [
  ...AMAZON_20_DAY_TECHNICAL_DAYS,
  {
    day: 19,
    title: "Amazon loop simulation · rounds 1 and 2",
    focus: "Run two complete one-hour rounds with coding, behavioral follow-ups, and your interviewer questions",
    tasks: [...amazonRoundTasks(1), ...amazonRoundTasks(2)],
  },
  {
    day: 20,
    title: "Amazon loop simulation · rounds 3 and 4",
    focus: "Finish the four-round rehearsal and freeze only evidence-backed interview habits",
    tasks: [
      ...amazonRoundTasks(3),
      ...amazonRoundTasks(4),
      task("20-d20-checklist", "Interview-day rules", 15, "Freeze the 8 to 10 story map, coding protocol, technical-Q&A gaps, four interviewer questions, logistics, and the no-GenAI rule.", "review"),
    ],
  },
];

const SPRINT_30: CourseDay[] = [
  ...AMAZON_20_DAY_TECHNICAL_DAYS,
  ...Array.from({ length: 9 }, (_, index): CourseDay => {
    const courseDay = index + 19;
    const reviewNumber = index + 1;
    return {
      day: courseDay,
      title: reviewNumber % 3 === 1 ? "Cold retrieval" : reviewNumber % 3 === 2 ? "Variant transfer" : "Communication repair",
      focus: reviewNumber % 3 === 1
        ? "Redo due problems without notes and record the first point where recall failed"
        : reviewNumber % 3 === 2
          ? "Solve a listed variation and explain why the original invariant still applies"
          : "Practice coding aloud, STAR follow-ups, and resume claim defense without adding new material",
      tasks: [
        task(`30-d${courseDay}-review`, "Clear due reviews and retry queue", 75, "Open Today, rerun every due or Learning item, and record proof only after the full solution survives.", "review", "/"),
        task(`30-d${courseDay}-recall`, "One no-notes explanation", 20, "Explain one algorithm, OOD decision, or STAR story from memory. Then compare against the proof checklist and repair the missing part.", "review"),
      ],
    };
  }),
  {
    day: 28,
    title: "Resume and technical-Q&A defense",
    focus: "Defend every metric and close the weakest official technical topic",
    tasks: [
      task("30-d28-resume", "Resume cross-examination", 50, "Paste the submitted resume and JD, then answer the strongest claim, hardest failure, technology trade-off, and nearest honest gap.", "behavioral", "/interview?company=amazon"),
      task("30-d28-qa", "Technical Q&A rapid round", 35, "Explain Java, data structures, complexity, testing, OOD, databases, concurrency, networking, and AI-development trade-offs without notes.", "review"),
    ],
  },
  {
    day: 29,
    title: "Amazon loop simulation · rounds 1 and 2",
    focus: "Run two complete one-hour rounds exactly as described by the recruiter",
    tasks: [...amazonRoundTasks(1), ...amazonRoundTasks(2)].map((item) => ({ ...item, id: `30-${item.id}` })),
  },
  {
    day: 30,
    title: "Amazon loop simulation · rounds 3 and 4",
    focus: "Finish the loop, review evidence, and stop adding new material",
    tasks: [
      ...amazonRoundTasks(3).map((item) => ({ ...item, id: `30-${item.id}` })),
      ...amazonRoundTasks(4).map((item) => ({ ...item, id: `30-${item.id}` })),
      task("30-d30-checklist", "Interview-day rules", 15, "Freeze the story map, coding protocol, interviewer questions, logistics, and the no-GenAI rule.", "review"),
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
  if (!world) {
    return {
      id: `amazon-${question.id}`,
      title: question.title,
      description: `${question.recallCue} Prove it: ${question.proof} Transfer: ${question.variations.join("; ")}.`,
      minutes: question.minutes,
      kind: question.track === "dsa" ? "coding" : "design",
      route: question.track === "dsa" ? `/companies/amazon/sde1?question=${question.id}` : question.href,
      questionId: question.id,
    };
  }
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

function blindTransferTask(missionId: CodingCombatMissionId): CourseTask {
  return {
    id: `amazon-blind-${missionId}`,
    title: "Blind transfer · unfamiliar problem",
    description: "Read an original scenario with no pattern label, commit to your reasoning, write real Java, pass hidden tests, and explain the invariant before the pattern is revealed.",
    minutes: missionId === "blind-release-order" || missionId === "blind-capacity-split" ? 45 : missionId === "blind-cooldown-value" || missionId === "blind-failure-groups" ? 40 : 35,
    kind: "coding",
    route: getCodingCombatMissionRoute(missionId),
    evidence: { kind: "coding-combat", refId: missionId, label: "Blind reasoning, real Java, and hidden JVM tests" },
  };
}

function sprintDayTasks(day: number, questionIds: string[]): CourseTask[] {
  if (day >= 14) return finalSprintTasks(day);
  const technicalTasks = questionIds.map(amazonQuestionTask);
  if (day === 10) {
    technicalTasks.push(task(
      "d10-coding-mock",
      "70-minute two-problem coding mock",
      70,
      "Ask clarifying questions, state assumptions, narrate real Java, test edge cases, and discuss optimization exactly as the recruiter guidance requires.",
      "mock",
      "/arena/coding-lab",
    ));
  }
  return [
    ...technicalTasks,
    ...optionalBehavioralTask(day),
    ...optionalConceptTask(day),
  ];
}

function optionalBehavioralTask(day: number): CourseTask[] {
  const mission = getAmazonBehavioralMissionForDay(day);
  return mission ? [amazonBehavioralTask(mission)] : [];
}

function amazonBehavioralTask(mission: AmazonBehavioralMission): CourseTask {
  return task(
    `amazon-story-${mission.id}`,
    `STAR story: ${mission.title}`,
    12,
    `${mission.resumeMiningCue} Prove: ${mission.proof.join("; ")}.`,
    "behavioral",
    `/interview?company=amazon&mission=${mission.id}`,
  );
}

function optionalConceptTask(day: number): CourseTask[] {
  const concept = getAmazonTechnicalConceptForDay(day);
  return concept ? [amazonConceptTask(concept)] : [];
}

function amazonConceptTask(concept: AmazonTechnicalConceptCheck): CourseTask {
  return task(
    `amazon-concept-${concept.id}`,
    `Technical Q&A: ${concept.title}`,
    8,
    `${concept.why} Answer aloud: ${concept.prompts.join(" Then: ")}`,
    "review",
  );
}

function amazonRoundTasks(round: number): CourseTask[] {
  return [
    task(
      `amazon-round-${round}-coding`,
      `Round ${round}: technical Q&A and live coding`,
      40,
      "Clarify, state assumptions, validate an example, narrate real Java, test edge cases, and discuss optimization.",
      "mock",
      "/arena/coding-lab",
    ),
    task(
      `amazon-round-${round}-behavioral`,
      `Round ${round}: behavioral follow-up`,
      15,
      "Answer one unseen resume or Leadership Principle question in complete STAR form, then take two probing follow-ups.",
      "behavioral",
      "/interview?company=amazon",
    ),
    task(
      `amazon-round-${round}-candidate-question`,
      `Round ${round}: your interviewer question`,
      5,
      "Ask one specific question about the team's customers, engineering challenges, ownership, or success measures. Avoid questions answered by the job page.",
      "review",
    ),
  ];
}

function finalSprintTasks(day: number): CourseTask[] {
  if (day === 14) {
    return [
      ...amazonRoundTasks(1),
      ...amazonRoundTasks(2),
    ];
  }
  return [
    ...amazonRoundTasks(3),
    ...amazonRoundTasks(4),
    task("d15-checklist", "Interview-day rules", 15, "Freeze the 8 to 10 story map, coding protocol, technical-Q&A gaps, interviewer questions, logistics, and the no-GenAI rule.", "review"),
  ];
}

export function buildCoursePlan(length: CourseLength): CourseDay[] {
  if (length === 15) return SPRINT_15;
  if (length === 20) return SPRINT_20;
  return SPRINT_30;
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
