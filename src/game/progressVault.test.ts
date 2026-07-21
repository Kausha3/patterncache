import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  KNOWN_STORES,
  VAULT_FORMAT,
  VAULT_VERSION,
  describeExport,
  exportProgress,
  importProgress,
  parseProgressExport,
} from "./progressVault";

/** Minimal localStorage for the node test environment. */
function stubLocalStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => (data.has(key) ? data.get(key)! : null),
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => void data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  } as Storage;
}

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = stubLocalStorage();
});

afterEach(() => {
  delete (globalThis as { localStorage?: Storage }).localStorage;
});

describe("progress vault", () => {
  it("round-trips every known store through export, wipe, and import", () => {
    localStorage.setItem("patterncache.garage.v1", JSON.stringify({ firstShift: { bestScore: 90, attempts: 1, completedAt: 5, completions: 1 } }));
    localStorage.setItem("patterncache.exercises.v1", JSON.stringify({ "parking-lot:m5": { label: "assignVehicle", attempts: 2, passedAt: 9 } }));
    localStorage.setItem("patterncache.game.v1", JSON.stringify({ xp: 1176 }));
    localStorage.setItem("patterncache.url-shortener-architect.v1", JSON.stringify({ currentIncidentIndex: 4, edges: [{ id: "browser->edge" }] }));
    localStorage.setItem("patterncache.url-shortener-journey.v1", JSON.stringify({ experienceCompletedAt: 12, interviewRecord: { completedAt: 99 } }));

    const exported = exportProgress(1234);
    expect(exported.format).toBe(VAULT_FORMAT);
    expect(exported.version).toBe(VAULT_VERSION);
    expect(exported.exportedAt).toBe(1234);
    expect(Object.keys(exported.stores)).toHaveLength(5);

    localStorage.clear();
    expect(localStorage.getItem("patterncache.garage.v1")).toBeNull();

    const summary = importProgress(parseProgressExport(JSON.stringify(exported)));
    expect(summary.restored.sort()).toEqual([
      "patterncache.exercises.v1",
      "patterncache.game.v1",
      "patterncache.garage.v1",
      "patterncache.url-shortener-architect.v1",
      "patterncache.url-shortener-journey.v1",
    ]);
    expect(summary.skipped).toEqual([]);
    expect(JSON.parse(localStorage.getItem("patterncache.garage.v1")!)).toEqual({
      firstShift: { bestScore: 90, attempts: 1, completedAt: 5, completions: 1 },
    });
    expect(JSON.parse(localStorage.getItem("patterncache.game.v1")!)).toEqual({ xp: 1176 });
    expect(JSON.parse(localStorage.getItem("patterncache.url-shortener-architect.v1")!)).toEqual({
      currentIncidentIndex: 4,
      edges: [{ id: "browser->edge" }],
    });
    expect(JSON.parse(localStorage.getItem("patterncache.url-shortener-journey.v1")!)).toEqual({
      experienceCompletedAt: 12,
      interviewRecord: { completedAt: 99 },
    });
  });

  it("skips empty and corrupt stores on export instead of failing", () => {
    localStorage.setItem("patterncache.game.v1", "{not json");
    localStorage.setItem("patterncache.garage.v1", JSON.stringify({}));
    const exported = exportProgress(1);
    expect(Object.keys(exported.stores)).toEqual(["patterncache.garage.v1"]);
  });

  it("imports only known keys and reports the rest as skipped", () => {
    const exported = exportProgress(1);
    exported.stores["patterncache.garage.v1"] = { firstShift: null };
    exported.stores["evil.other.key"] = { anything: true };
    const summary = importProgress(exported);
    expect(summary.restored).toEqual(["patterncache.garage.v1"]);
    expect(summary.skipped).toEqual(["evil.other.key"]);
    expect(localStorage.getItem("evil.other.key")).toBeNull();
  });

  it("rejects files that are not PatternCache exports, with readable messages", () => {
    expect(() => parseProgressExport("not json")).toThrow(/not valid JSON/);
    expect(() => parseProgressExport('{"foo": 1}')).toThrow(/does not look like/);
    expect(() => parseProgressExport('[1,2]')).toThrow(/does not look like/);
    expect(() =>
      parseProgressExport(JSON.stringify({ format: VAULT_FORMAT, version: VAULT_VERSION + 1, stores: {} })),
    ).toThrow(/newer version/);
    expect(() =>
      parseProgressExport(JSON.stringify({ format: VAULT_FORMAT, version: VAULT_VERSION, stores: null })),
    ).toThrow(/no progress data/);
  });

  it("describes an export in store labels for the confirm step", () => {
    localStorage.setItem("patterncache.garage.v1", JSON.stringify({}));
    localStorage.setItem("patterncache.course.v1", JSON.stringify({ day: 3 }));
    const labels = describeExport(exportProgress(1));
    expect(labels).toContain("SOLID campaign");
    expect(labels).toContain("Daily plan and task history");
    expect(labels).toHaveLength(2);
  });

  it("keeps the known-store registry aligned with every key the app uses", () => {
    // If a new store is added to the app but not the vault, exports would
    // silently drop it. This canary hardcodes the current inventory.
    expect(KNOWN_STORES.map((store) => store.key).sort()).toEqual([
      "patterncache.algorithm-replays.v1",
      "patterncache.amazon-sde1.v1",
      "patterncache.beginner-study.v1",
      "patterncache.course.v1",
      "patterncache.exercises.v1",
      "patterncache.game.v1",
      "patterncache.garage.v1",
      "patterncache.hld-worlds.v1",
      "patterncache.hld-worlds.v2",
      "patterncache.lld-verification.amazon-locker.v1",
      "patterncache.lld-verification.circular-buffer.v1",
      "patterncache.lld-verification.elevator.v1",
      "patterncache.lld-verification.lru-cache.v1",
      "patterncache.lld-verification.vending-machine.v1",
      "patterncache.mock-interviews.v1",
      "patterncache.parking-lot-gauntlet.v1",
      "patterncache.pattern-genome.v1",
      "patterncache.progress.v1",
      "patterncache.url-shortener-architect.v1",
      "patterncache.url-shortener-journey.v1",
    ]);
  });
});
