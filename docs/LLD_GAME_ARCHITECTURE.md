# LLD Game Architecture

## Product promise

System Forge teaches the repeatable thinking process used in an LLD interview. It does not reward memorizing a diagram or selecting a disguised multiple-choice answer.

The learner should finish a mission able to:

1. turn an ambiguous prompt into explicit requirements;
2. separate actors, values, entities, and out-of-scope nouns;
3. give every class one clear responsibility;
4. choose properties from the state a class must protect;
5. choose methods from the behavior and invariants a class owns;
6. model composition, association, dependency, and inheritance intentionally;
7. run realistic scenarios and edge cases through the object model;
8. change the design without casually rewriting stable classes;
9. introduce a design pattern only when a concrete variation or failure requires it;
10. explain the design, alternatives, and trade-offs in interview language.

## Core game loop

The game is a persistent simulation, not a sequence of forms. The learner sees a running world and its architecture blueprint at the same time.

### Beginner contract

Guided mode must assume the learner has never heard the words LLD, class, object, property, method, SOLID, or SRP.

- Start with one concrete object and define every term beside the example.
- Use plain-language names first; show Java names as secondary supporting detail.
- Reveal only the classes and code pieces required by the current incident.
- Keep code pieces locked until the learner runs the world and observes the failure.
- After a failure, highlight only the pieces that caused it and explain exactly where each belongs and why.
- Hide architecture metrics and pattern names until the learner has experienced the problem they describe.

The learning sequence is therefore: **see a real thing → learn its words → run it → observe a failure → repair it → name the principle**.

### 1. Reproduce an incident

The learner dispatches a real event into the world: rush-hour entry, an oversized vehicle, two cars racing for the last spot, overnight checkout, a pricing change, or a gateway outage.

The system animates the event and shows the actual call trace. A failure is phrased as a domain consequence—double booking, invalid occupancy, frozen entry, or an incorrect duration—not as “wrong answer.”

### 2. Inspect the broken boundary

The blueprint highlights the properties and methods that participated in the failure. It explains which state or invariant became unsafe without presenting a list of possible answers.

The learner is allowed to make a bad refactor. The world, not a red quiz label, demonstrates why it is bad.

### 3. Refactor by direct manipulation

The learner picks up or drags an actual typed property or Java method between live class modules. The generated Java changes immediately.

Class modules display a one-sentence responsibility, their owned state, and their behavior. Cohesion rises and leaked responsibilities fall as the model improves.

### 4. Rerun the same incident

The same event is dispatched again. It passes only if the required data and invariant are protected by their owning objects. A learner cannot progress by clicking Next after a wrong response.

### 5. Survive a change storm

After core behavior works, a new requirement or infrastructure failure attacks the system. The learner must contain the change without breaking stable parking flows.

Patterns are revealed only after the architecture has earned them. For example, installing fee calculation behind `PricingPolicy` allows a new EV rate implementation without editing parking or payment code; the game then names the discovered mechanism as Strategy.

### 6. Defend from evidence

After all incidents pass, the learner explains the design in free form. A strong answer cites an owner, the state or invariant it protects, a failure observed in the simulation, and a future change that is now contained.

### Anti-MCQ acceptance rule

A mechanic is rejected if the learner can complete it by selecting one labeled answer from a supplied list. In particular:

- no class-owner dropdowns;
- no Include/Exclude relationship buttons;
- no “pick the correct pattern” panels;
- no finished explanations with blank placeholders;
- no progression after an incorrect decision without repairing and rerunning the world.

Direct manipulation is not enough by itself. Every architectural action must cause a visible, testable change in the simulation.

## SOLID campaign

SOLID is the first campaign. HLD and LeetCode remain separate locked tracks until this campaign has a complete, tested learning loop.

### Chapter 1 — Single Responsibility Principle

**Mission:** Parking lot.

**Player experience:** Separate allocation, session tracking, pricing, and payment. Run a normal parking flow, then add EV charging and event pricing. The game visualizes how a god object causes unrelated regressions.

**Interview signal:** “These behaviors change for different reasons.”

### Chapter 2 — Open/Closed Principle

**Mission:** Coupon and pricing engine.

**Player experience:** Start with one pricing rule, then add weekend, membership, event, and EV tariffs. A branch-heavy solution grows red change paths. A `PricingPolicy` contract lets the learner add a new implementation without editing stable callers.

**Pattern earned:** Strategy; Factory only when runtime policy selection appears.

**Interview signal:** “A new variant is a new implementation, not a new branch in working code.”

### Chapter 3 — Liskov Substitution Principle

**Mission:** Parking spot capabilities and payment providers.

**Player experience:** Swap implementations inside the same scenario suite. A subtype that rejects a valid base-class operation or changes promised behavior fails contract tests. The learner repairs the abstraction instead of adding caller-side type checks.

**Interview signal:** “Every implementation preserves the contract expected by the caller.”

### Chapter 4 — Interface Segregation Principle

**Mission:** Vending hardware and notification channels.

**Player experience:** A large interface forces display, dispenser, payment, and inventory adapters to implement irrelevant methods. The learner splits the interface into small client-specific capabilities and sees fake methods disappear.

**Interview signal:** “A client depends only on the operations it actually uses.”

### Chapter 5 — Dependency Inversion Principle

**Mission:** Payment and persistence boundaries.

**Player experience:** A domain service initially constructs a concrete gateway. Provider failure and tests expose the coupling. The learner introduces a domain-owned port, injects an adapter, and swaps in a deterministic fake during scenario tests.

**Pattern earned:** Adapter or Facade when the external API shape requires it.

**Interview signal:** “The stable domain owns the contract; external details implement it.”

## Fifteen-day LLD path

The campaign is designed for one focused session per day.

| Day | Focus | Deliverable |
| --- | --- | --- |
| 1 | Interview flow and scope | Ask useful clarification questions for Parking Lot |
| 2 | Entities versus values | Produce a scoped domain vocabulary |
| 3 | Properties and invariants | Build `ParkingSpot`, `Vehicle`, and `Ticket` state |
| 4 | Methods and responsibility | Place behaviors using information ownership |
| 5 | Relationships | Build the Parking Lot object graph |
| 6 | SRP | Split allocation, pricing, payment, and session responsibilities |
| 7 | OCP | Add tariff variants without changing stable callers |
| 8 | LSP | Pass a shared contract test suite with interchangeable implementations |
| 9 | ISP | Split a broad hardware/service interface by client need |
| 10 | DIP | Inject payment and persistence ports |
| 11 | Strategy and Factory | Earn patterns from real variation and construction pressure |
| 12 | State and Observer | Model lifecycle rules and event notification |
| 13 | Full Parking Lot mock | Complete clarification through code skeleton |
| 14 | Elevator or Vending transfer mission | Apply the same process to an unfamiliar system |
| 15 | Timed interview | Defend design, edge cases, patterns, and trade-offs aloud |

## Difficulty progression

The same mission can run in four modes:

1. **Guided:** the coach explains each tool and narrows the workspace;
2. **Assisted:** hints are available, but the learner creates the model;
3. **Interview:** only the prompt and interviewer responses are shown;
4. **Mutation gauntlet:** changing requirements and failures arrive under time pressure.

Hints disappear gradually. The learner never jumps directly from definitions to a blank diagram.

## Content architecture

Mission content must be data-driven so the engine can support Parking Lot, Elevator, Vending Machine, Amazon Locker, Library, Chess, ATM, and future company-specific prompts without rebuilding the UI.

Each mission supplies:

- prompt and interviewer responses;
- domain candidates and why they are or are not classes;
- reference properties, methods, and relationships;
- runnable scenarios and invariants;
- SOLID mutations;
- pattern triggers and trade-offs;
- a scoring rubric;
- complete reference explanations.

Reference content stays hidden until the learner commits an attempt.

## Scoring model

The score measures design evidence, not clicks:

- 20% clarification and scope;
- 25% class and property model;
- 20% method ownership and invariants;
- 15% relationships and collaboration;
- 10% change containment under mutation;
- 10% interview explanation.

A mission is “interview ready” only when the learner completes the flow twice: once guided and once without hints.

## First vertical-slice acceptance criteria

The Parking Lot SRP mission is ready only when a first-time learner can:

1. explain what an object, class, property, method, and responsibility mean;
2. ask at least the scope questions that materially change the model;
3. create the six core types needed by the agreed scope;
4. assign properties and methods with an ownership explanation;
5. run entry, full-lot, size-mismatch, and concurrent-assignment scenarios;
6. experience an EV/pricing change that exposes mixed responsibilities;
7. refactor toward a focused pricing boundary;
8. see a generated Java skeleton based on their model;
9. give a free-form defense and compare it with a complete reference answer;
10. recover from mistakes without restarting the mission.

No screen may expose blank answer templates, contradictory step labels, hidden primary actions, or advanced metrics before the learner asks for them.
