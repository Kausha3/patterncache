import { describe, expect, it } from "vitest";
import {
  advanceTariffWorld,
  createTariffWorld,
  matchingReceiptCount,
  runTariffWorldToEnd,
} from "./tariffWorld";

describe("tariff wars world", () => {
  it("starts working: the first two receipts match the ledger", () => {
    let world = createTariffWorld();
    world = advanceTariffWorld(world);
    world = advanceTariffWorld(world);
    expect(world.receipts).toEqual([
      { plate: "KA-11", tariff: "flat", charged: 6, expected: 6, matches: true },
      { plate: "KA-12", tariff: "ev", charged: 8, expected: 8, matches: true },
    ]);
    expect(matchingReceiptCount(world)).toBe(2);
    expect(world.refunds).toBe(0);
    expect(world.shipped).toBe(false);
    expect(world.ended).toBe(false);
  });

  it("ships the event tariff at the scripted tick", () => {
    let world = createTariffWorld();
    for (let step = 0; step < 3; step += 1) world = advanceTariffWorld(world);
    expect(world.shipped).toBe(true);
    const shipEntry = world.log.find((entry) => entry.kind === "ship");
    expect(shipEntry?.tick).toBe(3);
    expect(shipEntry?.text).toContain("calculateFee()");
  });

  it("overcharges the very next EV exit after the ship", () => {
    let world = createTariffWorld();
    for (let step = 0; step < 4; step += 1) world = advanceTariffWorld(world);
    const receipt = world.receipts[world.receipts.length - 1];
    expect(receipt.plate).toBe("KA-13");
    expect(receipt.tariff).toBe("ev");
    expect(receipt.charged).toBe(23);
    expect(receipt.expected).toBe(8);
    expect(receipt.matches).toBe(false);
    expect(receipt.charged).not.toBe(receipt.expected);
    expect(world.refunds).toBe(1);
    expect(world.refundQueue).toEqual(["KA-13"]);
    expect(world.log.some((entry) => entry.kind === "overcharge")).toBe(true);
  });

  it("also hits the flat car: the surcharge lands on a ticket that never asked for it", () => {
    let world = createTariffWorld();
    for (let step = 0; step < 5; step += 1) world = advanceTariffWorld(world);
    const receipt = world.receipts.find((entry) => entry.plate === "KA-14");
    expect(receipt?.tariff).toBe("flat");
    expect(receipt?.matches).toBe(false);
    expect(world.refunds).toBe(2);
  });

  it("melts down at three refunds and the world ends", () => {
    const world = runTariffWorldToEnd();
    expect(world.refunds).toBe(3);
    expect(world.ended).toBe(true);
    expect(world.refundQueue).toEqual(["KA-13", "KA-14", "KA-15"]);
    expect(matchingReceiptCount(world)).toBe(2);
    expect(world.receipts).toHaveLength(5);
  });

  it("freezes once ended: advancing an ended world returns the same reference", () => {
    const ended = runTariffWorldToEnd();
    expect(advanceTariffWorld(ended)).toBe(ended);
  });

  it("is deterministic: two runs produce identical logs and receipts", () => {
    const first = runTariffWorldToEnd();
    const second = runTariffWorldToEnd();
    expect(first.log).toEqual(second.log);
    expect(first.receipts).toEqual(second.receipts);
  });

  it("keeps the narrative free of em-dashes and names the real cause", () => {
    const world = runTariffWorldToEnd();
    const emDash = "\\u2014";
    expect(world.log.some((entry) => entry.text.includes(emDash))).toBe(false);
    const meltdown = world.log.find((entry) => entry.kind === "meltdown");
    expect(meltdown?.text).toContain("edited the method they all live in");
    expect(meltdown?.text).toContain("Nobody touched the flat or EV code");
  });
});
