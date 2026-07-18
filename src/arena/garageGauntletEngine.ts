import {
  GARAGE_INCIDENTS,
  createGaragePlacements,
  moveGarageArtifact,
  simulateGarageIncident,
  type GarageNodeId,
  type GaragePlacements,
  type GarageSimulation,
} from "./garageRefactorEngine";

export interface GarageGauntletState {
  placements: GaragePlacements;
  currentIncidentIndex: number;
  observedIncidentIds: string[];
  clearedIncidentIds: string[];
  runs: number;
}

export function createGarageGauntletState(): GarageGauntletState {
  return {
    placements: createGaragePlacements(),
    currentIncidentIndex: 0,
    observedIncidentIds: [],
    clearedIncidentIds: [],
    runs: 0,
  };
}

export function runCurrentGarageIncident(state: GarageGauntletState): {
  state: GarageGauntletState;
  simulation: GarageSimulation;
} {
  const incident = GARAGE_INCIDENTS[state.currentIncidentIndex] ?? GARAGE_INCIDENTS[0];
  const simulation = simulateGarageIncident(incident, state.placements);
  return {
    simulation,
    state: {
      ...state,
      runs: state.runs + 1,
      observedIncidentIds: addUnique(state.observedIncidentIds, incident.id),
      clearedIncidentIds: simulation.passed
        ? addUnique(state.clearedIncidentIds, incident.id)
        : state.clearedIncidentIds.filter((id) => id !== incident.id),
    },
  };
}

/**
 * The learner may mutate only the incident they have actually observed fail.
 * This prevents clicking through a pre-labelled class diagram before the
 * world has supplied a reason for the design change.
 */
export function installCurrentGarageArtifact(
  state: GarageGauntletState,
  artifactId: string,
  nodeId: GarageNodeId,
): GarageGauntletState {
  const incident = GARAGE_INCIDENTS[state.currentIncidentIndex];
  if (!incident || !state.observedIncidentIds.includes(incident.id)) return state;
  if (!incident.requiredArtifactIds.includes(artifactId)) return state;
  const placements = moveGarageArtifact(state.placements, artifactId, nodeId);
  if (placements === state.placements) return state;
  return {
    ...state,
    placements,
    clearedIncidentIds: state.clearedIncidentIds.filter((id) => id !== incident.id),
  };
}

export function advanceGarageIncident(state: GarageGauntletState): GarageGauntletState {
  const current = GARAGE_INCIDENTS[state.currentIncidentIndex];
  if (!current || !state.clearedIncidentIds.includes(current.id)) return state;
  return {
    ...state,
    currentIncidentIndex: Math.min(GARAGE_INCIDENTS.length - 1, state.currentIncidentIndex + 1),
  };
}

export function isGarageGauntletArchitectureVerified(state: GarageGauntletState): boolean {
  return GARAGE_INCIDENTS.every((incident) =>
    state.clearedIncidentIds.includes(incident.id) && simulateGarageIncident(incident, state.placements).passed,
  );
}

function addUnique(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value];
}
