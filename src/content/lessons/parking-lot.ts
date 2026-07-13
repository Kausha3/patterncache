import type { LLDLesson } from "@/types";

export const parkingLot: LLDLesson = {
  id: "parking-lot",
  track: "lld",
  title: "Design a Parking Lot",
  blurb: "The canonical LLD warm-up — classes, spot allocation, edge cases like a full lot.",
  estMinutes: 8,
  overview:
    "Low-level design isn't about scale — it's about turning a vague prompt into a clean set of classes with the right responsibilities, then defending that model when the interviewer pokes at it with edge cases. A parking lot is the classic warm-up: everyone can picture the domain, so the interview is purely about your object-modeling judgment. Clarify the scope, name the real classes (not every noun in the prompt is one), assign each behavior to the class that actually owns it, then survive the 'what if' questions.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design a parking lot.",
    opening: "Let's design a parking garage's core system — entry, spot assignment, and exit. Where do you want to start?",
    summary:
      "You've scoped it: three vehicle sizes with size-matched spots, a multi-level garage, and full fee calculation plus payment on exit. That's enough to stop asking and start naming the objects — go identify the classes.",
    questions: [
      {
        id: "sizes",
        ask: "Do we need to support multiple vehicle sizes — motorcycle, compact, large — or just one spot type?",
        category: "scope",
        answer: "Yes — motorcycle, compact, and large, each needing a matching or bigger spot.",
        why: "Vehicle-to-spot size matching is the core object-modeling decision here — it determines what Vehicle and ParkingSpot each need to know.",
        establishes: "3 vehicle sizes, size-matched spots",
        lp: ["customer-obsession"],
      },
      {
        id: "levels",
        ask: "Single level, or multiple levels?",
        category: "scope",
        answer: "Multiple levels — assume a multi-floor garage.",
        why: "This decides whether ParkingLot owns Spots directly, or delegates through a Level layer — a real class-hierarchy decision, not a detail.",
        establishes: "Multi-level garage",
        lp: ["dive-deep"],
      },
      {
        id: "payment",
        ask: "Do we calculate and process payment, or just track entry and exit?",
        category: "constraints",
        answer: "Yes — calculate a fee based on duration and process payment on exit.",
        why: "This decides whether Payment is even a class in your model, or out of scope entirely.",
        establishes: "Fee calculation + payment on exit",
        lp: ["customer-obsession"],
      },
      {
        id: "storage-premature",
        ask: "Should spot lookup use a linked list or a hash map internally?",
        category: "premature",
        redirect: "That's a data-structure implementation detail. Get the class responsibilities right first — the internal storage choice comes after.",
      },
    ],
  },
  design: {
    entities: [
      { id: "lot", name: "ParkingLot", isEntity: true, why: "The top-level system — owns the levels and enforces overall capacity." },
      { id: "level", name: "Level", isEntity: true, why: "A floor of the garage — owns a set of spots and tracks its own free count." },
      { id: "spot", name: "ParkingSpot", isEntity: true, why: "A single space — has a size and an occupied/free state." },
      { id: "vehicle", name: "Vehicle", isEntity: true, why: "The car, motorcycle, or truck being parked — has a size that must fit a spot." },
      { id: "ticket", name: "Ticket", isEntity: true, why: "Issued on entry, closed on exit — links a vehicle, a spot, and a timestamp." },
      { id: "payment", name: "Payment", isEntity: true, why: "Calculates and processes the fee owed on exit." },
      { id: "color", name: "Color", isEntity: false, why: "An attribute of Vehicle (like paint or plate color), not its own class — modeling it separately is over-engineering." },
      { id: "plate", name: "LicensePlate", isEntity: false, why: "A value belonging to Vehicle, not a class of its own — it has no independent behavior beyond identifying the vehicle." },
      { id: "attendant", name: "ParkingAttendant", isEntity: false, why: "Nobody asked for staffed attendants — inventing this scope adds complexity the prompt never requested." },
      { id: "app", name: "MobileApp", isEntity: false, why: "A client that calls into the system, not a class inside the system's own domain model." },
    ],
    methods: [
      { id: "m1", signature: "findAvailableSpot(vehicle): Spot", ownerId: "lot" },
      { id: "m2", signature: "isFull(): boolean", ownerId: "lot" },
      { id: "m3", signature: "findSpotOnLevel(vehicle): Spot", ownerId: "level" },
      { id: "m4", signature: "getFreeCount(): int", ownerId: "level" },
      { id: "m5", signature: "assignVehicle(vehicle): void", ownerId: "spot" },
      { id: "m6", signature: "release(): void", ownerId: "spot" },
      { id: "m7", signature: "getSize(): Size", ownerId: "vehicle" },
      { id: "m8", signature: "issue(vehicle, spot): Ticket", ownerId: "ticket" },
      { id: "m9", signature: "close(): void", ownerId: "ticket" },
      { id: "m10", signature: "calculateFee(ticket): Money", ownerId: "payment" },
      { id: "m11", signature: "charge(amount): boolean", ownerId: "payment" },
    ],
    edgeCases: [
      {
        id: "full",
        scenario: "The lot is completely full and a vehicle arrives. What should happen?",
        options: [
          { id: "a", label: "Silently assign it to a spot anyway, overselling capacity.", correct: false, feedback: "Never silently violate capacity — it corrupts the invariant the whole system depends on." },
          { id: "b", label: "Reject entry and signal 'lot full' before a ticket is ever issued.", correct: true, feedback: "Right — check capacity before issuing a Ticket, not after. This is the first edge case interviewers probe." },
          { id: "c", label: "Issue a ticket anyway, then figure out a spot later.", correct: false, feedback: "A Ticket implies a spot was assigned — issuing one without a spot creates an invalid state." },
        ],
      },
      {
        id: "size-mismatch",
        scenario: "A large truck arrives, but only compact spots are free. What now?",
        options: [
          { id: "a", label: "Force it into a compact spot anyway.", correct: false, feedback: "Fitting a large vehicle into a compact spot isn't a modeling detail — it's a physically wrong assignment." },
          { id: "b", label: "Reject or queue the vehicle — spot size must be checked against vehicle size before assignment.", correct: true, feedback: "Exactly — findAvailableSpot has to compare Vehicle.getSize() against each candidate ParkingSpot before assigning it." },
          { id: "c", label: "Let the driver decide by driving around and picking one.", correct: false, feedback: "The system should enforce the invariant — you can't rely on a driver to honor a rule the system itself owns." },
        ],
      },
      {
        id: "lost-ticket",
        scenario: "A driver loses their physical ticket. How does checkout work?",
        options: [
          { id: "a", label: "Refuse to let them leave without the exact ticket ID.", correct: false, feedback: "Real systems don't strand a paying customer over a lost slip — that's a support nightmare, not good design." },
          { id: "b", label: "Look up the open Ticket by license plate or spot instead of requiring the physical ID.", correct: true, feedback: "Right — Ticket needs to be findable by more than one key, since the physical ticket is just one entry point to the same record." },
          { id: "c", label: "Charge the maximum possible fee automatically.", correct: false, feedback: "Punitive, and it doesn't solve the actual problem — recovering the real entry time so the fee is accurate." },
        ],
      },
      {
        id: "concurrent",
        scenario: "Two vehicles arrive at the exact same instant and both try to claim the last free spot.",
        options: [
          { id: "a", label: "Whichever request commits first wins — spot assignment must be atomic so exactly one succeeds.", correct: true, feedback: "This is the concurrency signal interviewers look for at L5+ — assignVehicle() has to be a synchronized or atomic operation, not a check-then-act race." },
          { id: "b", label: "Both get the spot — the second vehicle just parks on top.", correct: false, feedback: "Obviously wrong physically, but it's exactly what happens in code if assignment isn't atomic — a check-then-act race." },
          { id: "c", label: "The system crashes and needs a human to resolve it.", correct: false, feedback: "A correct design prevents the race in the first place — it doesn't rely on a human cleaning up after it." },
        ],
      },
    ],
    relationships: [
      "ParkingLot has many Levels",
      "Level has many ParkingSpots",
      "Ticket references one Vehicle and one ParkingSpot",
      "Payment is computed from a Ticket's duration",
    ],
  },
  recap: [
    "Not every noun in the prompt is a class — attributes (color, plate) and out-of-scope ideas (an attendant nobody asked for) are the traps.",
    "Assign each method to the class that actually owns the data it touches — Spot knows how to assign/release itself; ParkingLot just finds one.",
    "The edge cases ARE the interview: a full lot, a size mismatch, a lost ticket, and a concurrency race are the four questions worth rehearsing.",
    "Clarify scope before naming classes — vehicle sizes, levels, and whether payment is in scope all change what the model needs to represent.",
  ],
  relatedLessons: ["amazon-locker", "url-shortener"],
};
