import { describe, expect, it } from "vitest";
import {
  assessFirstShiftInterview,
  canParkShiftSpot,
  createFirstShiftState,
  firstShiftReducer,
  getShiftSpotState,
} from "./firstShiftEngine";
import type { FirstShiftState } from "./firstShiftEngine";

describe("firstShiftEngine", () => {
  it("teaches manual inspection before allowing the first car to park", () => {
    let state = firstShiftReducer(createFirstShiftState(), { type: "START_SHIFT" });
    state = firstShiftReducer(state, { type: "OPEN_GATE" });
    expect(getShiftSpotState(state, "A1")).toBe("unknown");
    state = firstShiftReducer(state, { type: "INSPECT_SPOT", spotId: "A1" });
    expect(getShiftSpotState(state, "A1")).toBe("occupied");
    state = firstShiftReducer(state, { type: "INSPECT_SPOT", spotId: "A3" });
    expect(canParkShiftSpot(state, "A3")).toBe(true);
    state = firstShiftReducer(state, { type: "PARK_SPOT", spotId: "A3" });
    expect(state).toMatchObject({ stage: "between-cars", carsParked: 1, queue: 0 });
  });

  it("turns repeated manual inspection into a visible rush-hour bottleneck", () => {
    let state: FirstShiftState = { ...createFirstShiftState(), stage: "rush-intro", carsParked: 2 };
    state = firstShiftReducer(state, { type: "START_RUSH" });
    state = firstShiftReducer(state, { type: "INSPECT_SPOT", spotId: "A1" });
    expect(state.stage).toBe("rush-search");
    state = firstShiftReducer(state, { type: "INSPECT_SPOT", spotId: "A2" });
    expect(state).toMatchObject({ stage: "bottleneck", queue: 3, rushChecks: 2 });
  });

  it("demonstrates the scanner on Floor 1 and clears the queue", () => {
    let state: FirstShiftState = { ...createFirstShiftState(), stage: "bottleneck", queue: 3 };
    state = firstShiftReducer(state, { type: "ASK_MENTOR" });
    state = firstShiftReducer(state, { type: "PICK_SCANNER" });
    state = firstShiftReducer(state, { type: "INSTALL_SCANNER", floor: 1 });
    expect(state).toMatchObject({ stage: "floor1-installed", floor1ScannerInstalled: true });
    state = firstShiftReducer(state, { type: "RUN_SCANNER" });
    state = firstShiftReducer(state, { type: "SCANNER_FINISH" });
    expect(state).toMatchObject({ stage: "floor1-success", carsParked: 5, queue: 0 });
  });

  it("requires the learner to transfer the scanner idea to Floor 2", () => {
    let state: FirstShiftState = { ...createFirstShiftState(), stage: "floor1-success", carsParked: 5 };
    state = firstShiftReducer(state, { type: "START_TRANSFER" });
    state = firstShiftReducer(state, { type: "PICK_SCANNER" });
    state = firstShiftReducer(state, { type: "INSTALL_SCANNER", floor: 1 });
    expect(state).toMatchObject({ stage: "carrying-transfer", attempts: 1 });
    state = firstShiftReducer(state, { type: "INSTALL_SCANNER", floor: 2 });
    state = firstShiftReducer(state, { type: "RUN_SCANNER" });
    state = firstShiftReducer(state, { type: "SCANNER_FINISH" });
    expect(state).toMatchObject({ stage: "reveal", floor2ScannerInstalled: true, carsParked: 8 });
  });

  it("scores an explanation by design evidence rather than exact wording", () => {
    const strong = assessFirstShiftInterview(
      "Each Level owns its parking spaces, so findSpot searches the spaces already held by that floor. ParkingLot only coordinates the floors. This focused one-job design contains future changes.",
    );
    expect(strong.score).toBe(100);
    expect(strong.missing).toEqual([]);
    expect(assessFirstShiftInterview("I would add a scanner.").score).toBe(0);
  });

  it("ignores actions that do not belong to the current story stage", () => {
    const state = createFirstShiftState();
    expect(firstShiftReducer(state, { type: "INSPECT_SPOT", spotId: "A3" })).toBe(state);
    expect(firstShiftReducer(state, { type: "RUN_SCANNER" })).toBe(state);
    expect(firstShiftReducer(state, { type: "INSTALL_SCANNER", floor: 2 })).toBe(state);
  });
});
