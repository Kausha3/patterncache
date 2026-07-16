import { describe, expect, it } from "vitest";
import {
  createLivingGarageState,
  getLivingGarageCarsParked,
  getLivingGarageTarget,
  livingGarageReducer,
} from "./livingGarageEngine";

describe("livingGarageEngine", () => {
  it("runs, fails, repairs the guided floor, and passes", () => {
    let state = createLivingGarageState();
    state = livingGarageReducer(state, { type: "RUN_WAVE" });
    expect(state.stage).toBe("running");
    state = livingGarageReducer(state, { type: "FAIL_WAVE" });
    state = livingGarageReducer(state, { type: "PICK_UP_MODULE" });
    state = livingGarageReducer(state, { type: "INSTALL_MODULE", target: "floor-1" });
    expect(state).toMatchObject({ stage: "repaired", moduleOwner: "floor-1", attempts: 1 });
    state = livingGarageReducer(state, { type: "RUN_WAVE" });
    state = livingGarageReducer(state, { type: "PASS_WAVE" });
    expect(state.stage).toBe("success");
    expect(getLivingGarageCarsParked(state)).toBe(5);
  });

  it("rejects a spatially wrong owner and returns the module to headquarters", () => {
    let state = createLivingGarageState();
    state = livingGarageReducer(state, { type: "RUN_WAVE" });
    state = livingGarageReducer(state, { type: "FAIL_WAVE" });
    state = livingGarageReducer(state, { type: "PICK_UP_MODULE" });
    state = livingGarageReducer(state, { type: "INSTALL_MODULE", target: "hq" });
    expect(state).toMatchObject({
      stage: "failed",
      moduleOwner: "hq",
      attempts: 1,
      lastWrongTarget: "hq",
    });
  });

  it("moves the transfer challenge to Floor 2 without changing the mechanic", () => {
    let state = livingGarageReducer(createLivingGarageState(), { type: "START_RECALL" });
    expect(getLivingGarageTarget(state.mode)).toBe("floor-2");
    state = livingGarageReducer(state, { type: "RUN_WAVE" });
    state = livingGarageReducer(state, { type: "FAIL_WAVE" });
    state = livingGarageReducer(state, { type: "PICK_UP_MODULE" });
    state = livingGarageReducer(state, { type: "INSTALL_MODULE", target: "floor-1" });
    expect(state.stage).toBe("failed");
    state = livingGarageReducer(state, { type: "PICK_UP_MODULE" });
    state = livingGarageReducer(state, { type: "INSTALL_MODULE", target: "floor-2" });
    expect(state).toMatchObject({ stage: "repaired", moduleOwner: "floor-2", attempts: 2 });
  });

  it("ignores actions that are invalid for the current stage", () => {
    const state = createLivingGarageState();
    expect(livingGarageReducer(state, { type: "PICK_UP_MODULE" })).toBe(state);
    expect(livingGarageReducer(state, { type: "INSTALL_MODULE", target: "floor-1" })).toBe(state);
    expect(livingGarageReducer(state, { type: "PASS_WAVE" })).toBe(state);
  });
});
