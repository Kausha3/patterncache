import { describe, expect, it } from "vitest";
import { PATTERN_GENOME_MAX_SCORE } from "@/arena/patternGenomeEngine";
import { sanitizePatternGenomeProgress } from "./usePatternGenomeProgress";

describe("Pattern Genome progress persistence", () => {
  it("drops malformed and unknown mission records", () => {
    expect(sanitizePatternGenomeProgress(null)).toEqual({});
    expect(sanitizePatternGenomeProgress([])).toEqual({});
    expect(sanitizePatternGenomeProgress({
      "subarray-sum": { bestScore: "900", attempts: 1, completedAt: 10 },
      invented: { bestScore: 1_000, attempts: 1, completedAt: 10 },
    })).toEqual({});
  });

  it("clamps scores and reconstructs trusted derived fields", () => {
    expect(sanitizePatternGenomeProgress({
      "subarray-sum": {
        bestScore: 4_000,
        maxScore: 50_000,
        stars: 99,
        attempts: 2.4,
        completedAt: 123.8,
      },
    })).toEqual({
      "subarray-sum": {
        bestScore: PATTERN_GENOME_MAX_SCORE,
        maxScore: PATTERN_GENOME_MAX_SCORE,
        stars: 3,
        attempts: 2,
        completedAt: 124,
      },
    });
  });

  it("normalizes negative values without crashing a returning session", () => {
    expect(sanitizePatternGenomeProgress({
      "weighted-route": { bestScore: -200, attempts: -3, completedAt: -10 },
    })).toEqual({
      "weighted-route": {
        bestScore: 0,
        maxScore: PATTERN_GENOME_MAX_SCORE,
        stars: 0,
        attempts: 1,
        completedAt: 0,
      },
    });
  });
});
