import type { LLDLesson } from "@/types";

export const amazonLocker: LLDLesson = {
  id: "amazon-locker",
  track: "lld",
  title: "Design Amazon Locker",
  blurb: "Amazon's own pickup-locker system — implement getPackage() and putPackage().",
  estMinutes: 8,
  overview:
    "Amazon Locker is a real, Amazon-flavored LLD prompt — confirmed asked in an actual L5 loop, framed around implementing getPackage() and putPackage(). It looks like Parking Lot's cousin, but the sizing rule inverts: a package just needs a locker at least as big as itself, not an exact match — the opposite constraint from fitting a vehicle into a spot. That inversion is exactly the kind of detail that separates a candidate who understood the domain from one pattern-matching a memorized template.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design Amazon Locker.",
    opening: "Design the core of Amazon Locker — a bank of pickup lockers where a courier drops off a package and a customer retrieves it. Where do you want to start?",
    summary:
      "You've scoped it: multiple locker sizes with a 'big enough' matching rule, one physical locker location, and pickup via a generated code. That's enough to stop asking and start naming the classes.",
    questions: [
      {
        id: "sizes",
        ask: "Do we need multiple locker sizes, or is it one size fits all?",
        category: "scope",
        answer: "Multiple sizes — small, medium, large. A package needs a locker at least as big as itself.",
        why: "Size compatibility is the core matching rule — and unlike a parking spot, a package fits in ANY locker at least its size, not just an exact one.",
        establishes: "Multiple locker sizes, size ≥ package",
        lp: ["customer-obsession"],
      },
      {
        id: "network",
        ask: "One physical location, or a network of locker sites across a city?",
        category: "scope",
        answer: "Assume one physical location for now — a bank of lockers at a single site.",
        why: "This decides whether LockerLocation is the top of your hierarchy or just one node in a larger network — scope it before modeling.",
        establishes: "Single locker location",
        lp: ["dive-deep"],
      },
      {
        id: "pickup",
        ask: "How does a customer actually retrieve their package — app, code, both?",
        category: "constraints",
        answer: "A pickup code, generated at delivery, entered on the locker's keypad or scanned from the app.",
        why: "This defines what PickupCode has to support — generation, validation, and an expiry window.",
        establishes: "Pickup via generated code",
        lp: ["customer-obsession"],
      },
      {
        id: "protocol-premature",
        ask: "Should the locker talk to the backend over REST or gRPC?",
        category: "premature",
        redirect: "That's a networking/protocol detail — get the class responsibilities right first.",
      },
    ],
  },
  design: {
    entities: [
      { id: "location", name: "LockerLocation", isEntity: true, why: "The physical site — owns the bank of lockers and exposes the system's core putPackage / getPackage operations." },
      { id: "locker", name: "Locker", isEntity: true, why: "A single compartment — has a size, an occupied state, and can assign, open, or release itself." },
      { id: "package", name: "Package", isEntity: true, why: "The item being delivered — has a size that must fit the locker it's assigned to." },
      { id: "code", name: "PickupCode", isEntity: true, why: "A one-time code tied to a package's locker — generated on delivery, validated on pickup." },
      { id: "customer", name: "Customer", isEntity: true, why: "The recipient — identified by the package they're expecting; a real participant even with little behavior of its own." },
      { id: "color", name: "Color", isEntity: false, why: "An attribute of a locker's housing, not its own class." },
      { id: "agent", name: "DeliveryAgent", isEntity: false, why: "The courier placing the package — an external actor who calls into the system, not a class inside its own domain model." },
      { id: "truck", name: "DeliveryTruck", isEntity: false, why: "Belongs to the delivery-logistics system, not the locker system's own domain." },
      { id: "address", name: "Address", isEntity: false, why: "An attribute of Customer or Package, not a class with independent behavior." },
      { id: "receipt", name: "Receipt", isEntity: false, why: "A byproduct of a successful putPackage() call — a message, not a class with its own responsibilities." },
    ],
    methods: [
      { id: "m1", signature: "putPackage(package): PickupCode", ownerId: "location" },
      { id: "m2", signature: "getPackage(code): Package", ownerId: "location" },
      { id: "m3", signature: "getOccupancy(): int", ownerId: "location" },
      { id: "m4", signature: "assignPackage(package): void", ownerId: "locker" },
      { id: "m5", signature: "open(): void", ownerId: "locker" },
      { id: "m6", signature: "release(): void", ownerId: "locker" },
      { id: "m7", signature: "getSize(): Size", ownerId: "package" },
      { id: "m8", signature: "generate(): string", ownerId: "code" },
      { id: "m9", signature: "isValid(): boolean", ownerId: "code" },
    ],
    edgeCases: [
      {
        id: "full",
        scenario: "All lockers at this location are full when a package arrives for delivery.",
        options: [
          { id: "a", label: "Force the package into an occupied locker anyway.", correct: false, feedback: "Never silently overwrite an occupied locker — you'd lose the package already inside." },
          { id: "b", label: "putPackage() rejects the delivery, and the carrier routes the package to a nearby location instead.", correct: true, feedback: "Right — capacity has to be checked before a locker is assigned, and the system should fail informatively rather than corrupt state." },
          { id: "c", label: "Queue the package outside the lockers until one frees up.", correct: false, feedback: "A locker system has nowhere to physically hold an un-lockered package — reject-and-reroute is the real-world answer." },
        ],
      },
      {
        id: "oversize",
        scenario: "Only large lockers are free, but the incoming package is small. What should putPackage()'s locker search do?",
        options: [
          { id: "a", label: "Assign it to the large locker — a small package fits fine in a big one, so allow it (prefer the smallest fit when there's a choice).", correct: true, feedback: "Right — locker size just needs to be ≥ package size, not an exact match. This is the mirror image of Parking Lot's rule, where a vehicle can never fit a smaller spot." },
          { id: "b", label: "Reject the delivery because there's no exact size match.", correct: false, feedback: "Needlessly strict — 'big enough' should always be acceptable; exact match was never the real requirement." },
          { id: "c", label: "Split the package across two lockers.", correct: false, feedback: "Packages aren't divisible — the actual constraint is simple: locker size must be ≥ package size." },
        ],
      },
      {
        id: "expired",
        scenario: "A customer's pickup code expires (say, after 3 days) before they retrieve the package.",
        options: [
          { id: "a", label: "Delete the package's data immediately with no trace.", correct: false, feedback: "You lose the ability to help the customer or carrier recover it — real systems keep a record after the locker itself is released." },
          { id: "b", label: "Release the locker back to the pool for new deliveries, and flag the package for return-to-carrier pickup.", correct: true, feedback: "Right — the locker is a scarce, reusable resource that should free up, while the package's own record persists separately for a return flow." },
          { id: "c", label: "Keep the package in the locker indefinitely until picked up.", correct: false, feedback: "That locker becomes permanently unusable — a locker system that never reclaims space doesn't scale." },
        ],
      },
      {
        id: "concurrent",
        scenario: "Two delivery agents both call putPackage() targeting the same available locker at the exact same instant.",
        options: [
          { id: "a", label: "Whichever request commits first wins — locker assignment must be atomic so exactly one package is ever placed.", correct: true, feedback: "Same concurrency signal as Parking Lot's spot race — assignPackage() has to be an atomic check-then-assign, not two separate steps a second request can interleave with." },
          { id: "b", label: "Both packages go in — the locker holds two items.", correct: false, feedback: "Physically impossible, and exactly what happens in code if assignment isn't atomic." },
          { id: "c", label: "The system arbitrarily drops one package's data.", correct: false, feedback: "A silently lost package is a shipment bug, not a fix." },
        ],
      },
    ],
    relationships: [
      "LockerLocation has many Lockers",
      "Locker holds at most one Package",
      "PickupCode is generated for one Package and tied to one Locker",
      "Customer is identified by the Package they're expecting, not stored as locker state",
    ],
  },
  recap: [
    "A package fits any locker at least its size — the inverse of Parking Lot's exact-or-bigger vehicle rule. Read the domain, don't assume the pattern.",
    "The system's public interface — putPackage() / getPackage() — belongs on LockerLocation; assignment and physical state belong on Locker itself.",
    "The recurring LLD edge cases: full capacity, a size boundary, resource reclamation over time, and a concurrent-assignment race.",
    "External actors that merely call into the system (a courier, an app) are not classes inside the system's own domain model.",
  ],
  relatedLessons: ["parking-lot", "url-shortener"],
};
