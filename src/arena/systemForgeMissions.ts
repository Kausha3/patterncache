export const SYSTEM_FORGE_MISSION_IDS = ["parking-ev", "elevator-priority", "vending-refund"] as const;

export type SystemForgeMissionId = (typeof SYSTEM_FORGE_MISSION_IDS)[number];
export type ForgeWorldKind = "parking" | "elevator" | "vending";
export type ForgeComponentTone = "teal" | "amber" | "blue" | "green" | "red";
export type ForgeVerdict = "stable" | "strained" | "breach";

export interface ForgeRequirement {
  id: string;
  label: string;
  detail: string;
  status: "healthy" | "warning" | "mutation" | "unknown";
}

export interface ForgeComponent {
  id: string;
  label: string;
  tone: ForgeComponentTone;
  methods: string[];
  gridColumn: number;
  gridRow: number;
}

export interface ForgeOutcome {
  verdict: ForgeVerdict;
  summary: string;
  consequence: string;
  changeRadius: number;
  coupling: number;
  cohesion: number;
  testsPassing: number;
  testsTotal: number;
  flowStability: number;
  failures: number;
  pressure: Array<{ label: string; value: string; trend: "good" | "warning" | "bad" }>;
  evidence: string[];
}

export interface SystemForgeMission {
  id: SystemForgeMissionId;
  level: number;
  systemName: string;
  expansionName: string;
  mutation: string;
  mutationDetail: string;
  learning: {
    concept: string;
    plainEnglish: string;
    hint: string;
    interviewFrame: string;
  };
  world: ForgeWorldKind;
  goal: {
    maxChangeRadius: number;
    minFlowStability: number;
  };
  requirements: ForgeRequirement[];
  components: ForgeComponent[];
  responsibility: {
    id: string;
    label: string;
    initialOwnerId: string;
  };
  outcomes: Record<string, ForgeOutcome>;
  trace: string[];
  coachPrompt: string;
  coachingKeywords: string[];
}

const outcome = (
  overrides: Partial<ForgeOutcome> & Pick<ForgeOutcome, "verdict" | "summary" | "consequence">,
): ForgeOutcome => ({
  changeRadius: 4,
  coupling: 2.4,
  cohesion: 78,
  testsPassing: 14,
  testsTotal: 18,
  flowStability: 52,
  failures: 2,
  pressure: [],
  evidence: [],
  ...overrides,
});

export const SYSTEM_FORGE_MISSIONS: SystemForgeMission[] = [
  {
    id: "parking-ev",
    level: 3,
    systemName: "Parking Lot",
    expansionName: "EV Expansion",
    mutation: "EV drivers can charge while parked.",
    mutationDetail: "Add charging without changing entry, allocation, payment, or exit behavior.",
    learning: {
      concept: "Single Responsibility Principle",
      plainEnglish: "A class should have one focused reason to change. Charging rules belong with charging behavior, while the parking lot should keep coordinating spaces.",
      hint: "Look for the class that already knows about charging time and pricing rules.",
      interviewFrame: "I would place calculateChargingCost() in ChargingPolicy because it already owns charging time and pricing rules. This keeps ParkingLot focused on allocating spaces, so a new charging tariff does not change entry, allocation, or exit behavior.",
    },
    world: "parking",
    goal: { maxChangeRadius: 3, minFlowStability: 80 },
    requirements: [
      { id: "entry", label: "Entry flow healthy", detail: "Average gate wait: 4.2s", status: "healthy" },
      { id: "allocation", label: "Allocation slows near capacity", detail: "Level 2 is almost full", status: "warning" },
      { id: "payment", label: "Payments working", detail: "No duplicate fees detected", status: "healthy" },
      { id: "exit", label: "Exit can jam", detail: "Charging fee touches final billing", status: "warning" },
      { id: "mutation", label: "New mutation incoming", detail: "EV drivers can charge while parked", status: "mutation" },
      { id: "grace", label: "Grace-period rules", detail: "Not discovered yet", status: "unknown" },
    ],
    components: [
      { id: "entry-gate", label: "EntryGate", tone: "teal", methods: ["issueTicket(vehicle)", "openGate()"], gridColumn: 1, gridRow: 1 },
      { id: "ticket", label: "Ticket", tone: "amber", methods: ["ticketId", "entryTime", "vehicleType"], gridColumn: 2, gridRow: 1 },
      { id: "exit-gate", label: "ExitGate", tone: "teal", methods: ["validate(ticket)", "collectPayment()"], gridColumn: 3, gridRow: 1 },
      { id: "pricing-policy", label: "PricingPolicy", tone: "blue", methods: ["calculateFee(ticket)", "validatePayment()"], gridColumn: 1, gridRow: 2 },
      { id: "parking-lot", label: "ParkingLot", tone: "red", methods: ["allocateSpot(ticket)", "findAvailableSpot()", "validateRules()"], gridColumn: 2, gridRow: 2 },
      { id: "charging-policy", label: "ChargingPolicy", tone: "green", methods: ["estimateChargeTime()", "pricingRules()"], gridColumn: 3, gridRow: 2 },
      { id: "floor", label: "Floor", tone: "amber", methods: ["floorId", "getAvailableSpots()"], gridColumn: 1, gridRow: 3 },
      { id: "spot", label: "Spot", tone: "red", methods: ["spotId", "isOccupied", "vehicleType"], gridColumn: 2, gridRow: 3 },
    ],
    responsibility: { id: "charging-cost", label: "calculateChargingCost()", initialOwnerId: "parking-lot" },
    outcomes: {
      "parking-lot": outcome({
        verdict: "breach",
        summary: "The lot coordinates too many reasons to change.",
        consequence: "Exit jammed · billing waits on parking coordination",
        evidence: ["ParkingLot owns allocation, rules, and charging price", "Four components change when pricing changes"],
        pressure: [
          { label: "Entry queue", value: "12", trend: "warning" },
          { label: "Exit queue", value: "18", trend: "bad" },
          { label: "Occupancy", value: "78%", trend: "good" },
          { label: "Power load", value: "63%", trend: "good" },
        ],
      }),
      "charging-policy": outcome({
        verdict: "stable",
        summary: "Charging changes are isolated behind a focused policy.",
        consequence: "Flow recovered · EV billing evolves independently",
        changeRadius: 2,
        coupling: 1.4,
        cohesion: 94,
        testsPassing: 18,
        testsTotal: 18,
        flowStability: 96,
        failures: 0,
        evidence: ["ChargingPolicy owns charging price and time", "ParkingLot only coordinates spot allocation", "New pricing modes affect two components"],
        pressure: [
          { label: "Entry queue", value: "4", trend: "good" },
          { label: "Exit queue", value: "3", trend: "good" },
          { label: "Occupancy", value: "81%", trend: "good" },
          { label: "Power load", value: "71%", trend: "warning" },
        ],
      }),
      "pricing-policy": outcome({
        verdict: "stable",
        summary: "A shared pricing strategy is valid when all fees change together.",
        consequence: "Flow stable · pricing stays centralized with a wider change radius",
        changeRadius: 3,
        coupling: 1.8,
        cohesion: 88,
        testsPassing: 17,
        testsTotal: 18,
        flowStability: 86,
        failures: 0,
        evidence: ["PricingPolicy already owns monetary rules", "Charging-time behavior remains separate", "Trade-off: one broader pricing abstraction"],
        pressure: [
          { label: "Entry queue", value: "5", trend: "good" },
          { label: "Exit queue", value: "6", trend: "warning" },
          { label: "Occupancy", value: "80%", trend: "good" },
          { label: "Power load", value: "69%", trend: "good" },
        ],
      }),
      "ticket": outcome({
        verdict: "strained",
        summary: "The data record now contains business policy.",
        consequence: "Duplicate charge risk · ticket changes for every pricing rule",
        changeRadius: 4,
        coupling: 2.7,
        cohesion: 61,
        testsPassing: 13,
        testsTotal: 18,
        flowStability: 68,
        failures: 1,
        evidence: ["Ticket mixes state with mutable billing behavior", "Payment and charging tests now depend on ticket internals"],
      }),
    },
    trace: ["Entry", "Allocate", "Park", "Charge", "Pay", "Exit"],
    coachPrompt: "Why did you isolate charging here?",
    coachingKeywords: ["responsibility", "change", "coupling", "cohesion", "policy", "pricing", "test", "extend"],
  },
  {
    id: "elevator-priority",
    level: 4,
    systemName: "Elevator",
    expansionName: "Priority Dispatch",
    mutation: "Emergency calls must preempt normal traffic.",
    mutationDetail: "Add priority dispatch without coupling cars, panels, and requests to one scheduling rule.",
    learning: {
      concept: "Strategy Pattern",
      plainEnglish: "Scheduling rules change independently from elevator movement. Keeping the rule in one scheduler lets the controller coordinate without knowing every algorithm.",
      hint: "Look for the class that already chooses a car and rebalances requests.",
      interviewFrame: "I would place prioritizeEmergency() in Scheduler because it already selects cars and balances requests. ElevatorController can keep coordinating fleet state while a new dispatch strategy changes without modifying cars, panels, or request data.",
    },
    world: "elevator",
    goal: { maxChangeRadius: 3, minFlowStability: 82 },
    requirements: [
      { id: "hall", label: "Hall requests flowing", detail: "P95 wait: 24s", status: "healthy" },
      { id: "capacity", label: "Rush-hour pressure", detail: "Six cars · forty floors", status: "warning" },
      { id: "safety", label: "Door safety isolated", detail: "Obstruction sensor healthy", status: "healthy" },
      { id: "mutation", label: "Priority mode incoming", detail: "Emergency calls preempt normal traffic", status: "mutation" },
      { id: "maintenance", label: "Maintenance behavior", detail: "Not discovered yet", status: "unknown" },
    ],
    components: [
      { id: "hall-panel", label: "HallPanel", tone: "teal", methods: ["request(direction)", "showStatus()"], gridColumn: 1, gridRow: 1 },
      { id: "request", label: "Request", tone: "amber", methods: ["floor", "direction", "priority"], gridColumn: 2, gridRow: 1 },
      { id: "car-panel", label: "CarPanel", tone: "teal", methods: ["selectFloor()", "openDoor()"], gridColumn: 3, gridRow: 1 },
      { id: "scheduler", label: "Scheduler", tone: "green", methods: ["selectCar(request)", "rebalance()"], gridColumn: 1, gridRow: 2 },
      { id: "controller", label: "ElevatorController", tone: "red", methods: ["assignRequest()", "trackFleet()", "publishState()"], gridColumn: 2, gridRow: 2 },
      { id: "elevator-car", label: "ElevatorCar", tone: "blue", methods: ["move()", "executeStops()"], gridColumn: 3, gridRow: 2 },
      { id: "door", label: "Door", tone: "amber", methods: ["open()", "close()", "isObstructed()"], gridColumn: 2, gridRow: 3 },
    ],
    responsibility: { id: "priority-dispatch", label: "prioritizeEmergency()", initialOwnerId: "controller" },
    outcomes: {
      controller: outcome({
        verdict: "breach",
        summary: "The controller coordinates state and owns scheduling policy.",
        consequence: "Normal calls starve · fleet updates block dispatch",
        evidence: ["Controller changes for every dispatch strategy", "Fleet state and policy tests are entangled"],
        pressure: [
          { label: "P95 wait", value: "41s", trend: "bad" },
          { label: "Emergency", value: "12s", trend: "warning" },
          { label: "Load factor", value: "82%", trend: "warning" },
          { label: "Starved calls", value: "7", trend: "bad" },
        ],
      }),
      scheduler: outcome({
        verdict: "stable",
        summary: "Priority is one replaceable scheduling strategy.",
        consequence: "Emergency response improves · normal fairness remains testable",
        changeRadius: 2,
        coupling: 1.5,
        cohesion: 93,
        testsPassing: 18,
        testsTotal: 18,
        flowStability: 95,
        failures: 0,
        evidence: ["Scheduler owns dispatch decisions", "Controller coordinates without knowing the algorithm", "Fairness and priority can be tested in isolation"],
        pressure: [
          { label: "P95 wait", value: "22s", trend: "good" },
          { label: "Emergency", value: "4s", trend: "good" },
          { label: "Load factor", value: "76%", trend: "good" },
          { label: "Starved calls", value: "0", trend: "good" },
        ],
      }),
      request: outcome({
        verdict: "strained",
        summary: "Priority data belongs on a request; dispatch behavior does not.",
        consequence: "Requests compare themselves · scheduling variants leak into data",
        changeRadius: 4,
        coupling: 2.5,
        cohesion: 64,
        testsPassing: 14,
        testsTotal: 18,
        flowStability: 70,
        failures: 1,
        evidence: ["Request should describe demand", "Self-scheduling requests depend on fleet state"],
      }),
      "elevator-car": outcome({
        verdict: "strained",
        summary: "Each car makes a locally reasonable but globally weak choice.",
        consequence: "Cars race for emergency calls · normal floors are skipped",
        changeRadius: 5,
        coupling: 2.9,
        cohesion: 58,
        testsPassing: 12,
        testsTotal: 18,
        flowStability: 61,
        failures: 2,
        evidence: ["Cars need fleet-wide knowledge", "Priority behavior is duplicated across every car"],
      }),
    },
    trace: ["Request", "Queue", "Prioritize", "Assign", "Move", "Arrive"],
    coachPrompt: "Why is priority dispatch owned by this component?",
    coachingKeywords: ["schedule", "strategy", "responsibility", "fleet", "change", "fairness", "test", "coupling"],
  },
  {
    id: "vending-refund",
    level: 2,
    systemName: "Vending Machine",
    expansionName: "Refund Recovery",
    mutation: "A failed dispense must refund the exact payment.",
    mutationDetail: "Recover money safely without teaching inventory, selection, and hardware about payment internals.",
    learning: {
      concept: "Information Expert",
      plainEnglish: "Behavior belongs near the information it needs. Refund logic should live close to captured payment state instead of leaking money rules into hardware or inventory.",
      hint: "Look for the class that already authorizes and captures the payment.",
      interviewFrame: "I would place refundCapturedPayment() in PaymentService because it owns the capture state and payment ID. This makes retries idempotent while Inventory and Dispenser stay focused on stock and hardware instead of learning payment-provider rules.",
    },
    world: "vending",
    goal: { maxChangeRadius: 3, minFlowStability: 85 },
    requirements: [
      { id: "selection", label: "Selection accepted", detail: "Product is available", status: "healthy" },
      { id: "payment", label: "Payment authorized", detail: "$2.25 captured", status: "healthy" },
      { id: "hardware", label: "Dispenser can fail", detail: "Motor timeout detected", status: "warning" },
      { id: "mutation", label: "Refund recovery incoming", detail: "Return the exact captured amount", status: "mutation" },
      { id: "partial", label: "Partial refunds", detail: "Not discovered yet", status: "unknown" },
    ],
    components: [
      { id: "display", label: "Display", tone: "teal", methods: ["showPrice()", "showError()"], gridColumn: 1, gridRow: 1 },
      { id: "selection", label: "Selection", tone: "amber", methods: ["productId", "quantity"], gridColumn: 2, gridRow: 1 },
      { id: "dispenser", label: "Dispenser", tone: "red", methods: ["dispense()", "motorStatus()"], gridColumn: 3, gridRow: 1 },
      { id: "inventory", label: "Inventory", tone: "blue", methods: ["reserve()", "release()", "inStock()"], gridColumn: 1, gridRow: 2 },
      { id: "machine", label: "VendingMachine", tone: "red", methods: ["selectProduct()", "coordinateSale()", "completeSale()"], gridColumn: 2, gridRow: 2 },
      { id: "payment-service", label: "PaymentService", tone: "green", methods: ["authorize()", "capture()", "paymentId"], gridColumn: 3, gridRow: 2 },
      { id: "transaction", label: "Transaction", tone: "amber", methods: ["amount", "status", "paymentId"], gridColumn: 2, gridRow: 3 },
    ],
    responsibility: { id: "exact-refund", label: "refundCapturedPayment()", initialOwnerId: "machine" },
    outcomes: {
      machine: outcome({
        verdict: "breach",
        summary: "The machine coordinates the sale and owns payment recovery.",
        consequence: "Refund retries duplicate · inventory stays reserved",
        evidence: ["VendingMachine changes with payment providers", "Recovery competes with sale coordination"],
        pressure: [
          { label: "Refund time", value: "18s", trend: "bad" },
          { label: "Duplicate risk", value: "High", trend: "bad" },
          { label: "Stock lock", value: "2", trend: "warning" },
          { label: "Recovery", value: "54%", trend: "bad" },
        ],
      }),
      "payment-service": outcome({
        verdict: "stable",
        summary: "Payment recovery stays with the component that owns capture state.",
        consequence: "Refund idempotent · inventory release completes",
        changeRadius: 2,
        coupling: 1.3,
        cohesion: 95,
        testsPassing: 18,
        testsTotal: 18,
        flowStability: 97,
        failures: 0,
        evidence: ["PaymentService owns authorization and capture", "Refunds reuse the provider transaction id", "The machine only coordinates success or failure"],
        pressure: [
          { label: "Refund time", value: "2s", trend: "good" },
          { label: "Duplicate risk", value: "None", trend: "good" },
          { label: "Stock lock", value: "0", trend: "good" },
          { label: "Recovery", value: "98%", trend: "good" },
        ],
      }),
      transaction: outcome({
        verdict: "stable",
        summary: "A transaction can own refund intent when a payment gateway executes it.",
        consequence: "Recovery stable · transaction lifecycle is explicit",
        changeRadius: 3,
        coupling: 1.9,
        cohesion: 87,
        testsPassing: 17,
        testsTotal: 18,
        flowStability: 89,
        failures: 0,
        evidence: ["Transaction owns payment lifecycle state", "Gateway details still stay in PaymentService", "Trade-off: richer domain transaction"],
        pressure: [
          { label: "Refund time", value: "4s", trend: "good" },
          { label: "Duplicate risk", value: "Low", trend: "warning" },
          { label: "Stock lock", value: "0", trend: "good" },
          { label: "Recovery", value: "92%", trend: "good" },
        ],
      }),
      dispenser: outcome({
        verdict: "strained",
        summary: "The hardware detects failure but should not understand money.",
        consequence: "Device driver imports payment logic · hardware tests become brittle",
        changeRadius: 5,
        coupling: 3.1,
        cohesion: 55,
        testsPassing: 11,
        testsTotal: 18,
        flowStability: 60,
        failures: 2,
        evidence: ["Dispenser should report a mechanical outcome", "Payment provider logic leaks into hardware"],
      }),
    },
    trace: ["Select", "Authorize", "Reserve", "Dispense", "Recover", "Release"],
    coachPrompt: "Why should refund recovery live here?",
    coachingKeywords: ["payment", "capture", "responsibility", "idempotent", "change", "transaction", "test", "coupling"],
  },
];

export function getSystemForgeMission(id: string): SystemForgeMission | undefined {
  return SYSTEM_FORGE_MISSIONS.find((mission) => mission.id === id);
}
