import type { LldStudioMissionId } from "./types";

export interface LldStudioType {
  id: string;
  name: string;
  kind: "class" | "interface";
  role: string;
  fields: string[];
}

export interface LldStudioResponsibility {
  id: string;
  label: string;
  signature: string;
  correctOwnerId: string;
  why: string;
  riskIfMisplaced: string;
}

export interface LldStudioRelationship {
  id: string;
  fromId: string;
  toId: string;
  label: string;
}

export interface LldStudioMutationOption {
  id: string;
  label: string;
  correct: boolean;
  feedback: string;
}

export interface LldStudioMutation {
  id: string;
  title: string;
  scenario: string;
  pressure: "new behavior" | "new state" | "external failure" | "policy change";
  options: LldStudioMutationOption[];
}

export type LldStudioDefenseOption = LldStudioMutationOption;

export interface LldStudioMission {
  id: LldStudioMissionId;
  title: string;
  domain: string;
  difficulty: "Foundation" | "Interview" | "Bar raiser";
  minutes: number;
  prompt: string;
  objective: string;
  types: LldStudioType[];
  responsibilities: LldStudioResponsibility[];
  relationships: LldStudioRelationship[];
  mutations: LldStudioMutation[];
  defense: {
    prompt: string;
    options: LldStudioDefenseOption[];
  };
}

export const LLD_STUDIO_MISSIONS: LldStudioMission[] = [
  {
    id: "parking-model",
    title: "Parking Lot Ownership",
    domain: "Aggregate boundaries and invariant ownership",
    difficulty: "Foundation",
    minutes: 30,
    prompt: "Design the core model for a multi-level parking lot that assigns compatible spots, issues tickets, calculates fees, and accepts payment.",
    objective: "Keep orchestration at the aggregate boundary while the object holding each invariant protects its own state.",
    types: [
      { id: "lot", name: "ParkingLot", kind: "class", role: "Coordinates allocation across levels", fields: ["List<Level> levels"] },
      { id: "level", name: "Level", kind: "class", role: "Searches the spots it contains", fields: ["List<ParkingSpot> spots"] },
      { id: "spot", name: "ParkingSpot", kind: "class", role: "Protects occupancy and compatibility", fields: ["SpotType type", "Vehicle currentVehicle"] },
      { id: "ticket", name: "ParkingTicket", kind: "class", role: "Captures one parking session", fields: ["String id", "Instant entryTime", "ParkingSpot spot"] },
      { id: "pricing", name: "PricingPolicy", kind: "interface", role: "Varies fee calculation independently", fields: [] },
      { id: "payment", name: "PaymentService", kind: "class", role: "Owns the external charging boundary", fields: ["PaymentGateway gateway"] },
    ],
    responsibilities: [
      {
        id: "park",
        label: "Coordinate a vehicle across levels and issue a ticket",
        signature: "ParkingTicket park(Vehicle vehicle)",
        correctOwnerId: "lot",
        why: "ParkingLot can see every Level and coordinates the aggregate-wide transaction without mutating child state directly.",
        riskIfMisplaced: "A child object would need knowledge of sibling levels or ticket creation, expanding its boundary.",
      },
      {
        id: "find-spot",
        label: "Find a compatible available spot within one level",
        signature: "Optional<ParkingSpot> findSpot(Vehicle vehicle)",
        correctOwnerId: "level",
        why: "Level owns the collection being searched and can change its internal indexing without affecting ParkingLot.",
        riskIfMisplaced: "ParkingLot would reach through Level and become coupled to its storage and search strategy.",
      },
      {
        id: "assign",
        label: "Validate compatibility and mutate occupancy",
        signature: "void assign(Vehicle vehicle)",
        correctOwnerId: "spot",
        why: "ParkingSpot owns currentVehicle and type, so it is the only object that can enforce the occupancy invariant atomically.",
        riskIfMisplaced: "External mutation can double-assign a spot or bypass size compatibility.",
      },
      {
        id: "duration",
        label: "Calculate the duration of this parking session",
        signature: "Duration durationAt(Instant exitTime)",
        correctOwnerId: "ticket",
        why: "ParkingTicket owns the session entry timestamp and represents the lifecycle being measured.",
        riskIfMisplaced: "A service would need to pull timestamp data out of the ticket and duplicate session rules.",
      },
      {
        id: "fee",
        label: "Calculate a fee from a ticket and exit time",
        signature: "Money calculateFee(ParkingTicket ticket, Instant exitTime)",
        correctOwnerId: "pricing",
        why: "Pricing is a replaceable policy; the parking aggregate should depend on its contract, not encode every pricing branch.",
        riskIfMisplaced: "Peak, weekend, airport, and event pricing become a growing conditional inside a stable domain class.",
      },
      {
        id: "charge",
        label: "Charge a payment method for a closed ticket",
        signature: "Receipt pay(ParkingTicket ticket, PaymentMethod method)",
        correctOwnerId: "payment",
        why: "PaymentService isolates retries, gateway failures, and idempotency at the external money boundary.",
        riskIfMisplaced: "ParkingLot becomes coupled to gateway APIs and payment failure handling.",
      },
    ],
    relationships: [
      { id: "lot-level", fromId: "lot", toId: "level", label: "contains many" },
      { id: "level-spot", fromId: "level", toId: "spot", label: "contains many" },
      { id: "ticket-spot", fromId: "ticket", toId: "spot", label: "records assigned" },
      { id: "payment-pricing", fromId: "payment", toId: "pricing", label: "uses fee contract" },
    ],
    mutations: [
      {
        id: "ev-charging",
        title: "EV charging arrives",
        scenario: "Some spots now provide charging with different connector capabilities. Standard allocation must keep working unchanged.",
        pressure: "new behavior",
        options: [
          { id: "capability", label: "Model SpotCapability and let compatibility policies evaluate vehicle needs against spot capabilities", correct: true, feedback: "Correct. A new capability composes with ParkingSpot without teaching ParkingLot a new vehicle-type branch." },
          { id: "lot-if", label: "Add an EV if/else branch to ParkingLot.park()", correct: false, feedback: "That makes the aggregate coordinator change for every future spot capability." },
          { id: "ev-lot", label: "Create a separate EvParkingLot with a copied allocation flow", correct: false, feedback: "Duplicating the aggregate splits capacity truth and guarantees the two allocation flows drift." },
        ],
      },
      {
        id: "reservation-expiry",
        title: "Reservations can expire",
        scenario: "Drivers may reserve a spot for ten minutes before arrival, and expired capacity must become available automatically.",
        pressure: "new state",
        options: [
          { id: "reservation", label: "Introduce Reservation with its own status/expiry and make allocation consult active reservations", correct: true, feedback: "Correct. Reservation owns its lifecycle; the lot coordinates it without overloading ParkingTicket." },
          { id: "ticket-null", label: "Reuse ParkingTicket with a nullable entryTime and infer reservation state", correct: false, feedback: "A nullable field creates implicit states and lets invalid combinations leak through the model." },
          { id: "sleep", label: "Have ParkingLot sleep for ten minutes and then release the spot", correct: false, feedback: "Blocking a domain object is not durable scheduling and fails across restarts." },
        ],
      },
      {
        id: "surge-pricing",
        title: "Event surge pricing",
        scenario: "Pricing changes by venue event, time window, and membership without changing parking or payment behavior.",
        pressure: "policy change",
        options: [
          { id: "compose-policy", label: "Add composable PricingPolicy implementations selected from pricing context", correct: true, feedback: "Correct. The existing policy boundary absorbs the change while the rest of the model stays stable." },
          { id: "ticket-switch", label: "Add event and membership switches to ParkingTicket.durationAt()", correct: false, feedback: "Duration is session data, not pricing policy; this destroys cohesion." },
          { id: "payment-rules", label: "Put pricing branches inside PaymentService.pay()", correct: false, feedback: "Payment should charge a decided amount, not own the business rules that decide it." },
        ],
      },
    ],
    defense: {
      prompt: "Which sentence best defends the boundary between ParkingLot and its child objects?",
      options: [
        { id: "coordinate-protect", label: "ParkingLot coordinates across objects; each child protects the invariant stored with its own data", correct: true, feedback: "Correct. Aggregate orchestration and local invariant ownership remain separate." },
        { id: "centralize-all", label: "ParkingLot should own every mutation because centralized code is always easier to maintain", correct: false, feedback: "A central god object has high knowledge, low cohesion, and bypasses child invariants." },
        { id: "no-coordinator", label: "Every object should work independently, so no aggregate coordinator is necessary", correct: false, feedback: "Cross-level allocation and ticket creation still require an explicit orchestration boundary." },
      ],
    },
  },
  {
    id: "coupon-policies",
    title: "Coupon Policy Engine",
    domain: "Composition over conditional explosion",
    difficulty: "Interview",
    minutes: 35,
    prompt: "Design a coupon engine supporting fixed, percentage, and promotional discounts with independent eligibility and redemption rules.",
    objective: "Separate independently changing policies while keeping checkout orchestration readable and auditable.",
    types: [
      { id: "coupon", name: "Coupon", kind: "class", role: "Owns identity and lifecycle", fields: ["String code", "CouponStatus status", "Instant expiresAt"] },
      { id: "engine", name: "CouponEngine", kind: "class", role: "Coordinates evaluation", fields: ["RedemptionLedger ledger"] },
      { id: "discount", name: "DiscountPolicy", kind: "interface", role: "Calculates one discount behavior", fields: [] },
      { id: "eligibility", name: "EligibilityPolicy", kind: "interface", role: "Evaluates whether context qualifies", fields: [] },
      { id: "ledger", name: "RedemptionLedger", kind: "class", role: "Protects redemption limits", fields: ["RedemptionRepository repository"] },
      { id: "cart", name: "Cart", kind: "class", role: "Owns line items and totals", fields: ["List<CartItem> items"] },
    ],
    responsibilities: [
      { id: "activate", label: "Activate or expire the coupon lifecycle", signature: "void transitionTo(CouponStatus next)", correctOwnerId: "coupon", why: "Coupon owns status and expiry, so lifecycle transitions belong beside the state they protect.", riskIfMisplaced: "External services can create illegal lifecycle jumps or disagree about expiry." },
      { id: "apply", label: "Coordinate eligibility, discount calculation, and redemption", signature: "DiscountResult apply(Coupon coupon, Cart cart, Customer customer)", correctOwnerId: "engine", why: "CouponEngine sequences independent policies and the ledger without absorbing their detailed rules.", riskIfMisplaced: "A policy becomes coupled to checkout orchestration, storage, and unrelated policy axes." },
      { id: "calculate", label: "Calculate the monetary discount", signature: "Money calculate(Cart cart, Coupon coupon)", correctOwnerId: "discount", why: "DiscountPolicy is the replaceable strategy for fixed, percentage, and BOGO calculations.", riskIfMisplaced: "Every promotion type adds another central switch branch." },
      { id: "qualifies", label: "Evaluate customer and cart qualification", signature: "boolean isEligible(Customer customer, Cart cart, Coupon coupon)", correctOwnerId: "eligibility", why: "Eligibility varies independently from discount math and belongs behind its own contract.", riskIfMisplaced: "VIP, category, geography, and minimum-spend rules become tangled with calculation." },
      { id: "redeem", label: "Atomically enforce and record redemption limits", signature: "void recordRedemption(String couponId, String customerId)", correctOwnerId: "ledger", why: "RedemptionLedger owns durable usage truth and can enforce uniqueness atomically.", riskIfMisplaced: "Check-then-write races allow a one-use coupon to be redeemed twice." },
      { id: "subtotal", label: "Calculate the cart subtotal from line items", signature: "Money subtotal()", correctOwnerId: "cart", why: "Cart owns its line items, so its derived total should not be reconstructed elsewhere.", riskIfMisplaced: "Policies duplicate cart arithmetic and couple themselves to storage details." },
    ],
    relationships: [
      { id: "engine-coupon", fromId: "engine", toId: "coupon", label: "evaluates" },
      { id: "engine-discount", fromId: "engine", toId: "discount", label: "delegates calculation" },
      { id: "engine-eligibility", fromId: "engine", toId: "eligibility", label: "delegates qualification" },
      { id: "engine-ledger", fromId: "engine", toId: "ledger", label: "records use" },
    ],
    mutations: [
      {
        id: "bogo",
        title: "Buy-one-get-one promotion",
        scenario: "A promotion discounts the cheapest eligible item for every qualifying pair.",
        pressure: "new behavior",
        options: [
          { id: "new-strategy", label: "Add BogoDiscountPolicy implementing the existing calculation contract", correct: true, feedback: "Correct. New math is a new strategy; orchestration and eligibility remain unchanged." },
          { id: "engine-branch", label: "Add a BOGO branch inside CouponEngine.apply()", correct: false, feedback: "The engine becomes a catalog of every promotion instead of a stable coordinator." },
          { id: "cart-bogo", label: "Teach Cart.subtotal() about coupon codes", correct: false, feedback: "Cart totals should not depend on an external promotion mechanism." },
        ],
      },
      {
        id: "stacking",
        title: "Coupon stacking rules",
        scenario: "Marketing wants some coupons combinable, some mutually exclusive, and some limited by discount category.",
        pressure: "policy change",
        options: [
          { id: "stack-policy", label: "Introduce CombinationPolicy that evaluates a set of candidate coupons before application", correct: true, feedback: "Correct. Cross-coupon compatibility is its own policy axis, separate from single-coupon calculation." },
          { id: "coupon-flag", label: "Add one boolean stackable flag and assume all future rules fit", correct: false, feedback: "A boolean cannot express categories, pairwise exclusions, or maximum stack depth." },
          { id: "checkout-if", label: "Hard-code allowed code combinations in Checkout", correct: false, feedback: "Checkout should consume a discount result, not become the promotion rule engine." },
        ],
      },
      {
        id: "concurrent-redemption",
        title: "Concurrent last redemption",
        scenario: "Two checkout requests race for the final remaining redemption of the same coupon.",
        pressure: "external failure",
        options: [
          { id: "atomic-ledger", label: "Make RedemptionLedger reserve/record usage atomically with a uniqueness or conditional-write constraint", correct: true, feedback: "Correct. The durable owner of redemption truth must make the limit race-safe." },
          { id: "engine-lock", label: "Use an in-memory synchronized block in each CouponEngine process", correct: false, feedback: "Process-local locks do not coordinate multiple application instances or survive restarts." },
          { id: "best-effort", label: "Check the count first and accept rare over-redemption", correct: false, feedback: "A stated redemption limit is a correctness invariant, not a best-effort metric." },
        ],
      },
    ],
    defense: {
      prompt: "Why are DiscountPolicy and EligibilityPolicy separate interfaces instead of one CouponStrategy?",
      options: [
        { id: "independent-axes", label: "Calculation and eligibility vary independently, so separating them prevents combinatorial subclasses and enables composition", correct: true, feedback: "Correct. Independent axes of change should remain independently composable." },
        { id: "more-types", label: "More interfaces always make a design more object-oriented", correct: false, feedback: "Types are justified by change boundaries, not by maximizing class count." },
        { id: "performance", label: "Two interfaces make discount calculation asymptotically faster", correct: false, feedback: "The benefit is extensibility and cohesion, not algorithmic complexity." },
      ],
    },
  },
  {
    id: "vending-recovery",
    title: "Vending Failure Recovery",
    domain: "State machines and compensating actions",
    difficulty: "Bar raiser",
    minutes: 40,
    prompt: "Design a vending-machine purchase flow that keeps payment, inventory, hardware dispensing, and transaction state consistent under failure.",
    objective: "Make invalid transitions impossible and give every external side effect an explicit recovery path.",
    types: [
      { id: "machine", name: "VendingMachine", kind: "class", role: "Coordinates the purchase use case", fields: ["Inventory inventory", "MachineState state"] },
      { id: "inventory", name: "Inventory", kind: "class", role: "Owns product availability", fields: ["Map<String, StockItem> stock"] },
      { id: "transaction", name: "Transaction", kind: "class", role: "Records one purchase lifecycle", fields: ["String id", "Money amount", "TransactionStatus status"] },
      { id: "payment", name: "PaymentGateway", kind: "interface", role: "Defines capture and refund side effects", fields: [] },
      { id: "dispenser", name: "Dispenser", kind: "interface", role: "Defines the hardware delivery boundary", fields: [] },
      { id: "state", name: "MachineState", kind: "class", role: "Guards legal action sequences", fields: ["StateName current"] },
    ],
    responsibilities: [
      { id: "purchase", label: "Coordinate reserve, payment, dispense, and compensation", signature: "PurchaseResult purchase(String code, PaymentMethod method)", correctOwnerId: "machine", why: "VendingMachine is the application-level coordinator that can see every participant without stealing their invariants.", riskIfMisplaced: "A narrow domain object becomes coupled to payment, hardware, and transaction orchestration." },
      { id: "reserve", label: "Atomically reserve one product by selection code", signature: "ProductReservation reserve(String code)", correctOwnerId: "inventory", why: "Inventory owns available stock and must make the decrement/reservation invariant atomic.", riskIfMisplaced: "Check-then-decrement races can oversell the last item." },
      { id: "mark", label: "Record a legal transaction status transition", signature: "void mark(TransactionStatus next)", correctOwnerId: "transaction", why: "Transaction owns the auditable purchase lifecycle and validates its own state changes.", riskIfMisplaced: "Payment and delivery can disagree about whether a transaction completed or failed." },
      { id: "capture", label: "Capture or refund money using an idempotency key", signature: "PaymentResult capture(Money amount, String idempotencyKey)", correctOwnerId: "payment", why: "PaymentGateway is the explicit external money boundary and owns retry-safe side-effect semantics.", riskIfMisplaced: "Machine logic becomes coupled to provider details and duplicate-charge behavior." },
      { id: "dispense", label: "Attempt hardware delivery and report a typed outcome", signature: "DispenseResult dispense(ProductReservation reservation)", correctOwnerId: "dispenser", why: "Dispenser encapsulates unreliable hardware and reports success/failure without deciding business compensation.", riskIfMisplaced: "Hardware details leak into the transaction model or inventory." },
      { id: "transition", label: "Reject actions that are illegal in the current machine state", signature: "void transitionTo(StateName next)", correctOwnerId: "state", why: "MachineState exists specifically to centralize valid transitions and prevent overlapping purchases.", riskIfMisplaced: "Every caller repeats partial state checks and invalid action sequences slip through." },
    ],
    relationships: [
      { id: "machine-inventory", fromId: "machine", toId: "inventory", label: "reserves from" },
      { id: "machine-state", fromId: "machine", toId: "state", label: "guarded by" },
      { id: "machine-payment", fromId: "machine", toId: "payment", label: "captures/refunds" },
      { id: "machine-dispenser", fromId: "machine", toId: "dispenser", label: "requests delivery" },
      { id: "machine-transaction", fromId: "machine", toId: "transaction", label: "records outcome" },
    ],
    mutations: [
      {
        id: "jam",
        title: "Dispenser jams after capture",
        scenario: "Payment succeeds, but the hardware reports that the product did not drop.",
        pressure: "external failure",
        options: [
          { id: "compensate", label: "Mark delivery failed, refund with the transaction idempotency key, and release inventory reservation", correct: true, feedback: "Correct. The explicit failure state drives compensating actions and restores customer/inventory invariants." },
          { id: "complete", label: "Mark complete because the payment side effect already succeeded", correct: false, feedback: "A completed charge without delivery violates the central purchase invariant." },
          { id: "retry-forever", label: "Keep the machine in DISPENSING and retry forever", correct: false, feedback: "Unbounded retry traps the machine and customer in a permanent intermediate state." },
        ],
      },
      {
        id: "callback-loss",
        title: "Payment response is lost",
        scenario: "The gateway captured funds, but the network timed out before VendingMachine received the response.",
        pressure: "external failure",
        options: [
          { id: "idempotent-query", label: "Retry/query using the same transaction idempotency key and converge on the stored payment result", correct: true, feedback: "Correct. Ambiguous network outcomes require a stable operation identity, not a new charge." },
          { id: "new-charge", label: "Generate a new payment request and charge again", correct: false, feedback: "A new identity can double-charge the customer after an ambiguous timeout." },
          { id: "assume-failed", label: "Assume every timeout means payment failed and release the product", correct: false, feedback: "The side effect may have succeeded; assuming failure loses money and corrupts transaction truth." },
        ],
      },
      {
        id: "new-hardware",
        title: "Multiple dispenser models",
        scenario: "A new machine model uses a conveyor instead of a coil and returns richer sensor telemetry.",
        pressure: "new behavior",
        options: [
          { id: "adapter", label: "Add a Dispenser implementation/adapter that maps the new hardware result to DispenseResult", correct: true, feedback: "Correct. The purchase flow remains stable behind the existing hardware boundary." },
          { id: "machine-switch", label: "Add a hardware-model switch to VendingMachine.purchase()", correct: false, feedback: "The coordinator becomes coupled to every device implementation and telemetry format." },
          { id: "transaction-hardware", label: "Put conveyor control methods on Transaction", correct: false, feedback: "Transaction records business lifecycle; it should not control physical hardware." },
        ],
      },
    ],
    defense: {
      prompt: "Why should Inventory reserve before payment but decrement permanently only after successful dispense?",
      options: [
        { id: "two-invariants", label: "Reservation prevents concurrent oversell, while delayed commit lets failure compensation restore availability without inventing stock", correct: true, feedback: "Correct. The two-stage inventory transition protects both concurrency and recovery." },
        { id: "faster", label: "It makes the payment gateway respond faster", correct: false, feedback: "Inventory transition order protects correctness; it does not change gateway latency." },
        { id: "no-refund", label: "It removes the need to model refunds", correct: false, feedback: "Payment can still succeed before hardware fails, so refund remains a required compensation." },
      ],
    },
  },
];

export function getLldStudioMission(id: string): LldStudioMission | undefined {
  return LLD_STUDIO_MISSIONS.find((mission) => mission.id === id);
}
