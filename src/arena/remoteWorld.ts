/**
 * The One Remote's living incident: a deterministic simulation of the
 * garage device wall on the night the diagnostics board lied.
 *
 * Every device on the wall (GateArm, TicketPrinter, EVCharger) is driven
 * through one universal device contract, and the nightly diagnostics sweep
 * calls the same runSelfTest() on all of them. The fat contract forced
 * devices to stub methods they cannot honor, and the EVCharger's self-test
 * was one of the forced fakes. So when the charger's contactor dies, the
 * next sweep still reads green: the board is reading a stub, not the
 * hardware. Drivers pile up at a dead pad while the wall says everything
 * is fine. The learner watches that lie surface before touching the
 * workbench, the same way the LSP chapter makes the entry lane jam first.
 *
 * Pure reducer, no timers: the component ticks it, tests drive it directly.
 */

export interface RemoteDevice {
  id: string;
  /** Whether the hardware actually works. */
  alive: boolean;
  /** What the diagnostics board believes, via runSelfTest(). */
  reportedOk: boolean;
}

export interface RemoteLogEntry {
  tick: number;
  kind: "sweep" | "fault" | "arrive" | "exposed";
  text: string;
}

export interface RemoteWorldState {
  tick: number;
  devices: RemoteDevice[];
  /** Drivers stuck at the dead charger, first arrival first. */
  strandedDrivers: string[];
  /** Scripted arrivals not yet at the pad. */
  arrivals: string[];
  ended: boolean;
  log: RemoteLogEntry[];
}

/** The tick where the EVCharger's contactor actually dies. */
export const CHARGER_FAULT_TICK = 2;

const STRANDED_TO_END = 3;

export function createRemoteWorld(): RemoteWorldState {
  return {
    tick: 0,
    devices: [
      { id: "GateArm", alive: true, reportedOk: true },
      { id: "TicketPrinter", alive: true, reportedOk: true },
      { id: "EVCharger", alive: true, reportedOk: true },
    ],
    strandedDrivers: [],
    arrivals: ["KA-21", "KA-22", "KA-23"],
    ended: false,
    log: [],
  };
}

/** What the counter above the wall shows: does every runSelfTest() say OK? */
export function boardReadsGreen(state: RemoteWorldState): boolean {
  return state.devices.every((device) => device.reportedOk);
}

export function advanceRemoteWorld(state: RemoteWorldState): RemoteWorldState {
  if (state.ended) return state;

  const tick = state.tick + 1;
  const log: RemoteLogEntry[] = [];
  const devices = state.devices.map((device) => ({ ...device }));
  const strandedDrivers = [...state.strandedDrivers];
  const arrivals = [...state.arrivals];
  let ended = false;

  if (tick === 1) {
    // The sweep asks every device the same question through the same fat
    // contract. Tonight every answer happens to be true.
    log.push({
      tick,
      kind: "sweep",
      text: "Diagnostics sweep 1: GateArm OK, TicketPrinter OK, EVCharger OK. Board is green.",
    });
  } else if (tick === CHARGER_FAULT_TICK) {
    // The hardware dies. The board's belief does not, because the board
    // never talks to hardware: it talks to runSelfTest(), and the charger's
    // runSelfTest() is a stub the fat contract forced on it.
    const charger = devices.find((device) => device.id === "EVCharger");
    if (charger) charger.alive = false;
    log.push({
      tick,
      kind: "fault",
      text: "EVCharger's contactor fails. No power on the pad.",
    });
  } else if (tick === CHARGER_FAULT_TICK + 1) {
    log.push({
      tick,
      kind: "sweep",
      text: "Diagnostics sweep 2: board still green. EVCharger's runSelfTest() is a forced stub that returns OK. The board is reading a fake.",
    });
  } else {
    const arriving = arrivals.shift();
    if (arriving) {
      strandedDrivers.push(arriving);
      log.push({
        tick,
        kind: "arrive",
        text: `${arriving} plugs in at the dead charger. Nothing happens. ${strandedDrivers.length} stranded.`,
      });
      if (strandedDrivers.length >= STRANDED_TO_END) {
        ended = true;
        log.push({
          tick,
          kind: "exposed",
          text: "Three drivers stranded at a dead charger while the wall says green. The fat contract forced every device to fake what it could not do, and one fake hid a real fault.",
        });
      }
    }
  }

  return { tick, devices, strandedDrivers, arrivals, ended, log: [...state.log, ...log] };
}

/** Run the whole script to its end; used by tests and the skip control. */
export function runRemoteWorldToEnd(state: RemoteWorldState = createRemoteWorld()): RemoteWorldState {
  let current = state;
  // Bounded loop: the script always ends; the bound is a safety net only.
  for (let step = 0; step < 50 && !current.ended; step += 1) {
    current = advanceRemoteWorld(current);
  }
  return current;
}
