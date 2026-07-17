import type { CodingCombatMission } from "@/arena/codingCombatMissions";
import type { CodingCombatRunResult, CodingCombatTestResult } from "@/arena/codingCombatEngine";
import { generateTestMain } from "./javaHarness";
import { runJavaProgram } from "./javaProgram";
import type { JavaRunStage } from "./javaProgram";

/**
 * Run a Coding Combat mission for real: compile the learner's Solution.java
 * together with a generated test main inside the in-browser JVM, execute it,
 * and read back the machine-written report. The result reuses the engine's
 * CodingCombatRunResult shape, so grading and the test console are shared
 * with the rest of the arena.
 */

export type { JavaRunStage };

export async function runJavaCombat(
  code: string,
  mission: CodingCombatMission,
  includeHidden: boolean,
  options: { onStage?: (stage: JavaRunStage) => void } = {},
): Promise<CodingCombatRunResult> {
  const startedAt = performance.now();
  const finish = (partial: Omit<CodingCombatRunResult, "durationMs">): CodingCombatRunResult => ({
    ...partial,
    durationMs: performance.now() - startedAt,
  });

  const tests = [
    ...mission.visibleTests.map((test) => ({ ...test, hidden: false })),
    ...(includeHidden ? mission.hiddenTests.map((test) => ({ ...test, hidden: true })) : []),
  ];

  let harness: string;
  try {
    harness = generateTestMain(mission.java, tests);
  } catch (error) {
    return finish({
      passed: false,
      timedOut: false,
      results: [],
      fatalError: error instanceof Error ? error.message : "The test program could not be generated.",
    });
  }

  const outcome = await runJavaProgram(
    [
      { fileName: "Solution.java", content: code },
      { fileName: "PcTestMain.java", content: harness },
    ],
    "PcTestMain",
    options,
  );

  if (outcome.kind === "compile-error") {
    return finish({
      passed: false,
      timedOut: false,
      results: [],
      fatalError: "Solution.java did not compile. Read the compiler output below; the line numbers are yours.",
      compileLog: outcome.log,
    });
  }
  if (outcome.kind === "fatal") {
    return finish({ passed: false, timedOut: outcome.timedOut, results: [], fatalError: outcome.message });
  }

  const entries = new Map(outcome.entries.map((entry) => [entry.id, entry]));
  const results: CodingCombatTestResult[] = tests.map((test) => {
    const entry = entries.get(test.id);
    if (!entry) {
      return {
        id: test.id,
        label: test.label,
        hidden: test.hidden,
        passed: false,
        expected: "",
        durationMs: 0,
        error: "No result was recorded for this test. The run likely stopped before reaching it.",
      };
    }
    return {
      id: test.id,
      label: test.label,
      hidden: test.hidden,
      passed: entry.passed,
      expected: entry.expected,
      actual: entry.actual ?? undefined,
      durationMs: entry.durationMs,
      error: entry.error ?? undefined,
      stdout: entry.stdout || undefined,
    };
  });

  return finish({
    passed: results.length > 0 && results.every((result) => result.passed),
    timedOut: false,
    results,
  });
}
