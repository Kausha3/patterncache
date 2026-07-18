import { describe, expect, it } from "vitest";
import type { CodingCombatRunResult } from "./codingCombatEngine";
import { analyzeCourseScheduleRun, gradeCourseExplanation, parseCourseTrace } from "./courseScheduleWorld";

function result(stdout: string, passed = true): CodingCombatRunResult {
  return {
    passed,
    timedOut: false,
    durationMs: 11,
    results: [{
      id: "launch-plan",
      label: "six-stage launch plan",
      hidden: false,
      passed,
      expected: "any valid prerequisite order",
      actual: passed ? "[5, 3, 4, 1, 2, 0]" : "[]",
      durationMs: 2,
      stdout,
    }],
  };
}

describe("Course Schedule II code-driven world", () => {
  it("parses only complete machine trace lines", () => {
    const events = parseCourseTrace([
      "learner output",
      "PC_TOPO|enqueue|5",
      "PC_TOPO|take|5|0|5",
      "PC_TOPO|decrement|3|0",
      "PC_TOPO|scan|broken",
      "PC_TOPO|unknown|4",
    ].join("\n"));
    expect(events).toHaveLength(3);
    expect(events[1]).toEqual({ kind: "take", course: 5, processed: 0, order: [5] });
  });

  it("treats a correct polling scheduler as a world failure", () => {
    const trace = [
      "PC_TOPO|round|0|0",
      ...Array.from({ length: 21 }, (_, index) => `PC_TOPO|scan|${index % 5}|5|0`),
      "PC_TOPO|release|5|5",
      "PC_TOPO|release|3|5,3",
      "PC_TOPO|release|4|5,3,4",
      "PC_TOPO|release|1|5,3,4,1",
      "PC_TOPO|release|2|5,3,4,1,2",
      "PC_TOPO|release|0|5,3,4,1,2,0",
    ];
    const analysis = analyzeCourseScheduleRun(result(trace.join("\n")));
    expect(analysis.correct).toBe(true);
    expect(analysis.efficient).toBe(false);
    expect(analysis.prerequisiteScans).toBe(21);
    expect(analysis.summary).toContain("O(V × E)");
  });

  it("requires a complete one-pass readiness execution for mastery", () => {
    const trace = [
      "PC_TOPO|enqueue|5",
      "PC_TOPO|take|5|0|5",
      "PC_TOPO|decrement|3|0", "PC_TOPO|enqueue|3",
      "PC_TOPO|decrement|4|0", "PC_TOPO|enqueue|4",
      "PC_TOPO|take|3|1|5,3",
      "PC_TOPO|decrement|1|0", "PC_TOPO|enqueue|1",
      "PC_TOPO|decrement|2|1",
      "PC_TOPO|take|4|2|5,3,4",
      "PC_TOPO|decrement|2|0", "PC_TOPO|enqueue|2",
      "PC_TOPO|take|1|3|5,3,4,1",
      "PC_TOPO|decrement|0|1",
      "PC_TOPO|take|2|4|5,3,4,1,2",
      "PC_TOPO|decrement|0|0", "PC_TOPO|enqueue|0",
      "PC_TOPO|take|0|5|5,3,4,1,2,0",
    ];
    const analysis = analyzeCourseScheduleRun(result(trace.join("\n")));
    expect(analysis.efficient).toBe(true);
    expect(analysis.graphOperations).toBe(19);
    expect(analysis.released).toEqual([5, 3, 4, 1, 2, 0]);
  });

  it("rejects a fake trace that omits one prerequisite update", () => {
    const trace = [
      ...[5, 3, 4, 1, 2, 0].map((course) => `PC_TOPO|enqueue|${course}`),
      ...[5, 3, 4, 1, 2, 0].map((course, index) => `PC_TOPO|take|${course}|${index}|${[5, 3, 4, 1, 2, 0].slice(0, index + 1).join(",")}`),
      ...Array.from({ length: 6 }, (_, index) => `PC_TOPO|decrement|${index}|0`),
    ];
    expect(analyzeCourseScheduleRun(result(trace.join("\n"))).efficient).toBe(false);
  });

  it("grades graph reasoning without supplied answer choices", () => {
    const strong = gradeCourseExplanation(
      "I direct every graph edge from a prerequisite to its dependent course. Indegree is the number of unresolved incoming prerequisites. Every zero-indegree course enters the ready queue. When I complete one, I decrement the indegree of each outgoing dependent and enqueue it at zero. If the processed count is fewer than all V courses, a cycle remains. Each course and prerequisite edge is handled once, so this is O(V + E).",
    );
    expect(strong).toMatchObject({ passed: true, score: 100 });
    const vague = gradeCourseExplanation("I use a queue and graph because that gives the right course order quickly.");
    expect(vague.passed).toBe(false);
    expect(vague.missing.length).toBeGreaterThan(3);
  });
});
