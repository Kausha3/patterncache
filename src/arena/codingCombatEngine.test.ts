import { describe, expect, it, vi } from "vitest";
import { CODING_COMBAT_MISSIONS } from "./codingCombatMissions";
import {
  CODING_COMBAT_MAX_SCORE,
  evaluateCodingCombatLocally,
  formatCombatValue,
  gradeCodingCombat,
  runCodingCombat,
} from "./codingCombatEngine";
import type { CodingCombatWorkerLike } from "./codingCombatEngine";

const mission = CODING_COMBAT_MISSIONS[0];
const oneTest = [{ ...mission.visibleTests[0], hidden: false }];

describe("Coding Combat evaluator", () => {
  it("reports wrong values without mutating the source test arguments", async () => {
    const originalArgs = structuredClone(oneTest[0].args);
    const result = await evaluateCodingCombatLocally(
      `function findTargetPair(nums) { nums.length = 0; return [99, 99]; }`,
      mission.functionName,
      oneTest,
    );

    expect(result.passed).toBe(false);
    expect(result.results[0]).toMatchObject({ passed: false, actual: [99, 99], expected: [0, 4] });
    expect(oneTest[0].args).toEqual(originalArgs);
  });

  it("contains syntax, missing-function, and per-test runtime failures", async () => {
    const syntax = await evaluateCodingCombatLocally("function findTargetPair( {", mission.functionName, oneTest);
    const missing = await evaluateCodingCombatLocally("function somethingElse() {}", mission.functionName, oneTest);
    const thrown = await evaluateCodingCombatLocally(
      `function findTargetPair() { throw new Error("intentional failure"); }`,
      mission.functionName,
      oneTest,
    );

    expect(syntax.fatalError).toBeTruthy();
    expect(missing.fatalError).toContain("Define a function named findTargetPair");
    expect(thrown.results[0].error).toContain("intentional failure");
    expect(thrown.passed).toBe(false);
  });

  it("terminates and disposes an unresponsive worker", async () => {
    const terminate = vi.fn();
    const dispose = vi.fn();
    const silentWorker: CodingCombatWorkerLike = {
      onmessage: null,
      onerror: null,
      postMessage: vi.fn(),
      terminate,
    };

    const result = await runCodingCombat(mission.starterCode, mission, false, {
      timeoutMs: 50,
      workerFactory: () => ({ worker: silentWorker, dispose }),
    });

    expect(result.timedOut).toBe(true);
    expect(result.fatalError).toContain("infinite loop");
    expect(terminate).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("forwards a successful worker result and cancels active workers on demand", async () => {
    const successResult = {
      passed: true,
      timedOut: false,
      durationMs: 1,
      results: [{ id: "ok", label: "ok", hidden: false, passed: true, expected: 1, actual: 1, durationMs: 1 }],
    };
    let respondingWorker: CodingCombatWorkerLike;
    respondingWorker = {
      onmessage: null,
      onerror: null,
      postMessage: () => queueMicrotask(() => respondingWorker.onmessage?.({ data: successResult })),
      terminate: vi.fn(),
    };
    const success = await runCodingCombat("", mission, false, {
      workerFactory: () => ({ worker: respondingWorker, dispose: vi.fn() }),
    });

    const controller = new AbortController();
    const terminate = vi.fn();
    const dispose = vi.fn();
    const silentWorker: CodingCombatWorkerLike = {
      onmessage: null,
      onerror: null,
      postMessage: vi.fn(),
      terminate,
    };
    const pending = runCodingCombat("", mission, false, {
      signal: controller.signal,
      workerFactory: () => ({ worker: silentWorker, dispose }),
    });
    controller.abort();
    const cancelled = await pending;

    expect(success).toEqual(successResult);
    expect(cancelled.fatalError).toBe("Execution cancelled.");
    expect(terminate).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("contains worker startup and postMessage failures as results instead of rejected promises", async () => {
    const startup = await runCodingCombat("", mission, false, {
      workerFactory: () => { throw new Error("worker unavailable"); },
    });
    const brokenWorker: CodingCombatWorkerLike = {
      onmessage: null,
      onerror: null,
      postMessage: () => { throw new Error("clone failed"); },
      terminate: vi.fn(),
    };
    const transport = await runCodingCombat("", mission, false, {
      workerFactory: () => ({ worker: brokenWorker, dispose: vi.fn() }),
    });

    expect(startup.fatalError).toContain("worker unavailable");
    expect(transport.fatalError).toContain("clone failed");
  });
});

describe("Coding Combat grading", () => {
  const correctAnswers = Object.fromEntries(
    mission.defense.map((question) => [question.id, question.options.find((option) => option.correct)!.id]),
  );

  it("awards the maximum only for a clean implementation and fully defended reasoning", () => {
    const grade = gradeCodingCombat({ mission, answers: correctAnswers, hintsUsed: 0, failedSubmissions: 0 });
    expect(grade.score).toBe(CODING_COMBAT_MAX_SCORE);
    expect(grade.defenseCorrect).toBe(3);
    expect(grade.techniquePoints).toBe(50);
  });

  it("clamps hint and failed-submission penalties and explains unanswered defenses", () => {
    const grade = gradeCodingCombat({ mission, answers: {}, hintsUsed: 99, failedSubmissions: 99 });
    expect(grade.score).toBe(250);
    expect(grade.techniquePoints).toBe(0);
    expect(grade.submissionPenalty).toBe(50);
    expect(grade.defenseResults.every((result) => result.feedback === "No answer was selected.")).toBe(true);
  });

  it("formats hostile or uncommon return values without crashing the console", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(formatCombatValue(undefined)).toBe("undefined");
    expect(formatCombatValue(10n)).toBe("10n");
    expect(formatCombatValue(circular)).toBe("[Unserializable value]");
  });
});
