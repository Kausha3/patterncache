export const SOLID_PRINCIPLE_IDS = ["srp", "ocp", "lsp", "isp", "dip"] as const;

export type SolidPrincipleId = (typeof SOLID_PRINCIPLE_IDS)[number];
export type LldDomainKind = "class" | "value" | "external" | "out-of-scope";
export type LldRelationshipKind = "composition" | "association" | "dependency" | "inheritance";

export interface SolidCampaignChapter {
  id: SolidPrincipleId;
  order: number;
  name: string;
  learnerCan: string;
  gameMechanic: string;
  interviewCue: string;
  patternUnlocked?: string;
}

export interface LldGameQuestion {
  id: string;
  prompt: string;
  answer: string;
  designImpact: string;
  required: boolean;
}

export interface LldDomainCandidate {
  id: string;
  label: string;
  referenceKind: LldDomainKind;
  why: string;
  purposeKeywords?: string[];
}

export interface LldPlacementCard {
  id: string;
  label: string;
  type?: string;
  javaSignature?: string;
  context?: string;
  referenceOwnerId: string;
  why: string;
}

export interface LldRelationshipCard {
  id: string;
  fromId: string;
  toId: string;
  kind: LldRelationshipKind;
  cardinality: string;
  referenceIncluded: boolean;
  why: string;
}

export interface LldScenario {
  id: string;
  title: string;
  story: string;
  requiredMethodIds: string[];
  requiredRelationshipIds: string[];
  success: string;
  failure: string;
}

export interface LldDecisionOption {
  id: string;
  label: string;
  correct: boolean;
  changedClassIds: string[];
  feedback: string;
}

export interface LldChangeStorm {
  id: string;
  principleId: SolidPrincipleId;
  title: string;
  requirement: string;
  pressure: string;
  options: LldDecisionOption[];
}

export interface LldPatternChallenge {
  prompt: string;
  options: Array<{
    id: string;
    name: string;
    correct: boolean;
    feedback: string;
  }>;
  whenToUse: string;
  whenNotToUse: string;
}

export interface LldInterviewDefense {
  prompt: string;
  rubric: Array<{ id: string; label: string; keywords: string[] }>;
  referenceAnswer: string;
}

export interface LldGameMission {
  id: string;
  sourceLessonId: string;
  title: string;
  prompt: string;
  objective: string;
  focusPrincipleId: SolidPrincipleId;
  questions: LldGameQuestion[];
  domainCandidates: LldDomainCandidate[];
  properties: LldPlacementCard[];
  methods: LldPlacementCard[];
  relationships: LldRelationshipCard[];
  scenarios: LldScenario[];
  changeStorms: LldChangeStorm[];
  patternChallenge: LldPatternChallenge;
  interview: LldInterviewDefense;
}

export const SOLID_CAMPAIGN: SolidCampaignChapter[] = [
  {
    id: "srp",
    order: 1,
    name: "Single Responsibility Principle",
    learnerCan: "Separate behaviors that change for different reasons and keep invariants with their owners.",
    gameMechanic: "A change storm highlights every class touched by one new requirement; the learner refactors until unrelated flows stop regressing.",
    interviewCue: "These responsibilities change for different reasons.",
  },
  {
    id: "ocp",
    order: 2,
    name: "Open/Closed Principle",
    learnerCan: "Add a new behavior variant without editing stable callers or growing a central conditional.",
    gameMechanic: "Each new pricing variant either adds one implementation or expands a red branch tree in existing code.",
    interviewCue: "A new variant is a new implementation, not a new branch in working code.",
    patternUnlocked: "Strategy",
  },
  {
    id: "lsp",
    order: 3,
    name: "Liskov Substitution Principle",
    learnerCan: "Design implementations that preserve the contract their callers rely on.",
    gameMechanic: "The learner swaps implementations into one scenario suite; contract-breaking subtypes fail the same caller tests.",
    interviewCue: "Every implementation preserves the caller's contract.",
  },
  {
    id: "isp",
    order: 4,
    name: "Interface Segregation Principle",
    learnerCan: "Give each client the smallest capability contract it actually needs.",
    gameMechanic: "Large interfaces create fake methods on adapters; splitting the contract removes irrelevant obligations.",
    interviewCue: "No client depends on operations it never uses.",
  },
  {
    id: "dip",
    order: 5,
    name: "Dependency Inversion Principle",
    learnerCan: "Make stable domain code own contracts that external details implement.",
    gameMechanic: "A provider outage forces the learner to replace a concrete dependency with an injected port and test adapter.",
    interviewCue: "The domain owns the contract; infrastructure implements it.",
    patternUnlocked: "Adapter",
  },
];

export const PARKING_LOT_SRP_MISSION: LldGameMission = {
  id: "parking-lot-srp",
  sourceLessonId: "parking-lot",
  title: "Parking Lot · Responsibility Under Change",
  prompt: "Design a parking lot.",
  objective: "Clarify the scope, build the class model, run its core flows, and keep EV pricing from leaking into parking or payment responsibilities.",
  focusPrincipleId: "srp",
  questions: [
    {
      id: "vehicle-sizes",
      prompt: "Do we support different vehicle and spot sizes?",
      answer: "Yes: motorcycle, compact, and large. A vehicle may use a compatible or larger spot.",
      designImpact: "Vehicle and ParkingSpot both need a size, and allocation must enforce compatibility.",
      required: true,
    },
    {
      id: "levels",
      prompt: "Is this a single-floor or multi-level garage?",
      answer: "It is a multi-level garage.",
      designImpact: "Level becomes a real class that owns and searches the spots on one floor.",
      required: true,
    },
    {
      id: "payment",
      prompt: "Are fee calculation and payment in scope?",
      answer: "Yes. Calculate a duration-based fee and charge on exit.",
      designImpact: "Pricing and payment are explicit responsibilities with different reasons to change.",
      required: true,
    },
    {
      id: "concurrency",
      prompt: "Can two entry requests try to claim the final spot at the same time?",
      answer: "Yes. Assignment must allow exactly one request to win.",
      designImpact: "ParkingSpot must protect occupancy atomically instead of exposing a mutable flag.",
      required: false,
    },
  ],
  domainCandidates: [
    { id: "lot", label: "ParkingLot", referenceKind: "class", why: "It coordinates allocation across every level.", purposeKeywords: ["coordinate", "level", "allocation"] },
    { id: "level", label: "Level", referenceKind: "class", why: "It owns and searches the spots on one floor.", purposeKeywords: ["spot", "floor", "search"] },
    { id: "spot", label: "ParkingSpot", referenceKind: "class", why: "It owns compatibility and occupancy state.", purposeKeywords: ["occup", "vehicle", "compatib"] },
    { id: "vehicle", label: "Vehicle", referenceKind: "class", why: "It has identity and size used during allocation.", purposeKeywords: ["size", "plate", "identity"] },
    { id: "ticket", label: "ParkingTicket", referenceKind: "class", why: "It records one parking session and its entry time.", purposeKeywords: ["session", "entry", "time"] },
    { id: "payment", label: "PaymentService", referenceKind: "class", why: "It owns the external charging boundary and payment failures.", purposeKeywords: ["payment", "charge", "gateway"] },
    { id: "size", label: "VehicleSize", referenceKind: "value", why: "It is a small value used by Vehicle and ParkingSpot, not an independent actor." },
    { id: "driver", label: "Driver", referenceKind: "external", why: "The driver uses the system but is not part of the garage's core object model." },
    { id: "mobile-app", label: "MobileApp", referenceKind: "out-of-scope", why: "It is a client of this model and was not requested as a domain responsibility." },
  ],
  properties: [
    { id: "lot-levels", label: "levels", type: "List<Level>", referenceOwnerId: "lot", why: "ParkingLot coordinates across the levels it owns." },
    { id: "level-spots", label: "spots", type: "List<ParkingSpot>", referenceOwnerId: "level", why: "A Level owns the collection it searches." },
    { id: "spot-size", label: "size", type: "VehicleSize", context: "Capacity offered by one parking spot", referenceOwnerId: "spot", why: "Compatibility is a property of the spot being allocated." },
    { id: "spot-vehicle", label: "currentVehicle", type: "Vehicle", context: "Null when the spot is free", referenceOwnerId: "spot", why: "ParkingSpot protects whether and by whom it is occupied." },
    { id: "vehicle-size", label: "size", type: "VehicleSize", context: "Capacity required by one vehicle", referenceOwnerId: "vehicle", why: "The vehicle carries the requirement used for compatibility." },
    { id: "ticket-entry", label: "entryTime", type: "Instant", referenceOwnerId: "ticket", why: "The ticket records the start of one parking session." },
    { id: "payment-gateway", label: "gateway", type: "PaymentGateway", referenceOwnerId: "payment", why: "PaymentService owns the external payment dependency." },
  ],
  methods: [
    { id: "find-lot-spot", label: "findAvailableSpot(vehicle)", javaSignature: "ParkingSpot findAvailableSpot(Vehicle vehicle)", referenceOwnerId: "lot", why: "Only ParkingLot can coordinate a search across every Level." },
    { id: "find-level-spot", label: "findSpot(vehicle)", javaSignature: "Optional<ParkingSpot> findSpot(Vehicle vehicle)", referenceOwnerId: "level", why: "Level owns the spot collection being searched." },
    { id: "assign-vehicle", label: "assign(vehicle)", javaSignature: "void assign(Vehicle vehicle)", referenceOwnerId: "spot", why: "ParkingSpot owns the occupancy and compatibility invariant." },
    { id: "vehicle-size-method", label: "getSize()", javaSignature: "VehicleSize getSize()", referenceOwnerId: "vehicle", why: "Vehicle owns the size value being read." },
    { id: "ticket-duration", label: "durationAt(exitTime)", javaSignature: "Duration durationAt(Instant exitTime)", referenceOwnerId: "ticket", why: "ParkingTicket owns the entry timestamp for this session." },
    { id: "charge-payment", label: "charge(amount, method)", javaSignature: "Receipt charge(Money amount, PaymentMethod method)", referenceOwnerId: "payment", why: "PaymentService owns gateway interaction, retries, and payment failure handling." },
  ],
  relationships: [
    { id: "lot-level", fromId: "lot", toId: "level", kind: "composition", cardinality: "1 to many", referenceIncluded: true, why: "A parking lot is composed of its levels." },
    { id: "level-spot", fromId: "level", toId: "spot", kind: "composition", cardinality: "1 to many", referenceIncluded: true, why: "A level is composed of the spots it manages." },
    { id: "ticket-spot", fromId: "ticket", toId: "spot", kind: "association", cardinality: "1 to 1", referenceIncluded: true, why: "A ticket records the spot assigned to one session." },
    { id: "ticket-vehicle", fromId: "ticket", toId: "vehicle", kind: "association", cardinality: "1 to 1", referenceIncluded: true, why: "A ticket records the vehicle participating in the session." },
    { id: "vehicle-lot-inheritance", fromId: "vehicle", toId: "lot", kind: "inheritance", cardinality: "is-a", referenceIncluded: false, why: "A Vehicle is not a kind of ParkingLot; their relationship is usage, not inheritance." },
    { id: "payment-spot-composition", fromId: "payment", toId: "spot", kind: "composition", cardinality: "1 to 1", referenceIncluded: false, why: "Payment does not own the lifetime of a physical spot." },
  ],
  scenarios: [
    {
      id: "normal-entry",
      title: "Vehicle enters",
      story: "A compact car enters, the lot searches each level, and one compatible free spot is assigned.",
      requiredMethodIds: ["find-lot-spot", "find-level-spot", "assign-vehicle", "vehicle-size-method"],
      requiredRelationshipIds: ["lot-level", "level-spot"],
      success: "The search stays inside the owning collections and ParkingSpot protects assignment.",
      failure: "The entry flow cannot reliably find and atomically claim a compatible spot.",
    },
    {
      id: "full-lot",
      title: "Lot is full",
      story: "A vehicle arrives after every compatible spot has been occupied.",
      requiredMethodIds: ["find-lot-spot", "find-level-spot"],
      requiredRelationshipIds: ["lot-level", "level-spot"],
      success: "The aggregate returns no available spot before a ticket is issued.",
      failure: "The model has no reliable building-wide path for proving that capacity is exhausted.",
    },
    {
      id: "size-mismatch",
      title: "Large vehicle, compact spots",
      story: "Only compact spaces are free when a large vehicle arrives.",
      requiredMethodIds: ["find-level-spot", "assign-vehicle", "vehicle-size-method"],
      requiredRelationshipIds: ["level-spot"],
      success: "Compatibility is checked before occupancy changes, so the invalid assignment is rejected.",
      failure: "Size is missing from the collaboration or assignment can bypass compatibility.",
    },
    {
      id: "last-spot-race",
      title: "Two cars race for one spot",
      story: "Two entry requests reach the final compatible spot at the same time.",
      requiredMethodIds: ["assign-vehicle"],
      requiredRelationshipIds: ["level-spot"],
      success: "ParkingSpot owns one atomic assignment operation, so exactly one vehicle wins.",
      failure: "Occupancy can be mutated from outside the owning object, allowing a double assignment.",
    },
  ],
  changeStorms: [
    {
      id: "ev-pricing",
      principleId: "srp",
      title: "EV charging and event pricing arrive",
      requirement: "Charging price now varies by energy used, event windows, and membership while payment providers remain unchanged.",
      pressure: "Pricing rules and payment-provider behavior now change for visibly different reasons.",
      options: [
        {
          id: "pricing-policy",
          label: "Create PricingPolicy.calculateFee(...) and let PaymentService only charge the resulting amount.",
          correct: true,
          changedClassIds: ["pricing-policy", "payment"],
          feedback: "The change is contained: pricing owns business rules, payment owns the external money boundary, and parking allocation stays untouched.",
        },
        {
          id: "parking-god-object",
          label: "Add EV, event, membership, and gateway branches directly to ParkingLot.",
          correct: false,
          changedClassIds: ["lot", "level", "ticket", "payment"],
          feedback: "ParkingLot now changes for allocation, pricing, and provider failures. One requirement spreads across unrelated responsibilities.",
        },
        {
          id: "singleton-payment",
          label: "Make PaymentService a Singleton and put every pricing rule inside it.",
          correct: false,
          changedClassIds: ["payment", "ticket", "lot"],
          feedback: "Global access does not separate responsibilities. It also hides dependencies and makes pricing tests share mutable global state.",
        },
      ],
    },
  ],
  patternChallenge: {
    prompt: "Several pricing algorithms must be selected by context without changing ParkingLot or PaymentService. Which pattern has now been earned?",
    options: [
      { id: "strategy", name: "Strategy", correct: true, feedback: "Pricing algorithms share one contract and vary independently, which is exactly the Strategy pressure." },
      { id: "factory", name: "Factory", correct: false, feedback: "A Factory may later choose which strategy to create, but it does not itself model interchangeable pricing behavior." },
      { id: "singleton", name: "Singleton", correct: false, feedback: "Singleton controls instance count and global access; it does not solve pricing variation and makes tests harder." },
      { id: "none", name: "No pattern", correct: false, feedback: "With several independently changing algorithms, a small PricingPolicy contract now removes real conditional pressure." },
    ],
    whenToUse: "Use Strategy when the algorithm varies independently and callers should depend on one stable operation.",
    whenNotToUse: "Do not introduce Strategy for one fixed calculation with no realistic variation; a focused method is simpler.",
  },
  interview: {
    prompt: "Defend the boundary between parking coordination, pricing, and payment. Name the alternative you rejected and the change your design contains.",
    rubric: [
      { id: "responsibility", label: "Names the separate responsibilities", keywords: ["responsibility", "coordinate", "pricing", "payment"] },
      { id: "ownership", label: "Connects behavior to owned state or invariant", keywords: ["owns", "invariant", "gateway", "rules"] },
      { id: "alternative", label: "Rejects a concrete alternative", keywords: ["instead", "rather", "alternative", "god object", "parkinglot"] },
      { id: "change", label: "Explains what future change stays contained", keywords: ["change", "extend", "new policy", "ev", "event"] },
      { id: "evidence", label: "Uses a scenario or test as evidence", keywords: ["test", "scenario", "entry", "regression", "flow"] },
    ],
    referenceAnswer: "I keep ParkingLot responsible for coordinating allocation across levels, while each ParkingSpot protects its own compatibility and occupancy invariant. I place fee calculation behind PricingPolicy because pricing rules change for EV charging, events, and membership; PaymentService only charges the amount and handles gateway failures. I rejected putting those branches in ParkingLot or PaymentService because that would give either class multiple unrelated reasons to change. With this split, a new tariff is a new pricing policy, and the existing entry, allocation, ticket, and payment scenarios continue to pass unchanged.",
  },
};

export const LLD_GAME_MISSIONS: LldGameMission[] = [PARKING_LOT_SRP_MISSION];
