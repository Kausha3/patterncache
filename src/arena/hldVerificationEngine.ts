import type { HldVerificationWorld } from "@/arena/hldVerificationWorlds";

export interface HldVerificationState {
  currentIncidentIndex: number;
  placements: Record<string, string>;
  observedIncidentIds: string[];
  clearedIncidentIds: string[];
  runs: number;
}

export interface HldRunSimulation {
  passed: boolean;
  misplacedModuleIds: string[];
  trace: { label: string; status: "pass" | "fail" | "waiting" }[];
  message: string;
}

export interface HldDefenseGrade {
  score: number;
  ready: boolean;
  missing: string[];
}

export function createHldVerificationState(world: HldVerificationWorld): HldVerificationState {
  return {
    currentIncidentIndex: 0,
    placements: Object.fromEntries(world.modules.map((module) => [module.id, module.startsInZoneId])),
    observedIncidentIds: [],
    clearedIncidentIds: [],
    runs: 0,
  };
}

export function installHldModule(world: HldVerificationWorld, state: HldVerificationState, moduleId: string, zoneId: string): HldVerificationState {
  if (!world.modules.some((module) => module.id === moduleId) || !world.zones.some((zone) => zone.id === zoneId)) return state;
  if (state.placements[moduleId] === zoneId) return state;
  const current = world.incidents[state.currentIncidentIndex];
  return {
    ...state,
    placements: { ...state.placements, [moduleId]: zoneId },
    clearedIncidentIds: state.clearedIncidentIds.filter((id) => id !== current.id),
  };
}

export function runCurrentHldIncident(world: HldVerificationWorld, state: HldVerificationState): { state: HldVerificationState; simulation: HldRunSimulation } {
  const incident = world.incidents[state.currentIncidentIndex];
  const misplacedModuleIds = incident.requiredModuleIds.filter((id) => {
    const module = world.modules.find((candidate) => candidate.id === id);
    return !module || state.placements[id] !== module.expectedZoneId;
  });
  const passed = misplacedModuleIds.length === 0;
  const failedStep = Math.max(0, incident.trace.length - 2);
  const simulation: HldRunSimulation = {
    passed,
    misplacedModuleIds,
    trace: incident.trace.map((label, index) => ({
      label,
      status: passed || index < failedStep ? "pass" : index === failedStep ? "fail" : "waiting",
    })),
    message: passed ? incident.success : incident.failure,
  };
  return {
    simulation,
    state: {
      ...state,
      runs: state.runs + 1,
      observedIncidentIds: state.observedIncidentIds.includes(incident.id) ? state.observedIncidentIds : [...state.observedIncidentIds, incident.id],
      clearedIncidentIds: passed && !state.clearedIncidentIds.includes(incident.id) ? [...state.clearedIncidentIds, incident.id] : state.clearedIncidentIds,
    },
  };
}

export function advanceHldIncident(world: HldVerificationWorld, state: HldVerificationState): HldVerificationState {
  const incident = world.incidents[state.currentIncidentIndex];
  if (!state.clearedIncidentIds.includes(incident.id) || state.currentIncidentIndex >= world.incidents.length - 1) return state;
  return { ...state, currentIncidentIndex: state.currentIncidentIndex + 1 };
}

export function hldWorldHealth(world: HldVerificationWorld, placements: Record<string, string>) {
  const correct = world.modules.filter((module) => placements[module.id] === module.expectedZoneId).length;
  const total = world.modules.length;
  return {
    correct,
    total,
    availability: Math.round(55 + (correct / total) * 44.9),
    p95Latency: Math.round(620 - (correct / total) * 500),
    openFailureModes: total - correct,
  };
}

export function isHldWorldVerified(world: HldVerificationWorld, state: HldVerificationState): boolean {
  return world.incidents.every((incident) => state.clearedIncidentIds.includes(incident.id));
}

export function assessHldDefense(world: HldVerificationWorld, answer: string): HldDefenseGrade {
  const text = answer.toLowerCase();
  const checks = [
    { label: "a concrete component boundary", hit: world.zones.some((zone) => text.includes(zone.technicalName.toLowerCase())) || world.modules.some((module) => text.includes(module.technicalName.toLowerCase())) },
    { label: "evidence from a live incident", hit: world.incidents.some((incident) => text.includes(incident.title.toLowerCase().split(" ")[0])) || /incident|failure|outage|surge|retry/.test(text) },
    { label: "a scale or reliability consequence", hit: /latency|throughput|load|scale|availability|queue|consistency|duplicate|loss/.test(text) },
    { label: "a rejected tradeoff", hit: /tradeoff|trade-off|rejected|instead|chose|because|cost/.test(text) },
    { label: "how the design absorbs change", hit: /change|new provider|new requirement|future|extend|replace|failure/.test(text) },
  ];
  const hitCount = checks.filter((check) => check.hit).length;
  const lengthCredit = Math.min(20, Math.floor(answer.trim().length / 20));
  const score = Math.min(100, hitCount * 16 + lengthCredit);
  return { score, ready: answer.trim().length >= 140 && hitCount >= 4 && score >= 80, missing: checks.filter((check) => !check.hit).map((check) => check.label) };
}
