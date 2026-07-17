import { describe, expect, it } from "vitest";
import {
  advanceOutageWorld,
  createOutageWorld,
  movingLaneCount,
  runOutageWorldToEnd,
} from "./outageWorld";

describe("exit rush outage world", () => {
  it("works before it breaks: cars pay and leave across all three lanes", () => {
    let world = createOutageWorld();
    for (let step = 0; step < 3; step += 1) world = advanceOutageWorld(world);
    expect(world.lanes.map((lane) => lane.processed)).toEqual([1, 1, 1]);
    expect(world.lanes.every((lane) => !lane.frozen)).toBe(true);
    expect(movingLaneCount(world)).toBe(3);
    expect(world.stuckCars).toEqual([]);
    expect(world.log.filter((entry) => entry.kind === "exit")).toHaveLength(3);
    expect(world.log[0].text).toBe("Lane 1: KA-31 pays and exits. 14 cars an hour.");
  });

  it("freezes all three lanes in one tick: one vendor, three simultaneous failures", () => {
    let world = createOutageWorld();
    for (let step = 0; step < 3; step += 1) world = advanceOutageWorld(world);
    expect(world.vendorDown).toBe(false);
    expect(movingLaneCount(world)).toBe(3);
    world = advanceOutageWorld(world);
    expect(world.vendorDown).toBe(true);
    expect(world.lanes.every((lane) => lane.frozen)).toBe(true);
    expect(movingLaneCount(world)).toBe(0);
    const outage = world.log.find((entry) => entry.kind === "outage");
    expect(outage?.text).toContain("Every terminal times out at once");
  });

  it("piles up stuck cars each tick once the terminals are dead", () => {
    let world = createOutageWorld();
    for (let step = 0; step < 5; step += 1) world = advanceOutageWorld(world);
    expect(world.stuckCars).toEqual(["KA-58", "KA-63"]);
    world = advanceOutageWorld(world);
    expect(world.stuckCars).toEqual(["KA-58", "KA-63", "KA-71", "KA-77"]);
    expect(world.log.filter((entry) => entry.kind === "stuck").length).toBeGreaterThanOrEqual(2);
  });

  it("names the missing seam: inline construction left ops nothing to swap", () => {
    const world = runOutageWorldToEnd();
    const noSeam = world.log.find((entry) => entry.kind === "no-seam");
    expect(noSeam?.text).toContain("There is nothing to swap");
    expect(noSeam?.text).toContain("each lane built AcmePayClient inside its own exit flow");
  });

  it("ends in meltdown once four or more cars are stuck", () => {
    const world = runOutageWorldToEnd();
    expect(world.ended).toBe(true);
    expect(world.stuckCars.length).toBeGreaterThanOrEqual(4);
    const meltdown = world.log.find((entry) => entry.kind === "meltdown");
    expect(meltdown?.text).toContain("High-level exit flow welded to a low-level client");
    expect(world.log[world.log.length - 1]).toBe(meltdown);
  });

  it("freezes once ended: advancing an ended world changes nothing", () => {
    const endedWorld = runOutageWorldToEnd();
    expect(advanceOutageWorld(endedWorld)).toBe(endedWorld);
  });

  it("is deterministic: two runs produce identical logs", () => {
    const first = runOutageWorldToEnd();
    const second = runOutageWorldToEnd();
    expect(first.log).toEqual(second.log);
    expect(first.stuckCars).toEqual(second.stuckCars);
  });

  it("keeps the narrative free of em-dashes", () => {
    const world = runOutageWorldToEnd();
    expect(world.log.some((entry) => entry.text.includes("\u2014"))).toBe(false);
  });
});
