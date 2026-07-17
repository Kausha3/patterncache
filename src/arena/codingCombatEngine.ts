import type { CodingCombatMission, CodingCombatTestCase } from "./codingCombatMissions";

export const CODING_COMBAT_MAX_SCORE = 500;
export const CODING_COMBAT_TIMEOUT_MS = 1_800;

export interface CodingCombatTestResult {
  id: string;
  label: string;
  hidden: boolean;
  passed: boolean;
  expected: unknown;
  actual?: unknown;
  durationMs: number;
  error?: string;
  /** Tail of what the solution printed during this test (Java runs only). */
  stdout?: string;
}

export interface CodingCombatRunResult {
  passed: boolean;
  timedOut: boolean;
  durationMs: number;
  results: CodingCombatTestResult[];
  fatalError?: string;
  /** Full javac diagnostics when the solution failed to compile (Java runs only). */
  compileLog?: string;
}

export interface CodingCombatDefenseResult {
  questionId: string;
  optionId?: string;
  correct: boolean;
  feedback: string;
  correctLabel: string;
}

export interface CodingCombatGrade {
  score: number;
  maxScore: number;
  defenseCorrect: number;
  defenseResults: CodingCombatDefenseResult[];
  codePoints: number;
  defensePoints: number;
  techniquePoints: number;
  submissionPenalty: number;
}

interface WorkerRequest {
  code: string;
  functionName: string;
  tests: Array<CodingCombatTestCase & { hidden: boolean }>;
}

export interface CodingCombatWorkerLike {
  onmessage: ((event: { data: CodingCombatRunResult }) => void) | null;
  onerror: ((event: { message?: string }) => void) | null;
  postMessage: (request: WorkerRequest) => void;
  terminate: () => void;
}

export interface CodingCombatWorkerHandle {
  worker: CodingCombatWorkerLike;
  dispose: () => void;
}

export type CodingCombatWorkerFactory = (source: string) => CodingCombatWorkerHandle;

export async function runCodingCombat(
  code: string,
  mission: CodingCombatMission,
  includeHidden: boolean,
  options: { timeoutMs?: number; workerFactory?: CodingCombatWorkerFactory; signal?: AbortSignal } = {},
): Promise<CodingCombatRunResult> {
  if (options.signal?.aborted) return failedRun("Execution cancelled.");
  const timeoutMs = Math.max(50, options.timeoutMs ?? CODING_COMBAT_TIMEOUT_MS);
  const tests = [
    ...mission.visibleTests.map((test) => ({ ...test, hidden: false })),
    ...(includeHidden ? mission.hiddenTests.map((test) => ({ ...test, hidden: true })) : []),
  ];

  let handle: CodingCombatWorkerHandle;
  try {
    handle = (options.workerFactory ?? createBrowserWorker)(CODING_COMBAT_WORKER_SOURCE);
  } catch (error) {
    return failedRun(toErrorMessage(error, "The isolated code runner could not start."));
  }

  return new Promise((resolve) => {
    let settled = false;
    const startedAt = performance.now();
    const finish = (result: CodingCombatRunResult) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      options.signal?.removeEventListener("abort", cancel);
      handle.worker.terminate();
      handle.dispose();
      resolve(result);
    };
    const timeout = globalThis.setTimeout(() => {
      finish({
        passed: false,
        timedOut: true,
        durationMs: performance.now() - startedAt,
        results: [],
        fatalError: `Execution exceeded ${timeoutMs}ms. Check for an infinite loop or a promise that never resolves.`,
      });
    }, timeoutMs);
    const cancel = () => finish(failedRun("Execution cancelled."));
    options.signal?.addEventListener("abort", cancel, { once: true });
    if (options.signal?.aborted) {
      cancel();
      return;
    }

    handle.worker.onmessage = (event) => finish(event.data);
    handle.worker.onerror = (event) => finish(failedRun(event.message || "The isolated runner crashed."));

    try {
      handle.worker.postMessage({ code, functionName: mission.functionName, tests });
    } catch (error) {
      finish(failedRun(toErrorMessage(error, "The code could not be sent to the isolated runner.")));
    }
  });
}

export async function evaluateCodingCombatLocally(
  code: string,
  functionName: string,
  tests: Array<CodingCombatTestCase & { hidden: boolean }>,
): Promise<CodingCombatRunResult> {
  const startedAt = performance.now();
  let candidate: (...args: unknown[]) => unknown;
  try {
    const factory = new Function(
      `"use strict";\n${code}\n; return typeof ${functionName} === "function" ? ${functionName} : undefined;`,
    ) as () => ((...args: unknown[]) => unknown) | undefined;
    const compiled = factory();
    if (!compiled) return failedRun(`Define a function named ${functionName}.`);
    candidate = compiled;
  } catch (error) {
    return failedRun(toErrorMessage(error, "The solution could not be compiled."));
  }

  const results: CodingCombatTestResult[] = [];
  for (const test of tests) {
    const testStartedAt = performance.now();
    try {
      const clonedArgs = cloneTestValue(test.args) as unknown[];
      const actual = await Promise.resolve(candidate(...clonedArgs));
      results.push({
        id: test.id,
        label: test.label,
        hidden: test.hidden,
        passed: deepEqual(actual, test.expected),
        expected: test.expected,
        actual,
        durationMs: performance.now() - testStartedAt,
      });
    } catch (error) {
      results.push({
        id: test.id,
        label: test.label,
        hidden: test.hidden,
        passed: false,
        expected: test.expected,
        durationMs: performance.now() - testStartedAt,
        error: toErrorMessage(error, "The function threw an unknown error."),
      });
    }
  }

  return {
    passed: results.every((result) => result.passed),
    timedOut: false,
    durationMs: performance.now() - startedAt,
    results,
  };
}

export function gradeCodingCombat({
  mission,
  answers,
  hintsUsed,
  failedSubmissions,
}: {
  mission: CodingCombatMission;
  answers: Record<string, string>;
  hintsUsed: number;
  failedSubmissions: number;
}): CodingCombatGrade {
  const defenseResults = mission.defense.map((question) => {
    const optionId = answers[question.id];
    const selected = question.options.find((option) => option.id === optionId);
    const correct = question.options.find((option) => option.correct)!;
    return {
      questionId: question.id,
      optionId,
      correct: selected?.correct === true,
      feedback: selected?.feedback ?? "No answer was selected.",
      correctLabel: correct.label,
    };
  });
  const defenseCorrect = defenseResults.filter((result) => result.correct).length;
  const codePoints = 300;
  const defensePoints = defenseCorrect * 50;
  const techniquePoints = Math.max(0, 50 - Math.max(0, hintsUsed) * 15);
  const submissionPenalty = Math.min(50, Math.max(0, failedSubmissions) * 10);
  const score = Math.max(0, Math.min(CODING_COMBAT_MAX_SCORE, codePoints + defensePoints + techniquePoints - submissionPenalty));

  return {
    score,
    maxScore: CODING_COMBAT_MAX_SCORE,
    defenseCorrect,
    defenseResults,
    codePoints,
    defensePoints,
    techniquePoints,
    submissionPenalty,
  };
}

export function formatCombatValue(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "function") return "[Function]";
  if (typeof value === "symbol") return String(value);
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? String(value) : serialized;
  } catch {
    return "[Unserializable value]";
  }
}

function createBrowserWorker(source: string): CodingCombatWorkerHandle {
  const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  const worker = new Worker(url);
  return {
    worker: worker as unknown as CodingCombatWorkerLike,
    dispose: () => URL.revokeObjectURL(url),
  };
}

function failedRun(fatalError: string): CodingCombatRunResult {
  return { passed: false, timedOut: false, durationMs: 0, results: [], fatalError };
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function cloneTestValue(value: unknown): unknown {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function deepEqual(actual: unknown, expected: unknown, seen = new WeakSet<object>()): boolean {
  if (Object.is(actual, expected)) return true;
  if (!actual || !expected || typeof actual !== "object" || typeof expected !== "object") return false;
  if (seen.has(actual)) return false;
  seen.add(actual);
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return false;
    return actual.every((value, index) => deepEqual(value, expected[index], seen));
  }
  const actualRecord = actual as Record<string, unknown>;
  const expectedRecord = expected as Record<string, unknown>;
  const actualKeys = Object.keys(actualRecord).sort();
  const expectedKeys = Object.keys(expectedRecord).sort();
  if (!deepEqual(actualKeys, expectedKeys, seen)) return false;
  return actualKeys.every((key) => deepEqual(actualRecord[key], expectedRecord[key], seen));
}

const CODING_COMBAT_WORKER_SOURCE = String.raw`
const sendResult = self.postMessage.bind(self);
const cloneSafely = typeof structuredClone === "function" ? structuredClone.bind(self) : (value) => JSON.parse(JSON.stringify(value));
const blockApi = () => { throw new Error("This API is disabled inside Coding Combat."); };
self.postMessage = blockApi;
self.importScripts = blockApi;
self.fetch = () => Promise.reject(new Error("Network access is disabled inside Coding Combat."));

function errorMessage(error, fallback) {
  return error && typeof error.message === "string" && error.message ? error.message : fallback;
}

function deepEqual(actual, expected, seen = new WeakSet()) {
  if (Object.is(actual, expected)) return true;
  if (!actual || !expected || typeof actual !== "object" || typeof expected !== "object") return false;
  if (seen.has(actual)) return false;
  seen.add(actual);
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return false;
    return actual.every((value, index) => deepEqual(value, expected[index], seen));
  }
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  if (!deepEqual(actualKeys, expectedKeys, seen)) return false;
  return actualKeys.every((key) => deepEqual(actual[key], expected[key], seen));
}

function cloneValue(value) {
  return cloneSafely(value);
}

self.onmessage = async (event) => {
  const { code, functionName, tests } = event.data;
  const startedAt = performance.now();
  let candidate;
  try {
    const factory = new Function('"use strict";\n' + code + '\n; return typeof ' + functionName + ' === "function" ? ' + functionName + ' : undefined;');
    candidate = factory();
    if (typeof candidate !== "function") {
      sendResult({ passed: false, timedOut: false, durationMs: 0, results: [], fatalError: "Define a function named " + functionName + "." });
      return;
    }
  } catch (error) {
    sendResult({ passed: false, timedOut: false, durationMs: 0, results: [], fatalError: errorMessage(error, "The solution could not be compiled.") });
    return;
  }

  const results = [];
  for (const test of tests) {
    const testStartedAt = performance.now();
    try {
      const actual = await Promise.resolve(candidate(...cloneValue(test.args)));
      results.push({
        id: test.id,
        label: test.label,
        hidden: test.hidden,
        passed: deepEqual(actual, test.expected),
        expected: test.expected,
        actual: typeof actual === "function" || typeof actual === "symbol" ? String(actual) : actual,
        durationMs: performance.now() - testStartedAt,
      });
    } catch (error) {
      results.push({
        id: test.id,
        label: test.label,
        hidden: test.hidden,
        passed: false,
        expected: test.expected,
        durationMs: performance.now() - testStartedAt,
        error: errorMessage(error, "The function threw an unknown error."),
      });
    }
  }

  sendResult({
    passed: results.every((result) => result.passed),
    timedOut: false,
    durationMs: performance.now() - startedAt,
    results,
  });
};
`;
