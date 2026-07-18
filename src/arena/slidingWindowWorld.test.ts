import { describe, expect, it } from "vitest";
import type { CodingCombatRunResult } from "./codingCombatEngine";
import {
  analyzeSlidingWindowRun,
  gradeSlidingWindowExplanation,
  parseSlidingWindowTrace,
} from "./slidingWindowWorld";

function result(stdout: string, passed = true): CodingCombatRunResult {
  return {
    passed,
    timedOut: false,
    durationMs: 12,
    results: [
      {
        id: "rush-hour",
        label: "classic rush-hour stream",
        hidden: false,
        passed,
        expected: "[3, 3, 5, 5, 6, 7]",
        actual: passed ? "[3, 3, 5, 5, 6, 7]" : "[3]",
        durationMs: 2,
        stdout,
      },
    ],
  };
}

describe("Sliding Window code-driven world", () => {
  it("parses only valid machine trace lines", () => {
    const events = parseSlidingWindowTrace([
      "ordinary learner output",
      "PC_TRACE|step|2|0|2",
      "PC_TRACE|push|2|-1|0|2|1:3,2:-1",
      "PC_TRACE|output|2|3|1:3,2:-1",
      "PC_TRACE|unknown|3",
      "PC_TRACE|scan|broken",
    ].join("\n"));
    expect(events).toHaveLength(3);
    expect(events[1]).toMatchObject({ kind: "push", index: 2, value: -1, left: 0, right: 2 });
    expect(events[1].queue).toEqual([{ index: 1, value: 3 }, { index: 2, value: -1 }]);
  });

  it("treats correct repeated rescanning as a world failure", () => {
    const lines = Array.from({ length: 18 }, (_, index) => `PC_TRACE|scan|${index % 8}|${Math.floor(index / 3)}|${Math.floor(index / 3) + 2}|1|3`);
    lines.push(...[2, 3, 4, 5, 6, 7].map((index, offset) => `PC_TRACE|output|${index}|${[3, 3, 5, 5, 6, 7][offset]}|`));
    const analysis = analyzeSlidingWindowRun(result(lines.join("\n")));
    expect(analysis.correct).toBe(true);
    expect(analysis.efficient).toBe(false);
    expect(analysis.inspections).toBe(18);
    expect(analysis.summary).toContain("18 values");
  });

  it("requires a complete monotonic-deque execution trace for the clear", () => {
    const lines: string[] = [];
    const queues = ["0:1", "1:3", "1:3,2:-1", "1:3,2:-1,3:-3", "4:5", "4:5,5:3", "6:6", "7:7"];
    for (let index = 0; index < 8; index += 1) {
      const left = Math.max(0, index - 2);
      lines.push(`PC_TRACE|step|${index}|${left}|${index}`);
      lines.push(`PC_TRACE|push|${index}|${[1, 3, -1, -3, 5, 3, 6, 7][index]}|${left}|${index}|${queues[index]}`);
      if (index >= 2) lines.push(`PC_TRACE|output|${index}|${[3, 3, 5, 5, 6, 7][index - 2]}|${queues[index]}`);
    }
    const analysis = analyzeSlidingWindowRun(result(lines.join("\n")));
    expect(analysis.correct).toBe(true);
    expect(analysis.efficient).toBe(true);
    expect(analysis.outputs).toEqual([3, 3, 5, 5, 6, 7]);
  });

  it("does not mistake a correct output without instrumented operations for mastery", () => {
    const analysis = analyzeSlidingWindowRun(result(""));
    expect(analysis.correct).toBe(true);
    expect(analysis.efficient).toBe(false);
    expect(analysis.summary).toContain("replayable");
  });

  it("rejects a candidate lane that keeps an expired index", () => {
    const lines: string[] = [];
    for (let index = 0; index < 8; index += 1) {
      const left = Math.max(0, index - 2);
      lines.push(`PC_TRACE|step|${index}|${left}|${index}`);
      lines.push(`PC_TRACE|push|${index}|${8 - index}|${left}|${index}|0:8`);
      if (index >= 2) lines.push(`PC_TRACE|output|${index}|${8 - index}|0:8`);
    }
    const analysis = analyzeSlidingWindowRun(result(lines.join("\n")));
    expect(analysis.correct).toBe(true);
    expect(analysis.efficient).toBe(false);
  });

  it("grades an original explanation for invariant evidence instead of answer selection", () => {
    const strong = gradeSlidingWindowExplanation(
      "The deque stores candidate indices in decreasing value order. I remove an index from the front when it expires outside the left boundary. I pop smaller values from the back because the newer larger value will outlive them. The front is therefore the maximum. Every index enters and leaves at most once, so the total work is O(n).",
    );
    expect(strong).toMatchObject({ passed: true, score: 100 });

    const vague = gradeSlidingWindowExplanation("I use a queue because it is faster and then return the max.");
    expect(vague.passed).toBe(false);
    expect(vague.score).toBeLessThan(60);
    expect(vague.missing.length).toBeGreaterThan(2);
  });
});
