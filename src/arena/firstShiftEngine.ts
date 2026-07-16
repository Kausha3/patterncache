export type FirstShiftStage =
  | "intro"
  | "arrival-one"
  | "manual-one"
  | "between-cars"
  | "manual-two"
  | "rush-intro"
  | "rush-search"
  | "bottleneck"
  | "demo"
  | "carrying-demo"
  | "floor1-installed"
  | "floor1-running"
  | "floor1-success"
  | "transfer"
  | "carrying-transfer"
  | "floor2-installed"
  | "floor2-running"
  | "reveal"
  | "interview"
  | "complete";

export type ShiftFloor = 1 | 2;
export type ShiftSpotId = "A1" | "A2" | "A3" | "B1" | "B2" | "B3";
export type ShiftSpotState = "unknown" | "occupied" | "free";

export const SHIFT_SPOTS: ShiftSpotId[] = ["A1", "A2", "A3", "B1", "B2", "B3"];

const FIRST_CAR_SPOTS: Record<ShiftSpotId, Exclude<ShiftSpotState, "unknown">> = {
  A1: "occupied",
  A2: "occupied",
  A3: "free",
  B1: "occupied",
  B2: "occupied",
  B3: "occupied",
};

const SECOND_CAR_SPOTS: Record<ShiftSpotId, Exclude<ShiftSpotState, "unknown">> = {
  A1: "occupied",
  A2: "occupied",
  A3: "occupied",
  B1: "occupied",
  B2: "free",
  B3: "occupied",
};

export type FirstShiftState = {
  stage: FirstShiftStage;
  carsParked: number;
  queue: number;
  revealedSpots: ShiftSpotId[];
  manualChecks: number;
  rushChecks: number;
  scannerHeld: boolean;
  floor1ScannerInstalled: boolean;
  floor2ScannerInstalled: boolean;
  attempts: number;
  feedback?: string;
  interviewScore?: number;
};

export type FirstShiftAction =
  | { type: "START_SHIFT" }
  | { type: "OPEN_GATE" }
  | { type: "INSPECT_SPOT"; spotId: ShiftSpotId }
  | { type: "PARK_SPOT"; spotId: ShiftSpotId }
  | { type: "NEXT_CAR" }
  | { type: "START_RUSH" }
  | { type: "ASK_MENTOR" }
  | { type: "PICK_SCANNER" }
  | { type: "INSTALL_SCANNER"; floor: ShiftFloor }
  | { type: "RUN_SCANNER" }
  | { type: "SCANNER_FINISH" }
  | { type: "START_TRANSFER" }
  | { type: "ENTER_INTERVIEW" }
  | { type: "SUBMIT_INTERVIEW"; score: number }
  | { type: "RESET" };

export function createFirstShiftState(): FirstShiftState {
  return {
    stage: "intro",
    carsParked: 0,
    queue: 0,
    revealedSpots: [],
    manualChecks: 0,
    rushChecks: 0,
    scannerHeld: false,
    floor1ScannerInstalled: false,
    floor2ScannerInstalled: false,
    attempts: 0,
  };
}

export function firstShiftReducer(state: FirstShiftState, action: FirstShiftAction): FirstShiftState {
  switch (action.type) {
    case "START_SHIFT":
      return state.stage === "intro"
        ? { ...state, stage: "arrival-one", queue: 1, feedback: "Your first driver is waiting at the entry gate." }
        : state;
    case "OPEN_GATE":
      return state.stage === "arrival-one"
        ? { ...state, stage: "manual-one", revealedSpots: [], feedback: "The driver reached Floor 1. Check its spaces until you find a free one." }
        : state;
    case "INSPECT_SPOT":
      return inspectSpot(state, action.spotId);
    case "PARK_SPOT":
      return parkSpot(state, action.spotId);
    case "NEXT_CAR":
      return state.stage === "between-cars"
        ? { ...state, stage: "manual-two", queue: 1, revealedSpots: [], feedback: "A second driver arrived. Floor 1 still has no automatic way to search." }
        : state;
    case "START_RUSH":
      return state.stage === "rush-intro"
        ? { ...state, stage: "rush-search", queue: 3, revealedSpots: [], rushChecks: 0, feedback: "Three drivers arrived together. Start checking Floor 1 again." }
        : state;
    case "ASK_MENTOR":
      return state.stage === "bottleneck"
        ? { ...state, stage: "demo", feedback: "The floor already holds all six space states. Give that floor one scanner that can read them instantly." }
        : state;
    case "PICK_SCANNER":
      if (state.stage === "demo") return { ...state, stage: "carrying-demo", scannerHeld: true, feedback: "Install the scanner on Floor 1, beside the spaces it must read." };
      if (state.stage === "transfer") return { ...state, stage: "carrying-transfer", scannerHeld: true, feedback: "Floor 2 is now backing up. Install the new scanner where that floor's spaces live." };
      return state;
    case "INSTALL_SCANNER":
      return installScanner(state, action.floor);
    case "RUN_SCANNER":
      if (state.stage === "floor1-installed") return { ...state, stage: "floor1-running", feedback: "Floor 1 is reading all six spaces in one scan." };
      if (state.stage === "floor2-installed") return { ...state, stage: "floor2-running", feedback: "Floor 2 is now searching its own spaces without a hint." };
      return state;
    case "SCANNER_FINISH":
      if (state.stage === "floor1-running") {
        return { ...state, stage: "floor1-success", carsParked: 5, queue: 0, feedback: "The queue cleared. Manual search needed many checks; the floor scanner needed one request." };
      }
      if (state.stage === "floor2-running") {
        return { ...state, stage: "reveal", carsParked: 8, queue: 0, feedback: "You transferred the same idea to a new floor without being told the answer." };
      }
      return state;
    case "START_TRANSFER":
      return state.stage === "floor1-success"
        ? { ...state, stage: "transfer", queue: 3, scannerHeld: false, feedback: "Rush hour moved to Floor 2. Use what made Floor 1 fast." }
        : state;
    case "ENTER_INTERVIEW":
      return state.stage === "reveal" ? { ...state, stage: "interview", feedback: undefined } : state;
    case "SUBMIT_INTERVIEW":
      if (state.stage !== "interview") return state;
      return {
        ...state,
        interviewScore: action.score,
        stage: action.score >= 75 ? "complete" : "interview",
        feedback: action.score >= 75
          ? "You explained the design using the experience you just had."
          : "The world makes sense. Now connect your explanation to the floor, its spaces, and the garage coordinator.",
      };
    case "RESET":
      return createFirstShiftState();
    default:
      return state;
  }
}

export function getShiftSpotState(state: FirstShiftState, spotId: ShiftSpotId): ShiftSpotState {
  if (!state.revealedSpots.includes(spotId)) return "unknown";
  if (state.stage === "manual-one") return FIRST_CAR_SPOTS[spotId];
  if (state.stage === "manual-two") return SECOND_CAR_SPOTS[spotId];
  return "occupied";
}

export function canParkShiftSpot(state: FirstShiftState, spotId: ShiftSpotId): boolean {
  return getShiftSpotState(state, spotId) === "free";
}

export type FirstShiftInterviewAssessment = {
  score: number;
  matched: string[];
  missing: string[];
};

export function assessFirstShiftInterview(answer: string): FirstShiftInterviewAssessment {
  const normalized = answer.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const evidence = [
    {
      label: "The floor owns its parking spaces",
      matched: /(floor|level)/.test(normalized) && /(own|remember|contain|has|holds)/.test(normalized) && /(spot|space)/.test(normalized),
    },
    {
      label: "findSpot searches those spaces",
      matched: /(find ?spot|search|scan)/.test(normalized) && /(spot|space)/.test(normalized),
    },
    {
      label: "ParkingLot coordinates floors",
      matched: /(parking ?lot|garage)/.test(normalized) && /(coordinate|direct|route|floor)/.test(normalized),
    },
    {
      label: "Focused ownership contains future change",
      matched: /(focus|single responsibility|one job|change|easier to modify|contained)/.test(normalized),
    },
  ];
  const matched = evidence.filter((item) => item.matched).map((item) => item.label);
  const missing = evidence.filter((item) => !item.matched).map((item) => item.label);
  return { score: matched.length * 25, matched, missing };
}

function inspectSpot(state: FirstShiftState, spotId: ShiftSpotId): FirstShiftState {
  if (state.stage !== "manual-one" && state.stage !== "manual-two" && state.stage !== "rush-search") return state;
  if (state.revealedSpots.includes(spotId)) return state;
  const revealedSpots = [...state.revealedSpots, spotId];
  if (state.stage === "rush-search") {
    const rushChecks = state.rushChecks + 1;
    if (rushChecks >= 2) {
      return {
        ...state,
        stage: "bottleneck",
        revealedSpots,
        rushChecks,
        feedback: "While you checked two spaces, three more drivers joined the queue. Manual search cannot keep up.",
      };
    }
    return { ...state, revealedSpots, rushChecks, feedback: `${spotId} is occupied. The queue is still growing.` };
  }
  const spotState = state.stage === "manual-one" ? FIRST_CAR_SPOTS[spotId] : SECOND_CAR_SPOTS[spotId];
  return {
    ...state,
    revealedSpots,
    manualChecks: state.manualChecks + 1,
    feedback: spotState === "free" ? `${spotId} is free. Guide the car into this space.` : `${spotId} is occupied. Check another space on this floor.`,
  };
}

function parkSpot(state: FirstShiftState, spotId: ShiftSpotId): FirstShiftState {
  if (!canParkShiftSpot(state, spotId)) return state;
  if (state.stage === "manual-one") {
    return { ...state, stage: "between-cars", carsParked: 1, queue: 0, feedback: `You parked the first car after ${state.manualChecks} manual checks.` };
  }
  if (state.stage === "manual-two") {
    return { ...state, stage: "rush-intro", carsParked: 2, queue: 0, feedback: `You parked the second car, but manual searching has now cost ${state.manualChecks} checks.` };
  }
  return state;
}

function installScanner(state: FirstShiftState, floor: ShiftFloor): FirstShiftState {
  if (state.stage === "carrying-demo") {
    if (floor !== 1) return state;
    return { ...state, stage: "floor1-installed", scannerHeld: false, floor1ScannerInstalled: true, feedback: "Floor 1 can now inspect every space it owns in a single action." };
  }
  if (state.stage === "carrying-transfer") {
    if (floor !== 2) {
      return { ...state, attempts: state.attempts + 1, feedback: "Floor 1 is already fast. Floor 2 is the floor whose spaces need to be searched now." };
    }
    return { ...state, stage: "floor2-installed", scannerHeld: false, floor2ScannerInstalled: true, feedback: "Correct. Floor 2 now has the same ability beside its own spaces." };
  }
  return state;
}
