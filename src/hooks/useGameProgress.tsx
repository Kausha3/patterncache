import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { buildCoursePlan, formatLocalDate, getCurrentCourseDay } from "@/course/coursePlan";
import {
  calculateGameProgress,
  describeDailyTarget,
  getChallengeCheckpoints,
  selectDailyTarget,
} from "@/game/gameEngine";
import type {
  ChallengeCheckpoint,
  ChallengeCheckpointId,
  GameProgressSummary,
} from "@/game/gameEngine";
import { getLesson } from "@/content";
import type { Lesson } from "@/types";
import { CODING_COMBAT_MISSION_IDS, LLD_STUDIO_MISSION_IDS } from "@/arena/types";
import type {
  ArenaMode,
  ArenaScoreRecord,
  ArenaScores,
  CodingCombatMissionId,
  CodingCombatScores,
  LldStudioMissionId,
  LldStudioScores,
} from "@/arena/types";
import { useCoursePlan } from "@/hooks/useCoursePlan";
import { useProgress } from "@/hooks/useProgress";

interface GameState {
  dailyTargets: Record<string, string>;
  challengeCheckpoints: Record<string, ChallengeCheckpointId[]>;
  arenaScores: ArenaScores;
  codingCombatScores: CodingCombatScores;
  lldStudioScores: LldStudioScores;
}

export interface DailyChallengeView {
  date: string;
  targetLessonId: string;
  targetTitle: string;
  targetTrack: Lesson["track"];
  reason: string;
  checkpoints: ChallengeCheckpoint[];
  completedCheckpointIds: ChallengeCheckpointId[];
  completeCount: number;
  completed: boolean;
  availableXp: number;
}

interface GameProgressContextValue {
  summary: GameProgressSummary;
  challenge: DailyChallengeView;
  toggleChallengeCheckpoint: (checkpointId: Exclude<ChallengeCheckpointId, "lesson">) => void;
  /** Raw persisted maps, exposed so the competency ledger can derive evidence. */
  challengeCheckpoints: Record<string, ChallengeCheckpointId[]>;
  dailyTargets: Record<string, string>;
  arenaScores: ArenaScores;
  recordArenaRun: (mode: ArenaMode, score: number, maxScore: number) => void;
  codingCombatScores: CodingCombatScores;
  recordCodingCombatRun: (missionId: CodingCombatMissionId, score: number, maxScore: number) => void;
  lldStudioScores: LldStudioScores;
  recordLldStudioRun: (missionId: LldStudioMissionId, score: number, maxScore: number) => void;
}

const STORAGE_KEY = "patterncache.game.v1";
const GameProgressContext = createContext<GameProgressContextValue | null>(null);

function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dailyTargets: {}, challengeCheckpoints: {}, arenaScores: {}, codingCombatScores: {}, lldStudioScores: {} };
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const dailyTargets = parsed.dailyTargets && typeof parsed.dailyTargets === "object"
      ? Object.fromEntries(
          Object.entries(parsed.dailyTargets).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        )
      : {};
    const validCheckpoints = new Set<ChallengeCheckpointId>(["recall", "lesson", "defend"]);
    const challengeCheckpoints = parsed.challengeCheckpoints && typeof parsed.challengeCheckpoints === "object"
      ? Object.fromEntries(
          Object.entries(parsed.challengeCheckpoints).map(([date, checkpoints]) => [
            date,
            Array.isArray(checkpoints)
              ? [...new Set(checkpoints.filter((id): id is ChallengeCheckpointId => validCheckpoints.has(id)))]
              : [],
          ]),
        )
      : {};
    const arenaScores: ArenaScores = {};
    for (const mode of ["coding", "hld", "lld"] as ArenaMode[]) {
      const record = sanitizeScoreRecord(parsed.arenaScores?.[mode]);
      if (record) arenaScores[mode] = record;
    }
    const codingCombatScores: CodingCombatScores = {};
    if (parsed.codingCombatScores && typeof parsed.codingCombatScores === "object") {
      for (const missionId of CODING_COMBAT_MISSION_IDS) {
        const record = sanitizeScoreRecord(parsed.codingCombatScores[missionId]);
        if (record) codingCombatScores[missionId] = record;
      }
    }
    const lldStudioScores: LldStudioScores = {};
    if (parsed.lldStudioScores && typeof parsed.lldStudioScores === "object") {
      for (const missionId of LLD_STUDIO_MISSION_IDS) {
        const record = sanitizeScoreRecord(parsed.lldStudioScores[missionId]);
        if (record) lldStudioScores[missionId] = record;
      }
    }
    return {
      dailyTargets,
      challengeCheckpoints,
      arenaScores,
      codingCombatScores,
      lldStudioScores,
    };
  } catch {
    return { dailyTargets: {}, challengeCheckpoints: {}, arenaScores: {}, codingCombatScores: {}, lldStudioScores: {} };
  }
}

function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage pressure: retain the active in-memory session.
  }
}

export function GameProgressProvider({ children }: { children: ReactNode }) {
  const { preferences, completedTaskIds, completedTaskDates } = useCoursePlan();
  const { progress } = useProgress();
  const [state, setState] = useState<GameState>(() => loadGameState());
  const today = formatLocalDate(new Date());
  const plan = useMemo(() => buildCoursePlan(preferences?.length ?? 15), [preferences?.length]);
  const currentDay = preferences ? getCurrentCourseDay(preferences.startDate, preferences.length) : 1;
  const suggestedTarget = useMemo(
    () => selectDailyTarget(plan, currentDay, progress),
    [plan, currentDay, progress],
  );
  const storedTargetId = state.dailyTargets[today];
  const targetLessonId = storedTargetId && getLesson(storedTargetId) ? storedTargetId : suggestedTarget.lessonId;
  const targetLesson = getLesson(targetLessonId)!;

  useEffect(() => {
    saveGameState(state);
  }, [state]);

  useEffect(() => {
    setState((current) => current.dailyTargets[today] && getLesson(current.dailyTargets[today])
      ? current
      : { ...current, dailyTargets: { ...current.dailyTargets, [today]: suggestedTarget.lessonId } });
  }, [today, suggestedTarget.lessonId]);

  useEffect(() => {
    if (progress[targetLessonId]?.status !== "completed") return;
    setState((current) => {
      const checkpoints = current.challengeCheckpoints[today] ?? [];
      if (checkpoints.includes("lesson")) return current;
      return {
        ...current,
        challengeCheckpoints: {
          ...current.challengeCheckpoints,
          [today]: [...checkpoints, "lesson"],
        },
      };
    });
  }, [progress, targetLessonId, today]);

  const toggleChallengeCheckpoint = useCallback((checkpointId: Exclude<ChallengeCheckpointId, "lesson">) => {
    setState((current) => {
      const checkpoints = current.challengeCheckpoints[today] ?? [];
      const exists = checkpoints.includes(checkpointId);
      return {
        ...current,
        challengeCheckpoints: {
          ...current.challengeCheckpoints,
          [today]: exists
            ? checkpoints.filter((id) => id !== checkpointId)
            : [...checkpoints, checkpointId],
        },
      };
    });
  }, [today]);

  const recordArenaRun = useCallback((mode: ArenaMode, score: number, maxScore: number) => {
    if (!isValidCompletedScore(score, maxScore)) return;
    setState((current) => {
      const previous = current.arenaScores[mode];
      const record: ArenaScoreRecord = {
        bestScore: Math.max(previous?.bestScore ?? 0, Math.min(score, maxScore)),
        maxScore,
        completedAt: Date.now(),
        attempts: (previous?.attempts ?? 0) + 1,
      };
      return {
        ...current,
        arenaScores: { ...current.arenaScores, [mode]: record },
      };
    });
  }, []);

  const recordCodingCombatRun = useCallback((missionId: CodingCombatMissionId, score: number, maxScore: number) => {
    if (!CODING_COMBAT_MISSION_IDS.includes(missionId) || !isValidCompletedScore(score, maxScore)) return;
    setState((current) => {
      const previous = current.codingCombatScores[missionId];
      const record: ArenaScoreRecord = {
        bestScore: Math.max(previous?.bestScore ?? 0, Math.min(score, maxScore)),
        maxScore,
        completedAt: Date.now(),
        attempts: (previous?.attempts ?? 0) + 1,
      };
      return {
        ...current,
        codingCombatScores: { ...current.codingCombatScores, [missionId]: record },
      };
    });
  }, []);

  const recordLldStudioRun = useCallback((missionId: LldStudioMissionId, score: number, maxScore: number) => {
    if (!LLD_STUDIO_MISSION_IDS.includes(missionId) || !isValidCompletedScore(score, maxScore)) return;
    setState((current) => {
      const previous = current.lldStudioScores[missionId];
      const record: ArenaScoreRecord = {
        bestScore: Math.max(previous?.bestScore ?? 0, Math.min(score, maxScore)),
        maxScore,
        completedAt: Date.now(),
        attempts: (previous?.attempts ?? 0) + 1,
      };
      return {
        ...current,
        lldStudioScores: { ...current.lldStudioScores, [missionId]: record },
      };
    });
  }, []);

  const summary = useMemo(
    () => calculateGameProgress({
      plan,
      completedTaskIds,
      completedTaskDates,
      progress,
      dailyTargets: state.dailyTargets,
      challengeCheckpoints: state.challengeCheckpoints,
      arenaScores: state.arenaScores,
      codingCombatScores: state.codingCombatScores,
      lldStudioScores: state.lldStudioScores,
    }),
    [plan, completedTaskIds, completedTaskDates, progress, state.dailyTargets, state.challengeCheckpoints, state.arenaScores, state.codingCombatScores, state.lldStudioScores],
  );

  const completedCheckpointIds = useMemo(() => {
    const checkpoints = state.challengeCheckpoints[today] ?? [];
    if (progress[targetLessonId]?.status === "completed" && !checkpoints.includes("lesson")) {
      return [...checkpoints, "lesson"] as ChallengeCheckpointId[];
    }
    return checkpoints;
  }, [progress, state.challengeCheckpoints, targetLessonId, today]);
  const checkpoints = useMemo(() => getChallengeCheckpoints(targetLesson.track), [targetLesson.track]);
  const challenge = useMemo<DailyChallengeView>(() => ({
    date: today,
    targetLessonId,
    targetTitle: targetLesson.title,
    targetTrack: targetLesson.track,
    reason: describeDailyTarget(targetLessonId, plan, currentDay, progress),
    checkpoints,
    completedCheckpointIds,
    completeCount: completedCheckpointIds.length,
    completed: completedCheckpointIds.length === checkpoints.length,
    availableXp: checkpoints.reduce((total, checkpoint) => total + checkpoint.xp, 0) + 100,
  }), [today, targetLessonId, targetLesson.title, targetLesson.track, plan, currentDay, progress, checkpoints, completedCheckpointIds]);

  const value = useMemo<GameProgressContextValue>(
    () => ({
      summary,
      challenge,
      toggleChallengeCheckpoint,
      challengeCheckpoints: state.challengeCheckpoints,
      dailyTargets: state.dailyTargets,
      arenaScores: state.arenaScores,
      recordArenaRun,
      codingCombatScores: state.codingCombatScores,
      recordCodingCombatRun,
      lldStudioScores: state.lldStudioScores,
      recordLldStudioRun,
    }),
    [summary, challenge, toggleChallengeCheckpoint, state.challengeCheckpoints, state.dailyTargets, state.arenaScores, recordArenaRun, state.codingCombatScores, recordCodingCombatRun, state.lldStudioScores, recordLldStudioRun],
  );

  return <GameProgressContext.Provider value={value}>{children}</GameProgressContext.Provider>;
}

function sanitizeScoreRecord(candidate: unknown): ArenaScoreRecord | undefined {
  if (!candidate || typeof candidate !== "object") return undefined;
  const record = candidate as Partial<ArenaScoreRecord>;
  if (
    typeof record.bestScore !== "number" || !Number.isFinite(record.bestScore) || record.bestScore < 0 ||
    typeof record.maxScore !== "number" || !Number.isFinite(record.maxScore) || record.maxScore <= 0 ||
    record.bestScore > record.maxScore ||
    typeof record.completedAt !== "number" || !Number.isFinite(record.completedAt) || record.completedAt <= 0 ||
    typeof record.attempts !== "number" || !Number.isInteger(record.attempts) || record.attempts < 1
  ) return undefined;
  return record as ArenaScoreRecord;
}

function isValidCompletedScore(score: number, maxScore: number): boolean {
  return Number.isFinite(score) && score >= 0 && Number.isFinite(maxScore) && maxScore > 0;
}

export function useGameProgress(): GameProgressContextValue {
  const context = useContext(GameProgressContext);
  if (!context) throw new Error("useGameProgress must be used within <GameProgressProvider>");
  return context;
}
