import type { LLDLesson } from "@/types";

export const vendingMachine: LLDLesson = {
  id: "vending-machine",
  track: "lld",
  title: "Design a Vending Machine",
  blurb: "State machine modeling — inventory, payment, dispensing, refunds.",
  estMinutes: 8,
  overview:
    "A vending machine is the canonical state-machine LLD prompt: a purchase moves through idle → selecting → dispensing, and the interesting design decision is making bad sequences — like starting a second purchase mid-dispense — impossible by construction, not just handled with an if-check after the fact. The edge cases are all about one thing: money and delivery staying in sync.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design a vending machine.",
    opening: "Design the core purchase flow of a vending machine — selection, payment, and dispensing. Where do you want to start?",
    summary:
      "You've scoped it: cash-only payment, a fixed grid of slots where the same product can appear more than once, and the machine always makes correct change. That's enough — go identify the classes.",
    questions: [
      {
        id: "payment-types",
        ask: "Do we need to support multiple payment types — cash, card — or just one?",
        category: "scope",
        answer: "Just cash for now — coins and bills. Card support could come later.",
        why: "This scopes what Payment actually needs to track and validate.",
        establishes: "Cash payment only",
        lp: ["customer-obsession"],
      },
      {
        id: "slots",
        ask: "How many product slots, and can multiple slots hold the same product?",
        category: "scope",
        answer: "Assume a fixed grid of slots, and yes — the same product can be stocked in more than one slot.",
        why: "This confirms Slot and Product are separate — a product's identity isn't tied to one physical location.",
        establishes: "Multiple slots, product ≠ slot",
        lp: ["dive-deep"],
      },
      {
        id: "change",
        ask: "Does the machine need to give exact change, or can it refuse a sale if it can't make change?",
        category: "constraints",
        answer: "It should give correct change whenever possible — assume it always can for this design.",
        why: "This decides whether computing change is a required, always-succeeding operation, or one with a failure path to design around.",
        establishes: "Machine always makes correct change",
        lp: ["customer-obsession"],
      },
      {
        id: "pattern-premature",
        ask: "Should we use a state pattern with a separate class per state, or a single enum field?",
        category: "premature",
        redirect: "That's an implementation-pattern choice — first agree on what states and transitions even exist.",
      },
    ],
  },
  design: {
    entities: [
      { id: "machine", name: "VendingMachine", isEntity: true, why: "The top-level system — holds the current state and coordinates a purchase end to end." },
      { id: "slot", name: "Slot", isEntity: true, why: "A single row — tracks its own product, price, and remaining quantity." },
      { id: "product", name: "Product", isEntity: true, why: "An item for sale — has a price and a name, independent of which slot holds it." },
      { id: "payment", name: "Payment", isEntity: true, why: "Tracks money inserted during the current transaction and computes change owed." },
      { id: "state", name: "VendingMachineState", isEntity: true, why: "Represents where the machine is in a purchase — idle, selecting, dispensing — and which actions are valid there." },
      { id: "coin", name: "Coin", isEntity: false, why: "A denomination value handled inside Payment, not a class with its own behavior." },
      { id: "customer", name: "Customer", isEntity: false, why: "An external actor interacting with the machine, not a class inside the machine's own domain model." },
      { id: "display", name: "Display", isEntity: false, why: "A UI output device, not a class holding domain logic — it just reflects VendingMachineState." },
      { id: "receipt", name: "Receipt", isEntity: false, why: "A byproduct of a completed Payment, not a class with its own responsibilities." },
      { id: "truck", name: "RestockTruck", isEntity: false, why: "Belongs to a separate restocking/logistics system, not this machine's own purchase flow." },
    ],
    methods: [
      { id: "m1", signature: "selectSlot(code): Slot", ownerId: "machine" },
      { id: "m2", signature: "dispenseProduct(slot): void", ownerId: "machine" },
      { id: "m3", signature: "cancelTransaction(): void", ownerId: "machine" },
      { id: "m4", signature: "getProduct(): Product", ownerId: "slot" },
      { id: "m5", signature: "decrementQuantity(): void", ownerId: "slot" },
      { id: "m6", signature: "isEmpty(): boolean", ownerId: "slot" },
      { id: "m7", signature: "getPrice(): Money", ownerId: "product" },
      { id: "m8", signature: "insertMoney(amount): void", ownerId: "payment" },
      { id: "m9", signature: "computeChange(price): Money", ownerId: "payment" },
      { id: "m10", signature: "canSelect(): boolean", ownerId: "state" },
      { id: "m11", signature: "transitionTo(state): void", ownerId: "state" },
    ],
    edgeCases: [
      {
        id: "empty-slot",
        scenario: "A customer selects a slot that's empty (sold out).",
        options: [
          { id: "a", label: "Dispense nothing and silently keep the inserted money.", correct: false, feedback: "Never keep a customer's money for a product you can't deliver — that's the single worst failure mode for a vending machine." },
          { id: "b", label: "Reject the selection, tell the customer it's sold out, and return any money already inserted.", correct: true, feedback: "Right — Slot.isEmpty() should be checked before dispensing is even attempted, and Payment must support a refund path." },
          { id: "c", label: "Substitute a different product from another slot automatically.", correct: false, feedback: "The system shouldn't silently give the customer something they didn't choose." },
        ],
      },
      {
        id: "overpay",
        scenario: "The customer inserts more money than the product costs.",
        options: [
          { id: "a", label: "Keep the entire amount, no change given.", correct: false, feedback: "A vending machine that doesn't give correct change is broken by design, not just impolite." },
          { id: "b", label: "Dispense the product and return the difference as change via Payment.computeChange().", correct: true, feedback: "Right — Payment exists specifically to make this correct and automatic." },
          { id: "c", label: "Refuse the purchase until the customer inserts the exact amount.", correct: false, feedback: "Requiring exact change is a real product decision some machines make, but it wasn't what we scoped — and it's a worse default experience." },
        ],
      },
      {
        id: "jam",
        scenario: "The customer selects a product, but the machine physically fails to dispense it (a jam).",
        options: [
          { id: "a", label: "Charge the customer anyway since they made a valid selection.", correct: false, feedback: "Charging for something that didn't get delivered is exactly the failure Payment exists to prevent." },
          { id: "b", label: "Detect the dispense failure, refund the payment, and flag the slot rather than completing the transaction.", correct: true, feedback: "The state machine needs a failure path, not just a happy path — VendingMachineState should support transitioning to a refund/failed state." },
          { id: "c", label: "Retry dispensing indefinitely until it works.", correct: false, feedback: "An infinite retry with no fallback can leave the machine stuck in a bad state forever." },
        ],
      },
      {
        id: "double-select",
        scenario: "Two selections happen in rapid succession before the first purchase completes.",
        options: [
          { id: "a", label: "Process both selections independently in parallel.", correct: false, feedback: "A vending machine only has one dispensing mechanism — two purchases can't physically complete at once." },
          { id: "b", label: "VendingMachineState rejects a new selection while a transaction is already in progress — the state machine itself prevents this.", correct: true, feedback: "This is exactly why VendingMachineState exists as its own class: canSelect() returning false during dispensing makes concurrent purchases impossible by construction." },
          { id: "c", label: "Let the second selection cancel the first.", correct: false, feedback: "Silently canceling a customer's in-progress, paid-for transaction is a bad and confusing outcome." },
        ],
      },
    ],
    relationships: [
      "VendingMachine has many Slots",
      "Slot holds one Product",
      "VendingMachine delegates the current transaction to Payment and VendingMachineState",
      "VendingMachineState gates which actions (select, dispense, cancel) are valid at any moment",
    ],
  },
  recap: [
    "This is the canonical state-machine LLD prompt: a VendingMachineState class that gates valid actions makes bad sequences impossible by construction, not just handled after the fact.",
    "Money must never be kept for a product that wasn't delivered — every failure path (sold out, jam) has to route through a refund, not a silent write-off.",
    "Slot and Product are different classes on purpose: a product's price and identity aren't tied to which physical row it's stocked in.",
    "The real edge cases here are all about money and delivery staying in sync — sold-out, overpayment, and physical dispense failure.",
  ],
  relatedLessons: ["parking-lot", "discount-coupon-system"],
};
