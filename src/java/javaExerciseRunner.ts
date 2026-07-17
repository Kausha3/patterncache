import type { JavaExerciseSpec } from "@/types";
import { generateExerciseMain } from "./javaHarness";
import { runJavaProgram } from "./javaProgram";
import type { JavaRunStage } from "./javaProgram";

/**
 * Run a lesson code exercise for real: the learner's edited class, the
 * exercise's supporting domain classes, and a generated test main are
 * compiled together and executed on the in-browser JVM.
 */

export interface JavaExerciseTestResult {
  id: string;
  label: string;
  passed: boolean;
  expected: string;
  actual?: string;
  error?: string;
  stdout?: string;
  durationMs: number;
}

export interface JavaExerciseRunResult {
  passed: boolean;
  timedOut: boolean;
  results: JavaExerciseTestResult[];
  fatalError?: string;
  compileLog?: string;
}

export async function runJavaExercise(
  learnerSource: string,
  spec: JavaExerciseSpec,
  options: { onStage?: (stage: JavaRunStage) => void } = {},
): Promise<JavaExerciseRunResult> {
  let harness: string;
  try {
    harness = generateExerciseMain(spec.tests);
  } catch (error) {
    return {
      passed: false,
      timedOut: false,
      results: [],
      fatalError: error instanceof Error ? error.message : "The test program could not be generated.",
    };
  }

  const outcome = await runJavaProgram(
    [
      { fileName: `${spec.editClassName}.java`, content: learnerSource },
      ...spec.support.map((file) => ({ fileName: `${file.className}.java`, content: file.source })),
      { fileName: "PcExerciseMain.java", content: harness },
    ],
    "PcExerciseMain",
    options,
  );

  if (outcome.kind === "compile-error") {
    return {
      passed: false,
      timedOut: false,
      results: [],
      fatalError: `${spec.editClassName}.java did not compile. Read the compiler output below; the line numbers are yours.`,
      compileLog: outcome.log,
    };
  }
  if (outcome.kind === "fatal") {
    return { passed: false, timedOut: outcome.timedOut, results: [], fatalError: outcome.message };
  }

  const entries = new Map(outcome.entries.map((entry) => [entry.id, entry]));
  const results: JavaExerciseTestResult[] = spec.tests.map((test) => {
    const entry = entries.get(test.id);
    if (!entry) {
      return {
        id: test.id,
        label: test.label,
        passed: false,
        expected: "",
        durationMs: 0,
        error: "No result was recorded for this test. The run likely stopped before reaching it.",
      };
    }
    return {
      id: test.id,
      label: test.label,
      passed: entry.passed,
      expected: entry.expected,
      actual: entry.actual ?? undefined,
      error: entry.error ?? undefined,
      stdout: entry.stdout || undefined,
      durationMs: entry.durationMs,
    };
  });

  return {
    passed: results.length > 0 && results.every((result) => result.passed),
    timedOut: false,
    results,
  };
}
