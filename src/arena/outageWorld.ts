/**
 * The DIP chapter's living incident: a deterministic simulation of the
 * Friday exit rush on the night AcmePay went down.
 *
 * Three exit lanes each constructed their own AcmePayClient inline in the
 * exit flow. While the vendor is up, nobody can tell the difference. The
 * moment AcmePay dies, all three lanes freeze in the same tick, and when
 * ops reaches for the backup vendor there is no seam to swap it into:
 * high-level exit flow welded straight to a low-level client, three lanes
 * at a time. The learner watches the garage melt before the workbench
 * names DIP, the same way the LSP chapter jams the entry lane first.
 *
 * Pure reducer, no timers: the component ticks it, tests drive it directly.
 */

export interface ExitLane {
  id: number;
  frozen: boolean;
  processed: number;
}

export type OutageLogKind = "exit" | "outage" | "stuck" | "no-seam" | "meltdown";

export interface OutageLogEntry {
  tick: number;
  kind: OutageLogKind;
  text: string;
}

export interface OutageWorldState {
  tick: number;
  lanes: ExitLane[];
  /** Plates stuck at dead terminals, in arrival order. */
  stuckCars: string[];
  vendorDown: boolean;
  ended: boolean;
  log: OutageLogEntry[];
}

/** The tick on which AcmePay dies and every lane freezes at once. */
const OUTAGE_TICK = 4;

/** The tick on which ops discovers there is no seam to swap a backup into. */
const NO_SEAM_TICK = 6;

/** The world ends once this many cars are stuck behind dead terminals. */
const MELTDOWN_AT_STUCK = 5;

/** Phase 1 script: one car pays and leaves per tick, spread across lanes. */
const EXIT_SCRIPT: Record<number, { lane: number; plate: string; rate: number }> = {
  1: { lane: 1, plate: "KA-31", rate: 14 },
  2: { lane: 2, plate: "KA-42", rate: 13 },
  3: { lane: 3, plate: "KA-07", rate: 15 },
};

/** Phase 3 script: cars rolling up to frozen terminals each tick. */
const STUCK_SCRIPT: Record<number, string[]> = {
  5: ["KA-58", "KA-63"],
  6: ["KA-71", "KA-77"],
  7: ["KA-84"],
};

export function createOutageWorld(): OutageWorldState {
  return {
    tick: 0,
    lanes: [
      { id: 1, frozen: false, processed: 0 },
      { id: 2, frozen: false, processed: 0 },
      { id: 3, frozen: false, processed: 0 },
    ],
    stuckCars: [],
    vendorDown: false,
    ended: false,
    log: [],
  };
}

/** What the counter chip shows: how many of the three lanes still move cars. */
export function movingLaneCount(state: OutageWorldState): number {
  return state.lanes.filter((lane) => !lane.frozen).length;
}

export function advanceOutageWorld(state: OutageWorldState): OutageWorldState {
  if (state.ended) return state;

  const tick = state.tick + 1;
  const log: OutageLogEntry[] = [];
  const lanes = state.lanes.map((lane) => ({ ...lane }));
  const stuckCars = [...state.stuckCars];
  let vendorDown = state.vendorDown;
  let ended = false;

  // Phase 1: the garage works. Cars pay through AcmePay and leave.
  const exit = EXIT_SCRIPT[tick];
  if (exit && !vendorDown) {
    const lane = lanes.find((candidate) => candidate.id === exit.lane);
    if (lane) {
      lane.processed += 1;
      log.push({
        tick,
        kind: "exit",
        text: `Lane ${exit.lane}: ${exit.plate} pays and exits. ${exit.rate} cars an hour.`,
      });
    }
  }

  // Phase 2: one vendor dies, and because every lane constructed its own
  // AcmePayClient inline, all three lanes freeze in this same tick.
  if (tick === OUTAGE_TICK) {
    vendorDown = true;
    for (const lane of lanes) lane.frozen = true;
    log.push({
      tick,
      kind: "outage",
      text: "AcmePay is down. Every terminal times out at once. Lane 1, lane 2, lane 3: frozen in the same second.",
    });
  }

  // Phase 3: cars keep arriving at terminals that cannot take payment.
  const arriving = STUCK_SCRIPT[tick];
  if (arriving && vendorDown) {
    stuckCars.push(...arriving);
    log.push({
      tick,
      kind: "stuck",
      text: `${arriving.join(" and ")} roll up to dead terminals. ${stuckCars.length} cars stuck and honking.`,
    });
  }

  if (tick === NO_SEAM_TICK && vendorDown) {
    log.push({
      tick,
      kind: "no-seam",
      text: "Ops wants to switch to the backup vendor. There is nothing to swap: each lane built AcmePayClient inside its own exit flow.",
    });
  }

  if (vendorDown && stuckCars.length >= MELTDOWN_AT_STUCK) {
    ended = true;
    log.push({
      tick,
      kind: "meltdown",
      text: "The whole garage is one vendor's outage. High-level exit flow welded to a low-level client, three lanes at a time.",
    });
  }

  return { tick, lanes, stuckCars, vendorDown, ended, log: [...state.log, ...log] };
}

/** Run the whole script to its meltdown; used by tests and the skip control. */
export function runOutageWorldToEnd(state: OutageWorldState = createOutageWorld()): OutageWorldState {
  let current = state;
  // Bounded loop: the script always ends; the bound is a safety net only.
  for (let step = 0; step < 50 && !current.ended; step += 1) {
    current = advanceOutageWorld(current);
  }
  return current;
}
