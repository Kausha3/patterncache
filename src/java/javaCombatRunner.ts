import type { CodingCombatMission } from "@/arena/codingCombatMissions";
import type { CodingCombatRunResult, CodingCombatTestResult } from "@/arena/codingCombatEngine";
import { generateTestMain, parseJavaTestReport } from "./javaHarness";
import {
  JavaTimeoutError,
  acquireRunLock,
  compileJava,
  ensureJavaRuntime,
  readVirtualFile,
  runJavaClass,
  withTimeout,
} from "./javaRunner";

/**
 * Run a Coding Combat mission for real: compile the learner's Solution.java
 * together with a generated test main inside the in-browser JVM, execute it,
 * and read back the machine-written report. The result reuses the engine's
 * CodingCombatRunResult shape, so grading and the test console are shared
 * with the rest of the arena.
 */

export type JavaRunStage = "loading-runtime" | "compiling" | "running";

const RUNTIME_TIMEOUT_MS = 180_000;
const COMPILE_TIMEOUT_MS = 150_000;
const RUN_TIMEOUT_MS = 60_000;

let runCounter = 0;

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

  let releaseLock: (() => void) | undefined;
  try {
    releaseLock = acquireRunLock();

    options.onStage?.("loading-runtime");
    await withTimeout(
      ensureJavaRuntime(),
      RUNTIME_TIMEOUT_MS,
      "The Java runtime took too long to load. Check your connection and run again.",
    );

    runCounter += 1;
    const runId = `${Date.now().toString(36)}-${runCounter}`;
    const logPath = `/files/pc-compile-${runId}.txt`;
    const reportPath = `/files/pc-report-${runId}.json`;

    options.onStage?.("compiling");
    const compiled = await withTimeout(
      compileJava(
        [
          { path: "/str/Solution.java", content: code },
          { path: "/str/PcTestMain.java", content: harness },
        ],
        logPath,
      ),
      COMPILE_TIMEOUT_MS,
      "Compilation took too long. Run again; reload the page if this repeats.",
    );
    if (!compiled.ok) {
      return finish({
        passed: false,
        timedOut: false,
        results: [],
        fatalError: "Solution.java did not compile. Read the compiler output below; the line numbers are yours.",
        // The learner knows the file as Solution.java, not by its virtual mount path.
        compileLog: compiled.log.split("/str/").join(""),
      });
    }

    options.onStage?.("running");
    const exitCode = await withTimeout(
      runJavaClass("PcTestMain", [reportPath]),
      RUN_TIMEOUT_MS,
      "The tests took too long. Look for an infinite loop; reload the page if the run never settles.",
    );
    const rawReport = await readVirtualFile(reportPath);
    if (rawReport === undefined) {
      return finish({
        passed: false,
        timedOut: false,
        results: [],
        fatalError:
          exitCode === 0
            ? "The tests ran but no report was written. Run again; reload the page if this repeats."
            : `The test runner stopped early with exit code ${exitCode}. Run again; reload the page if this repeats.`,
      });
    }

    const entries = new Map(parseJavaTestReport(rawReport).map((entry) => [entry.id, entry]));
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
  } catch (error) {
    const timedOut = error instanceof JavaTimeoutError;
    return finish({
      passed: false,
      timedOut,
      results: [],
      fatalError: error instanceof Error ? error.message : "The Java run failed unexpectedly.",
    });
  } finally {
    releaseLock?.();
  }
}
