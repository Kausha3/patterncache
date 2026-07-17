import { describe, expect, it } from "vitest";
import {
  assessChapterInterview,
  createChapterState,
  enumerateBenchConfigs,
  initialBenchConfig,
  reduceChapter,
  runBench,
  CHAPTER_COMPLETION_THRESHOLD,
} from "./solidChapterEngine";
import type { ChapterState, SolidChapterMission, Workbench } from "./solidChapterEngine";
import { SOLID_CHAPTER_MISSIONS, getSolidChapterMission } from "./solidChapterMissions";

function solveBench(bench: Workbench) {
  return enumerateBenchConfigs(bench).filter((config) =>
    runBench(bench, config).every((row) => row.pass),
  );
}

function applyConfig(
  mission: SolidChapterMission,
  state: ChapterState,
  benchName: "repair" | "transfer",
  config: Record<string, string>,
): ChapterState {
  let next = state;
  for (const [controlId, optionId] of Object.entries(config)) {
    next = reduceChapter(mission, next, { type: "SET_CONTROL", bench: benchName, controlId, optionId });
  }
  return reduceChapter(mission, next, { type: "RUN_BENCH", bench: benchName });
}

describe("solid chapter missions data", () => {
  it("ships all four remaining chapters in campaign order", () => {
    expect(SOLID_CHAPTER_MISSIONS.map((mission) => mission.id)).toEqual(["ocp", "lsp", "isp", "dip"]);
    expect(SOLID_CHAPTER_MISSIONS.map((mission) => mission.order)).toEqual([2, 3, 4, 5]);
  });

  it("gives every bench a broken start: the initial configuration must fail the suite", () => {
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      for (const bench of [mission.repairBench, mission.transferBench]) {
        const results = runBench(bench, initialBenchConfig(bench));
        expect(results.some((row) => !row.pass), `${mission.id} bench should start broken`).toBe(true);
      }
    }
  });

  it("guarantees every bench is solvable: at least one configuration passes every row", () => {
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      for (const [name, bench] of [["repair", mission.repairBench], ["transfer", mission.transferBench]] as const) {
        const solutions = solveBench(bench);
        expect(solutions.length, `${mission.id}/${name} needs a discoverable solution`).toBeGreaterThan(0);
      }
    }
  });

  it("makes experimentation informative: distinct failing configs produce distinct failure details", () => {
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      const bench = mission.repairBench;
      const failingDetailSets = enumerateBenchConfigs(bench)
        .map((config) => runBench(bench, config))
        .filter((results) => results.some((row) => !row.pass))
        .map((results) => results.filter((row) => !row.pass).map((row) => row.detail).join("|"));
      const distinct = new Set(failingDetailSets);
      expect(distinct.size, `${mission.id} should have multiple distinct failure narratives`).toBeGreaterThan(1);
    }
  });

  it("never labels a workbench option as correct: correctness only exists in evaluation", () => {
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      for (const bench of [mission.repairBench, mission.transferBench]) {
        for (const control of bench.controls) {
          for (const option of control.options as unknown as Record<string, unknown>[]) {
            expect(option.correct, `${mission.id} bench options must not carry correct flags`).toBeUndefined();
          }
        }
      }
    }
  });

  it("gives every row a real detail in both passing and failing states", () => {
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      for (const bench of [mission.repairBench, mission.transferBench]) {
        for (const config of enumerateBenchConfigs(bench)) {
          for (const row of runBench(bench, config)) {
            expect(row.detail.length, `${mission.id} row detail too thin`).toBeGreaterThan(30);
          }
        }
      }
    }
  });

  it("unlocks Strategy on OCP and Adapter on DIP, matching the campaign metadata", () => {
    expect(getSolidChapterMission("ocp")?.pattern?.unlockedName).toBe("Strategy");
    expect(getSolidChapterMission("dip")?.pattern?.unlockedName).toBe("Adapter");
    expect(getSolidChapterMission("lsp")?.pattern).toBeUndefined();
    expect(getSolidChapterMission("isp")?.pattern).toBeUndefined();
  });

  it("keeps every rubric at four items so the 75% bar means three of four ideas", () => {
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      expect(mission.interview.rubric).toHaveLength(4);
      for (const item of mission.interview.rubric) {
        expect(item.keywords.length).toBeGreaterThan(0);
      }
    }
  });

  it("scores each mission's own model answer at 100", () => {
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      const assessment = assessChapterInterview(mission, mission.interview.modelAnswer);
      expect(assessment.score, `${mission.id}: missing ${assessment.missing.join(", ")}`).toBe(100);
    }
  });

  it("contains no em-dashes in any user-facing string", () => {
    const raw = JSON.stringify(SOLID_CHAPTER_MISSIONS, (_key, value) =>
      typeof value === "function" ? undefined : value,
    );
    expect(raw.includes("—")).toBe(false);
  });
});

describe("solid chapter engine", () => {
  const mission = SOLID_CHAPTER_MISSIONS[0];

  it("runs the incident as the repair bench at its broken initial config", () => {
    let state = createChapterState(mission);
    state = reduceChapter(mission, state, { type: "BEGIN" });
    expect(state.stage).toBe("incident");
    expect(state.repair.results).toBeDefined();
    expect(state.repair.allPass).toBe(false);
  });

  it("blocks progression until the same board passes on a rerun", () => {
    let state = createChapterState(mission);
    state = reduceChapter(mission, state, { type: "BEGIN" });
    state = reduceChapter(mission, state, { type: "SEE_FAILURE" });
    expect(state.stage).toBe("repair");
    // Trying to continue without a passing run does nothing.
    expect(reduceChapter(mission, state, { type: "CONFIRM_RERUN" }).stage).toBe("repair");
    // A partial fix reruns to a still-failing board with new details.
    state = applyConfig(mission, state, "repair", { ev: "card" });
    expect(state.repair.allPass).toBe(false);
    expect(state.repair.runs).toBe(1);
    // The full fix passes and unlocks progression.
    const solution = solveBench(mission.repairBench)[0];
    state = applyConfig(mission, state, "repair", solution);
    expect(state.repair.allPass).toBe(true);
    state = reduceChapter(mission, state, { type: "CONFIRM_RERUN" });
    expect(state.stage).toBe("transfer");
  });

  it("invalidates the last run when a control changes", () => {
    let state = createChapterState(mission);
    state = reduceChapter(mission, state, { type: "BEGIN" });
    state = reduceChapter(mission, state, { type: "SEE_FAILURE" });
    const solution = solveBench(mission.repairBench)[0];
    state = applyConfig(mission, state, "repair", solution);
    expect(state.repair.allPass).toBe(true);
    state = reduceChapter(mission, state, { type: "SET_CONTROL", bench: "repair", controlId: "flat", optionId: "branch" });
    expect(state.repair.allPass).toBe(false);
    expect(state.repair.results).toBeUndefined();
  });

  it("walks the full happy path to complete", () => {
    let state = createChapterState(mission);
    state = reduceChapter(mission, state, { type: "BEGIN" });
    state = reduceChapter(mission, state, { type: "SEE_FAILURE" });
    state = applyConfig(mission, state, "repair", solveBench(mission.repairBench)[0]);
    state = reduceChapter(mission, state, { type: "CONFIRM_RERUN" });
    expect(state.stage).toBe("transfer");
    state = applyConfig(mission, state, "transfer", solveBench(mission.transferBench)[0]);
    state = reduceChapter(mission, state, { type: "CONFIRM_RERUN" });
    expect(state.stage).toBe("pattern");
    const correctPattern = mission.pattern!.options.find((option) => option.correct)!;
    state = reduceChapter(mission, state, { type: "CHOOSE_PATTERN", optionId: correctPattern.id });
    expect(state.stage).toBe("debrief");
    state = reduceChapter(mission, state, { type: "ENTER_INTERVIEW" });
    state = reduceChapter(mission, state, { type: "SUBMIT_INTERVIEW", score: 100 });
    expect(state.stage).toBe("complete");
  });

  it("skips the pattern stage for chapters without a pattern unlock", () => {
    const lsp = getSolidChapterMission("lsp")!;
    let state = createChapterState(lsp);
    state = reduceChapter(lsp, state, { type: "BEGIN" });
    state = reduceChapter(lsp, state, { type: "SEE_FAILURE" });
    state = applyConfig(lsp, state, "repair", solveBench(lsp.repairBench)[0]);
    state = reduceChapter(lsp, state, { type: "CONFIRM_RERUN" });
    state = applyConfig(lsp, state, "transfer", solveBench(lsp.transferBench)[0]);
    state = reduceChapter(lsp, state, { type: "CONFIRM_RERUN" });
    expect(state.stage).toBe("debrief");
  });

  it("holds the interview stage below the completion threshold", () => {
    const lsp = getSolidChapterMission("lsp")!;
    let state = createChapterState(lsp);
    state = reduceChapter(lsp, state, { type: "BEGIN" });
    state = reduceChapter(lsp, state, { type: "SEE_FAILURE" });
    state = applyConfig(lsp, state, "repair", solveBench(lsp.repairBench)[0]);
    state = reduceChapter(lsp, state, { type: "CONFIRM_RERUN" });
    state = applyConfig(lsp, state, "transfer", solveBench(lsp.transferBench)[0]);
    state = reduceChapter(lsp, state, { type: "CONFIRM_RERUN" });
    state = reduceChapter(lsp, state, { type: "ENTER_INTERVIEW" });
    state = reduceChapter(lsp, state, { type: "SUBMIT_INTERVIEW", score: CHAPTER_COMPLETION_THRESHOLD - 25 });
    expect(state.stage).toBe("interview");
    state = reduceChapter(lsp, state, { type: "SUBMIT_INTERVIEW", score: CHAPTER_COMPLETION_THRESHOLD });
    expect(state.stage).toBe("complete");
  });

  it("ignores actions issued from the wrong stage", () => {
    const fresh = createChapterState(mission);
    expect(reduceChapter(mission, fresh, { type: "RUN_BENCH", bench: "repair" })).toBe(fresh);
    expect(reduceChapter(mission, fresh, { type: "SUBMIT_INTERVIEW", score: 100 })).toBe(fresh);
  });
});
