import type { SolidPrincipleId } from "./lldGameMissions";

/**
 * Generic engine for SOLID campaign chapters 2 through 5 (OCP, LSP, ISP,
 * DIP). Each chapter repeats the loop the first shift proved: run the world
 * into a domain failure, choose a repair and see its consequence, rerun the
 * same incident, transfer the idea with hints off, then defend it in
 * interview language against a keyword rubric.
 *
 * The anti-MCQ contract still holds where it matters: a wrong repair is not
 * a red X, it is a consequence report (which flows fail now, which classes a
 * future change will touch), and the learner cannot progress until the rerun
 * of the SAME scenario board passes.
 */

export type ChapterStage =
  | "briefing"
  | "incident"
  | "repair"
  | "rerun"
  | "transfer"
  | "pattern"
  | "debrief"
  | "interview"
  | "complete";

export type ChapterPrincipleId = Exclude<SolidPrincipleId, "srp">;

export interface ScenarioRow {
  id: string;
  label: string;
  /** Status on the incident board, before any repair. */
  before: "pass" | "fail";
  detail: string;
}

export interface ChapterOption {
  id: string;
  label: string;
  correct: boolean;
  /** What the world looks like after this choice. Consequences, not verdicts. */
  consequence: string;
}

export interface ChapterRubricItem {
  id: string;
  label: string;
  /** Groups of alternatives: the item matches when EVERY group has a hit. */
  keywords: string[][];
}

export interface SolidChapterMission {
  id: ChapterPrincipleId;
  order: number;
  title: string;
  principle: string;
  hook: string;
  briefing: {
    headline: string;
    body: string;
    beats: string[];
  };
  incident: {
    intro: string;
    board: ScenarioRow[];
    failureBanner: string;
  };
  repair: {
    prompt: string;
    options: ChapterOption[];
  };
  rerun: {
    summary: string;
    before: string;
    after: string;
  };
  transfer: {
    prompt: string;
    options: ChapterOption[];
    success: string;
  };
  pattern?: {
    unlockedName: string;
    prompt: string;
    options: ChapterOption[];
    whenToUse: string;
    whenNotToUse: string;
  };
  debrief: {
    headline: string;
    body: string;
    mappings: { domain: string; software: string }[];
    javaSnippet: string;
    defense: string;
  };
  interview: {
    prompt: string;
    rubric: ChapterRubricItem[];
    modelAnswer: string;
  };
}

export interface ChapterState {
  stage: ChapterStage;
  /** Wrong repair currently on the board, if any, for consequence display. */
  activeWrongRepairId?: string;
  repairAttempts: number;
  activeWrongTransferId?: string;
  transferAttempts: number;
  activeWrongPatternId?: string;
  patternAttempts: number;
  interviewScore?: number;
  interviewAttempts: number;
  feedback?: string;
}

export type ChapterAction =
  | { type: "BEGIN" }
  | { type: "SEE_FAILURE" }
  | { type: "CHOOSE_REPAIR"; optionId: string }
  | { type: "CONFIRM_RERUN" }
  | { type: "CHOOSE_TRANSFER"; optionId: string }
  | { type: "CHOOSE_PATTERN"; optionId: string }
  | { type: "ENTER_INTERVIEW" }
  | { type: "SUBMIT_INTERVIEW"; score: number }
  | { type: "RESET" };

export function createChapterState(): ChapterState {
  return {
    stage: "briefing",
    repairAttempts: 0,
    transferAttempts: 0,
    patternAttempts: 0,
    interviewAttempts: 0,
  };
}

export const CHAPTER_COMPLETION_THRESHOLD = 75;

export function reduceChapter(
  mission: SolidChapterMission,
  state: ChapterState,
  action: ChapterAction,
): ChapterState {
  switch (action.type) {
    case "BEGIN":
      return state.stage === "briefing"
        ? { ...state, stage: "incident", feedback: mission.incident.intro }
        : state;
    case "SEE_FAILURE":
      return state.stage === "incident"
        ? { ...state, stage: "repair", feedback: mission.incident.failureBanner }
        : state;
    case "CHOOSE_REPAIR": {
      if (state.stage !== "repair") return state;
      const option = mission.repair.options.find((candidate) => candidate.id === action.optionId);
      if (!option) return state;
      if (!option.correct) {
        return {
          ...state,
          activeWrongRepairId: option.id,
          repairAttempts: state.repairAttempts + 1,
          feedback: option.consequence,
        };
      }
      return {
        ...state,
        stage: "rerun",
        activeWrongRepairId: undefined,
        feedback: option.consequence,
      };
    }
    case "CONFIRM_RERUN":
      return state.stage === "rerun"
        ? { ...state, stage: "transfer", feedback: mission.transfer.prompt }
        : state;
    case "CHOOSE_TRANSFER": {
      if (state.stage !== "transfer") return state;
      const option = mission.transfer.options.find((candidate) => candidate.id === action.optionId);
      if (!option) return state;
      if (!option.correct) {
        return {
          ...state,
          activeWrongTransferId: option.id,
          transferAttempts: state.transferAttempts + 1,
          feedback: option.consequence,
        };
      }
      return {
        ...state,
        stage: mission.pattern ? "pattern" : "debrief",
        activeWrongTransferId: undefined,
        feedback: mission.transfer.success,
      };
    }
    case "CHOOSE_PATTERN": {
      if (state.stage !== "pattern" || !mission.pattern) return state;
      const option = mission.pattern.options.find((candidate) => candidate.id === action.optionId);
      if (!option) return state;
      if (!option.correct) {
        return {
          ...state,
          activeWrongPatternId: option.id,
          patternAttempts: state.patternAttempts + 1,
          feedback: option.consequence,
        };
      }
      return {
        ...state,
        stage: "debrief",
        activeWrongPatternId: undefined,
        feedback: option.consequence,
      };
    }
    case "ENTER_INTERVIEW":
      return state.stage === "debrief" ? { ...state, stage: "interview", feedback: undefined } : state;
    case "SUBMIT_INTERVIEW":
      if (state.stage !== "interview") return state;
      return {
        ...state,
        interviewScore: action.score,
        interviewAttempts: state.interviewAttempts + 1,
        stage: action.score >= CHAPTER_COMPLETION_THRESHOLD ? "complete" : "interview",
      };
    case "RESET":
      return createChapterState();
    default:
      return state;
  }
}

export interface ChapterInterviewAssessment {
  score: number;
  matched: string[];
  missing: string[];
}

export function assessChapterInterview(
  mission: SolidChapterMission,
  answer: string,
): ChapterInterviewAssessment {
  const normalized = answer.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const perItem = Math.floor(100 / mission.interview.rubric.length);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const item of mission.interview.rubric) {
    const hit = item.keywords.every((group) =>
      group.some((keyword) => normalized.includes(keyword.toLowerCase())),
    );
    (hit ? matched : missing).push(item.label);
  }
  const score = matched.length === mission.interview.rubric.length ? 100 : matched.length * perItem;
  return { score, matched, missing };
}
