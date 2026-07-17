import { describe, expect, it } from "vitest";
import {
  assessChapterInterview,
  createChapterState,
  reduceChapter,
  CHAPTER_COMPLETION_THRESHOLD,
} from "./solidChapterEngine";
import type { ChapterState, SolidChapterMission } from "./solidChapterEngine";
import { SOLID_CHAPTER_MISSIONS, getSolidChapterMission } from "./solidChapterMissions";

function playToStage(mission: SolidChapterMission, target: "repair" | "rerun" | "transfer"): ChapterState {
  let state = createChapterState();
  state = reduceChapter(mission, state, { type: "BEGIN" });
  state = reduceChapter(mission, state, { type: "SEE_FAILURE" });
  if (target === "repair") return state;
  const correctRepair = mission.repair.options.find((option) => option.correct)!;
  state = reduceChapter(mission, state, { type: "CHOOSE_REPAIR", optionId: correctRepair.id });
  if (target === "rerun") return state;
  state = reduceChapter(mission, state, { type: "CONFIRM_RERUN" });
  return state;
}

describe("solid chapter missions data", () => {
  it("ships all four remaining chapters in campaign order", () => {
    expect(SOLID_CHAPTER_MISSIONS.map((mission) => mission.id)).toEqual(["ocp", "lsp", "isp", "dip"]);
    expect(SOLID_CHAPTER_MISSIONS.map((mission) => mission.order)).toEqual([2, 3, 4, 5]);
  });

  it("keeps exactly one correct option per decision, with real consequences on every option", () => {
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      const decisionSets = [mission.repair.options, mission.transfer.options];
      if (mission.pattern) decisionSets.push(mission.pattern.options);
      for (const options of decisionSets) {
        expect(options.filter((option) => option.correct)).toHaveLength(1);
        for (const option of options) {
          expect(option.consequence.length, `${mission.id}/${option.id} needs a consequence`).toBeGreaterThan(40);
        }
      }
    }
  });

  it("gives every incident board at least one failing row and one passing row", () => {
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      expect(mission.incident.board.some((row) => row.before === "fail")).toBe(true);
      expect(mission.incident.board.some((row) => row.before === "pass")).toBe(true);
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
        for (const group of item.keywords) {
          expect(group.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("scores each mission's own model answer at 100", () => {
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      const assessment = assessChapterInterview(mission, mission.interview.modelAnswer);
      expect(assessment.score, `${mission.id} model answer should fully match its own rubric: missing ${assessment.missing.join(", ")}`).toBe(100);
    }
  });

  it("contains no em-dashes in any user-facing string", () => {
    const raw = JSON.stringify(SOLID_CHAPTER_MISSIONS);
    expect(raw.includes("—")).toBe(false);
  });
});

describe("solid chapter engine", () => {
  const mission = SOLID_CHAPTER_MISSIONS[0];

  it("walks the happy path to complete", () => {
    let state = playToStage(mission, "transfer");
    expect(state.stage).toBe("transfer");
    const correctTransfer = mission.transfer.options.find((option) => option.correct)!;
    state = reduceChapter(mission, state, { type: "CHOOSE_TRANSFER", optionId: correctTransfer.id });
    expect(state.stage).toBe("pattern");
    const correctPattern = mission.pattern!.options.find((option) => option.correct)!;
    state = reduceChapter(mission, state, { type: "CHOOSE_PATTERN", optionId: correctPattern.id });
    expect(state.stage).toBe("debrief");
    state = reduceChapter(mission, state, { type: "ENTER_INTERVIEW" });
    expect(state.stage).toBe("interview");
    state = reduceChapter(mission, state, { type: "SUBMIT_INTERVIEW", score: 100 });
    expect(state.stage).toBe("complete");
    expect(state.interviewScore).toBe(100);
  });

  it("skips the pattern stage for chapters without a pattern unlock", () => {
    const lsp = getSolidChapterMission("lsp")!;
    let state = playToStage(lsp, "transfer");
    const correctTransfer = lsp.transfer.options.find((option) => option.correct)!;
    state = reduceChapter(lsp, state, { type: "CHOOSE_TRANSFER", optionId: correctTransfer.id });
    expect(state.stage).toBe("debrief");
  });

  it("keeps the learner on repair after a wrong choice, showing the consequence", () => {
    let state = playToStage(mission, "repair");
    const wrong = mission.repair.options.find((option) => !option.correct)!;
    state = reduceChapter(mission, state, { type: "CHOOSE_REPAIR", optionId: wrong.id });
    expect(state.stage).toBe("repair");
    expect(state.repairAttempts).toBe(1);
    expect(state.feedback).toBe(wrong.consequence);
    expect(state.activeWrongRepairId).toBe(wrong.id);
  });

  it("holds the interview stage below the completion threshold", () => {
    let state = playToStage(mission, "transfer");
    const correctTransfer = mission.transfer.options.find((option) => option.correct)!;
    state = reduceChapter(mission, state, { type: "CHOOSE_TRANSFER", optionId: correctTransfer.id });
    const correctPattern = mission.pattern!.options.find((option) => option.correct)!;
    state = reduceChapter(mission, state, { type: "CHOOSE_PATTERN", optionId: correctPattern.id });
    state = reduceChapter(mission, state, { type: "ENTER_INTERVIEW" });
    state = reduceChapter(mission, state, { type: "SUBMIT_INTERVIEW", score: CHAPTER_COMPLETION_THRESHOLD - 25 });
    expect(state.stage).toBe("interview");
    expect(state.interviewAttempts).toBe(1);
    state = reduceChapter(mission, state, { type: "SUBMIT_INTERVIEW", score: CHAPTER_COMPLETION_THRESHOLD });
    expect(state.stage).toBe("complete");
  });

  it("ignores actions issued from the wrong stage", () => {
    const fresh = createChapterState();
    expect(reduceChapter(mission, fresh, { type: "CHOOSE_REPAIR", optionId: "policy-slot" })).toBe(fresh);
    expect(reduceChapter(mission, fresh, { type: "SUBMIT_INTERVIEW", score: 100 })).toBe(fresh);
  });

  it("scores partial interview answers below 100", () => {
    const partial = assessChapterInterview(mission, "I would add a new class for each tariff.");
    expect(partial.score).toBeLessThan(100);
    expect(partial.missing.length).toBeGreaterThan(0);
  });
});
