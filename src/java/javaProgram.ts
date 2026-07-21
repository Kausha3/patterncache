import { parseJavaTestReport } from "./javaHarness";
import type { JavaTestReportEntry } from "./javaHarness";
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
 * The one pipeline every in-browser Java run goes through: boot the runtime,
 * compile the sources, run the main class, read back the JSON report it
 * wrote. Coding Combat and lesson exercises both build on this; they differ
 * only in how they assemble sources and present the outcome.
 */

export type JavaRunStage = "loading-runtime" | "compiling" | "running";

const RUNTIME_TIMEOUT_MS = 180_000;
const COMPILE_TIMEOUT_MS = 90_000;
const RUN_TIMEOUT_MS = 60_000;

let runCounter = 0;

export type JavaProgramOutcome =
  | { kind: "compile-error"; log: string }
  | { kind: "report"; entries: JavaTestReportEntry[] }
  | { kind: "fatal"; message: string; timedOut: boolean };

export async function runJavaProgram(
  sources: { fileName: string; content: string }[],
  mainClassName: string,
  options: { onStage?: (stage: JavaRunStage) => void } = {},
): Promise<JavaProgramOutcome> {
  let releaseLock: (() => void) | undefined;
  const keepLockUntilSettled = <T,>(work: Promise<T>) => {
    const release = releaseLock;
    releaseLock = undefined;
    void work.then(
      () => release?.(),
      () => release?.(),
    );
  };
  const runWithGuard = async <T,>(work: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    try {
      return await withTimeout(work, timeoutMs, message);
    } catch (error) {
      // A Promise timeout cannot cancel WebAssembly already executing. Keep
      // the shared JVM locked until that operation actually settles so a
      // retry never overlaps the previous compiler or test process.
      if (error instanceof JavaTimeoutError) keepLockUntilSettled(work);
      throw error;
    }
  };
  try {
    releaseLock = acquireRunLock();

    options.onStage?.("loading-runtime");
    const runtimeWork = ensureJavaRuntime();
    await runWithGuard(
      runtimeWork,
      RUNTIME_TIMEOUT_MS,
      "The Java runtime took too long to load. Check your connection and run again.",
    );

    runCounter += 1;
    const runId = `${Date.now().toString(36)}-${runCounter}`;
    const logPath = `/files/pc-compile-${runId}.txt`;
    const reportPath = `/files/pc-report-${runId}.json`;

    options.onStage?.("compiling");
    const compileWork = compileJava(
      sources.map((source) => ({ path: `/str/${source.fileName}`, content: source.content })),
      logPath,
    );
    const compiled = await runWithGuard(
      compileWork,
      COMPILE_TIMEOUT_MS,
      "Compilation took too long. The compiler is still finishing safely in the background; retry when the Run button becomes available.",
    );
    if (!compiled.ok) {
      // The learner knows files by name, not by their virtual mount path.
      return { kind: "compile-error", log: compiled.log.split("/str/").join("") };
    }

    options.onStage?.("running");
    const runWork = runJavaClass(mainClassName, [reportPath]);
    const exitCode = await runWithGuard(
      runWork,
      RUN_TIMEOUT_MS,
      "The tests took too long. Look for an infinite loop; the JVM will unlock after this run actually stops.",
    );
    const rawReport = await readVirtualFile(reportPath);
    if (rawReport === undefined) {
      return {
        kind: "fatal",
        timedOut: false,
        message:
          exitCode === 0
            ? "The tests ran but no report was written. Run again; reload the page if this repeats."
            : `The test runner stopped early with exit code ${exitCode}. Run again; reload the page if this repeats.`,
      };
    }
    return { kind: "report", entries: parseJavaTestReport(rawReport) };
  } catch (error) {
    return {
      kind: "fatal",
      timedOut: error instanceof JavaTimeoutError,
      message: error instanceof Error ? error.message : "The Java run failed unexpectedly.",
    };
  } finally {
    releaseLock?.();
  }
}
