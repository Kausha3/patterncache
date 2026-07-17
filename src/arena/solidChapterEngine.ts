import type { SolidPrincipleId } from "./lldGameMissions";

/**
 * Engine for SOLID campaign chapters 2 through 5 (OCP, LSP, ISP, DIP).
 *
 * The core mechanic is a WORKBENCH, not a multiple-choice list. The learner
 * adjusts a design configuration (where each tariff lives, how a subtype
 * behaves, which contract owns each operation, what the exit flow depends
 * on), then RUNS the world. Every scenario row's pass/fail is COMPUTED from
 * the actual configuration by an evaluation rule; no option is labeled
 * correct anywhere. Wrong configurations produce different, specific
 * failures worth reading, and progression requires making the same board
 * pass on a rerun. That is the campaign's acceptance rule made literal:
 * repair and rerun the world, never pick the blessed answer.
 */

export type ChapterStage =
  | "briefing"
  | "incident"
  | "repair"
  | "transfer"
  | "pattern"
  | "debrief"
  | "interview"
  | "complete";

export type ChapterPrincipleId = Exclude<SolidPrincipleId, "srp">;

export type BenchConfig = Record<string, string>;

export interface BenchControlOption {
  id: string;
  label: string;
}

export interface BenchControl {
  id: string;
  /** The design question, e.g. "Where does the EV charging fee live?" */
  label: string;
  options: BenchControlOption[];
  /** The broken starting position the incident ships with. */
  initial: string;
}

export interface BenchRowResult {
  pass: boolean;
  detail: string;
}

export interface BenchRow {
  id: string;
  label: string;
  evaluate: (config: BenchConfig) => BenchRowResult;
}

export interface Workbench {
  intro: string;
  controls: BenchControl[];
  rows: BenchRow[];
  successNote: string;
}

export interface ChapterOption {
  id: string;
  label: string;
  correct: boolean;
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
    failureBanner: string;
  };
  repairBench: Workbench;
  rerun: {
    before: string;
    after: string;
  };
  transferBench: Workbench;
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

export interface BenchState {
  config: BenchConfig;
  /** Results of the most recent run, if any. */
  results?: { rowId: string; pass: boolean; detail: string }[];
  allPass: boolean;
  runs: number;
}

export interface ChapterState {
  stage: ChapterStage;
  repair: BenchState;
  transfer: BenchState;
  activeWrongPatternId?: string;
  patternAttempts: number;
  interviewScore?: number;
  interviewAttempts: number;
  feedback?: string;
}

export type ChapterAction =
  | { type: "BEGIN" }
  | { type: "SEE_FAILURE" }
  | { type: "SET_CONTROL"; bench: "repair" | "transfer"; controlId: string; optionId: string }
  | { type: "RUN_BENCH"; bench: "repair" | "transfer" }
  | { type: "CONFIRM_RERUN" }
  | { type: "CHOOSE_PATTERN"; optionId: string }
  | { type: "ENTER_INTERVIEW" }
  | { type: "SUBMIT_INTERVIEW"; score: number }
  | { type: "RESET" };

export function initialBenchConfig(bench: Workbench): BenchConfig {
  return Object.fromEntries(bench.controls.map((control) => [control.id, control.initial]));
}

export function runBench(bench: Workbench, config: BenchConfig): { rowId: string; pass: boolean; detail: string }[] {
  return bench.rows.map((row) => {
    const result = row.evaluate(config);
    return { rowId: row.id, pass: result.pass, detail: result.detail };
  });
}

function freshBenchState(bench: Workbench): BenchState {
  return { config: initialBenchConfig(bench), allPass: false, runs: 0 };
}

export function createChapterState(mission: SolidChapterMission): ChapterState {
  return {
    stage: "briefing",
    repair: freshBenchState(mission.repairBench),
    transfer: freshBenchState(mission.transferBench),
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
    case "BEGIN": {
      if (state.stage !== "briefing") return state;
      // The incident IS the repair bench run at its broken initial config:
      // the learner sees real computed failures before touching anything.
      const results = runBench(mission.repairBench, state.repair.config);
      return {
        ...state,
        stage: "incident",
        repair: { ...state.repair, results, allPass: results.every((row) => row.pass) },
        feedback: mission.incident.intro,
      };
    }
    case "SEE_FAILURE":
      return state.stage === "incident"
        ? { ...state, stage: "repair", feedback: mission.incident.failureBanner }
        : state;
    case "SET_CONTROL": {
      if (state.stage !== action.bench) return state;
      const bench = action.bench === "repair" ? mission.repairBench : mission.transferBench;
      const control = bench.controls.find((candidate) => candidate.id === action.controlId);
      if (!control || !control.options.some((option) => option.id === action.optionId)) return state;
      const target = state[action.bench];
      return {
        ...state,
        [action.bench]: {
          ...target,
          config: { ...target.config, [action.controlId]: action.optionId },
          // A change invalidates the last run: the world must be rerun.
          results: undefined,
          allPass: false,
        },
      };
    }
    case "RUN_BENCH": {
      if (state.stage !== action.bench) return state;
      const bench = action.bench === "repair" ? mission.repairBench : mission.transferBench;
      const target = state[action.bench];
      const results = runBench(bench, target.config);
      const allPass = results.every((row) => row.pass);
      return {
        ...state,
        [action.bench]: { ...target, results, allPass, runs: target.runs + 1 },
        feedback: allPass ? bench.successNote : undefined,
      };
    }
    case "CONFIRM_RERUN":
      return state.stage === "repair" && state.repair.allPass
        ? { ...state, stage: "transfer", feedback: mission.transferBench.intro }
        : state.stage === "transfer" && state.transfer.allPass
          ? { ...state, stage: mission.pattern ? "pattern" : "debrief", feedback: undefined }
          : state;
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
      return { ...state, stage: "debrief", activeWrongPatternId: undefined, feedback: option.consequence };
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
      return createChapterState(mission);
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

/**
 * Enumerate every configuration of a bench. Used by tests to prove the
 * search space is honest: the initial config fails, at least one config
 * passes, and distinct wrong configs produce distinct failure details.
 */
export function enumerateBenchConfigs(bench: Workbench): BenchConfig[] {
  let configs: BenchConfig[] = [{}];
  for (const control of bench.controls) {
    configs = configs.flatMap((config) =>
      control.options.map((option) => ({ ...config, [control.id]: option.id })),
    );
  }
  return configs;
}
