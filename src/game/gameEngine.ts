import { formatLocalDate } from "@/course/coursePlan";
import type { CourseDay } from "@/course/coursePlan";
import type { CourseTask } from "@/course/coursePlan";
import { getLesson, RECOMMENDED_FIRST } from "@/content";
import type { Lesson, ProgressMap } from "@/types";
import type { ArenaScoreRecord, ArenaScores, CodingCombatScores, LldStudioScores } from "@/arena/types";

export type ChallengeCheckpointId = "recall" | "lesson" | "defend";

export interface GameRank {
  level: number;
  name: string;
  minXp: number;
}

export interface GameAchievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface GameProgressSummary {
  xp: number;
  rank: GameRank;
  nextRank?: GameRank;
  levelProgress: number;
  xpIntoLevel: number;
  xpForLevel: number;
  streak: number;
  completedCourseTasks: number;
  totalCourseTasks: number;
  bossesCleared: number;
  arenaClears: number;
  arenaXp: number;
  codingCombatClears: number;
  codingCombatXp: number;
  lldStudioClears: number;
  lldStudioXp: number;
  achievements: GameAchievement[];
}

export interface DailyTarget {
  lessonId: string;
  reason: string;
}

export interface ChallengeCheckpoint {
  id: ChallengeCheckpointId;
  label: string;
  description: string;
  xp: number;
  automatic: boolean;
}

const RANKS: GameRank[] = [
  { level: 1, name: "Pattern Scout", minXp: 0 },
  { level: 2, name: "Signal Finder", minXp: 500 },
  { level: 3, name: "Systems Builder", minXp: 1_200 },
  { level: 4, name: "Design Strategist", minXp: 2_200 },
  { level: 5, name: "Interview Architect", minXp: 3_600 },
  { level: 6, name: "Bar Raiser", minXp: 5_400 },
];

const CHECKPOINT_XP: Record<ChallengeCheckpointId, number> = {
  recall: 30,
  lesson: 80,
  defend: 40,
};

const BOSS_CLEAR_BONUS = 100;

export function getGameRank(xp: number): { rank: GameRank; nextRank?: GameRank } {
  let safeIndex = 0;
  for (let index = 1; index < RANKS.length; index += 1) {
    if (xp < RANKS[index].minXp) break;
    safeIndex = index;
  }
  return { rank: RANKS[safeIndex], nextRank: RANKS[safeIndex + 1] };
}

export function getCourseTaskXp(task: CourseTask): number {
  return task.lessonId ? 80 + task.minutes : 30 + Math.min(task.minutes, 60);
}

export function selectDailyTarget(plan: CourseDay[], currentDay: number, progress: ProgressMap): DailyTarget {
  const lessonIds = uniqueLessonIds(plan);
  // The evidence-driven course routes directly to executable missions and no
  // longer embeds generic lessons. Keep this frozen legacy challenge stable by
  // falling back to lessons the learner has actually touched.
  const touchedLessonIds = Object.keys(progress).filter((id) => !!getLesson(id));
  const playableIds = lessonIds.length > 0
    ? lessonIds.filter((id) => !!getLesson(id))
    : touchedLessonIds;

  const shaky = playableIds.find((id) => progress[id]?.confidence === "shaky");
  if (shaky) {
    return { lessonId: shaky, reason: "Resurfaced because your confidence is shaky. Stabilize it before the next mock." };
  }

  const inProgress = playableIds.find((id) => progress[id]?.status === "in-progress");
  if (inProgress) {
    return { lessonId: inProgress, reason: "You already opened this skill. Finish the loop while the context is still warm." };
  }

  const todayLesson = plan[currentDay - 1]?.tasks.find(
    (task) => task.lessonId && progress[task.lessonId]?.status !== "completed" && getLesson(task.lessonId),
  )?.lessonId;
  if (todayLesson) {
    return { lessonId: todayLesson, reason: "Pulled directly from today’s campaign so the challenge reinforces your scheduled work." };
  }

  const nextLesson = playableIds.find((id) => progress[id]?.status !== "completed");
  if (nextLesson) {
    return { lessonId: nextLesson, reason: "This is the next unfinished skill in your interview campaign." };
  }

  const oldestCompleted = [...playableIds].sort(
    (a, b) => (progress[a]?.lastVisited ?? 0) - (progress[b]?.lastVisited ?? 0),
  )[0];
  return {
    lessonId: oldestCompleted ?? RECOMMENDED_FIRST,
    reason: "Campaign cleared. This mastery defense revisits the skill you have left untouched the longest.",
  };
}

export function describeDailyTarget(
  lessonId: string,
  plan: CourseDay[],
  currentDay: number,
  progress: ProgressMap,
): string {
  if (progress[lessonId]?.confidence === "shaky") {
    return "Resurfaced because your confidence is shaky. Stabilize it before the next mock.";
  }
  if (progress[lessonId]?.status === "in-progress") {
    return "You already opened this skill. Finish the loop while the context is still warm.";
  }
  if (plan[currentDay - 1]?.tasks.some((task) => task.lessonId === lessonId)) {
    return "Pulled directly from today’s campaign so the challenge reinforces your scheduled work.";
  }
  if (progress[lessonId]?.status === "completed") {
    return "Mastery defense: recall and explain the design again without leaning on the finished answer.";
  }
  return "This is the next unfinished skill in your interview campaign.";
}

export function getChallengeCheckpoints(track: Lesson["track"]): ChallengeCheckpoint[] {
  const copy: Record<Lesson["track"], { recall: string; defend: string }> = {
    dsa: {
      recall: "Name the recognition trigger and invariant without opening the lesson.",
      defend: "Explain the complexity and one input that breaks the brute-force approach.",
    },
    "system-design": {
      recall: "State the core requirements, scale assumption, and first bottleneck from memory.",
      defend: "Defend one tradeoff and describe how the system fails under pressure.",
    },
    lld: {
      recall: "Name the core classes and the responsibility owned by each one.",
      defend: "Explain one rejected class, one edge case, and the principle protecting the model.",
    },
  };

  return [
    { id: "recall", label: "Recall the signal", description: copy[track].recall, xp: CHECKPOINT_XP.recall, automatic: false },
    { id: "lesson", label: "Clear the core interaction", description: "Complete the lesson’s practice, Build it, or Design it interaction and rate your confidence.", xp: CHECKPOINT_XP.lesson, automatic: true },
    { id: "defend", label: "Defend the decision", description: copy[track].defend, xp: CHECKPOINT_XP.defend, automatic: false },
  ];
}

export function calculateGameProgress({
  plan,
  completedTaskIds,
  completedTaskDates,
  progress,
  dailyTargets,
  challengeCheckpoints,
  arenaScores = {},
  codingCombatScores = {},
  lldStudioScores = {},
  now = new Date(),
}: {
  plan: CourseDay[];
  completedTaskIds: string[];
  completedTaskDates: Record<string, string>;
  progress: ProgressMap;
  dailyTargets: Record<string, string>;
  challengeCheckpoints: Record<string, ChallengeCheckpointId[]>;
  arenaScores?: ArenaScores;
  codingCombatScores?: CodingCombatScores;
  lldStudioScores?: LldStudioScores;
  now?: Date;
}): GameProgressSummary {
  const completedIds = new Set(completedTaskIds);
  const tasks = plan.flatMap((day) => day.tasks);
  let xp = 0;
  let completedCourseTasks = 0;

  for (const task of tasks) {
    const complete = task.lessonId
      ? progress[task.lessonId]?.status === "completed"
      : completedIds.has(task.id);
    if (!complete) continue;
    completedCourseTasks += 1;
    xp += getCourseTaskXp(task);
  }

  let bossesCleared = 0;
  for (const date of Object.keys(dailyTargets)) {
    const checkpoints = new Set(challengeCheckpoints[date] ?? []);
    for (const checkpoint of checkpoints) xp += CHECKPOINT_XP[checkpoint];
    if (checkpoints.size === 3) {
      bossesCleared += 1;
      xp += BOSS_CLEAR_BONUS;
    }
  }

  let arenaXp = 0;
  const arenaRecords = Object.values(arenaScores).filter((record) => !!record);
  for (const record of arenaRecords) {
    const performance = record.maxScore > 0 ? Math.min(1, record.bestScore / record.maxScore) : 0;
    arenaXp += 150 + Math.round(performance * 200);
  }
  xp += arenaXp;
  const arenaClears = arenaRecords.length;

  const codingCombatRecords = Object.values(codingCombatScores);
  const codingCombatXp = codingCombatRecords.reduce(
    (total, record) => total + getCodingCombatRecordXp(record),
    0,
  );
  const codingCombatClears = codingCombatRecords.length;
  xp += codingCombatXp;

  const lldStudioRecords = Object.values(lldStudioScores).filter((record) => !!record);
  const lldStudioXp = lldStudioRecords.reduce(
    (total, record) => total + getLldStudioRecordXp(record),
    0,
  );
  const lldStudioClears = lldStudioRecords.length;
  xp += lldStudioXp;

  const activityDates = [
    ...Object.values(completedTaskDates),
    ...Object.values(progress)
      .map((entry) => entry.lastVisited)
      .filter((value): value is number => typeof value === "number")
      .map((value) => formatLocalDate(new Date(value))),
    ...Object.entries(challengeCheckpoints)
      .filter(([, checkpoints]) => checkpoints.length > 0)
      .map(([date]) => date),
    ...arenaRecords.map((record) => formatLocalDate(new Date(record.completedAt))),
    ...codingCombatRecords.map((record) => formatLocalDate(new Date(record.completedAt))),
    ...lldStudioRecords.map((record) => formatLocalDate(new Date(record.completedAt))),
  ];
  const streak = calculateStreak(activityDates, now);
  const { rank, nextRank } = getGameRank(xp);
  const xpIntoLevel = xp - rank.minXp;
  const xpForLevel = nextRank ? nextRank.minXp - rank.minXp : 1;
  const levelProgress = nextRank ? Math.min(1, xpIntoLevel / xpForLevel) : 1;

  const completedLessons = Object.entries(progress)
    .filter(([, entry]) => entry.status === "completed")
    .map(([id]) => getLesson(id))
    .filter((lesson): lesson is Lesson => !!lesson);
  const trackCounts = {
    dsa: completedLessons.filter((lesson) => lesson.track === "dsa").length,
    hld: completedLessons.filter((lesson) => lesson.track === "system-design").length,
    lld: completedLessons.filter((lesson) => lesson.track === "lld").length,
  };
  const achievements: GameAchievement[] = [
    { id: "first-signal", name: "First Signal", description: "Complete your first campaign task.", unlocked: completedCourseTasks >= 1 },
    { id: "pattern-hunter", name: "Pattern Hunter", description: "Complete three DSA lessons.", unlocked: trackCounts.dsa >= 3 },
    { id: "systems-builder", name: "Systems Builder", description: "Complete three HLD lessons.", unlocked: trackCounts.hld >= 3 },
    { id: "object-architect", name: "Object Architect", description: "Complete three LLD lessons.", unlocked: trackCounts.lld >= 3 },
    { id: "boss-breaker", name: "Boss Breaker", description: "Clear a daily boss battle.", unlocked: bossesCleared >= 1 },
    { id: "consistency-engine", name: "Consistency Engine", description: "Build a five-day learning streak.", unlocked: streak >= 5 },
    { id: "code-combatant", name: "Code Combatant", description: "Clear the timed Pattern Combat simulation.", unlocked: !!arenaScores.coding },
    { id: "incident-commander", name: "Incident Commander", description: "Score at least 70% in Incident Command.", unlocked: arenaScoreRatio(arenaScores.hld) >= 0.7 },
    { id: "model-defender", name: "Model Defender", description: "Score at least 70% in Model Defense.", unlocked: arenaScoreRatio(arenaScores.lld) >= 0.7 },
    { id: "full-loop", name: "Full Loop", description: "Clear all three Arena simulations.", unlocked: arenaClears === 3 },
    { id: "code-author", name: "Code Author", description: "Pass every visible and hidden test in a Coding Combat mission.", unlocked: codingCombatClears >= 1 },
    { id: "combat-engineer", name: "Combat Engineer", description: "Build and defend six Coding Combat missions across distinct patterns.", unlocked: codingCombatClears >= 6 },
    { id: "model-builder", name: "Model Builder", description: "Complete a responsibility model in the LLD Design Studio.", unlocked: lldStudioClears >= 1 },
    { id: "change-proof", name: "Change Proof", description: "Defend all three LLD Studio models against requirement mutations.", unlocked: lldStudioClears >= 3 },
  ];

  return {
    xp,
    rank,
    nextRank,
    levelProgress,
    xpIntoLevel,
    xpForLevel,
    streak,
    completedCourseTasks,
    totalCourseTasks: tasks.length,
    bossesCleared,
    arenaClears,
    arenaXp,
    codingCombatClears,
    codingCombatXp,
    lldStudioClears,
    lldStudioXp,
    achievements,
  };
}

export function getCodingCombatRecordXp(record: ArenaScoreRecord): number {
  const performance = record.maxScore > 0 ? Math.min(1, Math.max(0, record.bestScore / record.maxScore)) : 0;
  return 200 + Math.round(performance * 200);
}

export function getLldStudioRecordXp(record: ArenaScoreRecord): number {
  const performance = record.maxScore > 0 ? Math.min(1, Math.max(0, record.bestScore / record.maxScore)) : 0;
  return 250 + Math.round(performance * 200);
}

export function calculateStreak(activityDates: string[], now = new Date()): number {
  const dates = new Set(activityDates);
  const today = formatLocalDate(now);
  const yesterday = shiftDate(today, -1);
  let cursor = dates.has(today) ? today : dates.has(yesterday) ? yesterday : undefined;
  let streak = 0;

  while (cursor && dates.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

function uniqueLessonIds(plan: CourseDay[]): string[] {
  return [...new Set(plan.flatMap((day) => day.tasks.map((task) => task.lessonId).filter((id): id is string => !!id)))];
}

function shiftDate(value: string, amount: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return formatLocalDate(date);
}

function arenaScoreRatio(record: ArenaScores[keyof ArenaScores]): number {
  return record && record.maxScore > 0 ? record.bestScore / record.maxScore : 0;
}
