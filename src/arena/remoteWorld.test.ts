import { describe, expect, it } from "vitest";
import {
  advanceRemoteWorld,
  boardReadsGreen,
  CHARGER_FAULT_TICK,
  createRemoteWorld,
  runRemoteWorldToEnd,
} from "./remoteWorld";

describe("one remote world", () => {
  it("first sweep is honestly green: every device alive and every self-test OK", () => {
    let world = createRemoteWorld();
    world = advanceRemoteWorld(world);
    expect(world.devices.every((device) => device.alive)).toBe(true);
    expect(world.devices.every((device) => device.reportedOk)).toBe(true);
    expect(boardReadsGreen(world)).toBe(true);
    const sweep = world.log[0];
    expect(sweep.kind).toBe("sweep");
    expect(sweep.text).toContain("Board is green");
  });

  it("the charger dies at the scripted tick but its self-test keeps saying OK", () => {
    let world = createRemoteWorld();
    for (let step = 0; step < CHARGER_FAULT_TICK; step += 1) world = advanceRemoteWorld(world);
    const charger = world.devices.find((device) => device.id === "EVCharger");
    // The core lie: hardware dead, board belief untouched.
    expect(charger?.alive).toBe(false);
    expect(charger?.reportedOk).toBe(true);
    expect(world.log.some((entry) => entry.kind === "fault")).toBe(true);
  });

  it("the next sweep still reads green because runSelfTest() is a forced stub", () => {
    let world = createRemoteWorld();
    for (let step = 0; step < CHARGER_FAULT_TICK + 1; step += 1) world = advanceRemoteWorld(world);
    expect(boardReadsGreen(world)).toBe(true);
    const secondSweep = world.log.find((entry) => entry.kind === "sweep" && entry.text.includes("sweep 2"));
    expect(secondSweep?.text).toContain("forced stub");
    expect(secondSweep?.text).toContain("reading a fake");
  });

  it("strands three drivers at the dead pad, in arrival order", () => {
    const world = runRemoteWorldToEnd();
    expect(world.strandedDrivers).toEqual(["KA-21", "KA-22", "KA-23"]);
    expect(world.ended).toBe(true);
    // The wall never stopped claiming green.
    expect(boardReadsGreen(world)).toBe(true);
  });

  it("names the forced-stub cause when the incident ends", () => {
    const world = runRemoteWorldToEnd();
    const exposed = world.log.find((entry) => entry.kind === "exposed");
    expect(exposed?.text).toContain("forced every device to fake what it could not do");
    expect(exposed?.text).toContain("one fake hid a real fault");
  });

  it("freezes once ended: advancing an ended world changes nothing", () => {
    const endedWorld = runRemoteWorldToEnd();
    expect(advanceRemoteWorld(endedWorld)).toBe(endedWorld);
  });

  it("is deterministic: two runs produce identical logs and end states", () => {
    const first = runRemoteWorldToEnd();
    const second = runRemoteWorldToEnd();
    expect(first.log).toEqual(second.log);
    expect(first.devices).toEqual(second.devices);
    expect(first.strandedDrivers).toEqual(second.strandedDrivers);
  });

  it("keeps the narrative free of em-dashes", () => {
    const world = runRemoteWorldToEnd();
    expect(world.log.some((entry) => entry.text.includes("\u2014"))).toBe(false);
  });
});
