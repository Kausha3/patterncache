import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCodingCombatMission } from "@/arena/codingCombatMissions";
import { resetPreparedJavaCombatRuns, runJavaCombat } from "./javaCombatRunner";

const mission = getCodingCombatMission("maximum-subarray")!;

function passingReport() {
  return {
    kind: "report" as const,
    entries: [...mission.visibleTests, ...mission.hiddenTests].map((test) => ({
      id: test.id,
      passed: true,
      expected: String(test.expected),
      actual: String(test.expected),
      error: null,
      stdout: "",
      durationMs: 1,
    })),
  };
}

describe("prepared Java Combat runs", () => {
  beforeEach(() => resetPreparedJavaCombatRuns());

  it("compiles the sealed suite once and reveals hidden results without recompiling", async () => {
    const execute = vi.fn(async () => passingReport());
    const visible = await runJavaCombat("class Solution {}", mission, false, { execute });
    const complete = await runJavaCombat("class Solution {}", mission, true, { execute });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(visible.results).toHaveLength(mission.visibleTests.length);
    expect(visible.results.every((test) => !test.hidden)).toBe(true);
    expect(complete.results).toHaveLength(mission.visibleTests.length + mission.hiddenTests.length);
    expect(complete.reusedCompilation).toBe(true);
    expect(complete.durationMs).toBe(0);
  });

  it("invalidates the prepared proof whenever the learner changes code", async () => {
    const execute = vi.fn(async () => passingReport());
    await runJavaCombat("class Solution { int version = 1; }", mission, false, { execute });
    await runJavaCombat("class Solution { int version = 2; }", mission, true, { execute });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("does not cache compiler or runtime failures", async () => {
    const execute = vi.fn(async () => ({ kind: "fatal" as const, timedOut: true, message: "compile timeout" }));
    await runJavaCombat("broken", mission, false, { execute });
    await runJavaCombat("broken", mission, true, { execute });
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
