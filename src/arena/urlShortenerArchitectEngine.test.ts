import { describe, expect, it } from "vitest";
import {
  URL_ARCHITECT_INCIDENTS,
  addUrlArchitectPart,
  advanceUrlArchitectIncident,
  assessUrlArchitectDefense,
  connectUrlArchitectParts,
  createUrlArchitectState,
  evaluateUrlArchitectIncident,
  isUrlArchitectVerified,
  removeUrlArchitectEdge,
  removeUrlArchitectPart,
  runUrlArchitectIncident,
  type UrlArchitectPartId,
  type UrlArchitectState,
} from "./urlShortenerArchitectEngine";

function add(state: UrlArchitectState, ...parts: UrlArchitectPartId[]): UrlArchitectState {
  return parts.reduce((next, part, index) => addUrlArchitectPart(next, part, 180 + index * 35, 100 + index * 28), state);
}

function connect(state: UrlArchitectState, edges: [UrlArchitectPartId, UrlArchitectPartId][]): UrlArchitectState {
  return edges.reduce((next, [from, to]) => connectUrlArchitectParts(next, from, to), state);
}

function solveCurrent(state: UrlArchitectState): UrlArchitectState {
  const incident = URL_ARCHITECT_INCIDENTS[state.currentIncidentIndex];
  const requiredParts = [...new Set(incident.rules.flatMap((rule) => rule.kind === "node" ? [rule.partId] : [rule.from, rule.to]))];
  state = add(state, ...requiredParts);
  for (const rule of incident.rules) {
    if (rule.kind === "edge") state = connectUrlArchitectParts(state, rule.from, rule.to);
    if (rule.kind === "forbidden-edge") state = removeUrlArchitectEdge(state, `${rule.from}->${rule.to}`);
  }
  return runUrlArchitectIncident(state).state;
}

describe("URL Shortener architecture canvas", () => {
  it("starts with only the visitor and reveals one causal failure at a time", () => {
    const state = createUrlArchitectState();
    expect(Object.keys(state.nodes)).toEqual(["browser"]);
    const simulation = evaluateUrlArchitectIncident(state);
    expect(simulation.passed).toBe(false);
    expect(simulation.trace.map((step) => step.status)).toEqual(["fail", "waiting", "waiting", "waiting"]);
    expect(simulation.message).toContain("public entry path");
  });

  it("requires a connected fast read path, not merely the right parts", () => {
    let state = createUrlArchitectState();
    state = add(state, "edge", "redirect", "cache", "link-store");
    expect(evaluateUrlArchitectIncident(state).passed).toBe(false);
    state = connect(state, [["browser", "edge"], ["edge", "redirect"], ["redirect", "cache"], ["cache", "link-store"]]);
    const result = runUrlArchitectIncident(state);
    expect(result.simulation.passed).toBe(true);
    expect(result.simulation.metrics.latency).toBe("92 ms");
    expect(result.state.clearedIncidentIds).toContain("celebrity-link");
  });

  it("rejects a synchronous analytics shortcut even when the async path also exists", () => {
    let state = solveCurrent(createUrlArchitectState());
    state = advanceUrlArchitectIncident(state);
    state = solveCurrent(state);
    state = advanceUrlArchitectIncident(state);
    state = add(state, "queue", "analytics");
    state = connect(state, [["redirect", "queue"], ["queue", "analytics"], ["redirect", "analytics"]]);
    expect(evaluateUrlArchitectIncident(state).passed).toBe(false);
    expect(evaluateUrlArchitectIncident(state).message).toContain("direct redirect-to-analytics cable");
  });

  it("revokes previous evidence when a required component or connection is removed", () => {
    let state = solveCurrent(createUrlArchitectState());
    expect(state.clearedIncidentIds).toContain("celebrity-link");
    state = removeUrlArchitectEdge(state, "redirect->cache");
    expect(state.clearedIncidentIds).not.toContain("celebrity-link");
    state = connectUrlArchitectParts(state, "redirect", "cache");
    state = runUrlArchitectIncident(state).state;
    state = removeUrlArchitectPart(state, "cache");
    expect(state.edges.some((edge) => edge.from === "cache" || edge.to === "cache")).toBe(false);
    expect(state.clearedIncidentIds).not.toContain("celebrity-link");
  });

  it("requires all four incident graphs before verification", () => {
    let state = createUrlArchitectState();
    for (let index = 0; index < URL_ARCHITECT_INCIDENTS.length; index += 1) {
      state = solveCurrent(state);
      if (index < URL_ARCHITECT_INCIDENTS.length - 1) state = advanceUrlArchitectIncident(state);
    }
    expect(isUrlArchitectVerified(state)).toBe(true);
    expect(state.clearedIncidentIds).toHaveLength(4);
    expect(assessUrlArchitectDefense(state, ["cache", "link-store"], "words ".repeat(80)).ready).toBe(false);
    expect(assessUrlArchitectDefense(
      state,
      ["cache", "link-store"],
      "The celebrity surge showed why the Read-through Cache protects redirect latency while the Primary Link Store remains the source of truth. I chose this boundary because cache eviction must not delete a mapping, and I rejected making cache durable because that would duplicate consistency work. For a future expiry requirement, I would add TTL metadata to the Primary Link Store and let the Read-through Cache expire no later than that source record.",
    ).ready).toBe(true);
  });
});
