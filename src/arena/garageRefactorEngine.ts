export type GarageNodeId =
  | "lot"
  | "level"
  | "spot"
  | "vehicle"
  | "ticket"
  | "pricing"
  | "payment";

export type GarageArtifactKind = "state" | "behavior";

export type GarageArtifact = {
  id: string;
  label: string;
  java: string;
  kind: GarageArtifactKind;
  beginnerName: string;
  beginnerDescription: string;
  referenceOwnerId: GarageNodeId;
  reason: string;
};

export type GarageNode = {
  id: GarageNodeId;
  label: string;
  beginnerName: string;
  responsibility: string;
  beginnerDescription: string;
};

export type GarageIncident = {
  id: string;
  title: string;
  dispatchLabel: string;
  story: string;
  requiredArtifactIds: string[];
  success: string;
  failure: string;
  beginnerGoal: string;
  repairLesson: string;
  trace: string[];
};

export type GaragePlacements = Record<string, GarageNodeId>;

export type GarageSimulation = {
  passed: boolean;
  incidentId: string;
  message: string;
  trace: Array<{ label: string; status: "pass" | "fail" }>;
  misplacedArtifactIds: string[];
};

export const GARAGE_NODES: GarageNode[] = [
  { id: "lot", label: "ParkingLot", beginnerName: "The whole garage", responsibility: "Coordinate a search across levels", beginnerDescription: "Remembers which floors exist and asks each floor to look for a free space." },
  { id: "level", label: "Level", beginnerName: "One garage floor", responsibility: "Own and search one floor's spots", beginnerDescription: "Remembers the parking spaces on one floor and searches only that floor." },
  { id: "spot", label: "ParkingSpot", beginnerName: "One parking space", responsibility: "Protect compatibility and occupancy", beginnerDescription: "Knows what size vehicle fits, whether it is free, and parks one vehicle safely." },
  { id: "vehicle", label: "Vehicle", beginnerName: "One car or truck", responsibility: "Own vehicle identity and required size", beginnerDescription: "Knows its own identity and how much parking space it needs." },
  { id: "ticket", label: "ParkingTicket", beginnerName: "One parking visit", responsibility: "Record one parking session", beginnerDescription: "Remembers when one visit started and calculates how long it lasted." },
  { id: "pricing", label: "PricingPolicy", beginnerName: "The price calculator", responsibility: "Calculate a fee from a ticket", beginnerDescription: "Turns the parking duration into a price. New pricing rules belong here." },
  { id: "payment", label: "PaymentService", beginnerName: "The card charger", responsibility: "Charge through a payment gateway", beginnerDescription: "Talks to the card provider and keeps payment failures away from parking logic." },
];

export const GARAGE_ARTIFACTS: GarageArtifact[] = [
  { id: "levels", label: "levels", java: "List<Level> levels", kind: "state", beginnerName: "Floors in the garage", beginnerDescription: "A list of every floor that belongs to the whole garage.", referenceOwnerId: "lot", reason: "The whole garage owns the floors it coordinates." },
  { id: "find-lot", label: "findAvailableSpot(vehicle)", java: "ParkingSpot findAvailableSpot(Vehicle vehicle)", kind: "behavior", beginnerName: "Search every floor", beginnerDescription: "An action that asks each floor to find a parking space for a vehicle.", referenceOwnerId: "lot", reason: "Only the whole garage coordinates a search across every floor." },
  { id: "spots", label: "spots", java: "List<ParkingSpot> spots", kind: "state", beginnerName: "Spaces on this floor", beginnerDescription: "A list of the parking spaces that belong to one floor.", referenceOwnerId: "level", reason: "Each floor owns its own collection of parking spaces." },
  { id: "find-level", label: "findSpot(vehicle)", java: "Optional<ParkingSpot> findSpot(Vehicle vehicle)", kind: "behavior", beginnerName: "Search this floor", beginnerDescription: "An action that searches the parking spaces on one floor.", referenceOwnerId: "level", reason: "One floor searches the parking spaces it owns." },
  { id: "spot-size", label: "capacity", java: "VehicleSize capacity", kind: "state", beginnerName: "Largest vehicle that fits", beginnerDescription: "Information describing whether this space fits a bike, car, or truck.", referenceOwnerId: "spot", reason: "A parking space knows the largest vehicle it can accept." },
  { id: "occupant", label: "currentVehicle", java: "Vehicle currentVehicle", kind: "state", beginnerName: "Vehicle parked here", beginnerDescription: "The vehicle currently using this space, or nothing when the space is free.", referenceOwnerId: "spot", reason: "A parking space protects its own occupied or free state." },
  { id: "assign", label: "assign(vehicle)", java: "void assign(Vehicle vehicle)", kind: "behavior", beginnerName: "Park a vehicle here", beginnerDescription: "An action that checks the vehicle and marks this space as occupied.", referenceOwnerId: "spot", reason: "The object that remembers occupancy must also protect the parking action." },
  { id: "vehicle-size", label: "requiredSize", java: "VehicleSize requiredSize", kind: "state", beginnerName: "Space this vehicle needs", beginnerDescription: "Information describing how large a parking space this vehicle requires.", referenceOwnerId: "vehicle", reason: "The vehicle owns the space requirement that describes it." },
  { id: "get-size", label: "getRequiredSize()", java: "VehicleSize getRequiredSize()", kind: "behavior", beginnerName: "Tell us the required size", beginnerDescription: "An action that returns how much parking space this vehicle needs.", referenceOwnerId: "vehicle", reason: "The vehicle exposes information about its own required size." },
  { id: "entry-time", label: "entryTime", java: "Instant entryTime", kind: "state", beginnerName: "Time parking started", beginnerDescription: "The exact time this parking visit began.", referenceOwnerId: "ticket", reason: "The parking ticket records when its visit began." },
  { id: "duration", label: "durationAt(exitTime)", java: "Duration durationAt(Instant exitTime)", kind: "behavior", beginnerName: "Calculate time parked", beginnerDescription: "An action that compares entry and exit times to find the visit duration.", referenceOwnerId: "ticket", reason: "The ticket owns the start time needed to calculate duration." },
  { id: "fee", label: "calculateFee(ticket)", java: "Money calculateFee(ParkingTicket ticket)", kind: "behavior", beginnerName: "Calculate the parking price", beginnerDescription: "An action that applies current pricing rules to one parking visit.", referenceOwnerId: "pricing", reason: "Pricing rules change independently from parking and payment." },
  { id: "gateway", label: "gateway", java: "PaymentGateway gateway", kind: "state", beginnerName: "Connection to the card provider", beginnerDescription: "The outside service used to charge a credit or debit card.", referenceOwnerId: "payment", reason: "Only the card-charging class should know the external provider." },
  { id: "charge", label: "charge(amount, method)", java: "Receipt charge(Money amount, PaymentMethod method)", kind: "behavior", beginnerName: "Charge the customer's card", beginnerDescription: "An action that sends an amount to the card provider and returns a receipt.", referenceOwnerId: "payment", reason: "Card retries and failures belong in the card-charging class." },
];

export const GARAGE_INCIDENTS: GarageIncident[] = [
  {
    id: "entry",
    title: "Rush-hour entry",
    dispatchLabel: "Dispatch compact car",
    story: "A compact car arrives. The lot must search every floor without exposing their spot collections.",
    requiredArtifactIds: ["levels", "find-lot", "spots", "find-level"],
    success: "The whole garage checked its floors, and each floor searched only the parking spaces it remembers.",
    failure: "The whole garage is trying to search parking spaces that should be remembered by one floor.",
    beginnerGoal: "Help the whole garage search its floors, while each floor searches only its own parking spaces.",
    repairLesson: "Keep information beside the action that uses it: the whole garage owns its floors; one floor owns and searches its spaces.",
    trace: ["A car asks the whole garage for a space", "The garage checks its list of floors", "One floor checks its own parking spaces", "A free space is returned"],
  },
  {
    id: "compatibility",
    title: "Oversized vehicle",
    dispatchLabel: "Dispatch large truck",
    story: "Only compact spots are free. The model must reject the truck before occupancy changes.",
    requiredArtifactIds: ["spot-size", "vehicle-size", "get-size", "assign"],
    success: "The parking space compared what it can fit with what the truck needs, then rejected the truck before parking it.",
    failure: "Information about the truck and parking space is in the wrong classes, so the program parks before it checks whether the truck fits.",
    beginnerGoal: "Make the vehicle describe the space it needs, and let one parking space decide whether the vehicle fits.",
    repairLesson: "A vehicle owns its required size. A parking space owns its capacity and the action that parks a vehicle safely.",
    trace: ["The truck reports how much space it needs", "The parking space checks what size it can fit", "The parking space protects its occupied or free state", "The truck is correctly rejected"],
  },
  {
    id: "race",
    title: "Last-spot race",
    dispatchLabel: "Release two cars",
    story: "Two requests reach A-03 together. Exactly one car may claim the final spot.",
    requiredArtifactIds: ["occupant", "assign"],
    success: "Space A-03 checked and changed its own occupied state in one safe action. One car parked and the other was rejected.",
    failure: "Code outside space A-03 changed whether it was occupied, so both cars were parked in the same space.",
    beginnerGoal: "Make sure two cars can never occupy the same parking space.",
    repairLesson: "The parking space must remember its current vehicle and perform the parking action itself, so the check and change happen together.",
    trace: ["Two cars ask for space A-03 at the same time", "A-03 checks whether a vehicle is already there", "A-03 parks exactly one car", "The other car is told that the space is full"],
  },
  {
    id: "ticket",
    title: "Overnight checkout",
    dispatchLabel: "Exit overnight guest",
    story: "A ticket crosses midnight. Duration must come from the session record, not global garage state.",
    requiredArtifactIds: ["entry-time", "duration"],
    success: "The ticket used the start time it remembers to calculate the exact parking duration.",
    failure: "The visit's start time and the action that calculates its duration live in different classes, so the duration is wrong.",
    beginnerGoal: "Calculate the length of one parking visit, even when it crosses midnight.",
    repairLesson: "The parking ticket remembers when its visit began, so it should also calculate that visit's duration.",
    trace: ["The exit time is sent to this visit's ticket", "The ticket reads when the visit started", "The ticket calculates the parking duration", "The price calculator receives the correct duration"],
  },
  {
    id: "pricing",
    title: "EV pricing storm",
    dispatchLabel: "Deploy EV pricing",
    story: "Product adds EV charging and weekend rates. Entry and payment code must remain untouched.",
    requiredArtifactIds: ["fee"],
    success: "A new price calculator can be added without changing how the garage finds spaces or charges cards. This is why the Strategy pattern exists.",
    failure: "Price calculation still lives in a class with a different job, so a price change could accidentally break parking or payment.",
    beginnerGoal: "Add a new EV price without changing the code that finds spaces or charges cards.",
    repairLesson: "Prices change for business reasons, so price calculation gets its own focused class instead of living in the garage manager.",
    trace: ["A new EV price rule is added", "The price calculator applies the new rule", "Finding parking spaces stays unchanged", "The card charger receives only the final amount"],
  },
  {
    id: "payment",
    title: "Gateway outage",
    dispatchLabel: "Simulate gateway timeout",
    story: "The card gateway times out. Cars must still enter while checkout reports a contained payment failure.",
    requiredArtifactIds: ["gateway", "charge"],
    success: "The card-charging class contained the provider failure, so the garage continued finding spaces for arriving cars.",
    failure: "Knowledge about the outside card provider lives in the garage code, so a payment outage stopped cars from entering.",
    beginnerGoal: "Let cars keep entering even when the outside card provider stops responding.",
    repairLesson: "The card-charging class owns the provider connection and the charge action, so payment trouble cannot freeze parking logic.",
    trace: ["The card charger contacts the outside provider", "The provider stops responding", "The card charger contains the failure", "The garage continues accepting cars"],
  },
];

export function createGaragePlacements(): GaragePlacements {
  return Object.fromEntries(GARAGE_ARTIFACTS.map((artifact) => [artifact.id, "lot"])) as GaragePlacements;
}

export function getGarageIncidentArtifacts(incident: GarageIncident): GarageArtifact[] {
  return incident.requiredArtifactIds.flatMap((artifactId) => {
    const artifact = GARAGE_ARTIFACTS.find((candidate) => candidate.id === artifactId);
    return artifact ? [artifact] : [];
  });
}

export function getGarageIncidentNodes(incident: GarageIncident): GarageNode[] {
  const ownerIds = new Set(getGarageIncidentArtifacts(incident).map((artifact) => artifact.referenceOwnerId));
  return GARAGE_NODES.filter((node) => ownerIds.has(node.id));
}

export function moveGarageArtifact(
  placements: GaragePlacements,
  artifactId: string,
  ownerId: GarageNodeId,
): GaragePlacements {
  if (!GARAGE_ARTIFACTS.some((artifact) => artifact.id === artifactId)) return placements;
  if (!GARAGE_NODES.some((node) => node.id === ownerId)) return placements;
  return { ...placements, [artifactId]: ownerId };
}

export function simulateGarageIncident(
  incident: GarageIncident,
  placements: GaragePlacements,
): GarageSimulation {
  const misplacedArtifactIds = incident.requiredArtifactIds.filter((artifactId) => {
    const artifact = GARAGE_ARTIFACTS.find((candidate) => candidate.id === artifactId);
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

export function garageArchitectureHealth(placements: GaragePlacements): {
  cohesion: number;
  coupling: number;
  correct: number;
  total: number;
} {
  const correct = GARAGE_ARTIFACTS.filter((artifact) => placements[artifact.id] === artifact.referenceOwnerId).length;
  const total = GARAGE_ARTIFACTS.length;
  const cohesion = Math.round((correct / total) * 100);
  return { cohesion, coupling: Math.max(0, total - correct), correct, total };
}

export function generateGarageJava(placements: GaragePlacements): string {
  return GARAGE_NODES.map((node) => {
    const artifacts = GARAGE_ARTIFACTS.filter((artifact) => placements[artifact.id] === node.id);
    const fields = artifacts.filter((artifact) => artifact.kind === "state");
    const methods = artifacts.filter((artifact) => artifact.kind === "behavior");
    const body = [
      ...fields.map((artifact) => `    private ${artifact.java};`),
      ...methods.flatMap((artifact) => [
        "",
        `    public ${artifact.java} {`,
        `        throw new UnsupportedOperationException("Implement ${artifact.label}");`,
        "    }",
      ]),
    ];
    return `class ${node.label} {\n${body.length ? body.join("\n") : "    // No responsibility installed."}\n}`;
  }).join("\n\n");
}

export function assessGarageDefense(answer: string): {
  score: number;
  ready: boolean;
  missing: string[];
} {
  const normalized = answer.toLowerCase();
  const checks = [
    { label: "Name concrete class owners", met: /(parkinglot|parkingspot|pricingpolicy|paymentservice|parkingticket)/.test(normalized) },
    { label: "Explain an owned responsibility or invariant", met: /(own|protect|coordinate|responsib|invariant|atomic)/.test(normalized) },
    { label: "Cite evidence from a simulation", met: /(race|outage|incident|simulation|double.book|oversized|overnight)/.test(normalized) },
    { label: "Name the future change that is contained", met: /(change|pricing|rate|gateway|provider|ev)/.test(normalized) },
    { label: "Reject the coupled or god-object alternative", met: /(coupl|god object|unrelated|instead|separat|leak)/.test(normalized) },
  ];
  const met = checks.filter((check) => check.met).length;
  return {
    score: met * 20,
    ready: met === checks.length && answer.trim().length >= 160,
    missing: checks.filter((check) => !check.met).map((check) => check.label),
  };
}
