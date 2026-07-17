import type { SolidChapterMission } from "./solidChapterEngine";

/**
 * SOLID campaign chapters 2 through 5, all set in the same garage the
 * learner already operates. Every chapter continues the story: the garage
 * that got floor-owned search in Mission 1 now grows tariffs, new spot
 * types, more devices, and a payment vendor, and each growth spurt breaks
 * in the exact way one SOLID principle exists to prevent.
 */

const OCP_MISSION: SolidChapterMission = {
  id: "ocp",
  order: 2,
  title: "The Tariff Wars",
  principle: "Open/Closed Principle",
  hook: "Every new price rule edits the same method, and old prices keep breaking.",
  briefing: {
    headline: "The garage started charging real money.",
    body: "Mission 1 gave every floor its own search. Now the owners want revenue: a flat hourly rate at first, then an EV rate per kilowatt, then event-weekend pricing. Each rule landed as another branch inside the pay station's calculateFee() method. It worked, briefly.",
    beats: [
      "Watch three tariffs collide inside one method",
      "Choose how the next tariff ships",
      "Earn the Strategy pattern the honest way",
    ],
  },
  incident: {
    intro: "Event weekend starts tonight. The new event branch went into calculateFee() this morning. Run the fee suite.",
    board: [
      { id: "flat", label: "Flat hourly parking", before: "pass", detail: "The original rate still computes correctly." },
      { id: "ev", label: "EV charging fee", before: "fail", detail: "EV drivers are overcharged tonight: the event branch runs before the EV branch and double-counts the energy fee." },
      { id: "event", label: "Event weekend pricing", before: "pass", detail: "The new branch works for plain cars, which is what got tested." },
      { id: "receipt", label: "Receipt totals match charges", before: "fail", detail: "Receipts show the pre-event fee because a second copy of the fee logic lives in the receipt printer." },
    ],
    failureBanner: "The event branch broke EV pricing, a flow nobody touched. Three tariffs now share one method, and every new rule re-risks all the old ones.",
  },
  repair: {
    prompt: "Membership discounts arrive next month. Decide how tariffs ship from now on.",
    options: [
      {
        id: "policy-slot",
        label: "Give the pay station one TariffPolicy contract. Each tariff becomes its own small implementation that computes a fee.",
        correct: true,
        consequence: "calculateFee() shrinks to one line: ask the active policies for their fees. The flat, EV, and event rules move into their own classes, and the receipt printer reads the same result instead of recomputing it.",
      },
      {
        id: "another-branch",
        label: "Add the membership discount as one more branch inside calculateFee(), like the last three.",
        correct: false,
        consequence: "The suite reruns: four tariffs now interact in eleven branch paths, and the EV-during-event combination fails again in a new way. Every future tariff means re-testing every old one, and the method nobody dares touch keeps growing.",
      },
      {
        id: "copy-station",
        label: "Copy the pay station per tariff: EventPayStation, EvPayStation, MemberPayStation.",
        correct: false,
        consequence: "Three stations drift apart within a sprint. A rounding bug in receipt totals now has to be found and fixed three times, and an EV member during an event has no station at all.",
      },
    ],
  },
  rerun: {
    summary: "Rerun the same fee suite with TariffPolicy in place.",
    before: "3 tariffs, 1 method, every new rule edits working code",
    after: "3 policy classes, 0 edits to the pay station, membership ships as a 4th class",
  },
  transfer: {
    prompt: "Hints off. The gate team has the same disease: a valet lane arrives, and the plan is a new branch inside GateController.decideLane(). Ship the valet lane.",
    options: [
      {
        id: "lane-policy",
        label: "Give GateController a LanePolicy contract and make valet routing its own implementation.",
        correct: true,
        consequence: "Correct. GateController stays closed while the valet lane ships as new code. Same shape as the tariffs, different corner of the garage.",
      },
      {
        id: "lane-branch",
        label: "Add the valet branch to decideLane(). It is only one if-statement.",
        correct: false,
        consequence: "The rerun shows the airport-shuttle lane misrouting a week later, broken by the valet branch. One if-statement is how the tariff war started too.",
      },
      {
        id: "lane-copy",
        label: "Fork GateController into ValetGateController for the valet floor.",
        correct: false,
        consequence: "Two controllers drift: the barrier-safety fix next month lands in one and not the other. The rerun flags the fork as a duplicate-maintenance risk.",
      },
    ],
    success: "Correct. GateController stays closed while the valet lane ships as new code. Same shape as the tariffs, different corner of the garage.",
  },
  pattern: {
    unlockedName: "Strategy",
    prompt: "You just shipped interchangeable fee calculations behind one contract, selected by context, with the caller closed to edits. What did you build?",
    options: [
      { id: "strategy", label: "Strategy", correct: true, consequence: "That is Strategy: one stable operation, many interchangeable implementations, varying independently of the caller. You built it because branches kept breaking each other, not because a book listed it." },
      { id: "factory", label: "Factory", correct: false, consequence: "A Factory would choose WHICH TariffPolicy to construct from config. Useful next, but the interchangeable-behavior part you just built is Strategy." },
      { id: "decorator", label: "Decorator", correct: false, consequence: "Decorator stacks extra behavior onto one object while keeping its type. Your tariffs replace each other, they do not wrap each other." },
      { id: "singleton", label: "Singleton", correct: false, consequence: "Instance count was never the problem. The problem was branches multiplying inside working code." },
    ],
    whenToUse: "Use Strategy when an algorithm genuinely varies and callers should depend on one stable operation.",
    whenNotToUse: "Skip it for one fixed calculation with no realistic variation. A focused method is simpler and honest.",
  },
  debrief: {
    headline: "New behavior is new code, not new branches.",
    body: "The pay station is now closed to modification and open to extension. Every tariff that arrives from here on is a class that did not exist yesterday, and the code that worked yesterday is untouched today.",
    mappings: [
      { domain: "One pay station, many tariff cards", software: "one stable caller, many TariffPolicy implementations" },
      { domain: "A new tariff card slots in", software: "a new class implements the contract" },
      { domain: "Old tariffs keep working untouched", software: "closed for modification" },
      { domain: "The card slot itself", software: "the TariffPolicy interface" },
    ],
    javaSnippet:
      "interface TariffPolicy {\n  Money feeFor(ParkingSession session);\n}\n\nclass EvChargingTariff implements TariffPolicy {\n  Money feeFor(ParkingSession session) {\n    return session.energyUsed().times(RATE_PER_KWH);\n  }\n}\n\n// PayStation stays closed:\nMoney total = activePolicies.stream()\n    .map(p -> p.feeFor(session))\n    .reduce(Money.ZERO, Money::add);",
    defense:
      "\"Pricing rules change often and independently, so each tariff is its own TariffPolicy implementation. The pay station depends on the contract and never changes when a tariff ships. The event-weekend incident is my evidence: when the rules shared one method, a new rule broke an old one that nobody touched.\"",
  },
  interview: {
    prompt: "Defend how the garage prices parking now. Why does a new tariff not risk the old ones, and what would you say to someone proposing one more if-branch?",
    rubric: [
      { id: "new-code", label: "A new variant is new code, not a new branch", keywords: [["new class", "new implementation", "own class", "new policy", "separate class", "its own"], ["branch", "if", "conditional", "edit", "modif"]] },
      { id: "stable-caller", label: "The stable caller stays untouched", keywords: [["pay station", "caller", "existing", "stable", "working code", "old"], ["untouched", "unchanged", "closed", "not change", "never change", "no edit", "stays"]] },
      { id: "contract", label: "Names the contract the variants share", keywords: [["tariffpolicy", "interface", "contract", "abstraction"]] },
      { id: "regression", label: "Argues from the regression evidence", keywords: [["regress", "broke", "broken", "re test", "retest", "risk", "event", "ev"]] },
    ],
    modelAnswer:
      "Each tariff is its own TariffPolicy implementation behind one contract, so a new price rule is a new class instead of a new branch. The pay station depends on the interface and stays untouched when tariffs ship, which matters because our event branch broke EV pricing exactly the way shared conditionals always do: an edit for one rule regressed another. If someone proposes one more if-branch, my answer is that the last if-branch cost us an overcharge incident, and a policy class costs nothing extra.",
  },
};

const LSP_MISSION: SolidChapterMission = {
  id: "lsp",
  order: 3,
  title: "The Impostor Spot",
  principle: "Liskov Substitution Principle",
  hook: "A new kind of parking spot claims the contract, then breaks its promise.",
  briefing: {
    headline: "The valet floor shipped a new spot type.",
    body: "A vendor delivered ReservedSpot for the new valet floor. It implements the same ParkingSpot contract every other spot honors, so the entry flow from Mission 1 should just work. Should.",
    beats: [
      "Run the entry flow against the new subtype",
      "Watch a contract break without a single caller changing",
      "Repair the subtype, not the callers",
    ],
  },
  incident: {
    intro: "The valet floor opens this morning. ReservedSpot passes compile, claims ParkingSpot, and slots into the same Level lists. Run the entry suite.",
    board: [
      { id: "normal-assign", label: "Assign to a standard spot", before: "pass", detail: "Every original spot honors assign() exactly as Mission 1 left it." },
      { id: "reserved-assign", label: "Assign to a ReservedSpot", before: "fail", detail: "ReservedSpot.assign() throws NeedsManagerKey. The car is stuck at the barrier and the spot now reports occupied with no ticket issued." },
      { id: "release", label: "Release on exit", before: "fail", detail: "The half-claimed ReservedSpot cannot be released because no session owns it." },
      { id: "search", label: "findSpot() counts free spots", before: "pass", detail: "Search still works: ReservedSpot reported itself free, which is how the car got sent to it." },
    ],
    failureBanner: "No caller changed. The entry flow that works for every other spot corrupted state the moment a subtype stopped honoring the promise it inherited.",
  },
  repair: {
    prompt: "The vendor asks how to fix ReservedSpot. Choose the repair.",
    options: [
      {
        id: "honor-contract",
        label: "Make ReservedSpot honor the promise: it reports free=false unless the reservation matches, and assign() either fully claims the spot or refuses cleanly up front.",
        correct: true,
        consequence: "The subtype now models reservation as availability, which the contract already expresses. Callers keep calling the same methods, and a reserved spot simply never shows up as free to the wrong car.",
      },
      {
        id: "instanceof-check",
        label: "Teach the entry flow to check instanceof ReservedSpot and skip those spots.",
        correct: false,
        consequence: "The rerun passes today and fails next quarter: every caller that touches spots now needs the check, and the next subtype adds another one. The contract stops meaning anything, which is the exact disease with a workaround on top.",
      },
      {
        id: "catch-retry",
        label: "Catch the NeedsManagerKey exception at the gate and retry another spot.",
        correct: false,
        consequence: "The rerun shows the half-claimed state leaking: the throwing spot already marked itself occupied, so capacity counts drift and the last-spot race from Mission 1 comes back through the side door.",
      },
    ],
  },
  rerun: {
    summary: "Rerun the entry suite with the honest subtype, same callers, zero caller edits.",
    before: "1 subtype broke 2 flows without any caller changing",
    after: "both spot kinds pass through the same caller code, no instanceof anywhere",
  },
  transfer: {
    prompt: "Hints off. Facilities wants CompactSpot to accept large vehicles anyway, because 'it mostly fits and we sell more tickets'. The large car then blocks the aisle. Decide.",
    options: [
      {
        id: "truthful-contract",
        label: "CompactSpot keeps telling the truth: its size is compact, compatibility says no, and the large car is routed to a real large spot.",
        correct: true,
        consequence: "Correct. A subtype that quietly accepts inputs it cannot actually serve is the same broken promise in the other direction. The contract only works if every implementation tells the truth through it.",
      },
      {
        id: "accept-anyway",
        label: "Let CompactSpot accept the large vehicle and hope drivers park carefully.",
        correct: false,
        consequence: "The world runs it: the aisle blocks, two floors of throughput die, and the failure surfaces far from the lie that caused it. The spot claimed a capability it does not have.",
      },
      {
        id: "gate-special-case",
        label: "Keep the acceptance but add a special case at the gate for large-into-compact.",
        correct: false,
        consequence: "Now the gate owns spot-compatibility logic that ParkingSpot already owns, two sources of truth drift, and the next spot type needs another special case. Callers are patching a lying subtype.",
      },
    ],
    success: "Correct. A subtype that quietly accepts inputs it cannot actually serve is the same broken promise in the other direction. The contract only works if every implementation tells the truth through it.",
  },
  debrief: {
    headline: "Any spot, same promise.",
    body: "The entry flow never needed to know which kind of spot it held, and after the repair it still does not. That is the whole principle: a subtype may do less waiting or more logging, but it may never demand more from callers or deliver less than the contract promised.",
    mappings: [
      { domain: "Any spot the search returns is safe to assign", software: "subtypes are substitutable through the base contract" },
      { domain: "A reserved spot just never looks free", software: "model the difference inside the contract, not as a surprise veto" },
      { domain: "The gate never asks what kind of spot it got", software: "no instanceof in callers, ever" },
      { domain: "The same entry suite passes for every spot kind", software: "one caller test suite proves substitutability" },
    ],
    javaSnippet:
      "class ReservedSpot implements ParkingSpot {\n  public boolean isFree() {\n    // Reservation is availability, not a veto at assign time.\n    return reservation == null && currentVehicle == null;\n  }\n\n  public void assign(Vehicle vehicle) {\n    if (!isFree() || !canFit(vehicle)) {\n      throw new IllegalStateException(\"assign() on unavailable spot\");\n    }\n    currentVehicle = vehicle; // full claim, or clean refusal above\n  }\n}",
    defense:
      "\"ReservedSpot broke substitution: it claimed the ParkingSpot contract but vetoed assign() after reporting free. I repaired the subtype instead of the callers, modeling reservation as availability. My test is simple: the same entry suite must pass for every spot kind with zero instanceof checks.\"",
  },
  interview: {
    prompt: "Defend the repair. Why did you change ReservedSpot instead of teaching the entry flow to handle it, and how do you test that a new spot type is safe?",
    rubric: [
      { id: "contract", label: "Frames it as a broken promise or contract", keywords: [["contract", "promise", "substitut", "liskov"]] },
      { id: "no-checks", label: "Rejects type checks in callers", keywords: [["instanceof", "type check", "check the type", "which kind", "special case"], ["no", "never", "avoid", "without", "reject", "instead"]] },
      { id: "subtype-fix", label: "Puts the fix in the subtype, not the callers", keywords: [["subtype", "reservedspot", "implementation", "spot itself"], ["fix", "repair", "honor", "honest", "truth", "model"]] },
      { id: "suite-evidence", label: "Uses one shared caller suite as the safety test", keywords: [["suite", "test", "same caller", "entry flow", "same code", "pass"]] },
    ],
    modelAnswer:
      "ReservedSpot claimed the ParkingSpot contract and then broke its promise, throwing on assign() after reporting itself free. Teaching the entry flow to check instanceof would spread the damage into every caller and make the contract meaningless, so the fix belongs in the subtype: reservation becomes part of availability, and assign() either fully claims or cleanly refuses. My safety test for any new spot type is the existing caller suite: it must pass unchanged, with no type checks added anywhere.",
  },
};

const ISP_MISSION: SolidChapterMission = {
  id: "isp",
  order: 4,
  title: "One Remote To Rule Them All",
  principle: "Interface Segregation Principle",
  hook: "One universal device contract forces every device to fake methods it cannot do.",
  briefing: {
    headline: "Facilities standardized every device onto one interface.",
    body: "The garage now runs gates, display boards, pay terminals, and plate cameras. Facilities shipped one universal GarageDevice contract with openBarrier(), displayMessage(), chargeCard(), and readPlate(), and every device must implement all four. The display board cannot charge a card. It implements chargeCard() anyway.",
    beats: [
      "Run the nightly device health check",
      "Watch fake methods hide a real hardware failure",
      "Split the contract by what each client actually needs",
    ],
  },
  incident: {
    intro: "The nightly health check calls every operation on every registered device, because the contract says every device has them. Run it.",
    board: [
      { id: "gate-barrier", label: "Gate: openBarrier()", before: "pass", detail: "The gate does the one thing it exists to do." },
      { id: "display-charge", label: "Display board: chargeCard()", before: "fail", detail: "Throws NotSupported. The health check flags a healthy display board as broken, every single night." },
      { id: "gate-display", label: "Gate: displayMessage()", before: "fail", detail: "The gate has no screen, so its displayMessage() is an empty method that returns success. Tonight that silent no-op masked the ACTUAL broken display board by the exit ramp." },
      { id: "terminal-charge", label: "Pay terminal: chargeCard()", before: "pass", detail: "The one device that really charges cards, lost in the noise of fake failures." },
    ],
    failureBanner: "Half the health report is noise from methods devices never had, and a silent no-op hid real broken hardware. The fat contract manufactured both problems.",
  },
  repair: {
    prompt: "Facilities asks how to make the health check trustworthy. Choose the repair.",
    options: [
      {
        id: "split-contracts",
        label: "Split GarageDevice into small contracts: BarrierControl, MessageDisplay, PaymentTerminal, PlateReader. Each device implements only what it really does.",
        correct: true,
        consequence: "The health check now asks each device only for the contracts it declares. A failure finally means real broken hardware, and no device carries a method it has to fake.",
      },
      {
        id: "not-supported",
        label: "Keep the fat interface and standardize on throwing NotSupported from methods a device lacks.",
        correct: false,
        consequence: "The rerun shows every caller growing try/catch scaffolding, and the health check still cannot tell 'unsupported by design' from 'supported but broken'. The noise is now structured noise.",
      },
      {
        id: "empty-defaults",
        label: "Add a base class with empty default implementations so devices compile cleanly.",
        correct: false,
        consequence: "The rerun is all green and the garage is lying to you: the broken exit-ramp display still reports success from its inherited no-op. Silent defaults ship real failures to production.",
      },
    ],
  },
  rerun: {
    summary: "Rerun the health check against the split contracts.",
    before: "4 devices faking 9 methods, 1 real failure hidden",
    after: "each device answers only for itself, the broken display is the only red row",
  },
  transfer: {
    prompt: "Hints off. The mobile team wants one GarageApi interface with entry, billing, and reporting methods, implemented by every backend service. Decide.",
    options: [
      {
        id: "split-by-client",
        label: "Give each client its own contract: EntryApi for the gate app, BillingApi for payments, ReportsApi for the office dashboard.",
        correct: true,
        consequence: "Correct. Each client depends on exactly what it uses, and a reporting change can never force a redeploy of the entry path. Same disease as the devices, same cure.",
      },
      {
        id: "one-god-api",
        label: "Ship the single GarageApi. One interface is easier to document.",
        correct: false,
        consequence: "The world runs it: the entry app now recompiles every time a report field changes, and the billing service implements report methods it serves with empty lists. The fat contract is back with HTTP in front of it.",
      },
      {
        id: "api-defaults",
        label: "One interface, but with default empty responses for methods a service does not really serve.",
        correct: false,
        consequence: "An office dashboard quietly renders empty reports from a service that never implemented them. Silent defaults did to the API exactly what they did to the display board.",
      },
    ],
    success: "Correct. Each client depends on exactly what it uses, and a reporting change can never force a redeploy of the entry path. Same disease as the devices, same cure.",
  },
  debrief: {
    headline: "Each device signs only for what it does.",
    body: "Interfaces exist for the clients that call them, not for the convenience of a master list. When a contract is small enough that every implementer honors all of it, fake methods disappear, and failure reports mean what they say.",
    mappings: [
      { domain: "The display board never signs up to charge cards", software: "no client depends on methods it never uses" },
      { domain: "The health check asks each device only what it declared", software: "clients consume narrow, role-based contracts" },
      { domain: "A red row now means broken hardware", software: "unsupported and broken are distinguishable again" },
      { domain: "One universal remote", software: "the fat-interface smell" },
    ],
    javaSnippet:
      "interface BarrierControl { void openBarrier(); }\ninterface MessageDisplay { void displayMessage(String text); }\ninterface PaymentTerminal { Receipt chargeCard(Money amount); }\n\nclass DisplayBoard implements MessageDisplay {\n  // Nothing to fake: this is the whole contract it can honor.\n  public void displayMessage(String text) { panel.render(text); }\n}",
    defense:
      "\"The universal GarageDevice contract forced fake methods, and fake methods produced both false alarms and a hidden real failure. I split it into role contracts sized to their clients, so every implementation honors everything it signs and a health-check failure is real information again.\"",
  },
  interview: {
    prompt: "Defend the split. What did the fat interface actually cost, and how do you decide where one contract ends and the next begins?",
    rubric: [
      { id: "client-shaped", label: "Sizes contracts by what clients use", keywords: [["client", "caller", "each device", "who uses", "consumer"], ["need", "uses", "actually", "only", "small", "narrow", "role"]] },
      { id: "no-fakes", label: "Names the fake-method cost", keywords: [["fake", "notsupported", "not supported", "empty", "no op", "noop", "throw", "stub"]] },
      { id: "hidden-failure", label: "Connects silent defaults to hidden real failures", keywords: [["hidden", "hide", "mask", "silent", "false alarm", "noise", "broken display", "real failure"]] },
      { id: "boundary", label: "Gives a rule for drawing the boundary", keywords: [["split", "boundary", "separate", "per role", "per client", "one contract", "segregat"]] },
    ],
    modelAnswer:
      "The fat interface cost us twice: devices threw or faked methods they never had, which filled the health report with noise, and one silent no-op masked a genuinely broken display. I split the contract along client needs, BarrierControl for the gate path, MessageDisplay for screens, PaymentTerminal for charging, so every implementer honors everything it signs. My boundary rule is the client: when a caller consumes only part of a contract, that part wants to be its own interface.",
  },
};

const DIP_MISSION: SolidChapterMission = {
  id: "dip",
  order: 5,
  title: "The Outage at Exit Rush",
  principle: "Dependency Inversion Principle",
  hook: "The exit flow is welded to one payment vendor, and the vendor just went down.",
  briefing: {
    headline: "5pm. Acme Payments is down. Nobody can leave.",
    body: "The pay station constructs AcmePayClient inside its own code and calls acme.sendCharge() directly. Acme's API has a 40 minute outage, the exit queue is backing onto the street, and the team cannot even test a fix because the exit flow only runs against real Acme credentials.",
    beats: [
      "Watch one concrete dependency stop the whole garage",
      "Invert the arrow: the garage owns the contract",
      "Earn the Adapter pattern the honest way",
    ],
  },
  incident: {
    intro: "Exit rush is live and Acme is timing out. Run the exit suite.",
    board: [
      { id: "charge-exit", label: "Charge on exit", before: "fail", detail: "acme.sendCharge() times out. Barriers stay down. The queue is 14 cars and growing." },
      { id: "cash-fallback", label: "Fall back to the cash box", before: "fail", detail: "There is no seam to swap anything in: the vendor client is constructed inside the exit flow itself." },
      { id: "test-exit", label: "Test the exit flow in CI", before: "fail", detail: "Tests need live Acme credentials, so the team is debugging the outage against production." },
      { id: "receipts", label: "Issue receipts", before: "pass", detail: "Receipts work, for the cars that manage to pay." },
    ],
    failureBanner: "Two different symptoms, one cause: the high-level exit flow depends directly on a low-level vendor detail. When the detail died, the domain died with it.",
  },
  repair: {
    prompt: "The queue is still growing. Choose the structural repair.",
    options: [
      {
        id: "payment-port",
        label: "The garage owns a PaymentPort contract (charge(amount) returns a receipt). AcmeAdapter implements it, a CashboxAdapter implements it, and the pay station receives its port from outside.",
        correct: true,
        consequence: "The arrow flips: the exit flow depends on a contract the garage owns, and Acme becomes one replaceable plug. The cashbox adapter goes in tonight, and CI runs against a test adapter with zero network.",
      },
      {
        id: "retry-wrapper",
        label: "Wrap every acme call in try/catch with an exponential retry loop.",
        correct: false,
        consequence: "The rerun shows the queue still frozen: retrying a dead vendor is still depending on a dead vendor. Tests still need credentials, and the exit flow is still married to Acme.",
      },
      {
        id: "second-vendor-branch",
        label: "Add a second vendor SDK next to Acme with an if(acmeIsDown) branch in the exit flow.",
        correct: false,
        consequence: "Now the exit flow constructs two concrete vendors and owns the failover logic for both. Every new provider edits the domain again, which is the tariff-wars disease wearing a payments costume.",
      },
    ],
  },
  rerun: {
    summary: "Rerun exit rush with the port in place and the cashbox adapter plugged in.",
    before: "exit flow constructs the vendor, outage stops the garage, CI needs credentials",
    after: "exit flow sees only PaymentPort, cashbox clears the queue, CI runs on a test adapter",
  },
  transfer: {
    prompt: "Hints off. The plate-recognition camera arrives next sprint, with its own vendor SDK. The team is about to call vendorCam.scan() inline from the entry flow. Decide.",
    options: [
      {
        id: "plate-port",
        label: "The garage owns a PlateReaderPort. The vendor SDK gets an adapter, and the entry flow receives the port.",
        correct: true,
        consequence: "Correct. The entry flow stays testable without a camera on your desk, and the camera vendor is now swappable the same way the payment vendor is.",
      },
      {
        id: "inline-sdk",
        label: "Call the camera SDK inline. It is just one method call.",
        correct: false,
        consequence: "One method call was how Acme got welded in. The rerun shows entry-flow tests now needing camera hardware, and the next outage belongs to the gate.",
      },
      {
        id: "static-helper",
        label: "Hide the SDK behind a static CameraUtils.scan() helper.",
        correct: false,
        consequence: "A static helper is still a hard-wired concrete dependency, just with a nicer name. Nothing can be substituted in tests or during an outage.",
      },
    ],
    success: "Correct. The entry flow stays testable without a camera on your desk, and the camera vendor is now swappable the same way the payment vendor is.",
  },
  pattern: {
    unlockedName: "Adapter",
    prompt: "AcmeAdapter translates the garage's PaymentPort calls into Acme's SDK calls. What did you build?",
    options: [
      { id: "adapter", label: "Adapter", correct: true, consequence: "That is Adapter: it converts the interface a vendor provides into the contract your domain owns. You built it because the domain must not speak vendor, not because the pattern catalog said so." },
      { id: "facade", label: "Facade", correct: false, consequence: "Close cousin, different job. A Facade simplifies a whole subsystem behind one front door. The adapter translates one contract into another, one to one." },
      { id: "proxy", label: "Proxy", correct: false, consequence: "A Proxy stands in for the same interface to control access to it. Your adapter changes the interface, which is the defining difference." },
      { id: "strategy", label: "Strategy", correct: false, consequence: "The interchangeable-implementations part is real, but what you specifically built around the vendor SDK is the translation layer, and that is Adapter." },
    ],
    whenToUse: "Use Adapter when your domain owns a contract and an external thing speaks a different one.",
    whenNotToUse: "Skip it when you control both sides. Just make the interfaces agree instead of translating between them.",
  },
  debrief: {
    headline: "The garage owns the socket. Vendors bring the plug.",
    body: "High-level policy no longer imports low-level detail. The exit flow depends on PaymentPort, a contract the domain owns, and every vendor is an adapter that plugs into it. The outage proved the direction of the arrow is not academic: it is whether the garage stays open.",
    mappings: [
      { domain: "The garage's own payment socket", software: "a domain-owned PaymentPort interface" },
      { domain: "Acme's plug, the cashbox's plug", software: "adapters implementing the port" },
      { domain: "Swapping plugs during the outage", software: "substituting implementations at the boundary" },
      { domain: "Testing exits with a fake plug", software: "a test double behind the same port" },
    ],
    javaSnippet:
      "// The domain owns this contract:\ninterface PaymentPort {\n  Receipt charge(Money amount, PaymentMethod method);\n}\n\nclass AcmeAdapter implements PaymentPort {\n  private final AcmePayClient acme;\n  public Receipt charge(Money amount, PaymentMethod method) {\n    return toReceipt(acme.sendCharge(toAcmeRequest(amount, method)));\n  }\n}\n\n// PayStation receives its port; it never constructs a vendor:\nPayStation station = new PayStation(paymentPort);",
    defense:
      "\"The exit flow used to construct its own vendor client, so a vendor outage stopped the garage and testing needed live credentials. I inverted the dependency: the domain owns PaymentPort, vendors implement it through adapters, and the pay station receives its port. During the outage we swapped in the cashbox adapter without touching the exit flow.\"",
  },
  interview: {
    prompt: "Defend the inversion. Who owns the payment contract now, why does that direction matter, and what changed for testing?",
    rubric: [
      { id: "domain-owns", label: "The domain owns the contract", keywords: [["domain", "garage", "exit flow", "pay station", "high level"], ["own", "owns", "defines", "port", "contract", "interface"]] },
      { id: "detail-implements", label: "Concrete details implement it from outside", keywords: [["adapter", "vendor", "acme", "implement", "plug", "concrete", "infrastructure"]] },
      { id: "substitution", label: "Substitution during outage or change", keywords: [["swap", "substitut", "replace", "cashbox", "fallback", "outage", "second vendor", "new vendor"]] },
      { id: "testability", label: "Names the testability payoff", keywords: [["test", "ci", "fake", "double", "mock", "credential", "without the vendor", "no network"]] },
    ],
    modelAnswer:
      "The garage owns PaymentPort now, and that direction is the whole point: high-level exit policy defines the contract, and vendors implement it from the outside through adapters. When Acme died we swapped in the cashbox adapter without editing the exit flow, which is substitution the old design made impossible. Testing changed the same way: CI runs the full exit flow against a test adapter with no network and no credentials, because the domain never constructs its own vendor.",
  },
};

export const SOLID_CHAPTER_MISSIONS: SolidChapterMission[] = [
  OCP_MISSION,
  LSP_MISSION,
  ISP_MISSION,
  DIP_MISSION,
];

export function getSolidChapterMission(id: string): SolidChapterMission | undefined {
  return SOLID_CHAPTER_MISSIONS.find((mission) => mission.id === id);
}
