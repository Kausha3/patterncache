import type { LldVerificationWorld, LldWorldIncident } from "./lldVerificationWorlds";

export interface LldVerificationState {
  placements: Record<string, string>;
  currentIncidentIndex: number;
  observedIncidentIds: string[];
  clearedIncidentIds: string[];
  runs: number;
}

export interface LldWorldSimulation {
  passed: boolean;
  incidentId: string;
  message: string;
  misplacedArtifactIds: string[];
  trace: Array<{ label: string; status: "pass" | "fail" }>;
}

export interface LldDefenseGrade {
  score: number;
  ready: boolean;
  missing: string[];
}

export function createLldVerificationState(world: LldVerificationWorld): LldVerificationState {
  return {
    placements: Object.fromEntries(world.artifacts.map((artifact) => [artifact.id, world.initialOwnerId])),
    currentIncidentIndex: 0,
    observedIncidentIds: [],
    clearedIncidentIds: [],
    runs: 0,
  };
}

export function referenceLldPlacements(world: LldVerificationWorld): Record<string, string> {
  return Object.fromEntries(world.artifacts.map((artifact) => [artifact.id, artifact.referenceOwnerId]));
}

export function simulateLldIncident(
  world: LldVerificationWorld,
  incident: LldWorldIncident,
  placements: Record<string, string>,
): LldWorldSimulation {
  const artifacts = new Map(world.artifacts.map((artifact) => [artifact.id, artifact]));
  const misplacedArtifactIds = incident.requiredArtifactIds.filter((artifactId) => {
    const artifact = artifacts.get(artifactId);
    return !artifact || placements[artifactId] !== artifact.referenceOwnerId;
  });
  const passed = misplacedArtifactIds.length === 0;
  const firstBrokenStep = passed ? -1 : Math.max(0, incident.trace.length - 2);
  return {
    passed,
    incidentId: incident.id,
    message: passed ? incident.success : incident.failure,
    misplacedArtifactIds,
    trace: incident.trace.map((label, index) => ({
      label,
      status: !passed && index >= firstBrokenStep ? "fail" : "pass",
    })),
  };
}

export function runCurrentLldIncident(
  world: LldVerificationWorld,
  state: LldVerificationState,
): { state: LldVerificationState; simulation: LldWorldSimulation } {
  const incident = world.incidents[state.currentIncidentIndex];
  const simulation = simulateLldIncident(world, incident, state.placements);
  return {
    simulation,
    state: {
      ...state,
      runs: state.runs + 1,
      observedIncidentIds: unique([...state.observedIncidentIds, incident.id]),
      clearedIncidentIds: simulation.passed
        ? unique([...state.clearedIncidentIds, incident.id])
        : state.clearedIncidentIds.filter((id) => id !== incident.id),
    },
  };
}

export function installLldArtifact(
  world: LldVerificationWorld,
  state: LldVerificationState,
  artifactId: string,
  nodeId: string,
): LldVerificationState {
  const incident = world.incidents[state.currentIncidentIndex];
  if (!state.observedIncidentIds.includes(incident.id) || state.clearedIncidentIds.includes(incident.id)) return state;
  if (!incident.requiredArtifactIds.includes(artifactId)) return state;
  if (!world.nodes.some((node) => node.id === nodeId)) return state;
  if (!world.artifacts.some((artifact) => artifact.id === artifactId)) return state;
  if (state.placements[artifactId] === nodeId) return state;

  const placements = { ...state.placements, [artifactId]: nodeId };
  return {
    ...state,
    placements,
    clearedIncidentIds: state.clearedIncidentIds.filter((clearedId) => {
      const cleared = world.incidents.find((candidate) => candidate.id === clearedId);
      return !!cleared && simulateLldIncident(world, cleared, placements).passed;
    }),
  };
}

export function advanceLldIncident(world: LldVerificationWorld, state: LldVerificationState): LldVerificationState {
  const incident = world.incidents[state.currentIncidentIndex];
  if (!state.clearedIncidentIds.includes(incident.id)) return state;
  if (state.currentIncidentIndex >= world.incidents.length - 1) return state;
  return { ...state, currentIncidentIndex: state.currentIncidentIndex + 1 };
}

export function isLldWorldVerified(world: LldVerificationWorld, state: LldVerificationState): boolean {
  return world.incidents.every((incident) =>
    state.clearedIncidentIds.includes(incident.id)
    && simulateLldIncident(world, incident, state.placements).passed,
  );
}

export function lldWorldHealth(world: LldVerificationWorld, placements: Record<string, string>): { correct: number; total: number } {
  return {
    correct: world.artifacts.filter((artifact) => placements[artifact.id] === artifact.referenceOwnerId).length,
    total: world.artifacts.length,
  };
}

export function assessLldWorldDefense(world: LldVerificationWorld, answer: string): LldDefenseGrade {
  const normalized = answer.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const ownerHits = world.defense.ownerTerms.filter((term) => normalized.includes(normalizeTerm(term))).length;
  const checks = [
    { label: "Name at least two concrete class owners", met: ownerHits >= 2 },
    { label: "Explain an owned responsibility or invariant", met: /(own|protect|coordinate|responsib|invariant|atomic|encapsulat)/.test(normalized) },
    { label: "Cite evidence from a world incident", met: world.defense.evidenceTerms.some((term) => normalized.includes(normalizeTerm(term))) },
    { label: "Name a future change that stays contained", met: world.defense.changeTerms.some((term) => normalized.includes(normalizeTerm(term))) && /(change|vary|replace|future|add|policy)/.test(normalized) },
    { label: "Reject a coupled alternative and state a tradeoff", met: /(coupl|god object|instead|separat|tradeoff|cost|reject|leak|scatter)/.test(normalized) },
  ];
  const met = checks.filter((check) => check.met).length;
  return {
    score: met * 20,
    ready: met === checks.length && answer.trim().length >= 180,
    missing: checks.filter((check) => !check.met).map((check) => check.label),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
