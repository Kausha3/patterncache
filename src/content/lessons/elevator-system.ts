import type { LLDLesson } from "@/types";

export const elevatorSystem: LLDLesson = {
  id: "elevator-system",
  track: "lld",
  title: "Design an Elevator System",
  blurb: "Scheduling algorithm, request queuing, multi-elevator coordination.",
  estMinutes: 35,
  overview:
    "An elevator system looks simple until you separate WHO decides (the dispatcher) from WHAT moves (the elevator itself). That's the same split that made Parking Lot and Amazon Locker click. The real design content isn't 'can it go up and down,' it's the scheduling rule for when to reverse direction, and the edge cases around concurrent and emergency requests that a memorized template never covers.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design an elevator system.",
    opening: "Design the core of a building's elevator system, covering request handling, dispatch, and movement. Where do you want to start?",
    summary:
      "You've scoped it: a coordinated bank of elevators with a simple, correct dispatch algorithm and basic emergency handling. That's enough, so go identify the classes.",
    questions: [
      {
        id: "bank",
        ask: "Is this one elevator, or a bank of multiple elevators the system has to coordinate?",
        category: "scope",
        answer: "A bank of multiple elevators. The system needs to pick the best one for each request.",
        why: "Single vs multiple elevators is the core fork. One elevator needs no dispatch logic at all, but multiple need a Dispatcher deciding who serves what.",
        establishes: "Multiple elevators, needs dispatch",
        lp: ["dive-deep"],
        branches: [
          { label: "Single elevator only", approach: "Dispatcher wouldn't exist as a class at all. There's nothing to choose between, so a request goes straight into the one Elevator's own stops queue via addStop(). One fewer class, but it doesn't scale past a single car." },
          { label: "Bank of multiple elevators (this)", approach: "Dispatcher becomes a real class. It's the only object that can see every Elevator's state at once, so assignElevator() and enqueueRequest() live there instead of on any single Elevator." },
        ],
      },
      {
        id: "optimize",
        ask: "Do we need to optimize for wait time, or is any correct assignment good enough here?",
        category: "scope",
        answer: "Just correct, sensible assignment. We're not building a full optimization algorithm, just a working scheduler.",
        why: "This scopes how deep the Dispatcher's algorithm needs to go: a working nearest-elevator heuristic vs. a full cost-optimization model.",
        establishes: "Simple sensible dispatch, not full optimization",
        lp: ["customer-obsession"],
      },
      {
        id: "emergency",
        ask: "Do we need to model emergency or fire behavior, or just normal operation?",
        category: "constraints",
        answer: "Yes, include basic emergency behavior, like resolving to the nearest floor and taking the elevator out of service.",
        why: "This decides whether 'nearest-floor safe stop' is even a requirement, or something you'd only mention as a bonus.",
        establishes: "Basic emergency handling in scope",
        lp: ["customer-obsession"],
        branches: [
          { label: "Normal operation only", approach: "Elevator wouldn't need an out-of-service state at all. No emergency-triggered stop, no separate handling path for a fire alarm mid-trip." },
          { label: "Basic emergency handling (this)", approach: "Elevator needs to resolve to the nearest floor and flip to an out-of-service state when an emergency fires. That's exactly why isAvailable() has to mean more than just 'stops is empty', and why the emergency edge case exists in the model at all." },
        ],
      },
      {
        id: "storage-premature",
        ask: "Should elevator state be stored in a database, or just in memory?",
        category: "premature",
        redirect: "That's a persistence detail. Get the class responsibilities right first.",
      },
    ],
  },
  design: {
    entities: [
      {
        id: "building",
        name: "Building",
        isEntity: true,
        why: "Owns the floors and the bank of elevators, the physical structure the system operates within.",
        properties: [
          { name: "id", type: "string" },
          { name: "floors", type: "List<Floor>" },
          { name: "elevators", type: "List<Elevator>" },
        ],
      },
      {
        id: "dispatcher",
        name: "Dispatcher",
        isEntity: true,
        why: "Decides which elevator should serve each incoming request. It's the scheduling brain, kept separate from the elevators themselves.",
        properties: [
          { name: "id", type: "string" },
          { name: "elevators", type: "List<Elevator>" },
          { name: "pendingRequests", type: "List<Request>" },
        ],
      },
      {
        id: "elevator",
        name: "Elevator",
        isEntity: true,
        why: "A single car that tracks its current floor, direction, and the stops it still needs to make.",
        properties: [
          { name: "id", type: "string" },
          { name: "currentFloor", type: "int" },
          { name: "direction", type: "Direction" },
          { name: "stops", type: "List<Integer>" },
        ],
      },
      {
        id: "request",
        name: "Request",
        isEntity: true,
        why: "One call for service: a hall call (floor + direction) from outside, or a car call (destination floor) from inside.",
        properties: [
          { name: "id", type: "string" },
          { name: "floor", type: "int" },
          { name: "direction", type: "Direction" },
        ],
      },
      {
        id: "floor",
        name: "Floor",
        isEntity: true,
        why: "A level the building serves, the origin of a hall call's up/down button.",
        properties: [
          { name: "id", type: "string" },
          { name: "floorNumber", type: "int" },
        ],
      },
      { id: "door", name: "Door", isEntity: false, why: "A component of Elevator with no independent identity. Open/close become Elevator's own methods, not a separate class." },
      { id: "button", name: "Button", isEntity: false, why: "A physical UI element that triggers a Request, not a class with its own behavior in the domain model." },
      { id: "passenger", name: "Passenger", isEntity: false, why: "Nobody asked the system to track individual riders. Inventing per-person state adds scope nobody requested." },
      { id: "motor", name: "Motor", isEntity: false, why: "A hardware component below the abstraction level this design operates at, so it's out of scope for the object model." },
      { id: "maintlog", name: "MaintenanceLog", isEntity: false, why: "A logging concern, not a core class this prompt is about. Modeling it here is premature scope creep." },
    ],
    methods: [
      {
        id: "m1",
        signature: "getElevators(): List<Elevator>",
        ownerId: "building",
        justification: "Building holds the elevators list as its own field, so exposing it read-only is a plain accessor tied to data only Building holds.",
      },
      {
        id: "m2",
        signature: "assignElevator(request): Elevator",
        ownerId: "dispatcher",
        justification: "Dispatcher is the only object that can see every Elevator's state at once, so picking the best one for a request is squarely its job. No single Elevator should decide for itself whether it's the right pick.",
        codeExercise: {
          language: "java",
          starter: "Elevator assignElevator(Request request) {\n    // your code here\n}",
          reference:
            "Elevator assignElevator(Request request) {\n    Elevator best = null;\n    int bestDistance = Integer.MAX_VALUE;\n    for (Elevator elevator : elevators) {\n        if (!elevator.isAvailable()) {\n            continue;\n        }\n        int distance = Math.abs(elevator.getCurrentFloor() - request.getFloor());\n        if (distance < bestDistance) {\n            best = elevator;\n            bestDistance = distance;\n        }\n    }\n    return best;\n}",
          checklist: [
            "Skips elevators that aren't available, and never assigns a request onto a car that's already busy with other stops",
            "Picks the nearest available elevator by floor distance, not just the first one found",
            "Returns null (or otherwise signals no match) instead of crashing when every elevator is unavailable. enqueueRequest() is what retries later, per the all-busy edge case",
            "Bonus (L5+, not required here): factoring in each elevator's current direction, not just distance, for a smarter match",
          ],
        },
      },
      {
        id: "m3",
        signature: "enqueueRequest(request): void",
        ownerId: "dispatcher",
        justification: "pendingRequests lives on Dispatcher's own field, so only Dispatcher should be the one appending to its own queue. Same encapsulation reasoning as a ParkingLot owning its own list of levels.",
      },
      {
        id: "m4",
        signature: "moveToNextStop(): void",
        ownerId: "elevator",
        justification: "stops, direction, and currentFloor are Elevator's own fields, so advancing to the next stop is a state transition only the class holding that state should perform.",
        codeExercise: {
          language: "java",
          starter: "void moveToNextStop() {\n    // your code here\n}",
          reference:
            "void moveToNextStop() {\n    List<Integer> ahead = new ArrayList<>();\n    for (int floor : stops) {\n        boolean isAhead = direction == Direction.UP ? floor > currentFloor : floor < currentFloor;\n        if (isAhead) ahead.add(floor);\n    }\n    if (ahead.isEmpty() && !stops.isEmpty()) {\n        direction = direction == Direction.UP ? Direction.DOWN : Direction.UP;\n        moveToNextStop();\n        return;\n    }\n    if (!ahead.isEmpty()) {\n        int next = direction == Direction.UP ? Collections.min(ahead) : Collections.max(ahead);\n        currentFloor = next;\n        stops.remove(Integer.valueOf(next));\n    }\n}",
          checklist: [
            "Only considers stops that are ahead in the current direction of travel, not the whole queue indiscriminately",
            "Reverses direction only once there are no more stops ahead in the current direction, finishing the sweep before turning around",
            "Removes a stop from the queue once it's been served, so the elevator doesn't stop at the same floor twice",
            "Handles an empty stops list without crashing, since there's nothing to move toward",
          ],
        },
      },
      {
        id: "m5",
        signature: "addStop(floor): void",
        ownerId: "elevator",
        justification: "Adding to stops mutates Elevator's own queue. Dispatcher shouldn't reach in and mutate another object's internal list directly.",
      },
      {
        id: "m6",
        signature: "getCurrentFloor(): int",
        ownerId: "elevator",
        justification: "currentFloor is Elevator's own field, and a plain accessor belongs on the object that holds the data, not wherever happens to need it.",
      },
      {
        id: "m7",
        signature: "isAvailable(): boolean",
        ownerId: "elevator",
        justification: "Availability is derived purely from Elevator's own stops list. Dispatcher would have to reach into Elevator's internals to compute this itself, which is exactly what encapsulation is meant to prevent.",
      },
      {
        id: "m8",
        signature: "getDirection(): Direction",
        ownerId: "request",
        justification: "direction is data Request itself holds. It's part of what makes 'floor 5 up' and 'floor 5 down' two different requests, so the accessor belongs on the class whose field it's reading.",
      },
      {
        id: "m9",
        signature: "pressButton(direction): Request",
        ownerId: "floor",
        justification: "Constructing a Request is triggered by a specific Floor's own hall button. Floor is the class that knows its own floor number, so it's the one that turns a button press into a well-formed Request rather than some other class needing to know Floor's internals.",
      },
    ],
    edgeCases: [
      {
        id: "all-busy",
        scenario: "All elevators are currently full or busy on other floors when a new hall call comes in.",
        options: [
          { id: "a", label: "Ignore the request until an elevator happens to become free.", correct: false, feedback: "A request must be queued, not silently dropped. Otherwise a rider waits forever with no elevator ever assigned." },
          { id: "b", label: "Queue the request; Dispatcher assigns it once an elevator becomes available or is close enough as states update.", correct: true, feedback: "Right, the Dispatcher retries assignment as elevator states change, instead of discarding a request it can't serve immediately." },
          { id: "c", label: "Immediately dispatch every idle elevator to that floor at once.", correct: false, feedback: "Wastes capacity. Only one elevator should ever be assigned to a given request." },
        ],
      },
      {
        id: "opposite-direction",
        scenario: "Two hall calls come in for opposite directions on the same floor at nearly the same time.",
        options: [
          { id: "a", label: "Treat it as one request since it's the same floor.", correct: false, feedback: "Direction is part of what a hall call means. 'Up' and 'down' are different requests with potentially different destination elevators." },
          { id: "b", label: "Model them as two separate Request objects, since direction is part of a hall call's identity.", correct: true, feedback: "Right, Request needs a direction, and two requests from the same floor going opposite ways are genuinely different objects." },
          { id: "c", label: "Only honor whichever button was pressed first and ignore the second.", correct: false, feedback: "Both riders are waiting for genuinely different trips. Dropping one isn't correct behavior." },
        ],
      },
      {
        id: "reverse",
        scenario: "A passenger presses a car-call button for a floor, but the elevator is already moving in the opposite direction.",
        options: [
          { id: "a", label: "Immediately reverse direction to serve the new stop first.", correct: false, feedback: "Reversing mid-trip strands every other passenger's already-committed stop. That's a worse experience, not a fix." },
          { id: "b", label: "Add the new stop to the elevator's queue, to be served after it finishes its current direction's stops.", correct: true, feedback: "This is the standard elevator scheduling rule: finish the current sweep in one direction, then reverse." },
          { id: "c", label: "Reject the button press since the elevator is already moving.", correct: false, feedback: "The elevator can absolutely serve that floor, just not before its current stops. Rejecting loses a valid request." },
        ],
      },
      {
        id: "emergency",
        scenario: "The elevator is between floors when a fire alarm or emergency stop is triggered.",
        options: [
          { id: "a", label: "Continue to the nearest floor in the current direction of travel, open the doors, and take the elevator out of service.", correct: true, feedback: "Real elevator systems prioritize getting to a floor safely over completing the original request. This real-world constraint is what separates a strong answer from a memorized template." },
          { id: "b", label: "Stop immediately wherever it is, between floors.", correct: false, feedback: "Stopping between floors traps passengers. Always resolve to the nearest floor first." },
          { id: "c", label: "Finish serving all queued stops first, then handle the emergency.", correct: false, feedback: "An emergency overrides the normal queue. Safety takes priority over completing scheduled stops." },
        ],
      },
    ],
    relationships: [
      "Building has many Floors and many Elevators",
      "Dispatcher assigns each Request to exactly one Elevator",
      "Elevator maintains a queue of Requests as its stops",
      "Floor issues a Request when a hall button is pressed",
    ],
    tradeoffs: [
      {
        decision: "Dispatcher is a separate class instead of each Elevator independently deciding whether to accept a request.",
        reasoning: "Costs one more class, but a single Dispatcher can see every Elevator's state at once and pick the genuinely best one. If each Elevator decided independently, two could accept the same request, or none would, with no arbiter to break the tie.",
      },
      {
        decision: "Request is its own class instead of Dispatcher tracking a raw (floor, direction) pair.",
        reasoning: "Costs a class for what looks like two fields, but a hall call has its own identity and lifecycle (pending, assigned, served) that a raw pair can't represent, and 'floor 5 up' vs 'floor 5 down' needing to stay distinguishable is exactly why direction lives on Request.",
      },
      {
        decision: "Elevator holds its own queue of stops instead of Dispatcher tracking each elevator's itinerary centrally.",
        reasoning: "Centralizing every elevator's stops in Dispatcher would mean it duplicates state that's really about one elevator's own movement. Keeping stops on Elevator means moveToNextStop() and addStop() can enforce the sweep-then-reverse rule locally, without Dispatcher micromanaging motion it doesn't need to know about.",
      },
    ],
    principles: [
      {
        name: "Single Responsibility Principle",
        explanation: "Dispatcher only decides WHICH elevator serves a request, and Elevator only decides HOW it moves through its own stops. Neither class reaches into the other's job.",
      },
      {
        name: "Encapsulation",
        explanation: "addStop() and moveToNextStop() are the only ways to change an Elevator's stops queue. Dispatcher assigns requests to an elevator but never reaches in and reorders its stops directly.",
      },
      {
        name: "Separation of Concerns",
        explanation: "Request (what's being asked for) and Elevator (what's doing the serving) are separate classes with different lifecycles. A Request can sit pending before any Elevator is even assigned to it.",
      },
      {
        name: "Composition over inheritance",
        explanation: "Building HAS-A list of Elevators and Floors. The object graph mirrors the physical structure directly, instead of forcing an elevator-type inheritance hierarchy the prompt never asked for.",
      },
    ],
  },
  recap: [
    "Separating Dispatcher (the algorithm) from Elevator (the state) mirrors ParkingLot/Level and LockerLocation/Locker. The class that decides isn't the class that IS the resource.",
    "Direction is part of a hall call's identity. 'Floor 5 going up' and 'floor 5 going down' are two different requests, not one.",
    "The core scheduling rule: finish the current direction's sweep before reversing. That's the actual elevator algorithm interviewers are checking for.",
    "Real-world edge cases like emergencies are exactly what separates a memorized template from someone who's thought about the domain.",
  ],
  relatedLessons: ["parking-lot", "amazon-locker"],
};
