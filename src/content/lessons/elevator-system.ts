import type { LLDLesson } from "@/types";

export const elevatorSystem: LLDLesson = {
  id: "elevator-system",
  track: "lld",
  title: "Design an Elevator System",
  blurb: "Scheduling algorithm, request queuing, multi-elevator coordination.",
  estMinutes: 8,
  overview:
    "An elevator system looks simple until you separate WHO decides (the dispatcher) from WHAT moves (the elevator itself) — the same split that made Parking Lot and Amazon Locker click. The real design content isn't 'can it go up and down', it's the scheduling rule for when to reverse direction, and the edge cases around concurrent and emergency requests that a memorized template never covers.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design an elevator system.",
    opening: "Design the core of a building's elevator system — request handling, dispatch, and movement. Where do you want to start?",
    summary:
      "You've scoped it: a coordinated bank of elevators with a simple, correct dispatch algorithm and basic emergency handling. That's enough — go identify the classes.",
    questions: [
      {
        id: "bank",
        ask: "Is this one elevator, or a bank of multiple elevators the system has to coordinate?",
        category: "scope",
        answer: "A bank of multiple elevators — the system needs to pick the best one for each request.",
        why: "Single vs multiple elevators is the core fork — one elevator needs no dispatch logic at all; multiple need a Dispatcher deciding who serves what.",
        establishes: "Multiple elevators, needs dispatch",
        lp: ["dive-deep"],
      },
      {
        id: "optimize",
        ask: "Do we need to optimize for wait time, or is any correct assignment good enough here?",
        category: "scope",
        answer: "Just correct, sensible assignment — we're not building a full optimization algorithm, just a working scheduler.",
        why: "This scopes how deep the Dispatcher's algorithm needs to go — a working nearest-elevator heuristic vs. a full cost-optimization model.",
        establishes: "Simple sensible dispatch, not full optimization",
        lp: ["customer-obsession"],
      },
      {
        id: "emergency",
        ask: "Do we need to model emergency or fire behavior, or just normal operation?",
        category: "constraints",
        answer: "Yes — include basic emergency behavior, like resolving to the nearest floor and taking the elevator out of service.",
        why: "This decides whether 'nearest-floor safe stop' is even a requirement, or something you'd only mention as a bonus.",
        establishes: "Basic emergency handling in scope",
        lp: ["customer-obsession"],
      },
      {
        id: "storage-premature",
        ask: "Should elevator state be stored in a database, or just in memory?",
        category: "premature",
        redirect: "That's a persistence detail — get the class responsibilities right first.",
      },
    ],
  },
  design: {
    entities: [
      { id: "building", name: "Building", isEntity: true, why: "Owns the floors and the bank of elevators — the physical structure the system operates within." },
      { id: "dispatcher", name: "Dispatcher", isEntity: true, why: "Decides which elevator should serve each incoming request — the scheduling brain, kept separate from the elevators themselves." },
      { id: "elevator", name: "Elevator", isEntity: true, why: "A single car — tracks its current floor, direction, and the stops it still needs to make." },
      { id: "request", name: "Request", isEntity: true, why: "One call for service — a hall call (floor + direction) from outside, or a car call (destination floor) from inside." },
      { id: "floor", name: "Floor", isEntity: true, why: "A level the building serves — the origin of a hall call's up/down button." },
      { id: "door", name: "Door", isEntity: false, why: "A component of Elevator with no independent identity — open/close become Elevator's own methods, not a separate class." },
      { id: "button", name: "Button", isEntity: false, why: "A physical UI element that triggers a Request — not a class with its own behavior in the domain model." },
      { id: "passenger", name: "Passenger", isEntity: false, why: "Nobody asked the system to track individual riders — inventing per-person state adds scope nobody requested." },
      { id: "motor", name: "Motor", isEntity: false, why: "A hardware component below the abstraction level this design operates at — out of scope for the object model." },
      { id: "maintlog", name: "MaintenanceLog", isEntity: false, why: "A logging concern, not a core class this prompt is about — modeling it here is premature scope creep." },
    ],
    methods: [
      { id: "m1", signature: "getElevators(): List<Elevator>", ownerId: "building" },
      { id: "m2", signature: "assignElevator(request): Elevator", ownerId: "dispatcher" },
      { id: "m3", signature: "enqueueRequest(request): void", ownerId: "dispatcher" },
      { id: "m4", signature: "moveToNextStop(): void", ownerId: "elevator" },
      { id: "m5", signature: "addStop(floor): void", ownerId: "elevator" },
      { id: "m6", signature: "getCurrentFloor(): int", ownerId: "elevator" },
      { id: "m7", signature: "isAvailable(): boolean", ownerId: "elevator" },
      { id: "m8", signature: "getDirection(): Direction", ownerId: "request" },
      { id: "m9", signature: "pressButton(direction): Request", ownerId: "floor" },
    ],
    edgeCases: [
      {
        id: "all-busy",
        scenario: "All elevators are currently full or busy on other floors when a new hall call comes in.",
        options: [
          { id: "a", label: "Ignore the request until an elevator happens to become free.", correct: false, feedback: "A request must be queued, not silently dropped — otherwise a rider waits forever with no elevator ever assigned." },
          { id: "b", label: "Queue the request; Dispatcher assigns it once an elevator becomes available or is close enough as states update.", correct: true, feedback: "Right — the Dispatcher retries assignment as elevator states change, instead of discarding a request it can't serve immediately." },
          { id: "c", label: "Immediately dispatch every idle elevator to that floor at once.", correct: false, feedback: "Wastes capacity — only one elevator should ever be assigned to a given request." },
        ],
      },
      {
        id: "opposite-direction",
        scenario: "Two hall calls come in for opposite directions on the same floor at nearly the same time.",
        options: [
          { id: "a", label: "Treat it as one request since it's the same floor.", correct: false, feedback: "Direction is part of what a hall call means — 'up' and 'down' are different requests with potentially different destination elevators." },
          { id: "b", label: "Model them as two separate Request objects, since direction is part of a hall call's identity.", correct: true, feedback: "Right — Request needs a direction, and two requests from the same floor going opposite ways are genuinely different objects." },
          { id: "c", label: "Only honor whichever button was pressed first and ignore the second.", correct: false, feedback: "Both riders are waiting for genuinely different trips — dropping one isn't correct behavior." },
        ],
      },
      {
        id: "reverse",
        scenario: "A passenger presses a car-call button for a floor, but the elevator is already moving in the opposite direction.",
        options: [
          { id: "a", label: "Immediately reverse direction to serve the new stop first.", correct: false, feedback: "Reversing mid-trip strands every other passenger's already-committed stop — that's a worse experience, not a fix." },
          { id: "b", label: "Add the new stop to the elevator's queue, to be served after it finishes its current direction's stops.", correct: true, feedback: "This is the standard elevator scheduling rule — finish the current sweep in one direction, then reverse." },
          { id: "c", label: "Reject the button press since the elevator is already moving.", correct: false, feedback: "The elevator can absolutely serve that floor — just not before its current stops. Rejecting loses a valid request." },
        ],
      },
      {
        id: "emergency",
        scenario: "The elevator is between floors when a fire alarm or emergency stop is triggered.",
        options: [
          { id: "a", label: "Continue to the nearest floor in the current direction of travel, open the doors, and take the elevator out of service.", correct: true, feedback: "Real elevator systems prioritize getting to a floor safely over completing the original request — this real-world constraint is what separates a strong answer from a memorized template." },
          { id: "b", label: "Stop immediately wherever it is, between floors.", correct: false, feedback: "Stopping between floors traps passengers — always resolve to the nearest floor first." },
          { id: "c", label: "Finish serving all queued stops first, then handle the emergency.", correct: false, feedback: "An emergency overrides the normal queue — safety takes priority over completing scheduled stops." },
        ],
      },
    ],
    relationships: [
      "Building has many Floors and many Elevators",
      "Dispatcher assigns each Request to exactly one Elevator",
      "Elevator maintains a queue of Requests as its stops",
      "Floor issues a Request when a hall button is pressed",
    ],
  },
  recap: [
    "Separating Dispatcher (the algorithm) from Elevator (the state) mirrors ParkingLot/Level and LockerLocation/Locker — the class that decides isn't the class that IS the resource.",
    "Direction is part of a hall call's identity — 'floor 5 going up' and 'floor 5 going down' are two different requests, not one.",
    "The core scheduling rule: finish the current direction's sweep before reversing — that's the actual elevator algorithm interviewers are checking for.",
    "Real-world edge cases like emergencies are exactly what separates a memorized template from someone who's thought about the domain.",
  ],
  relatedLessons: ["parking-lot", "amazon-locker"],
};
