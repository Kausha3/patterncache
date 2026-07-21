import { beforeEach, describe, expect, it, vi } from "vitest";
import { addUrlArchitectPart, connectUrlArchitectParts, createUrlArchitectState, runUrlArchitectIncident } from "@/arena/urlShortenerArchitectEngine";
import { URL_ARCHITECT_PROGRESS_KEY, loadUrlArchitectDraft, sanitizeUrlArchitectState } from "./urlShortenerArchitectProgress";

describe("URL Shortener architect progress", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));

  it("falls back safely when storage contains invalid JSON", () => {
    localStorage.setItem(URL_ARCHITECT_PROGRESS_KEY, "not-json");
    expect(loadUrlArchitectDraft()).toEqual(createUrlArchitectState());
  });

  it("drops unknown nodes, duplicate edges, and forged clears", () => {
    const sanitized = sanitizeUrlArchitectState({
      currentIncidentIndex: 0,
      nodes: { browser: { partId: "browser", x: 9999, y: -50 }, edge: { partId: "edge", x: 200, y: 200 }, unknown: { partId: "unknown", x: 2, y: 2 } },
      edges: [
        { id: "fake", from: "browser", to: "edge" },
        { id: "duplicate", from: "browser", to: "edge" },
        { id: "bad", from: "edge", to: "unknown" },
      ],
      observedIncidentIds: ["celebrity-link", "fake"],
      clearedIncidentIds: ["celebrity-link"],
      runs: -4,
    });
    expect(Object.keys(sanitized.nodes).sort()).toEqual(["browser", "edge"]);
    expect(sanitized.edges).toEqual([{ id: "browser->edge", from: "browser", to: "edge" }]);
    expect(sanitized.clearedIncidentIds).toEqual([]);
    expect(sanitized.runs).toBe(0);
  });

  it("cannot inject components that belong to later incidents", () => {
    const sanitized = sanitizeUrlArchitectState({
      currentIncidentIndex: 0,
      nodes: {
        browser: { partId: "browser", x: 34, y: 258 },
        "id-allocator": { partId: "id-allocator", x: 200, y: 200 },
        analytics: { partId: "analytics", x: 240, y: 240 },
        replicas: { partId: "replicas", x: 280, y: 280 },
      },
      edges: [
        { from: "browser", to: "id-allocator" },
        { from: "id-allocator", to: "analytics" },
      ],
    });
    expect(Object.keys(sanitized.nodes)).toEqual(["browser"]);
    expect(sanitized.edges).toEqual([]);
  });

  it("returns a safe blank draft for arbitrary hostile top-level values", () => {
    for (const value of [null, undefined, 7, "draft", true, [], { nodes: null }, { currentIncidentIndex: Number.NaN }]) {
      expect(() => sanitizeUrlArchitectState(value)).not.toThrow();
      expect(sanitizeUrlArchitectState(value).nodes.browser).toBeDefined();
    }
  });

  it("retains a clear only when the stored graph still proves it", () => {
    let state = createUrlArchitectState();
    for (const [index, part] of (["edge", "redirect", "cache", "link-store"] as const).entries()) state = addUrlArchitectPart(state, part, 140 + index * 120, 180);
    for (const [from, to] of [["browser", "edge"], ["edge", "redirect"], ["redirect", "cache"], ["cache", "link-store"]] as const) state = connectUrlArchitectParts(state, from, to);
    state = runUrlArchitectIncident(state).state;
    expect(sanitizeUrlArchitectState(state).clearedIncidentIds).toEqual(["celebrity-link"]);
  });
});

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}
