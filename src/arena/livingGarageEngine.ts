export type LivingGarageMode = "guided" | "recall";

export type LivingGarageStage =
  | "ready"
  | "running"
  | "failed"
  | "carrying"
  | "repaired"
  | "rerunning"
  | "success";

export type GarageWorldOwner = "hq" | "floor-1" | "floor-2";

export type LivingGarageState = {
  mode: LivingGarageMode;
  stage: LivingGarageStage;
  moduleOwner: GarageWorldOwner;
  attempts: number;
  lastWrongTarget?: GarageWorldOwner;
};

export type LivingGarageAction =
  | { type: "RUN_WAVE" }
  | { type: "FAIL_WAVE" }
  | { type: "PICK_UP_MODULE" }
  | { type: "INSTALL_MODULE"; target: GarageWorldOwner }
  | { type: "PASS_WAVE" }
  | { type: "START_RECALL" }
  | { type: "RESET" };

export function createLivingGarageState(mode: LivingGarageMode = "guided"): LivingGarageState {
  return {
    mode,
    stage: "ready",
    moduleOwner: "hq",
    attempts: 0,
  };
}

export function getLivingGarageTarget(mode: LivingGarageMode): GarageWorldOwner {
  return mode === "guided" ? "floor-1" : "floor-2";
}

export function livingGarageReducer(
  state: LivingGarageState,
  action: LivingGarageAction,
): LivingGarageState {
  switch (action.type) {
    case "RUN_WAVE":
      if (state.stage === "ready") return { ...state, stage: "running", lastWrongTarget: undefined };
      if (state.stage === "repaired") return { ...state, stage: "rerunning", lastWrongTarget: undefined };
      return state;
    case "FAIL_WAVE":
      return state.stage === "running" ? { ...state, stage: "failed" } : state;
    case "PICK_UP_MODULE":
      return state.stage === "failed" ? { ...state, stage: "carrying" } : state;
    case "INSTALL_MODULE": {
      if (state.stage !== "carrying") return state;
      const target = getLivingGarageTarget(state.mode);
      if (action.target !== target) {
        return {
          ...state,
          stage: "failed",
          moduleOwner: "hq",
          attempts: state.attempts + 1,
          lastWrongTarget: action.target,
        };
      }
      return {
        ...state,
        stage: "repaired",
        moduleOwner: target,
        attempts: state.attempts + 1,
        lastWrongTarget: undefined,
      };
    }
    case "PASS_WAVE":
      return state.stage === "rerunning" ? { ...state, stage: "success" } : state;
    case "START_RECALL":
      return createLivingGarageState("recall");
    case "RESET":
      return createLivingGarageState();
    default:
      return state;
  }
}

export function getLivingGarageCarsParked(state: LivingGarageState): number {
  if (state.stage === "ready") return 0;
  if (state.stage === "running" || state.stage === "failed" || state.stage === "carrying" || state.stage === "repaired") return 2;
  if (state.stage === "rerunning") return 4;
  return 5;
}

