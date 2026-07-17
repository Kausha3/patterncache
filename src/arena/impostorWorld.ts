/**
 * The Impostor Spot's living incident: a deterministic simulation of the
 * garage entry lane on the night ReservedSpot shipped.
 *
 * The gate treats every spot through the ParkingSpot contract: scan for the
 * first spot reporting free, assign the car. ReservedSpot claims that
 * contract but breaks its promise: it reports free, accepts the claim, then
 * throws. The gate has no reason to distrust it, so it retries the same spot
 * forever while a working spot sits open further down the row. The learner
 * watches that jam happen before touching the workbench, the same way
 * Mission 1 makes the manual search fail before naming SRP.
 *
 * Pure reducer, no timers: the component ticks it, tests drive it directly.
 */

export interface ImpostorSpot {
  id: string;
  reserved: boolean;
  occupiedBy?: string;
}

export interface ImpostorLogEntry {
  tick: number;
  kind: "arrive" | "park" | "bounce" | "jam";
  text: string;
}

export interface ImpostorWorldState {
  tick: number;
  spots: ImpostorSpot[];
  /** Plates waiting at the gate, head of the line first. */
  queue: string[];
  /** Scripted arrivals not yet at the gate. */
  arrivals: string[];
  bounces: number;
  jammed: boolean;
  log: ImpostorLogEntry[];
}

const JAM_AFTER_BOUNCES = 3;

export function createImpostorWorld(): ImpostorWorldState {
  return {
    tick: 0,
    // Two honest spots fill first so the world visibly works before it
    // breaks; the reserved impostor sits ahead of the last honest spot so
    // the uniform scan keeps choosing it.
    spots: [
      { id: "A1", reserved: false },
      { id: "A2", reserved: false },
      { id: "R1", reserved: true },
      { id: "A3", reserved: false },
    ],
    queue: [],
    arrivals: ["KA-01", "KA-02", "KA-03", "KA-04", "KA-05"],
    bounces: 0,
    jammed: false,
    log: [],
  };
}

/** What the counter above the gate shows: every spot whose isOccupied() is false. */
export function reportedFreeCount(state: ImpostorWorldState): number {
  return state.spots.filter((spot) => !spot.occupiedBy).length;
}

export function advanceImpostorWorld(state: ImpostorWorldState): ImpostorWorldState {
  if (state.jammed) return state;

  const tick = state.tick + 1;
  const log: ImpostorLogEntry[] = [];
  const arrivals = [...state.arrivals];
  const queue = [...state.queue];
  const spots = state.spots.map((spot) => ({ ...spot }));

  const arriving = arrivals.shift();
  if (arriving) {
    queue.push(arriving);
    log.push({ tick, kind: "arrive", text: `${arriving} pulls up to the gate.` });
  }

  let bounces = state.bounces;
  let jammed = false;
  const car = queue[0];
  if (car) {
    // The gate's whole algorithm: first spot reporting free wins. It cannot
    // know one of them is lying, because the contract says it does not have to.
    const target = spots.find((spot) => !spot.occupiedBy);
    if (target && !target.reserved) {
      target.occupiedBy = car;
      queue.shift();
      log.push({ tick, kind: "park", text: `${car} parks in ${target.id}.` });
    } else if (target && target.reserved) {
      bounces += 1;
      log.push({
        tick,
        kind: "bounce",
        text: `Gate assigns ${target.id} to ${car}. ${target.id} accepts the claim, then throws. ${car} is stuck at the gate.`,
      });
      if (bounces >= JAM_AFTER_BOUNCES) {
        jammed = true;
        log.push({
          tick,
          kind: "jam",
          text: `Entry jammed. The counter says ${spots.filter((spot) => !spot.occupiedBy).length} spots free and A3 sits open, but every scan trusts ${target.id}'s contract and the line only grows.`,
        });
      }
    }
  }

  return { tick, spots, queue, arrivals, bounces, jammed, log: [...state.log, ...log] };
}

/** Run the whole script to its jam; used by tests and the skip control. */
export function runImpostorWorldToJam(state: ImpostorWorldState = createImpostorWorld()): ImpostorWorldState {
  let current = state;
  // Bounded loop: the script always jams; the bound is a safety net only.
  for (let step = 0; step < 50 && !current.jammed; step += 1) {
    current = advanceImpostorWorld(current);
  }
  return current;
}
