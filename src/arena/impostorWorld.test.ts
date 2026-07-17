import { describe, expect, it } from "vitest";
import {
  advanceImpostorWorld,
  createImpostorWorld,
  reportedFreeCount,
  runImpostorWorldToJam,
} from "./impostorWorld";

describe("impostor spot world", () => {
  it("starts honest: all four spots report free, nobody waiting", () => {
    const world = createImpostorWorld();
    expect(reportedFreeCount(world)).toBe(4);
    expect(world.queue).toEqual([]);
    expect(world.jammed).toBe(false);
  });

  it("works before it breaks: the first two cars park in honest spots", () => {
    let world = createImpostorWorld();
    world = advanceImpostorWorld(world);
    world = advanceImpostorWorld(world);
    expect(world.spots.find((spot) => spot.id === "A1")?.occupiedBy).toBe("KA-01");
    expect(world.spots.find((spot) => spot.id === "A2")?.occupiedBy).toBe("KA-02");
    expect(world.queue).toEqual([]);
    expect(world.bounces).toBe(0);
  });

  it("bounces on the impostor: the reserved spot reports free, accepts the claim, then throws", () => {
    let world = createImpostorWorld();
    for (let step = 0; step < 3; step += 1) world = advanceImpostorWorld(world);
    expect(world.bounces).toBe(1);
    // The car never actually parked and never left the line.
    expect(world.queue[0]).toBe("KA-03");
    expect(world.spots.find((spot) => spot.id === "R1")?.occupiedBy).toBeUndefined();
    expect(world.log.some((entry) => entry.kind === "bounce")).toBe(true);
  });

  it("retries the same lying spot instead of moving on, because the contract says it may", () => {
    let world = createImpostorWorld();
    for (let step = 0; step < 4; step += 1) world = advanceImpostorWorld(world);
    expect(world.bounces).toBe(2);
    expect(world.queue[0]).toBe("KA-03");
    // The honest spot behind the impostor stays open the whole time.
    expect(world.spots.find((spot) => spot.id === "A3")?.occupiedBy).toBeUndefined();
  });

  it("jams with a working spot open and the counter still claiming space", () => {
    const world = runImpostorWorldToJam();
    expect(world.jammed).toBe(true);
    expect(world.bounces).toBe(3);
    expect(world.queue.length).toBeGreaterThanOrEqual(2);
    expect(world.spots.find((spot) => spot.id === "A3")?.occupiedBy).toBeUndefined();
    expect(reportedFreeCount(world)).toBe(2);
    const jamEntry = world.log.find((entry) => entry.kind === "jam");
    expect(jamEntry?.text).toContain("A3 sits open");
  });

  it("freezes once jammed: advancing a jammed world changes nothing", () => {
    const jammedWorld = runImpostorWorldToJam();
    expect(advanceImpostorWorld(jammedWorld)).toBe(jammedWorld);
  });

  it("is deterministic: two runs produce identical logs", () => {
    const first = runImpostorWorldToJam();
    const second = runImpostorWorldToJam();
    expect(first.log).toEqual(second.log);
  });

  it("keeps the narrative free of em-dashes", () => {
    const world = runImpostorWorldToJam();
    expect(world.log.some((entry) => entry.text.includes("—"))).toBe(false);
  });
});
