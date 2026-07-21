import {
  URL_ARCHITECT_INCIDENTS,
  URL_ARCHITECT_PARTS,
  createUrlArchitectState,
  edgeId,
  evaluateUrlArchitectIncident,
  type UrlArchitectEdge,
  type UrlArchitectNode,
  type UrlArchitectPartId,
  type UrlArchitectState,
} from "@/arena/urlShortenerArchitectEngine";

export const URL_ARCHITECT_PROGRESS_KEY = "patterncache.url-shortener-architect.v1";

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function loadUrlArchitectDraft(): UrlArchitectState {
  try {
    const raw = safeStorage()?.getItem(URL_ARCHITECT_PROGRESS_KEY);
    if (!raw) return createUrlArchitectState();
    return sanitizeUrlArchitectState(JSON.parse(raw));
  } catch {
    return createUrlArchitectState();
  }
}

export function saveUrlArchitectDraft(state: UrlArchitectState): void {
  try {
    safeStorage()?.setItem(URL_ARCHITECT_PROGRESS_KEY, JSON.stringify(state));
  } catch {
    // The active game remains usable when browser storage is unavailable.
  }
}

export function resetUrlArchitectDraft(): void {
  try {
    safeStorage()?.removeItem(URL_ARCHITECT_PROGRESS_KEY);
  } catch {
    // The in-memory reset still succeeds.
  }
}

export function sanitizeUrlArchitectState(value: unknown): UrlArchitectState {
  const base = createUrlArchitectState();
  if (!value || typeof value !== "object") return base;
  const draft = value as Partial<UrlArchitectState>;
  const currentIncidentIndex = Number.isInteger(draft.currentIncidentIndex)
    ? Math.min(URL_ARCHITECT_INCIDENTS.length - 1, Math.max(0, draft.currentIncidentIndex!))
    : 0;
  const validPartIds = new Set(URL_ARCHITECT_PARTS.filter((part) => part.unlockAtIncident <= currentIncidentIndex).map((part) => part.id));
  const rawNodes = draft.nodes && typeof draft.nodes === "object" ? draft.nodes : {};
  const nodes: Partial<Record<UrlArchitectPartId, UrlArchitectNode>> = { browser: base.nodes.browser };
  for (const partId of validPartIds) {
    if (partId === "browser") continue;
    const rawNode = rawNodes[partId];
    if (!rawNode || typeof rawNode !== "object") continue;
    const candidate = rawNode as Partial<UrlArchitectNode>;
    if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)) continue;
    nodes[partId] = {
      partId,
      x: Math.min(782, Math.max(16, Math.round(candidate.x!))),
      y: Math.min(492, Math.max(16, Math.round(candidate.y!))),
    };
  }
  const rawEdges = Array.isArray(draft.edges) ? draft.edges : [];
  const seenEdges = new Set<string>();
  const edges: UrlArchitectEdge[] = [];
  for (const rawEdge of rawEdges) {
    if (!rawEdge || typeof rawEdge !== "object") continue;
    const candidate = rawEdge as Partial<UrlArchitectEdge>;
    if (!candidate.from || !candidate.to || candidate.from === candidate.to || !nodes[candidate.from] || !nodes[candidate.to]) continue;
    const id = edgeId(candidate.from, candidate.to);
    if (seenEdges.has(id)) continue;
    seenEdges.add(id);
    edges.push({ id, from: candidate.from, to: candidate.to });
  }
  const validIncidentIds = new Set(URL_ARCHITECT_INCIDENTS.map((incident) => incident.id));
  const observedIncidentIds = Array.isArray(draft.observedIncidentIds)
    ? [...new Set(draft.observedIncidentIds.filter((id): id is string => typeof id === "string" && validIncidentIds.has(id)))]
    : [];
  const claimedClears = new Set(Array.isArray(draft.clearedIncidentIds) ? draft.clearedIncidentIds : []);
  const candidate: UrlArchitectState = {
    currentIncidentIndex,
    nodes,
    edges,
    observedIncidentIds,
    clearedIncidentIds: [],
    runs: Number.isFinite(draft.runs) ? Math.max(0, Math.floor(draft.runs!)) : 0,
  };
  candidate.clearedIncidentIds = URL_ARCHITECT_INCIDENTS
    .filter((incident) => claimedClears.has(incident.id) && observedIncidentIds.includes(incident.id) && evaluateUrlArchitectIncident(candidate, incident).passed)
    .map((incident) => incident.id);
  return candidate;
}
