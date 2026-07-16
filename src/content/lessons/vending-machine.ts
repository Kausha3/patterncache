import type { LLDLesson } from "@/types";

export const vendingMachine: LLDLesson = {
  id: "vending-machine",
  track: "lld",
  title: "Design a Vending Machine",
  blurb: "State machine modeling for inventory, payment, dispensing, and refunds.",
  estMinutes: 35,
  overview:
    "A vending machine is the canonical state-machine LLD prompt: a purchase moves through idle → selecting → dispensing, and the interesting design decision is making bad sequences (like starting a second purchase mid-dispense) impossible by construction, not just handled with an if-check after the fact. The edge cases are all about one thing: money and delivery staying in sync.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design a vending machine.",
    opening: "Design the core purchase flow of a vending machine: selection, payment, and dispensing. Where do you want to start?",
    summary:
      "You've scoped it: cash-only payment, a fixed grid of slots where the same product can appear more than once, and the machine always makes correct change. That's enough. Go identify the classes.",
    questions: [
      {
        id: "payment-types",
        ask: "Do we need to support multiple payment types, like cash and card, or just one?",
        category: "scope",
        answer: "Just cash for now: coins and bills. Card support could come later.",
        why: "This scopes what Payment actually needs to track and validate.",
        establishes: "Cash payment only",
        lp: ["customer-obsession"],
      },
      {
        id: "slots",
        ask: "How many product slots, and can multiple slots hold the same product?",
        category: "scope",
        answer: "Assume a fixed grid of slots, and yes, the same product can be stocked in more than one slot.",
        why: "This confirms Slot and Product are separate, because a product's identity isn't tied to one physical location.",
        establishes: "Multiple slots, product ≠ slot",
        lp: ["dive-deep"],
        branches: [
          { label: "Single slot per product (no duplicates)", approach: "Slot and Product could realistically collapse into one class. Each product has exactly one location, one price, one quantity, with no need to look up which slots hold it. Fewer classes, but doesn't match how real machines are stocked." },
          { label: "Multiple slots, same product (this)", approach: "Slot and Product must stay separate. Slot holds a quantity and a location, Product holds the price and name shared identically across every slot that stocks it. This is exactly why selectSlot() returns a Slot, not a Product." },
        ],
      },
      {
        id: "change",
        ask: "Does the machine need to give exact change, or can it refuse a sale if it can't make change?",
        category: "constraints",
        answer: "It should give correct change whenever possible. Assume it always can for this design.",
        why: "This decides whether computing change is a required, always-succeeding operation, or one with a failure path to design around.",
        establishes: "Machine always makes correct change",
        lp: ["customer-obsession"],
        branches: [
          { label: "Refuse sale if exact change isn't possible", approach: "computeChange() would need a can-make-change check before dispensing even starts, and Payment would need a refuse-and-return-money path, the same shape as Slot.isEmpty(), but for change instead of stock." },
          { label: "Always makes correct change (this)", approach: "computeChange() can assume success and just needs to be correct. The only failure paths left are sold-out and physical jams, not payment math. Simpler Payment class, but assumes an implementation detail (denominations on hand) a real machine would need to actually track." },
        ],
      },
      {
        id: "pattern-premature",
        ask: "Should we use a state pattern with a separate class per state, or a single enum field?",
        category: "premature",
        redirect: "That's an implementation-pattern choice. First agree on what states and transitions even exist.",
      },
    ],
  },
  design: {
    entities: [
      {
        id: "machine",
        name: "VendingMachine",
        isEntity: true,
        why: "The top-level system. It holds the current state and coordinates a purchase end to end.",
        properties: [
          { name: "id", type: "string" },
          { name: "slots", type: "List<Slot>" },
          { name: "state", type: "VendingMachineState" },
          { name: "currentPayment", type: "Payment" },
        ],
      },
      {
        id: "slot",
        name: "Slot",
        isEntity: true,
        why: "A single row. It tracks its own product, price, and remaining quantity.",
        properties: [
          { name: "id", type: "string" },
          { name: "product", type: "Product" },
          { name: "quantity", type: "int" },
        ],
      },
      {
        id: "product",
        name: "Product",
        isEntity: true,
        why: "An item for sale. It has a price and a name, independent of which slot holds it.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "price", type: "Money" },
        ],
      },
      {
        id: "payment",
        name: "Payment",
        isEntity: true,
        why: "Tracks money inserted during the current transaction and computes change owed.",
        properties: [
          { name: "id", type: "string" },
          { name: "amountInserted", type: "Money" },
          { name: "status", type: "PaymentStatus" },
        ],
      },
      {
        id: "state",
        name: "VendingMachineState",
        isEntity: true,
        why: "Represents where the machine is in a purchase (idle, selecting, dispensing) and which actions are valid there.",
        properties: [{ name: "name", type: "StateName" }],
      },
      { id: "coin", name: "Coin", isEntity: false, why: "A denomination value handled inside Payment, not a class with its own behavior." },
      { id: "customer", name: "Customer", isEntity: false, why: "An external actor interacting with the machine, not a class inside the machine's own domain model." },
      { id: "display", name: "Display", isEntity: false, why: "A UI output device, not a class holding domain logic. It just reflects VendingMachineState." },
      { id: "receipt", name: "Receipt", isEntity: false, why: "A byproduct of a completed Payment, not a class with its own responsibilities." },
      { id: "truck", name: "RestockTruck", isEntity: false, why: "Belongs to a separate restocking/logistics system, not this machine's own purchase flow." },
    ],
    methods: [
      {
        id: "m1",
        signature: "selectSlot(code): Slot",
        ownerId: "machine",
        justification: "VendingMachine is the only class that receives the customer's raw slot code and needs to search across the whole grid to find the match. Slot doesn't know its own code, and Product doesn't know which slots hold it.",
      },
      {
        id: "m2",
        signature: "dispenseProduct(slot): void",
        ownerId: "machine",
        justification: "Dispensing has to coordinate Slot.decrementQuantity() with a state transition on VendingMachineState. Neither Slot nor Payment alone can see both, so the orchestration lives on VendingMachine.",
      },
      {
        id: "m3",
        signature: "cancelTransaction(): void",
        ownerId: "machine",
        justification: "Cancelling touches both Payment (issue a refund) and VendingMachineState (transition back to idle), so it has to live on the one class holding references to both.",
      },
      {
        id: "m4",
        signature: "getProduct(): Product",
        ownerId: "slot",
        justification: "Slot is the only class holding a reference to which Product it's stocked with. It's a plain accessor for data it already owns.",
      },
      {
        id: "m5",
        signature: "decrementQuantity(): void",
        ownerId: "slot",
        justification: "quantity lives on Slot, so Slot is the only class that can safely mutate it. If VendingMachine decremented slot.quantity directly, nothing would stop two callers from dispensing from an already-empty slot.",
      },
      {
        id: "m6",
        signature: "isEmpty(): boolean",
        ownerId: "slot",
        justification: "Empty-ness is derived purely from quantity, which Slot owns. Computing it anywhere else means exposing that field outside the class.",
      },
      {
        id: "m7",
        signature: "getPrice(): Money",
        ownerId: "product",
        justification: "Price is data Product holds directly. It's a plain accessor, not a decision, so it belongs on the object whose field it's reading.",
      },
      {
        id: "m8",
        signature: "insertMoney(amount): void",
        ownerId: "payment",
        justification: "The running total inserted during a transaction is Payment's own field. Payment is the only class that should mutate it, so the invariant (total only grows through insertMoney) can't be violated from outside.",
      },
      {
        id: "m9",
        signature: "computeChange(price): Money",
        ownerId: "payment",
        justification: "Change math depends on Payment's own accumulated total versus a price. Keeping it on Payment means the money logic never leaks into VendingMachine or Slot.",
        codeExercise: {
          language: "java",
          starter: "Money computeChange(Money price) {\n    // your code here\n}",
          reference:
            "Money computeChange(Money price) {\n    if (amountInserted.isLessThan(price)) {\n        throw new IllegalStateException(\"Insufficient payment\");\n    }\n    return amountInserted.subtract(price);\n}",
          checklist: [
            "Handles the case where amountInserted is less than price instead of returning a negative Money",
            "Returns exactly amountInserted minus price when enough was inserted",
            "Doesn't mutate amountInserted as a side effect, since computing change is separate from resetting the payment",
            "Bonus (L5+, not required here): if change can't be made in available denominations, that failure needs to surface here too",
          ],
        },
      },
      {
        id: "m10",
        signature: "canSelect(): boolean",
        ownerId: "state",
        justification: "Whether a new selection is legal right now is exactly what VendingMachineState exists to answer. The gating logic lives on the class that tracks the current state, not scattered across every caller that might attempt a selection.",
      },
      {
        id: "m11",
        signature: "transitionTo(state): void",
        ownerId: "state",
        justification: "Only VendingMachineState should be able to change which state the machine is in. If VendingMachine flipped its own state field directly, nothing would enforce that transitions only happen along valid paths.",
        codeExercise: {
          language: "java",
          starter: "void transitionTo(StateName newState) {\n    // your code here\n}",
          reference:
            "void transitionTo(StateName newState) {\n    boolean valid = switch (name) {\n        case IDLE -> newState == StateName.SELECTING;\n        case SELECTING -> newState == StateName.DISPENSING || newState == StateName.IDLE;\n        case DISPENSING -> newState == StateName.IDLE || newState == StateName.REFUNDING;\n        case REFUNDING -> newState == StateName.IDLE;\n    };\n    if (!valid) {\n        throw new IllegalStateException(\"Cannot transition from \" + name + \" to \" + newState);\n    }\n    this.name = newState;\n}",
          checklist: [
            "Rejects invalid transitions (e.g. DISPENSING straight to SELECTING) instead of allowing any state to jump to any other",
            "Only mutates the state field after confirming the transition is valid",
            "Fails loudly (exception) rather than silently ignoring an invalid transition request",
            "Bonus (L5+, not required here): needs to be atomic if selectSlot()/dispenseProduct() can be triggered concurrently, not just correct in isolation",
          ],
        },
      },
    ],
    edgeCases: [
      {
        id: "empty-slot",
        scenario: "A customer selects a slot that's empty (sold out).",
        options: [
          { id: "a", label: "Dispense nothing and silently keep the inserted money.", correct: false, feedback: "Never keep a customer's money for a product you can't deliver. That's the single worst failure mode for a vending machine." },
          { id: "b", label: "Reject the selection, tell the customer it's sold out, and return any money already inserted.", correct: true, feedback: "Right. Slot.isEmpty() should be checked before dispensing is even attempted, and Payment must support a refund path." },
          { id: "c", label: "Substitute a different product from another slot automatically.", correct: false, feedback: "The system shouldn't silently give the customer something they didn't choose." },
        ],
      },
      {
        id: "overpay",
        scenario: "The customer inserts more money than the product costs.",
        options: [
          { id: "a", label: "Keep the entire amount, no change given.", correct: false, feedback: "A vending machine that doesn't give correct change is broken by design, not just impolite." },
          { id: "b", label: "Dispense the product and return the difference as change via Payment.computeChange().", correct: true, feedback: "Right. Payment exists specifically to make this correct and automatic." },
          { id: "c", label: "Refuse the purchase until the customer inserts the exact amount.", correct: false, feedback: "Requiring exact change is a real product decision some machines make, but it wasn't what we scoped, and it's a worse default experience." },
        ],
      },
      {
        id: "jam",
        scenario: "The customer selects a product, but the machine physically fails to dispense it (a jam).",
        options: [
          { id: "a", label: "Charge the customer anyway since they made a valid selection.", correct: false, feedback: "Charging for something that didn't get delivered is exactly the failure Payment exists to prevent." },
          { id: "b", label: "Detect the dispense failure, refund the payment, and flag the slot rather than completing the transaction.", correct: true, feedback: "The state machine needs a failure path, not just a happy path. VendingMachineState should support transitioning to a refund/failed state." },
          { id: "c", label: "Retry dispensing indefinitely until it works.", correct: false, feedback: "An infinite retry with no fallback can leave the machine stuck in a bad state forever." },
        ],
      },
      {
        id: "double-select",
        scenario: "Two selections happen in rapid succession before the first purchase completes.",
        options: [
          { id: "a", label: "Process both selections independently in parallel.", correct: false, feedback: "A vending machine only has one dispensing mechanism. Two purchases can't physically complete at once." },
          { id: "b", label: "VendingMachineState rejects a new selection while a transaction is already in progress: the state machine itself prevents this.", correct: true, feedback: "This is exactly why VendingMachineState exists as its own class: canSelect() returning false during dispensing makes concurrent purchases impossible by construction." },
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
    tradeoffs: [
      {
        decision: "VendingMachineState is its own class instead of a status field plus a big if/else chain on VendingMachine.",
        reasoning: "Costs one more class, but makes invalid transitions impossible by construction. canSelect() and transitionTo() enforce the state machine in one place instead of scattering 'is this action even legal right now' checks across every method that might be called at the wrong time.",
      },
      {
        decision: "Slot and Product are separate classes instead of storing price and name directly on each Slot.",
        reasoning: "Costs an extra class and a reference, but means the same product can be restocked into multiple slots without duplicating its price and name. Updating a product's price updates it everywhere it's sold, not just in one slot's copy.",
      },
      {
        decision: "Payment tracks the running total itself instead of VendingMachine holding a raw Money field.",
        reasoning: "Keeps the invariant (total only grows through insertMoney(), change is computed rather than guessed) inside the one class responsible for it, instead of trusting every caller that touches VendingMachine's money to keep it consistent.",
      },
    ],
    principles: [
      {
        name: "Single Responsibility Principle",
        explanation: "Slot only tracks its own product and quantity; Payment only tracks money and change. dispenseProduct() on VendingMachine coordinates both without either one knowing the other's internals.",
      },
      {
        name: "Encapsulation",
        explanation: "Slot.decrementQuantity() is the only way to reduce quantity, and VendingMachineState.transitionTo() is the only way to change the current state. No other class reaches in and mutates those fields directly.",
      },
      {
        name: "State pattern",
        explanation: "VendingMachineState is a real class, not just an enum field on VendingMachine, specifically so canSelect() and transitionTo() can hold the actual gating logic. That's the concrete reason bad sequences become impossible by construction instead of just handled with an if-check.",
      },
      {
        name: "Separation of Concerns",
        explanation: "Product (what's for sale) and Slot (where it physically sits) change independently. Restocking touches Slot, a price change touches Product, and neither operation should require touching the other class.",
      },
    ],
  },
  recap: [
    "This is the canonical state-machine LLD prompt: a VendingMachineState class that gates valid actions makes bad sequences impossible by construction, not just handled after the fact.",
    "Money must never be kept for a product that wasn't delivered. Every failure path (sold out, jam) has to route through a refund, not a silent write-off.",
    "Slot and Product are different classes on purpose: a product's price and identity aren't tied to which physical row it's stocked in.",
    "The real edge cases here are all about money and delivery staying in sync: sold-out, overpayment, and physical dispense failure.",
  ],
  relatedLessons: ["parking-lot", "discount-coupon-system"],
};
