import { useCallback, useEffect, useState } from "react";
import { PATTERN_GENOME_MAX_SCORE, getGenomeStars } from "@/arena/patternGenomeEngine";
import { PATTERN_GENOME_MISSION_IDS } from "@/arena/patternGenomeMissions";
import type { PatternGenomeMissionId } from "@/arena/patternGenomeMissions";

export interface PatternGenomeRecord {
  bestScore: number;
  maxScore: number;
  stars: number;
  attempts: number;
  completedAt: number;
}

export type PatternGenomeProgress = Partial<Record<PatternGenomeMissionId, PatternGenomeRecord>>;

const STORAGE_KEY = "patterncache.pattern-genome.v1";

export function sanitizePatternGenomeProgress(value: unknown): PatternGenomeProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const progress: PatternGenomeProgress = {};

  for (const missionId of PATTERN_GENOME_MISSION_IDS) {
    const candidate = source[missionId];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const record = candidate as Record<string, unknown>;
    const bestScore = finiteNumber(record.bestScore);
    const attempts = finiteNumber(record.attempts);
    const completedAt = finiteNumber(record.completedAt);
    if (bestScore === undefined || attempts === undefined || completedAt === undefined) continue;
    const clampedScore = Math.max(0, Math.min(PATTERN_GENOME_MAX_SCORE, Math.round(bestScore)));
    progress[missionId] = {
      bestScore: clampedScore,
      maxScore: PATTERN_GENOME_MAX_SCORE,
      stars: getGenomeStars(clampedScore),
      attempts: Math.max(1, Math.round(attempts)),
      completedAt: Math.max(0, Math.round(completedAt)),
    };
  }
  return progress;
}

export function usePatternGenomeProgress() {
  const [progress, setProgress] = useState<PatternGenomeProgress>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? sanitizePatternGenomeProgress(JSON.parse(raw)) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Keep the session playable when browser storage is unavailable.
    }
  }, [progress]);

  const recordRun = useCallback((missionId: PatternGenomeMissionId, score: number) => {
    if (!PATTERN_GENOME_MISSION_IDS.includes(missionId) || !Number.isFinite(score)) return;
    const safeScore = Math.max(0, Math.min(PATTERN_GENOME_MAX_SCORE, Math.round(score)));
    setProgress((current) => {
      const previous = current[missionId];
      const bestScore = Math.max(previous?.bestScore ?? 0, safeScore);
      return {
        ...current,
        [missionId]: {
          bestScore,
          maxScore: PATTERN_GENOME_MAX_SCORE,
          stars: getGenomeStars(bestScore),
          attempts: (previous?.attempts ?? 0) + 1,
          completedAt: Date.now(),
        },
      };
    });
  }, []);

  return { progress, recordRun };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
