import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GARAGE_ARTIFACTS, GARAGE_INCIDENTS } from "@/arena/garageRefactorEngine";
import {
  advanceGarageIncident,
  createGarageGauntletState,
  installCurrentGarageArtifact,
  runCurrentGarageIncident,
} from "@/arena/garageGauntletEngine";
import {
  PARKING_LOT_GAUNTLET_STORAGE_KEY,
  loadParkingLotGauntletProgress,
  recordParkingLotGauntletCompletion,
  sanitizeParkingLotGauntletProgress,
  saveParkingLotGauntletDraft,
} from "./parkingLotGauntletProgress";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  } satisfies Storage;
}

describe("Parking Lot gauntlet persistence", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it("rejects hostile records and repairs draft placements", () => {
    const progress = sanitizeParkingLotGauntletProgress({
      record: { bestScore: "perfect" },
      draft: {
        placements: { spots: "attacker", fee: "pricing" },
        currentIncidentIndex: 999,
        observedIncidentIds: ["entry", "fake"],
        clearedIncidentIds: ["entry", "fake"],
        runs: -9,
      },
    });
    expect(progress.record).toBeUndefined();
    expect(progress.draft?.currentIncidentIndex).toBe(GARAGE_INCIDENTS.length - 1);
    expect(progress.draft?.placements.spots).toBe("lot");
    expect(progress.draft?.placements.fee).toBe("pricing");
    expect(progress.draft?.clearedIncidentIds).toEqual([]);
    expect(progress.draft?.runs).toBe(0);
  });

  it("round-trips a valid in-progress repair", () => {
    let state = runCurrentGarageIncident(createGarageGauntletState()).state;
    state = installCurrentGarageArtifact(state, "spots", "level");
    saveParkingLotGauntletDraft(state);
    expect(loadParkingLotGauntletProgress().draft?.placements.spots).toBe("level");
    expect(localStorage.getItem(PARKING_LOT_GAUNTLET_STORAGE_KEY)).toContain("observedIncidentIds");
  });

  it("refuses completion without all six live incidents and a strong defense", () => {
    const incomplete = recordParkingLotGauntletCompletion(
      createGarageGauntletState(),
      "ParkingSpot owns occupancy. The race incident proved it and future pricing changes stay separate from the god object and gateway provider.",
    );
    expect(incomplete.completed).toBe(false);
    expect(incomplete.progress.record).toBeUndefined();
  });

  it("records exact completion and removes the draft only after proof", () => {
    let state = createGarageGauntletState();
    for (let index = 0; index < GARAGE_INCIDENTS.length; index += 1) {
      state = runCurrentGarageIncident(state).state;
      for (const artifactId of GARAGE_INCIDENTS[index].requiredArtifactIds) {
        const artifact = GARAGE_ARTIFACTS.find((candidate) => candidate.id === artifactId)!;
        state = installCurrentGarageArtifact(state, artifact.id, artifact.referenceOwnerId);
      }
      state = runCurrentGarageIncident(state).state;
      if (index < GARAGE_INCIDENTS.length - 1) state = advanceGarageIncident(state);
    }
    saveParkingLotGauntletDraft(state);
    const result = recordParkingLotGauntletCompletion(
      state,
      "ParkingSpot owns and atomically protects occupancy instead of leaking it into a god object. The last-spot race simulation proved the invariant. PricingPolicy contains future EV rate changes, while PaymentService separates the gateway provider outage from ParkingLot.",
    );
    expect(result.completed).toBe(true);
    expect(result.progress.record).toMatchObject({ bestScore: 100, incidentsVerified: 6, completions: 1 });
    expect(result.progress.draft).toBeUndefined();
  });

  it("continues on screen when storage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("full"); },
    });
    expect(saveParkingLotGauntletDraft(createGarageGauntletState()).draft).toBeDefined();
    expect(loadParkingLotGauntletProgress()).toEqual({});
  });
});
