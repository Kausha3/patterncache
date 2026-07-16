export type FoundationPhase =
  | "welcome"
  | "discover"
  | "properties"
  | "methods"
  | "relationships"
  | "simulation"
  | "change"
  | "interview"
  | "complete";

export type FoundationClassId =
  | "parking-lot"
  | "level"
  | "parking-spot"
  | "vehicle"
  | "ticket"
  | "pricing-policy";

export type FoundationMemberKind = "property" | "method";

export type FoundationClass = {
  id: FoundationClassId;
  worldName: string;
  className: string;
  plainPurpose: string;
  hotspot: { x: number; y: number };
};

export type FoundationMember = {
  id: string;
  kind: FoundationMemberKind;
  label: string;
  plainMeaning: string;
  owner: FoundationClassId;
  ownerReason: string;
};

export type FoundationRelationship = {
  id: string;
  source: FoundationClassId;
  target: FoundationClassId;
  worldMeaning: string;
  codeMeaning: string;
};

export const FOUNDATION_CLASSES: FoundationClass[] = [
  {
    id: "parking-lot",
    worldName: "The whole garage",
    className: "ParkingLot",
    plainPurpose: "Coordinates the floors and the entry flow.",
    hotspot: { x: 22, y: 31 },
  },
  {
    id: "level",
    worldName: "One floor",
    className: "Level",
    plainPurpose: "Manages the parking spaces on one floor.",
    hotspot: { x: 57, y: 35 },
  },
  {
    id: "parking-spot",
    worldName: "One parking space",
    className: "ParkingSpot",
    plainPurpose: "Knows its size and whether a vehicle occupies it.",
    hotspot: { x: 74, y: 49 },
  },
  {
    id: "vehicle",
    worldName: "One vehicle",
    className: "Vehicle",
    plainPurpose: "Carries the identity and type of one arriving vehicle.",
    hotspot: { x: 48, y: 68 },
  },
  {
    id: "ticket",
    worldName: "One parking visit",
    className: "ParkingTicket",
    plainPurpose: "Records when one vehicle entered and where it parked.",
    hotspot: { x: 17, y: 64 },
  },
  {
    id: "pricing-policy",
    worldName: "The pricing rulebook",
    className: "PricingPolicy",
    plainPurpose: "Calculates a fee without changing the garage coordinator.",
    hotspot: { x: 34, y: 54 },
  },
];

export const FOUNDATION_PROPERTIES: FoundationMember[] = [
  {
    id: "levels",
    kind: "property",
    label: "List<Level> levels",
    plainMeaning: "The list of floors inside the garage",
    owner: "parking-lot",
    ownerReason: "the whole garage must remember which floors it coordinates",
  },
  {
    id: "spots",
    kind: "property",
    label: "List<ParkingSpot> spots",
    plainMeaning: "The spaces that exist on one floor",
    owner: "level",
    ownerReason: "each floor must remember its own parking spaces",
  },
  {
    id: "occupied",
    kind: "property",
    label: "boolean occupied",
    plainMeaning: "Whether one parking space is already taken",
    owner: "parking-spot",
    ownerReason: "one parking space is the thing that becomes free or occupied",
  },
  {
    id: "vehicle-type",
    kind: "property",
    label: "VehicleType type",
    plainMeaning: "Whether the arrival is a compact car, truck, or EV",
    owner: "vehicle",
    ownerReason: "the vehicle carries its own identity and physical type",
  },
  {
    id: "entry-time",
    kind: "property",
    label: "Instant entryTime",
    plainMeaning: "When this parking visit began",
    owner: "ticket",
    ownerReason: "the ticket records one visit from entry to exit",
  },
];

export const FOUNDATION_METHODS: FoundationMember[] = [
  {
    id: "enter",
    kind: "method",
    label: "enter(vehicle)",
    plainMeaning: "Coordinate an arriving vehicle across the garage",
    owner: "parking-lot",
    ownerReason: "the whole garage coordinates the entry flow across floors",
  },
  {
    id: "find-spot",
    kind: "method",
    label: "findSpot(vehicle)",
    plainMeaning: "Search the spaces on one floor",
    owner: "level",
    ownerReason: "the floor already owns the list of spaces being searched",
  },
  {
    id: "park",
    kind: "method",
    label: "park(vehicle)",
    plainMeaning: "Place one vehicle into one free space",
    owner: "parking-spot",
    ownerReason: "the parking space changes its own occupied state",
  },
  {
    id: "duration",
    kind: "method",
    label: "durationAt(exitTime)",
    plainMeaning: "Measure the length of one parking visit",
    owner: "ticket",
    ownerReason: "the ticket already remembers when that visit began",
  },
];

export const CHANGE_MEMBER: FoundationMember = {
  id: "calculate-fee",
  kind: "method",
  label: "calculateFee(ticket)",
  plainMeaning: "Apply weekday, weekend, and event pricing rules",
  owner: "pricing-policy",
  ownerReason: "pricing rules change independently from garage coordination",
};

export const FOUNDATION_RELATIONSHIPS: FoundationRelationship[] = [
  {
    id: "lot-levels",
    source: "parking-lot",
    target: "level",
    worldMeaning: "The garage contains many floors.",
    codeMeaning: "ParkingLot has many Level objects.",
  },
  {
    id: "level-spots",
    source: "level",
    target: "parking-spot",
    worldMeaning: "Each floor contains many parking spaces.",
    codeMeaning: "Level has many ParkingSpot objects.",
  },
  {
    id: "vehicle-ticket",
    source: "vehicle",
    target: "ticket",
    worldMeaning: "An arriving vehicle receives one active ticket.",
    codeMeaning: "Vehicle is associated with a ParkingTicket for one visit.",
  },
];

export const FOUNDATION_SIMULATION_TRACE = [
  { owner: "ParkingLot", action: "enter(vehicle)", result: "asks each floor for help" },
  { owner: "Level", action: "findSpot(vehicle)", result: "searches only its own spaces" },
  { owner: "ParkingSpot", action: "park(vehicle)", result: "marks itself occupied" },
  { owner: "ParkingTicket", action: "records entryTime", result: "keeps the visit history" },
] as const;

export type FoundationCampaignState = {
  phase: FoundationPhase;
  discovered: FoundationClassId[];
  propertyOwners: Record<string, FoundationClassId>;
  methodOwners: Record<string, FoundationClassId>;
  selectedMemberId?: string;
  relationships: string[];
  pendingRelationSource?: FoundationClassId;
  simulationRunning: boolean;
  simulationStep: number;
  simulationComplete: boolean;
  changeOwner: FoundationClassId;
  attempts: number;
  lastFeedback?: string;
  interviewScore?: number;
};

export type FoundationCampaignAction =
  | { type: "START" }
  | { type: "DISCOVER_CLASS"; classId: FoundationClassId }
  | { type: "PICK_MEMBER"; memberId: string }
  | { type: "PLACE_SELECTED"; owner: FoundationClassId }
  | { type: "SELECT_RELATION_ENDPOINT"; classId: FoundationClassId }
  | { type: "RUN_SIMULATION" }
  | { type: "SIMULATION_TICK" }
  | { type: "ADVANCE" }
  | { type: "SUBMIT_INTERVIEW"; score: number }
  | { type: "RESET" };

export function createFoundationCampaignState(): FoundationCampaignState {
  return {
    phase: "welcome",
    discovered: [],
    propertyOwners: {},
    methodOwners: {},
    relationships: [],
    simulationRunning: false,
    simulationStep: 0,
    simulationComplete: false,
    changeOwner: "parking-lot",
    attempts: 0,
  };
}

export function foundationCampaignReducer(
  state: FoundationCampaignState,
  action: FoundationCampaignAction,
): FoundationCampaignState {
  switch (action.type) {
    case "START":
      return state.phase === "welcome" ? { ...state, phase: "discover", lastFeedback: undefined } : state;
    case "DISCOVER_CLASS": {
      if (state.phase !== "discover" || action.classId === "pricing-policy" || state.discovered.includes(action.classId)) return state;
      const discovered = [...state.discovered, action.classId];
      const found = getFoundationClass(action.classId);
      return {
        ...state,
        discovered,
        lastFeedback: `${found.worldName} becomes the ${found.className} class: ${found.plainPurpose}`,
      };
    }
    case "PICK_MEMBER": {
      const member = getMemberForPhase(state.phase, action.memberId);
      if (!member || isMemberPlaced(state, member)) return state;
      return { ...state, selectedMemberId: member.id, lastFeedback: `You are holding ${member.label}. Choose the class that should own it.` };
    }
    case "PLACE_SELECTED": {
      if (!state.selectedMemberId) return state;
      const member = getMemberForPhase(state.phase, state.selectedMemberId);
      if (!member) return state;
      if (action.owner !== member.owner) {
        return {
          ...state,
          attempts: state.attempts + 1,
          lastFeedback: `${getFoundationClass(action.owner).className} is not the best owner. Think about this: ${member.ownerReason}.`,
        };
      }
      if (state.phase === "properties") {
        return {
          ...state,
          propertyOwners: { ...state.propertyOwners, [member.id]: action.owner },
          selectedMemberId: undefined,
          lastFeedback: `${member.label} is now protected by ${getFoundationClass(action.owner).className}, because ${member.ownerReason}.`,
        };
      }
      if (state.phase === "methods") {
        return {
          ...state,
          methodOwners: { ...state.methodOwners, [member.id]: action.owner },
          selectedMemberId: undefined,
          lastFeedback: `${getFoundationClass(action.owner).className} can now ${member.plainMeaning.toLowerCase()}.`,
        };
      }
      if (state.phase === "change") {
        return {
          ...state,
          changeOwner: action.owner,
          selectedMemberId: undefined,
          lastFeedback: "Pricing changes are now contained inside PricingPolicy. The garage coordinator stays focused.",
        };
      }
      return state;
    }
    case "SELECT_RELATION_ENDPOINT": {
      if (state.phase !== "relationships") return state;
      const relation = getCurrentRelationship(state);
      if (!relation) return state;
      if (!state.pendingRelationSource) {
        if (action.classId !== relation.source) {
          return {
            ...state,
            attempts: state.attempts + 1,
            lastFeedback: `Start the connection at ${getFoundationClass(relation.source).className}: ${relation.worldMeaning}`,
          };
        }
        return {
          ...state,
          pendingRelationSource: relation.source,
          lastFeedback: `Connection started at ${getFoundationClass(relation.source).className}. Now connect the object it contains or uses.`,
        };
      }
      if (action.classId !== relation.target) {
        return {
          ...state,
          attempts: state.attempts + 1,
          lastFeedback: `${getFoundationClass(action.classId).className} does not complete this real-world connection. ${relation.worldMeaning}`,
        };
      }
      return {
        ...state,
        relationships: [...state.relationships, relation.id],
        pendingRelationSource: undefined,
        lastFeedback: `${relation.worldMeaning} In the design: ${relation.codeMeaning}`,
      };
    }
    case "RUN_SIMULATION":
      if (state.phase !== "simulation" || state.simulationRunning || state.simulationComplete) return state;
      return { ...state, simulationRunning: true, simulationStep: 0, lastFeedback: "A vehicle entered. Watch the responsibility move through the objects you built." };
    case "SIMULATION_TICK": {
      if (state.phase !== "simulation" || !state.simulationRunning) return state;
      const simulationStep = state.simulationStep + 1;
      const simulationComplete = simulationStep >= FOUNDATION_SIMULATION_TRACE.length;
      return {
        ...state,
        simulationStep,
        simulationRunning: !simulationComplete,
        simulationComplete,
        lastFeedback: simulationComplete
          ? "The vehicle parked successfully because every object owned focused information and behavior."
          : `${FOUNDATION_SIMULATION_TRACE[simulationStep - 1].owner} completed ${FOUNDATION_SIMULATION_TRACE[simulationStep - 1].action}.`,
      };
    }
    case "ADVANCE":
      return advanceFoundationPhase(state);
    case "SUBMIT_INTERVIEW":
      if (state.phase !== "interview") return state;
      return {
        ...state,
        interviewScore: action.score,
        phase: action.score >= 75 ? "complete" : "interview",
        lastFeedback: action.score >= 75
          ? "You explained the design using responsibilities, relationships, and change reasoning."
          : "The design is built. Strengthen the missing parts of your spoken explanation and try again.",
      };
    case "RESET":
      return createFoundationCampaignState();
    default:
      return state;
  }
}

export function isFoundationPhaseReady(state: FoundationCampaignState): boolean {
  if (state.phase === "welcome") return true;
  if (state.phase === "discover") return state.discovered.length === FOUNDATION_CLASSES.length - 1;
  if (state.phase === "properties") return FOUNDATION_PROPERTIES.every((member) => state.propertyOwners[member.id] === member.owner);
  if (state.phase === "methods") return FOUNDATION_METHODS.every((member) => state.methodOwners[member.id] === member.owner);
  if (state.phase === "relationships") return FOUNDATION_RELATIONSHIPS.every((relation) => state.relationships.includes(relation.id));
  if (state.phase === "simulation") return state.simulationComplete;
  if (state.phase === "change") return state.changeOwner === "pricing-policy";
  return false;
}

export function getCurrentFoundationMember(state: FoundationCampaignState): FoundationMember | undefined {
  const members = state.phase === "properties"
    ? FOUNDATION_PROPERTIES
    : state.phase === "methods"
      ? FOUNDATION_METHODS
      : state.phase === "change"
        ? [CHANGE_MEMBER]
        : [];
  return members.find((member) => !isMemberPlaced(state, member));
}

export function getCurrentRelationship(state: FoundationCampaignState): FoundationRelationship | undefined {
  return FOUNDATION_RELATIONSHIPS.find((relationship) => !state.relationships.includes(relationship.id));
}

export function getFoundationClass(classId: FoundationClassId): FoundationClass {
  return FOUNDATION_CLASSES.find((item) => item.id === classId) ?? FOUNDATION_CLASSES[0];
}

export type FoundationInterviewAssessment = {
  score: number;
  matched: string[];
  missing: string[];
};

export function assessFoundationInterview(answer: string): FoundationInterviewAssessment {
  const normalized = answer.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const evidence = [
    {
      label: "Name the main objects",
      matched: /(parking ?lot)/.test(normalized) && /(level|floor)/.test(normalized) && /(parking ?spot|space|vehicle|ticket)/.test(normalized),
    },
    {
      label: "Explain what each object owns or does",
      matched: /(own|remember|responsib|coordinate)/.test(normalized) && /(find|search|park|enter)/.test(normalized),
    },
    {
      label: "Describe at least one relationship",
      matched: /(has many|contains|composition|relationship|list of|levels.*spots|floors.*spaces)/.test(normalized),
    },
    {
      label: "Explain how pricing can change safely",
      matched: /(pricing ?policy|pricing rule|fee)/.test(normalized) && /(change|vary|separate|without changing|focused)/.test(normalized),
    },
  ];
  const matched = evidence.filter((item) => item.matched).map((item) => item.label);
  const missing = evidence.filter((item) => !item.matched).map((item) => item.label);
  return { score: matched.length * 25, matched, missing };
}

function getMemberForPhase(phase: FoundationPhase, memberId: string): FoundationMember | undefined {
  if (phase === "properties") return FOUNDATION_PROPERTIES.find((member) => member.id === memberId);
  if (phase === "methods") return FOUNDATION_METHODS.find((member) => member.id === memberId);
  if (phase === "change" && memberId === CHANGE_MEMBER.id) return CHANGE_MEMBER;
  return undefined;
}

function isMemberPlaced(state: FoundationCampaignState, member: FoundationMember): boolean {
  if (member.id === CHANGE_MEMBER.id) return state.changeOwner === "pricing-policy";
  return member.kind === "property"
    ? state.propertyOwners[member.id] === member.owner
    : state.methodOwners[member.id] === member.owner;
}

function advanceFoundationPhase(state: FoundationCampaignState): FoundationCampaignState {
  if (!isFoundationPhaseReady(state)) return state;
  const next: Partial<Record<FoundationPhase, FoundationPhase>> = {
    discover: "properties",
    properties: "methods",
    methods: "relationships",
    relationships: "simulation",
    simulation: "change",
    change: "interview",
  };
  const phase = next[state.phase];
  return phase ? { ...state, phase, selectedMemberId: undefined, pendingRelationSource: undefined, lastFeedback: undefined } : state;
}
