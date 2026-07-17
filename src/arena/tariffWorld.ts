/**
 * The Tariff Wars' living incident: a deterministic simulation of the garage
 * pay station on the night the event weekend tariff shipped.
 *
 * Every fee in the garage comes out of one shared calculateFee() method. The
 * flat rate works. The EV rate works. Then the event weekend tariff lands as
 * one more branch inside that same method, the branches get reordered, and
 * every price that was already correct starts coming out wrong. Nobody
 * touched the flat or EV code; they just live in the method that changed.
 * The learner watches the refunds pile up before the workbench names OCP.
 *
 * Pure reducer, no timers: the component ticks it, tests drive it directly.
 */

export type TariffKind = "flat" | "ev";

export interface TariffReceipt {
  plate: string;
  tariff: TariffKind;
  charged: number;
  expected: number;
  matches: boolean;
}

export interface TariffLogEntry {
  tick: number;
  kind: "exit-ok" | "ship" | "overcharge" | "meltdown";
  text: string;
}

export interface TariffWorldState {
  tick: number;
  /** True once the event weekend branch lands inside calculateFee(). */
  shipped: boolean;
  receipts: TariffReceipt[];
  /** Plates waiting at the booth for their money back, first wronged first. */
  refundQueue: string[];
  refunds: number;
  ended: boolean;
  log: TariffLogEntry[];
}

export interface TariffCard {
  id: string;
  name: string;
  detail: string;
  /** The freshly shipped rule, styled as the intruder once it lands. */
  isNew: boolean;
  live: boolean;
}

interface ExitStep {
  kind: "exit";
  plate: string;
  tariff: TariffKind;
  expected: number;
  charged: number;
  text: string;
}

interface ShipStep {
  kind: "ship";
  text: string;
}

type ScriptStep = ExitStep | ShipStep;

const REFUNDS_TO_MELTDOWN = 3;

/**
 * The whole night, scripted. Charged amounts are what the reordered shared
 * method actually bills; expected amounts are what the ledger says. Before
 * the ship they agree, after the ship they do not.
 */
const SCRIPT: ScriptStep[] = [
  {
    kind: "exit",
    plate: "KA-11",
    tariff: "flat",
    expected: 6,
    charged: 6,
    text: "KA-11 exits. Flat rate, 2 hours: $6. Receipt matches the ledger.",
  },
  {
    kind: "exit",
    plate: "KA-12",
    tariff: "ev",
    expected: 8,
    charged: 8,
    text: "KA-12 exits. EV rate plus charging fee, 2 hours: $8. Receipt matches the ledger.",
  },
  {
    kind: "ship",
    text: "Event weekend tariff ships. One more branch lands inside calculateFee().",
  },
  {
    kind: "exit",
    plate: "KA-13",
    tariff: "ev",
    expected: 8,
    charged: 23,
    text: "KA-13 exits. The new event branch runs first and the charging fee bills twice: charged $23, the ledger says $8. The receipt does not match the ledger. KA-13 joins the refund line.",
  },
  {
    kind: "exit",
    plate: "KA-14",
    tariff: "flat",
    expected: 6,
    charged: 21,
    text: "KA-14 exits. Flat rate, 2 hours, but the event surcharge lands on a plain ticket: charged $21, the ledger says $6. The receipt does not match the ledger. KA-14 joins the refund line.",
  },
  {
    kind: "exit",
    plate: "KA-15",
    tariff: "ev",
    expected: 8,
    charged: 23,
    text: "KA-15 exits. Same wrong price as KA-13: charged $23, the ledger says $8. The receipt does not match the ledger. KA-15 joins the refund line.",
  },
];

export function createTariffWorld(): TariffWorldState {
  return {
    tick: 0,
    shipped: false,
    receipts: [],
    refundQueue: [],
    refunds: 0,
    ended: false,
    log: [],
  };
}

/** The three rules the pay station knows, as cards above the lane. */
export function tariffCards(state: TariffWorldState): TariffCard[] {
  return [
    { id: "FLAT", name: "Flat", detail: "$3 per hour", isNew: false, live: true },
    { id: "EV", name: "EV", detail: "$3 per hour plus charging fee", isNew: false, live: true },
    {
      id: "EVENT",
      name: "Event",
      detail: state.shipped ? "shipped tonight, edits calculateFee()" : "ships tonight",
      isNew: true,
      live: state.shipped,
    },
  ];
}

/** What the counter chip reports: receipts that agree with the ledger. */
export function matchingReceiptCount(state: TariffWorldState): number {
  return state.receipts.filter((receipt) => receipt.matches).length;
}

export function advanceTariffWorld(state: TariffWorldState): TariffWorldState {
  if (state.ended) return state;

  const tick = state.tick + 1;
  const step = SCRIPT[tick - 1];
  if (!step) return state;

  const log: TariffLogEntry[] = [];
  const receipts = [...state.receipts];
  const refundQueue = [...state.refundQueue];
  let shipped = state.shipped;
  let refunds = state.refunds;
  let ended = false;

  if (step.kind === "ship") {
    shipped = true;
    log.push({ tick, kind: "ship", text: step.text });
  } else {
    const matches = step.charged === step.expected;
    receipts.push({
      plate: step.plate,
      tariff: step.tariff,
      charged: step.charged,
      expected: step.expected,
      matches,
    });
    if (matches) {
      log.push({ tick, kind: "exit-ok", text: step.text });
    } else {
      refunds += 1;
      refundQueue.push(step.plate);
      log.push({ tick, kind: "overcharge", text: step.text });
      if (refunds >= REFUNDS_TO_MELTDOWN) {
        ended = true;
        log.push({
          tick,
          kind: "meltdown",
          text: "Three refunds in twenty minutes. Nobody touched the flat or EV code tonight. One new rule edited the method they all live in, and every old price paid for it.",
        });
      }
    }
  }

  return { tick, shipped, receipts, refundQueue, refunds, ended, log: [...state.log, ...log] };
}

/** Run the whole script to its meltdown; used by tests and the skip control. */
export function runTariffWorldToEnd(state: TariffWorldState = createTariffWorld()): TariffWorldState {
  let current = state;
  // Bounded loop: the script always melts down; the bound is a safety net only.
  for (let step = 0; step < 50 && !current.ended; step += 1) {
    current = advanceTariffWorld(current);
  }
  return current;
}
