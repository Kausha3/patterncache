import type {
  LldDomainKind,
  LldGameMission,
} from "./lldGameMissions";

export const LLD_GAME_PHASES = [
  "briefing",
  "domain",
  "model",
  "relationships",
  "scenarios",
  "change",
  "patterns",
  "interview",
  "complete",
] as const;

export type LldGamePhase = (typeof LLD_GAME_PHASES)[number];
export type LldGameMode = "guided" | "assisted" | "interview" | "gauntlet";

export interface LldScenarioRun {
  scenarioId: string;
  passed: boolean;
  message: string;
  missingMethodIds: string[];
  missingRelationshipIds: string[];
}

export interface LldGameState {
  missionId: string;
  mode: LldGameMode;
  phase: LldGamePhase;
  askedQuestionIds: string[];
  domainKinds: Record<string, LldDomainKind>;
  classPurposes: Record<string, string>;
  propertyOwners: Record<string, string>;
  methodOwners: Record<string, string>;
  relationshipDecisions: Record<string, boolean>;
  scenarioRuns: Record<string, LldScenarioRun>;
  changeDecisions: Record<string, string>;
  patternDecisionId?: string;
  defenseAnswer: string;
  lastFeedback?: string;
}

export type LldGameAction =
  | { type: "ask-question"; questionId: string }
  | { type: "classify-domain"; candidateId: string; kind: LldDomainKind }
  | { type: "set-class-purpose"; classId: string; purpose: string }
  | { type: "place-property"; propertyId: string; ownerId: string }
  | { type: "place-method"; methodId: string; ownerId: string }
  | { type: "decide-relationship"; relationshipId: string; included: boolean }
  | { type: "run-scenario"; scenarioId: string }
  | { type: "choose-change"; changeId: string; optionId: string }
  | { type: "choose-pattern"; optionId: string }
  | { type: "submit-defense"; answer: string }
  | { type: "revisit"; phase: Exclude<LldGamePhase, "complete"> }
  | { type: "reset"; mode?: LldGameMode }
  | { type: "advance" };

export interface LldGameScore {
  total: number;
  clarification: number;
  classModel: number;
  methodOwnership: number;
  relationships: number;
  changeContainment: number;
  interviewDefense: number;
  defenseRubricMatches: string[];
}

export function createLldGameState(mission: LldGameMission, mode: LldGameMode = "guided"): LldGameState {
  return {
    missionId: mission.id,
    mode,
    phase: "briefing",
    askedQuestionIds: [],
    domainKinds: {},
    classPurposes: {},
    propertyOwners: {},
    methodOwners: {},
    relationshipDecisions: {},
    scenarioRuns: {},
    changeDecisions: {},
    defenseAnswer: "",
  };
}

export function reduceLldGame(
  mission: LldGameMission,
  state: LldGameState,
  action: LldGameAction,
): LldGameState {
  if (state.missionId !== mission.id) return { ...state, lastFeedback: "This run belongs to a different mission." };

  if (action.type === "reset") return createLldGameState(mission, action.mode ?? state.mode);

  if (action.type === "revisit") {
    const requestedIndex = LLD_GAME_PHASES.indexOf(action.phase);
    const currentIndex = LLD_GAME_PHASES.indexOf(state.phase);
    if (requestedIndex > currentIndex && state.phase !== "complete") return invalid(state, "Complete the current phase before moving forward.");
    return { ...state, phase: action.phase, lastFeedback: undefined };
  }

  if (action.type === "ask-question") {
    if (!mission.questions.some((question) => question.id === action.questionId)) return invalid(state, "That question is not part of this interview.");
    return {
      ...state,
      askedQuestionIds: unique([...state.askedQuestionIds, action.questionId]),
      lastFeedback: mission.questions.find((question) => question.id === action.questionId)?.designImpact,
    };
  }

  if (action.type === "classify-domain") {
    if (!mission.domainCandidates.some((candidate) => candidate.id === action.candidateId)) return invalid(state, "That domain candidate does not exist.");
    return invalidateFrom(state, "domain", {
      domainKinds: { ...state.domainKinds, [action.candidateId]: action.kind },
      lastFeedback: undefined,
    });
  }

  if (action.type === "set-class-purpose") {
    return invalidateFrom(state, "domain", {
      classPurposes: { ...state.classPurposes, [action.classId]: action.purpose },
      lastFeedback: undefined,
    });
  }

  if (action.type === "place-property") {
    if (!mission.properties.some((property) => property.id === action.propertyId)) return invalid(state, "That property does not exist.");
    return invalidateFrom(state, "model", {
      propertyOwners: { ...state.propertyOwners, [action.propertyId]: action.ownerId },
      lastFeedback: undefined,
    });
  }

  if (action.type === "place-method") {
    if (!mission.methods.some((method) => method.id === action.methodId)) return invalid(state, "That method does not exist.");
    return invalidateFrom(state, "model", {
      methodOwners: { ...state.methodOwners, [action.methodId]: action.ownerId },
      lastFeedback: undefined,
    });
  }

  if (action.type === "decide-relationship") {
    if (!mission.relationships.some((relationship) => relationship.id === action.relationshipId)) return invalid(state, "That relationship does not exist.");
    return invalidateFrom(state, "relationships", {
      relationshipDecisions: { ...state.relationshipDecisions, [action.relationshipId]: action.included },
      lastFeedback: undefined,
    });
  }

  if (action.type === "run-scenario") {
    const scenario = mission.scenarios.find((candidate) => candidate.id === action.scenarioId);
    if (!scenario) return invalid(state, "That scenario does not exist.");
    const result = evaluateScenario(mission, state, scenario.id);
    return {
      ...state,
      scenarioRuns: { ...state.scenarioRuns, [scenario.id]: result },
      lastFeedback: result.message,
    };
  }

  if (action.type === "choose-change") {
    const change = mission.changeStorms.find((candidate) => candidate.id === action.changeId);
    const option = change?.options.find((candidate) => candidate.id === action.optionId);
    if (!change || !option) return invalid(state, "That change decision does not exist.");
    return {
      ...state,
      changeDecisions: { ...state.changeDecisions, [change.id]: option.id },
      patternDecisionId: undefined,
      defenseAnswer: "",
      lastFeedback: option.feedback,
    };
  }

  if (action.type === "choose-pattern") {
    const option = mission.patternChallenge.options.find((candidate) => candidate.id === action.optionId);
    if (!option) return invalid(state, "That pattern decision does not exist.");
    return { ...state, patternDecisionId: option.id, defenseAnswer: "", lastFeedback: option.feedback };
  }

  if (action.type === "submit-defense") {
    if (action.answer.trim().length < 80) {
      return { ...state, defenseAnswer: action.answer, lastFeedback: "Explain the responsibility, rejected alternative, contained change, and one scenario in at least a few complete sentences." };
    }
    return { ...state, defenseAnswer: action.answer.trim(), phase: "complete", lastFeedback: "Design defense submitted. The complete reference answer is now available for comparison." };
  }

  return advance(mission, state);
}

export function getPhaseReadiness(mission: LldGameMission, state: LldGameState): { ready: boolean; missing: string[] } {
  if (state.phase === "briefing") {
    const missing = mission.questions.filter((question) => question.required && !state.askedQuestionIds.includes(question.id)).map((question) => question.prompt);
    return { ready: missing.length === 0, missing };
  }

  if (state.phase === "domain") {
    const unclassified = mission.domainCandidates.filter((candidate) => !state.domainKinds[candidate.id]).map((candidate) => `Classify ${candidate.label}`);
    const missingPurposes = mission.domainCandidates
      .filter((candidate) => candidate.referenceKind === "class" && !state.classPurposes[candidate.id]?.trim())
      .map((candidate) => `Explain ${candidate.label}'s responsibility`);
    return { ready: unclassified.length + missingPurposes.length === 0, missing: [...unclassified, ...missingPurposes] };
  }

  if (state.phase === "model") {
    const properties = mission.properties.filter((property) => !state.propertyOwners[property.id]).map((property) => `Place property ${property.label}`);
    const methods = mission.methods.filter((method) => !state.methodOwners[method.id]).map((method) => `Place method ${method.label}`);
    return { ready: properties.length + methods.length === 0, missing: [...properties, ...methods] };
  }

  if (state.phase === "relationships") {
    const missing = mission.relationships.filter((relationship) => state.relationshipDecisions[relationship.id] === undefined).map((relationship) => `Decide ${relationship.fromId} → ${relationship.toId}`);
    return { ready: missing.length === 0, missing };
  }

  if (state.phase === "scenarios") {
    const missing = mission.scenarios.flatMap((scenario) => {
      const run = state.scenarioRuns[scenario.id];
      if (!run) return [`Run ${scenario.title}`];
      return run.passed ? [] : [`Repair the model for ${scenario.title}`];
    });
    return { ready: missing.length === 0, missing };
  }

  if (state.phase === "change") {
    const missing = mission.changeStorms.flatMap((change) => {
      const selected = change.options.find((option) => option.id === state.changeDecisions[change.id]);
      if (!selected) return [`Resolve ${change.title}`];
      return selected.correct ? [] : [`Contain the change in ${change.title}`];
    });
    return { ready: missing.length === 0, missing };
  }

  if (state.phase === "patterns") {
    const selected = mission.patternChallenge.options.find((option) => option.id === state.patternDecisionId);
    return { ready: selected?.correct === true, missing: selected?.correct ? [] : ["Choose the pattern that solves the variation you observed"] };
  }
  if (state.phase === "interview") return { ready: false, missing: ["Submit a complete design defense"] };
  return { ready: false, missing: [] };
}

export function evaluateScenario(mission: LldGameMission, state: LldGameState, scenarioId: string): LldScenarioRun {
  const scenario = mission.scenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) return { scenarioId, passed: false, message: "Unknown scenario.", missingMethodIds: [], missingRelationshipIds: [] };

  const missingMethodIds = scenario.requiredMethodIds.filter((methodId) => {
    const method = mission.methods.find((candidate) => candidate.id === methodId);
    return !method || state.methodOwners[method.id] !== method.referenceOwnerId;
  });
  const missingRelationshipIds = scenario.requiredRelationshipIds.filter((relationshipId) => {
    const relationship = mission.relationships.find((candidate) => candidate.id === relationshipId);
    return !relationship || state.relationshipDecisions[relationship.id] !== relationship.referenceIncluded;
  });
  const passed = missingMethodIds.length === 0 && missingRelationshipIds.length === 0;
  return {
    scenarioId,
    passed,
    message: passed ? scenario.success : scenario.failure,
    missingMethodIds,
    missingRelationshipIds,
  };
}

export function scoreLldGame(mission: LldGameMission, state: LldGameState): LldGameScore {
  const requiredQuestions = mission.questions.filter((question) => question.required);
  const clarification = ratioPoints(requiredQuestions.filter((question) => state.askedQuestionIds.includes(question.id)).length, requiredQuestions.length, 20);

  const correctKinds = mission.domainCandidates.filter((candidate) => state.domainKinds[candidate.id] === candidate.referenceKind).length;
  const classCandidates = mission.domainCandidates.filter((candidate) => candidate.referenceKind === "class");
  const strongPurposes = classCandidates.filter((candidate) => matchesAny(state.classPurposes[candidate.id] ?? "", candidate.purposeKeywords ?? [])).length;
  const correctProperties = mission.properties.filter((property) => state.propertyOwners[property.id] === property.referenceOwnerId).length;
  const classModel = ratioPoints(correctKinds, mission.domainCandidates.length, 10)
    + ratioPoints(strongPurposes, classCandidates.length, 5)
    + ratioPoints(correctProperties, mission.properties.length, 10);

  const correctMethods = mission.methods.filter((method) => state.methodOwners[method.id] === method.referenceOwnerId).length;
  const methodOwnership = ratioPoints(correctMethods, mission.methods.length, 20);

  const correctRelationships = mission.relationships.filter((relationship) => state.relationshipDecisions[relationship.id] === relationship.referenceIncluded).length;
  const relationships = ratioPoints(correctRelationships, mission.relationships.length, 15);

  const changeCorrect = mission.changeStorms.every((change) => {
    const selected = change.options.find((option) => option.id === state.changeDecisions[change.id]);
    return selected?.correct === true;
  });
  const patternCorrect = mission.patternChallenge.options.find((option) => option.id === state.patternDecisionId)?.correct === true;
  const changeContainment = (changeCorrect ? 7 : 0) + (patternCorrect ? 3 : 0);

  const normalizedDefense = state.defenseAnswer.toLowerCase();
  const defenseRubricMatches = mission.interview.rubric
    .filter((criterion) => criterion.keywords.some((keyword) => normalizedDefense.includes(keyword.toLowerCase())))
    .map((criterion) => criterion.id);
  const interviewDefense = ratioPoints(defenseRubricMatches.length, mission.interview.rubric.length, 10);

  return {
    clarification,
    classModel,
    methodOwnership,
    relationships,
    changeContainment,
    interviewDefense,
    defenseRubricMatches,
    total: clarification + classModel + methodOwnership + relationships + changeContainment + interviewDefense,
  };
}

export function generateLldGameJava(mission: LldGameMission, state: LldGameState): string {
  const selectedClasses = mission.domainCandidates.filter((candidate) => state.domainKinds[candidate.id] === "class");
  const lines = [
    `// ${mission.title}`,
    "// Generated from your class, property, and method decisions.",
    "",
  ];

  for (const candidate of selectedClasses) {
    lines.push(`class ${candidate.label} {`);
    const properties = mission.properties.filter((property) => state.propertyOwners[property.id] === candidate.id);
    const methods = mission.methods.filter((method) => state.methodOwners[method.id] === candidate.id);
    if (properties.length === 0 && methods.length === 0) lines.push("    // No state or behavior assigned yet.");
    for (const property of properties) lines.push(`    private ${property.type ?? "Object"} ${property.label};`);
    if (properties.length > 0 && methods.length > 0) lines.push("");
    for (const method of methods) {
      lines.push(`    public ${method.javaSignature ?? `Object ${method.label}`} {`);
      lines.push(`        throw new UnsupportedOperationException("TODO: ${method.label}");`);
      lines.push("    }", "");
    }
    if (lines[lines.length - 1] === "") lines.pop();
    lines.push("}", "");
  }

  const pricingChange = state.changeDecisions["ev-pricing"] === "pricing-policy";
  if (pricingChange) {
    lines.push("interface PricingPolicy {", "    Money calculateFee(ParkingTicket ticket, Instant exitTime);", "}", "");
  }

  return lines.join("\n").trimEnd();
}

function advance(mission: LldGameMission, state: LldGameState): LldGameState {
  const readiness = getPhaseReadiness(mission, state);
  if (!readiness.ready) return invalid(state, readiness.missing[0] ? `Before continuing: ${readiness.missing[0]}.` : "This phase is not ready to continue.");
  const currentIndex = LLD_GAME_PHASES.indexOf(state.phase);
  const nextPhase = LLD_GAME_PHASES[currentIndex + 1] ?? state.phase;
  return { ...state, phase: nextPhase, lastFeedback: undefined };
}

function invalidateFrom(
  state: LldGameState,
  phase: Extract<LldGamePhase, "domain" | "model" | "relationships">,
  patch: Partial<LldGameState>,
): LldGameState {
  const phaseIndex = LLD_GAME_PHASES.indexOf(phase);
  const currentIndex = LLD_GAME_PHASES.indexOf(state.phase);
  const shouldReopen = currentIndex > phaseIndex;
  return {
    ...state,
    ...patch,
    phase: shouldReopen ? phase : state.phase,
    scenarioRuns: shouldReopen ? {} : state.scenarioRuns,
    changeDecisions: shouldReopen ? {} : state.changeDecisions,
    patternDecisionId: shouldReopen ? undefined : state.patternDecisionId,
    defenseAnswer: shouldReopen ? "" : state.defenseAnswer,
  };
}

function invalid(state: LldGameState, message: string): LldGameState {
  return { ...state, lastFeedback: message };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function ratioPoints(correct: number, total: number, points: number): number {
  if (total === 0) return points;
  return Math.round((correct / total) * points);
}

function matchesAny(value: string, keywords: string[]): boolean {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}
