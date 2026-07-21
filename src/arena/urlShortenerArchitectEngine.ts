export type UrlArchitectPartId =
  | "browser"
  | "edge"
  | "redirect"
  | "creator"
  | "cache"
  | "id-allocator"
  | "link-store"
  | "queue"
  | "analytics"
  | "replicas"
  | "monitor";

export interface UrlArchitectPart {
  id: UrlArchitectPartId;
  beginnerName: string;
  technicalName: string;
  description: string;
  category: "request" | "compute" | "data" | "async" | "reliability";
  unlockAtIncident: number;
}

export interface UrlArchitectNode {
  partId: UrlArchitectPartId;
  x: number;
  y: number;
}

export interface UrlArchitectEdge {
  id: string;
  from: UrlArchitectPartId;
  to: UrlArchitectPartId;
}

export interface UrlArchitectState {
  currentIncidentIndex: number;
  nodes: Partial<Record<UrlArchitectPartId, UrlArchitectNode>>;
  edges: UrlArchitectEdge[];
  observedIncidentIds: string[];
  clearedIncidentIds: string[];
  runs: number;
}

interface RequiredNodeRule {
  id: string;
  kind: "node";
  partId: UrlArchitectPartId;
  trace: string;
  failure: string;
}

interface RequiredEdgeRule {
  id: string;
  kind: "edge";
  from: UrlArchitectPartId;
  to: UrlArchitectPartId;
  trace: string;
  failure: string;
}

interface ForbiddenEdgeRule {
  id: string;
  kind: "forbidden-edge";
  from: UrlArchitectPartId;
  to: UrlArchitectPartId;
  trace: string;
  failure: string;
}

export type UrlArchitectRule = RequiredNodeRule | RequiredEdgeRule | ForbiddenEdgeRule;

export interface UrlArchitectIncident {
  id: string;
  title: string;
  dispatchLabel: string;
  story: string;
  goal: string;
  success: string;
  discoveryTitle: string;
  discovery: string;
  failureMetrics: { latency: string; availability: string; pressure: string };
  successMetrics: { latency: string; availability: string; pressure: string };
  rules: UrlArchitectRule[];
}

export interface UrlArchitectRuleResult {
  id: string;
  passed: boolean;
  trace: string;
  failure: string;
  relatedPartIds: UrlArchitectPartId[];
}

export interface UrlArchitectSimulation {
  passed: boolean;
  message: string;
  ruleResults: UrlArchitectRuleResult[];
  trace: { label: string; status: "pass" | "fail" | "waiting" }[];
  activePartIds: UrlArchitectPartId[];
  metrics: { latency: string; availability: string; pressure: string };
}

export interface UrlArchitectDefenseGrade {
  score: number;
  ready: boolean;
  missing: string[];
}

export const URL_ARCHITECT_PARTS: UrlArchitectPart[] = [
  { id: "browser", beginnerName: "Visitor", technicalName: "Client", description: "Starts create and redirect requests.", category: "request", unlockAtIncident: 0 },
  { id: "edge", beginnerName: "Front door", technicalName: "API Gateway", description: "Receives public traffic and sends it to the right request handler.", category: "request", unlockAtIncident: 0 },
  { id: "redirect", beginnerName: "Redirect worker", technicalName: "Redirect Service", description: "Looks up a code and returns the destination quickly.", category: "compute", unlockAtIncident: 0 },
  { id: "creator", beginnerName: "Link maker", technicalName: "Link Creation Service", description: "Coordinates creation of a new short link.", category: "compute", unlockAtIncident: 0 },
  { id: "cache", beginnerName: "Fast memory", technicalName: "Read-through Cache", description: "Keeps popular mappings close to the redirect path.", category: "data", unlockAtIncident: 0 },
  { id: "link-store", beginnerName: "Permanent link book", technicalName: "Primary Link Store", description: "Durably stores code-to-destination mappings.", category: "data", unlockAtIncident: 0 },
  { id: "queue", beginnerName: "Waiting lane", technicalName: "Event Queue", description: "Lets slow work finish after the redirect response.", category: "async", unlockAtIncident: 0 },
  { id: "id-allocator", beginnerName: "Unique code maker", technicalName: "Distributed ID Allocator", description: "Issues codes without two writers producing the same value.", category: "data", unlockAtIncident: 1 },
  { id: "analytics", beginnerName: "Click counter", technicalName: "Analytics Worker", description: "Consumes click events without blocking redirects.", category: "async", unlockAtIncident: 2 },
  { id: "replicas", beginnerName: "Read copies", technicalName: "Read Replica Set", description: "Adds read capacity and survives loss of one copy.", category: "data", unlockAtIncident: 3 },
  { id: "monitor", beginnerName: "Failure lookout", technicalName: "Health Monitor", description: "Detects unhealthy replicas and removes them from service.", category: "reliability", unlockAtIncident: 3 },
];

export const URL_ARCHITECT_INCIDENTS: UrlArchitectIncident[] = [
  {
    id: "celebrity-link",
    title: "Celebrity link surge",
    dispatchLabel: "Release 50,000 redirects",
    story: "One short link becomes globally popular. Every redirect currently walks to permanent storage.",
    goal: "Build a fast redirect path with a durable fallback.",
    success: "Hot redirects now finish from fast memory while cache misses still reach the durable link book.",
    discoveryTitle: "You built a cache-aside read path",
    discovery: "The cache is fast but disposable. The permanent store remains the source of truth, so eviction never destroys a link.",
    failureMetrics: { latency: "620 ms", availability: "55%", pressure: "Primary store saturated" },
    successMetrics: { latency: "92 ms", availability: "99.9%", pressure: "Hot reads absorbed" },
    rules: [
      { id: "surge-edge", kind: "edge", from: "browser", to: "edge", trace: "Traffic reaches one public front door", failure: "The visitor has no public entry path into the system." },
      { id: "surge-handler", kind: "edge", from: "edge", to: "redirect", trace: "The front door routes redirects to a focused handler", failure: "Redirect traffic is not connected to a service that owns the lookup." },
      { id: "surge-cache", kind: "edge", from: "redirect", to: "cache", trace: "The redirect handler checks fast memory first", failure: "Every redirect still reaches durable storage because the read path has no cache." },
      { id: "surge-fallback", kind: "edge", from: "cache", to: "link-store", trace: "A cache miss falls back to the permanent mapping", failure: "Fast memory has no durable fallback, so an eviction would make a valid link disappear." },
    ],
  },
  {
    id: "collision",
    title: "Two creators, one code",
    dispatchLabel: "Create links in two regions",
    story: "Two creation requests arrive at the same moment and both try to claim the same short code.",
    goal: "Build a write path that coordinates uniqueness before persistence.",
    success: "The creation service obtains a unique code and writes one authoritative mapping to durable storage.",
    discoveryTitle: "You separated allocation from persistence",
    discovery: "Generating a unique identifier and storing a durable mapping solve different failure modes. Keeping both visible makes races explainable.",
    failureMetrics: { latency: "210 ms", availability: "97%", pressure: "Collision risk open" },
    successMetrics: { latency: "180 ms", availability: "99.9%", pressure: "Codes remain unique" },
    rules: [
      { id: "create-route", kind: "edge", from: "edge", to: "creator", trace: "Create requests reach a dedicated write service", failure: "The front door has no creation path separate from redirect reads." },
      { id: "create-allocator", kind: "edge", from: "creator", to: "id-allocator", trace: "The write service obtains one unique code", failure: "Two writers can still invent the same code because uniqueness has no owner." },
      { id: "create-store", kind: "edge", from: "creator", to: "link-store", trace: "The mapping is persisted as the source of truth", failure: "The new code is not connected to durable mapping storage." },
    ],
  },
  {
    id: "analytics-storm",
    title: "Analytics slows redirects",
    dispatchLabel: "Slow analytics to six seconds",
    story: "The analytics system takes six seconds to accept each click while redirects keep arriving.",
    goal: "Preserve click events without adding analytics latency to the user path.",
    success: "The redirect publishes an event and returns immediately while workers count clicks later.",
    discoveryTitle: "You built an asynchronous boundary",
    discovery: "The event queue turns analytics latency into backlog instead of user latency. The response path no longer waits for reporting.",
    failureMetrics: { latency: "6.2 s", availability: "61%", pressure: "Request threads blocked" },
    successMetrics: { latency: "94 ms", availability: "99.9%", pressure: "Queue absorbs backlog" },
    rules: [
      { id: "analytics-publish", kind: "edge", from: "redirect", to: "queue", trace: "A completed redirect publishes a click event", failure: "The redirect path has nowhere durable to hand off analytics work." },
      { id: "analytics-consume", kind: "edge", from: "queue", to: "analytics", trace: "A worker consumes the event later", failure: "Events enter the waiting lane but no worker drains them." },
      { id: "analytics-no-sync", kind: "forbidden-edge", from: "redirect", to: "analytics", trace: "The user path does not wait for the click counter", failure: "A direct redirect-to-analytics cable keeps slow reporting inside the user request." },
    ],
  },
  {
    id: "replica-outage",
    title: "A read replica disappears",
    dispatchLabel: "Take one read copy offline",
    story: "One storage replica stops responding while redirect traffic is still being sent to it.",
    goal: "Add read capacity and a separate mechanism that routes around failed copies.",
    success: "Cache misses use healthy read copies while the monitor removes the failed replica from service.",
    discoveryTitle: "You separated traffic from failure detection",
    discovery: "Redirect code asks for data. The reliability plane decides which replica is healthy. That keeps outage policy reusable and observable.",
    failureMetrics: { latency: "2.8 s", availability: "72%", pressure: "Dead replica selected" },
    successMetrics: { latency: "118 ms", availability: "99.95%", pressure: "Failed copy isolated" },
    rules: [
      { id: "replica-read", kind: "edge", from: "cache", to: "replicas", trace: "Cache misses can use a pool of read copies", failure: "The read path still depends on one storage endpoint." },
      { id: "replica-monitor", kind: "edge", from: "monitor", to: "replicas", trace: "Health policy observes and removes failed copies", failure: "No independent component owns replica health and failover." },
    ],
  },
];

const START_NODE: UrlArchitectNode = { partId: "browser", x: 34, y: 258 };

export function createUrlArchitectState(): UrlArchitectState {
  return {
    currentIncidentIndex: 0,
    nodes: { browser: START_NODE },
    edges: [],
    observedIncidentIds: [],
    clearedIncidentIds: [],
    runs: 0,
  };
}

export function edgeId(from: UrlArchitectPartId, to: UrlArchitectPartId): string {
  return `${from}->${to}`;
}

export function addUrlArchitectPart(state: UrlArchitectState, partId: UrlArchitectPartId, x: number, y: number): UrlArchitectState {
  const part = URL_ARCHITECT_PARTS.find((candidate) => candidate.id === partId);
  if (!part || part.unlockAtIncident > state.currentIncidentIndex || state.nodes[partId]) return state;
  const nodes = { ...state.nodes, [partId]: { partId, x: clamp(x, 16, 782), y: clamp(y, 16, 492) } };
  return invalidateClears({ ...state, nodes });
}

export function moveUrlArchitectPart(state: UrlArchitectState, partId: UrlArchitectPartId, x: number, y: number): UrlArchitectState {
  if (!state.nodes[partId] || partId === "browser") return state;
  return { ...state, nodes: { ...state.nodes, [partId]: { partId, x: clamp(x, 16, 782), y: clamp(y, 16, 492) } } };
}

export function removeUrlArchitectPart(state: UrlArchitectState, partId: UrlArchitectPartId): UrlArchitectState {
  if (partId === "browser" || !state.nodes[partId]) return state;
  const nodes = { ...state.nodes };
  delete nodes[partId];
  const edges = state.edges.filter((edge) => edge.from !== partId && edge.to !== partId);
  return invalidateClears({ ...state, nodes, edges });
}

export function connectUrlArchitectParts(state: UrlArchitectState, from: UrlArchitectPartId, to: UrlArchitectPartId): UrlArchitectState {
  if (from === to || !state.nodes[from] || !state.nodes[to]) return state;
  const id = edgeId(from, to);
  if (state.edges.some((edge) => edge.id === id)) return state;
  return invalidateClears({ ...state, edges: [...state.edges, { id, from, to }] });
}

export function removeUrlArchitectEdge(state: UrlArchitectState, id: string): UrlArchitectState {
  if (!state.edges.some((edge) => edge.id === id)) return state;
  return invalidateClears({ ...state, edges: state.edges.filter((edge) => edge.id !== id) });
}

export function evaluateUrlArchitectIncident(state: UrlArchitectState, incident = URL_ARCHITECT_INCIDENTS[state.currentIncidentIndex]): UrlArchitectSimulation {
  const ruleResults = incident.rules.map((rule): UrlArchitectRuleResult => {
    const hasEdge = "from" in rule && state.edges.some((edge) => edge.from === rule.from && edge.to === rule.to);
    const passed = rule.kind === "node" ? !!state.nodes[rule.partId] : rule.kind === "edge" ? hasEdge : !hasEdge;
    const relatedPartIds = rule.kind === "node" ? [rule.partId] : [rule.from, rule.to];
    return { id: rule.id, passed, trace: rule.trace, failure: rule.failure, relatedPartIds };
  });
  const failedIndex = ruleResults.findIndex((result) => !result.passed);
  const passed = failedIndex === -1;
  const trace = ruleResults.map((result, index) => ({
    label: result.trace,
    status: passed || index < failedIndex ? "pass" as const : index === failedIndex ? "fail" as const : "waiting" as const,
  }));
  const activePartIds = [...new Set(ruleResults.filter((result, index) => result.passed && (passed || index < failedIndex)).flatMap((result) => result.relatedPartIds))];
  return {
    passed,
    message: passed ? incident.success : ruleResults[failedIndex].failure,
    ruleResults,
    trace,
    activePartIds,
    metrics: passed ? incident.successMetrics : incident.failureMetrics,
  };
}

export function runUrlArchitectIncident(state: UrlArchitectState): { state: UrlArchitectState; simulation: UrlArchitectSimulation } {
  const incident = URL_ARCHITECT_INCIDENTS[state.currentIncidentIndex];
  const simulation = evaluateUrlArchitectIncident(state, incident);
  return {
    simulation,
    state: {
      ...state,
      runs: state.runs + 1,
      observedIncidentIds: state.observedIncidentIds.includes(incident.id) ? state.observedIncidentIds : [...state.observedIncidentIds, incident.id],
      clearedIncidentIds: simulation.passed && !state.clearedIncidentIds.includes(incident.id) ? [...state.clearedIncidentIds, incident.id] : state.clearedIncidentIds,
    },
  };
}

export function advanceUrlArchitectIncident(state: UrlArchitectState): UrlArchitectState {
  const incident = URL_ARCHITECT_INCIDENTS[state.currentIncidentIndex];
  if (!state.clearedIncidentIds.includes(incident.id) || state.currentIncidentIndex >= URL_ARCHITECT_INCIDENTS.length - 1) return state;
  return { ...state, currentIncidentIndex: state.currentIncidentIndex + 1 };
}

export function isUrlArchitectVerified(state: UrlArchitectState): boolean {
  return URL_ARCHITECT_INCIDENTS.every((incident) => state.clearedIncidentIds.includes(incident.id));
}

export function assessUrlArchitectDefense(state: UrlArchitectState, pinnedPartIds: UrlArchitectPartId[], answer: string): UrlArchitectDefenseGrade {
  const text = answer.toLowerCase();
  const uniquePins = [...new Set(pinnedPartIds)].filter((id) => state.nodes[id]);
  const mentionedPins = uniquePins.filter((id) => {
    const part = URL_ARCHITECT_PARTS.find((candidate) => candidate.id === id);
    return part && (text.includes(part.beginnerName.toLowerCase()) || text.includes(part.technicalName.toLowerCase()));
  });
  const checks = [
    { label: "a verified architecture", hit: isUrlArchitectVerified(state) },
    { label: "two pinned components from your own design", hit: uniquePins.length >= 2 },
    { label: "the names of both pinned components", hit: mentionedPins.length >= 2 },
    { label: "evidence from a traffic incident", hit: URL_ARCHITECT_INCIDENTS.some((incident) => text.includes(incident.title.toLowerCase().split(" ")[0])) || /surge|collision|analytics|replica|incident|outage/.test(text) },
    { label: "a rejected tradeoff", hit: /tradeoff|trade-off|rejected|instead|chose|because|cost/.test(text) },
    { label: "what changes under a new requirement", hit: /change|expire|ttl|future|new requirement|replace|extend/.test(text) },
  ];
  const hitCount = checks.filter((check) => check.hit).length;
  const lengthCredit = Math.min(16, Math.floor(answer.trim().length / 25));
  const score = Math.min(100, hitCount * 14 + lengthCredit);
  return {
    score,
    ready: answer.trim().length >= 220 && checks.every((check) => check.hit) && score >= 90,
    missing: checks.filter((check) => !check.hit).map((check) => check.label),
  };
}

function invalidateClears(state: UrlArchitectState): UrlArchitectState {
  const clearedIncidentIds = state.clearedIncidentIds.filter((id) => {
    const incident = URL_ARCHITECT_INCIDENTS.find((candidate) => candidate.id === id);
    return incident ? evaluateUrlArchitectIncident(state, incident).passed : false;
  });
  return clearedIncidentIds.length === state.clearedIncidentIds.length ? state : { ...state, clearedIncidentIds };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
