import type { BenchConfig, SolidChapterMission } from "./solidChapterEngine";

/**
 * SOLID campaign chapters 2 through 5, all set in the garage the learner
 * already operates. The repair and transfer phases are WORKBENCHES: the
 * learner arranges the design and runs the world, and every scenario row is
 * computed from that arrangement. Nothing in these files marks an option
 * "correct"; correctness is whatever makes the same board pass on a rerun.
 */

// ---------------------------------------------------------------------------
// Chapter 2 · OCP · The Tariff Wars
// ---------------------------------------------------------------------------

const TARIFFS = [
  { id: "flat", name: "Flat hourly parking" },
  { id: "ev", name: "EV charging fee" },
  { id: "event", name: "Event weekend pricing" },
] as const;

const branchCount = (config: BenchConfig) => TARIFFS.filter((t) => config[t.id] === "branch").length;

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
      "Run the fee suite and watch tariffs collide",
      "Rearrange where each tariff lives, then rerun",
      "Earn the Strategy pattern the honest way",
    ],
  },
  incident: {
    intro: "Event weekend starts tonight. The event branch went into calculateFee() this morning. This is the fee suite as it stands.",
    failureBanner: "Branches sharing one method broke a flow nobody touched. You have the workbench: decide where each tariff lives, then rerun the same suite until it holds.",
  },
  repairBench: {
    intro: "Place each tariff, then run the fee suite. The suite reruns against whatever arrangement you choose.",
    controls: TARIFFS.map((tariff) => ({
      id: tariff.id,
      label: `Where does ${tariff.name.toLowerCase()} live?`,
      options: [
        { id: "branch", label: "A branch inside calculateFee()" },
        { id: "card", label: "Its own TariffPolicy implementation" },
      ],
      initial: "branch",
    })),
    rows: [
      ...TARIFFS.map((tariff) => ({
        id: `${tariff.id}-row`,
        label: tariff.name,
        evaluate: (config: BenchConfig) => {
          const asCard = config[tariff.id] === "card";
          const branches = branchCount(config);
          if (asCard) {
            return { pass: true, detail: `${tariff.name} computes in its own policy class, isolated from every other rule.` };
          }
          if (branches === 1) {
            return { pass: true, detail: `${tariff.name} is the only branch left, so nothing interacts with it. Yet.` };
          }
          const others = TARIFFS.filter((t) => t.id !== tariff.id && config[t.id] === "branch").map((t) => t.name.toLowerCase());
          return { pass: false, detail: `${tariff.name} shares calculateFee() with ${others.join(" and ")}. Branch order decides who double-counts whom, and this run it lost.` };
        },
      })),
      {
        id: "receipts",
        label: "Receipt totals match charges",
        evaluate: (config: BenchConfig) => {
          const branches = branchCount(config);
          return branches === 0
            ? { pass: true, detail: "The receipt printer reads the computed policy result instead of re-deriving fees itself." }
            : { pass: false, detail: `The receipt printer carries its own copy of the in-method fee logic, and it is ${branches} branch${branches === 1 ? "" : "es"} out of date.` };
        },
      },
      {
        id: "next-tariff",
        label: "Membership discount ships next month",
        evaluate: (config: BenchConfig) => {
          const branches = branchCount(config);
          return branches === 0
            ? { pass: true, detail: "A new tariff is a new class. calculateFee() does not change, so nothing old needs re-testing." }
            : { pass: false, detail: `Shipping it means editing a method that already holds ${branches} branch${branches === 1 ? "" : "es"}. Every old tariff goes back into the test plan.` };
        },
      },
    ],
    successNote: "The suite holds. calculateFee() shrank to one line that asks the active policies for their fees, and the receipt printer reads the same result.",
  },
  rerun: {
    before: "3 tariffs, 1 method, every new rule edits working code",
    after: "3 policy classes, 0 edits to the pay station, membership ships as a 4th class",
  },
  transferBench: {
    intro: "Hints off. The gate team has the same disease: valet and shuttle routing are about to land inside GateController.decideLane(). Arrange it, then run the lane suite.",
    controls: [
      {
        id: "valet",
        label: "Where does valet routing live?",
        options: [
          { id: "branch", label: "A branch inside decideLane()" },
          { id: "policy", label: "Its own LanePolicy implementation" },
        ],
        initial: "branch",
      },
      {
        id: "shuttle",
        label: "Where does airport-shuttle routing live?",
        options: [
          { id: "branch", label: "A branch inside decideLane()" },
          { id: "policy", label: "Its own LanePolicy implementation" },
        ],
        initial: "branch",
      },
    ],
    rows: [
      {
        id: "valet-row",
        label: "Valet lane routes correctly",
        evaluate: (config) =>
          config.valet === "policy" || config.shuttle !== "branch"
            ? { pass: true, detail: config.valet === "policy" ? "Valet routing is its own policy, untouched by other lanes." : "Valet is the only branch, so nothing collides with it. Yet." }
            : { pass: false, detail: "The valet and shuttle branches share decideLane(), and this run the shuttle condition swallowed a valet arrival." },
      },
      {
        id: "shuttle-row",
        label: "Airport shuttle routes correctly",
        evaluate: (config) =>
          config.shuttle === "policy" || config.valet !== "branch"
            ? { pass: true, detail: config.shuttle === "policy" ? "Shuttle routing is its own policy." : "Shuttle is the only branch left in the method." }
            : { pass: false, detail: "A week after the valet branch landed, the shuttle misroutes: the branches guard against each other now." },
      },
      {
        id: "gate-closed",
        label: "GateController stays closed to lane changes",
        evaluate: (config) =>
          config.valet === "policy" && config.shuttle === "policy"
            ? { pass: true, detail: "The next lane type is a new LanePolicy class. decideLane() never changes again." }
            : { pass: false, detail: "Any new lane type reopens decideLane(). This is exactly how the tariff war started." },
      },
    ],
    successNote: "Same shape as the tariffs, different corner of the garage: lanes vary as policies while the controller stays closed.",
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

// ---------------------------------------------------------------------------
// Chapter 3 · LSP · The Impostor Spot
// ---------------------------------------------------------------------------

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
      "Run the entry suite against the vendor's subtype",
      "Change how ReservedSpot honors the contract, then rerun",
      "Prove any new spot type safe with one caller suite",
    ],
  },
  incident: {
    intro: "The valet floor opens this morning. ReservedSpot compiles, claims ParkingSpot, and slots into the same Level lists. This is the entry suite against the vendor's defaults.",
    failureBanner: "No caller changed, and two flows corrupted anyway. The subtype's behavior is on your workbench: adjust what it promises, then rerun the same suite.",
  },
  repairBench: {
    intro: "Set ReservedSpot's behavior, then run the entry suite. The suite is the same one every other spot already passes.",
    controls: [
      {
        id: "reservedFree",
        label: "While a reservation holds, isFree() reports the spot as",
        options: [
          { id: "free", label: "Free (the reservation is checked later, at assign time)" },
          { id: "occupied", label: "Not free (a reservation is a form of occupancy)" },
        ],
        initial: "free",
      },
      {
        id: "assignBehavior",
        label: "When assign() is called and the reservation does not match, the spot",
        options: [
          { id: "claim-then-throw", label: "Marks itself occupied, then throws NeedsManagerKey" },
          { id: "accept", label: "Accepts the vehicle anyway and clears the reservation" },
          { id: "throw-clean", label: "Refuses up front and changes no state at all" },
        ],
        initial: "claim-then-throw",
      },
    ],
    rows: [
      {
        id: "entry",
        label: "Entry flow assigns a car to a spot that reported free",
        evaluate: (config) => {
          if (config.reservedFree === "occupied") {
            return { pass: true, detail: "A reserved spot never looks free, so the search never routes the wrong car to it. The caller code did not change." };
          }
          if (config.assignBehavior === "accept") {
            return { pass: false, detail: "The car parked, but in a spot someone else reserved. The contract said free and the world now disagrees with the bookings system." };
          }
          if (config.assignBehavior === "claim-then-throw") {
            return { pass: false, detail: "The spot said free, then vetoed assign() after marking itself occupied. The car is stuck at the barrier with no ticket and the spot is a phantom." };
          }
          return { pass: false, detail: "The spot said free, then refused the assignment. No state corrupted, but the entry flow bounces cars off a spot that keeps advertising itself." };
        },
      },
      {
        id: "counts",
        label: "Capacity counts stay accurate",
        evaluate: (config) =>
          config.reservedFree === "occupied"
            ? { pass: true, detail: "Reserved spots count as taken, so building-wide capacity math tells the truth." }
            : { pass: false, detail: "Every reserved spot inflates the free count. The full-lot check from Mission 1 now lies." },
      },
      {
        id: "customer",
        label: "The reserved customer arrives to a waiting spot",
        evaluate: (config) => {
          if (config.reservedFree === "occupied") {
            return { pass: true, detail: "Nobody else was ever routed there. The reservation held." };
          }
          return config.assignBehavior === "accept"
            ? { pass: false, detail: "Their spot is under someone else's car. The reservation was silently discarded at assign time." }
            : { pass: false, detail: "Their spot spent the morning bouncing other drivers and sits in a confused state by the time they arrive." };
        },
      },
      {
        id: "race",
        label: "The last-spot race stays closed (Mission 1's invariant)",
        evaluate: (config) => {
          if (config.assignBehavior === "throw-clean") {
            return { pass: true, detail: "assign() either fully claims or cleanly refuses, so two racing requests still produce exactly one winner." };
          }
          return config.assignBehavior === "claim-then-throw"
            ? { pass: false, detail: "Under a race, the losing request leaves the spot half-claimed. Mission 1's atomic-assignment invariant is broken from inside the subtype." }
            : { pass: false, detail: "Accept-anyway means two racing requests can both think they won. The double-assignment bug is back through the side door." };
        },
      },
    ],
    successNote: "Both spot kinds now pass through the SAME caller code: reservation is availability, and assign() fully claims or cleanly refuses. No instanceof anywhere.",
  },
  rerun: {
    before: "1 subtype broke 2 flows without any caller changing",
    after: "both spot kinds pass the same suite, zero caller edits, no type checks",
  },
  transferBench: {
    intro: "Hints off. Facilities wants CompactSpot to accept large vehicles, because 'it mostly fits and we sell more tickets'. Configure the spot and the gate, then run the suite.",
    controls: [
      {
        id: "canFit",
        label: "CompactSpot.canFit(largeVehicle) returns",
        options: [
          { id: "accept", label: "True. It mostly fits, and tickets are tickets" },
          { id: "truthful", label: "False. The spot is compact and says so" },
        ],
        initial: "accept",
      },
      {
        id: "gate",
        label: "The entry gate",
        options: [
          { id: "trust", label: "Trusts whatever the spot's compatibility answer is" },
          { id: "special-case", label: "Adds its own special case for large-into-compact" },
        ],
        initial: "trust",
      },
    ],
    rows: [
      {
        id: "aisle",
        label: "Aisles stay clear on Floor 2",
        evaluate: (config) => {
          if (config.canFit === "truthful") {
            return { pass: true, detail: "Large vehicles are routed to real large spots. Nothing hangs into the aisle." };
          }
          return config.gate === "special-case"
            ? { pass: true, detail: "The gate's special case caught it this time. The lie is still in the spot, waiting for the next caller that trusts it." }
            : { pass: false, detail: "A large SUV took a compact spot and blocks the aisle. Two floors of throughput die while it gets towed." };
        },
      },
      {
        id: "truth",
        label: "One source of truth for compatibility",
        evaluate: (config) => {
          if (config.gate === "special-case") {
            return { pass: false, detail: "The gate now owns compatibility logic that ParkingSpot already owns. The two will drift, and the next spot type needs another special case." };
          }
          return config.canFit === "truthful"
            ? { pass: true, detail: "Compatibility lives in the spot, and every caller trusts the same answer." }
            : { pass: false, detail: "The single source of truth is a lie. Every caller that trusts canFit() inherits the aisle problem." };
        },
      },
      {
        id: "new-types",
        label: "The next spot type needs zero caller edits",
        evaluate: (config) =>
          config.canFit === "truthful" && config.gate === "trust"
            ? { pass: true, detail: "Any spot that tells the truth through the contract slots straight in. The suite proves it." }
            : { pass: false, detail: "Callers are compensating for subtype behavior. Every new spot type will need its own round of caller patches." },
      },
    ],
    successNote: "Same principle, other direction: a subtype that accepts what it cannot serve is as broken as one that refuses what it promised. Contracts only work when implementations tell the truth through them.",
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

// ---------------------------------------------------------------------------
// Chapter 4 · ISP · One Remote To Rule Them All
// ---------------------------------------------------------------------------

const DEVICE_OPS = [
  { id: "openBarrier", name: "openBarrier()", device: "the gate" },
  { id: "displayMessage", name: "displayMessage()", device: "the display board" },
  { id: "chargeCard", name: "chargeCard()", device: "the pay terminal" },
  { id: "readPlate", name: "readPlate()", device: "the plate camera" },
] as const;

const universalOps = (config: BenchConfig) => DEVICE_OPS.filter((op) => config[op.id] === "universal");

const ISP_MISSION: SolidChapterMission = {
  id: "isp",
  order: 4,
  title: "One Remote To Rule Them All",
  principle: "Interface Segregation Principle",
  hook: "One universal device contract forces every device to fake methods it cannot do.",
  briefing: {
    headline: "Facilities standardized every device onto one interface.",
    body: "The garage runs gates, display boards, pay terminals, and plate cameras. Facilities shipped one universal GarageDevice contract with openBarrier(), displayMessage(), chargeCard(), and readPlate(), and every device must implement all four. The display board cannot charge a card. It implements chargeCard() anyway.",
    beats: [
      "Run the nightly health check against the universal contract",
      "Move operations into contracts, then rerun",
      "Make a red row mean real broken hardware again",
    ],
  },
  incident: {
    intro: "The nightly health check calls every operation on every registered device, because the contract says every device has them. This is tonight's report.",
    failureBanner: "Half the report is noise from methods devices never had, and a silent no-op hid real broken hardware. The contract layout is on your workbench: place each operation, then rerun the health check.",
  },
  repairBench: {
    intro: "Decide which contract each operation belongs to, then run the health check. Every device implements every contract that contains any operation it is forced to carry.",
    controls: DEVICE_OPS.map((op) => ({
      id: op.id,
      label: `${op.name}, really done by ${op.device}, lives in`,
      options: [
        { id: "universal", label: "The universal GarageDevice contract (all devices implement it)" },
        { id: "role", label: `A small role contract only ${op.device} implements` },
      ],
      initial: "universal",
    })),
    rows: [
      {
        id: "display-check",
        label: "Health check: display board",
        evaluate: (config) => {
          const forced = universalOps(config).filter((op) => op.id !== "displayMessage");
          return forced.length === 0
            ? { pass: true, detail: "The display board answers only for displaying. Its report is clean." }
            : { pass: false, detail: `The universal contract forces the display board to carry ${forced.map((op) => op.name).join(", ")}. It throws NotSupported and the check flags healthy hardware as broken.` };
        },
      },
      {
        id: "gate-check",
        label: "Health check: gate",
        evaluate: (config) => {
          const forced = universalOps(config).filter((op) => op.id !== "openBarrier");
          return forced.length === 0
            ? { pass: true, detail: "The gate answers only for the barrier. No fakes, no stubs." }
            : { pass: false, detail: `The gate fakes ${forced.map((op) => op.name).join(", ")} with silent no-ops just to satisfy the contract.` };
        },
      },
      {
        id: "hidden-failure",
        label: "The broken exit-ramp display is detected",
        evaluate: (config) =>
          config.displayMessage === "role"
            ? { pass: true, detail: "Only real displays answer for displayMessage(), so the exit-ramp failure finally shows up as the only red row it deserves." }
            : { pass: false, detail: "The gate's silent displayMessage() no-op returns success, and tonight that success masked the genuinely broken display by the exit ramp." },
      },
      {
        id: "signal",
        label: "A red row means real breakage",
        evaluate: (config) => {
          const universal = universalOps(config);
          return universal.length === 0
            ? { pass: true, detail: "Every implementation honors everything it signs, so the health report is finally information instead of noise." }
            : { pass: false, detail: `${universal.length} operation${universal.length === 1 ? " is" : "s are"} still universal, so the report still mixes 'unsupported by design' with 'supported but broken'.` };
        },
      },
    ],
    successNote: "Each device signs only for what it does: BarrierControl, MessageDisplay, PaymentTerminal, PlateReader. Failures mean broken hardware again.",
  },
  rerun: {
    before: "4 devices faking 9 methods, 1 real failure hidden in the noise",
    after: "each device answers only for itself, the broken display is the only red row",
  },
  transferBench: {
    intro: "Hints off. The mobile team wants one GarageApi interface with entry, billing, and reporting methods, implemented by every backend service. Arrange the API, then run the integration suite.",
    controls: [
      {
        id: "entry",
        label: "Entry operations are served through",
        options: [
          { id: "god", label: "The single GarageApi interface" },
          { id: "client", label: "An EntryApi shaped for the gate app" },
        ],
        initial: "god",
      },
      {
        id: "billing",
        label: "Billing operations are served through",
        options: [
          { id: "god", label: "The single GarageApi interface" },
          { id: "client", label: "A BillingApi shaped for payments" },
        ],
        initial: "god",
      },
      {
        id: "reports",
        label: "Reporting operations are served through",
        options: [
          { id: "god", label: "The single GarageApi interface" },
          { id: "client", label: "A ReportsApi shaped for the office dashboard" },
        ],
        initial: "god",
      },
    ],
    rows: [
      {
        id: "entry-deploys",
        label: "The gate app redeploys only for entry changes",
        evaluate: (config) =>
          config.entry === "client"
            ? { pass: true, detail: "The gate app depends on EntryApi and nothing else. Report fields can churn all quarter." }
            : { pass: false, detail: "The gate app consumes the god interface, so a renamed report field forces an entry-path recompile and redeploy." },
      },
      {
        id: "no-stubs",
        label: "No service serves fake methods",
        evaluate: (config) => {
          const god = [config.entry, config.billing, config.reports].filter((value) => value === "god").length;
          return god === 0
            ? { pass: true, detail: "Each service implements exactly the contract its clients call." }
            : { pass: false, detail: `${god} capability group${god === 1 ? "" : "s"} still ride the god interface, so services stub methods they never really serve. The billing service returns empty report lists today.` };
        },
      },
      {
        id: "dashboard",
        label: "Office dashboard failures are real",
        evaluate: (config) =>
          config.reports === "client"
            ? { pass: true, detail: "Reports come from a service that actually implements them. An empty dashboard now means a real problem." }
            : { pass: false, detail: "The dashboard quietly renders empty reports from a stubbed god-interface method. Nobody notices for a month." },
      },
    ],
    successNote: "Same disease as the devices, same cure: contracts sized to their clients, so no consumer depends on operations it never uses.",
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

// ---------------------------------------------------------------------------
// Chapter 5 · DIP · The Outage at Exit Rush
// ---------------------------------------------------------------------------

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
      "Run exit rush against the hard-wired vendor",
      "Rewire what the exit flow depends on, then rerun",
      "Earn the Adapter pattern the honest way",
    ],
  },
  incident: {
    intro: "Exit rush is live and Acme is timing out. This is the exit suite against the current wiring.",
    failureBanner: "Two different symptoms, one arrow pointing the wrong way. The wiring is on your workbench: decide what the exit flow depends on and what stands behind it, then rerun exit rush.",
  },
  repairBench: {
    intro: "Rewire the exit flow's payment dependency, then run exit rush. The suite computes from the wiring you choose.",
    controls: [
      {
        id: "dependency",
        label: "PayStation gets its payment capability by",
        options: [
          { id: "construct", label: "Constructing AcmePayClient inside the exit flow" },
          { id: "port", label: "Receiving a garage-owned PaymentPort from outside" },
        ],
        initial: "construct",
      },
      {
        id: "outage-plan",
        label: "Tonight's outage plan",
        options: [
          { id: "retry", label: "Wrap acme calls in try/catch with an exponential retry loop" },
          { id: "vendor-branch", label: "Add a second vendor SDK behind an if(acmeIsDown) branch" },
          { id: "cashbox", label: "A CashboxAdapter that satisfies the same payment contract" },
        ],
        initial: "retry",
      },
    ],
    rows: [
      {
        id: "outage-exit",
        label: "Cars exit during the Acme outage",
        evaluate: (config) => {
          if (config["outage-plan"] === "retry") {
            return { pass: false, detail: "Retrying a dead vendor is still depending on a dead vendor. The queue is 14 cars and climbing while the backoff climbs with it." };
          }
          if (config["outage-plan"] === "cashbox" && config.dependency === "construct") {
            return { pass: false, detail: "There is a cashbox adapter, but no seam to plug it into: the exit flow constructs Acme inside itself, so nothing can be swapped tonight." };
          }
          return config["outage-plan"] === "cashbox"
            ? { pass: true, detail: "The cashbox adapter plugs into the port and the queue clears. The exit flow never noticed the swap." }
            : { pass: true, detail: "The second vendor happens to be up, so cars exit tonight. Note what it cost: the exit flow now owns failover branching for two concrete vendors." };
        },
      },
      {
        id: "ci",
        label: "CI tests the exit flow without vendor credentials",
        evaluate: (config) =>
          config.dependency === "port"
            ? { pass: true, detail: "A test adapter sits behind the same port. The full exit flow runs in CI with zero network." }
            : { pass: false, detail: "The exit flow constructs its vendor internally, so every test needs live credentials. The team is debugging the outage against production." },
      },
      {
        id: "new-vendor",
        label: "A new provider ships next quarter without touching the exit flow",
        evaluate: (config) => {
          if (config.dependency !== "port") {
            return { pass: false, detail: "The exit flow names a concrete vendor class inside itself. Any provider change is an exit-flow change." };
          }
          return config["outage-plan"] === "vendor-branch"
            ? { pass: false, detail: "The port exists, but failover lives as an if-branch in the exit flow. Every new provider edits the domain again. That is the tariff-wars disease wearing a payments costume." }
            : { pass: true, detail: "A new provider is one new adapter implementing PaymentPort. The exit flow does not change." };
        },
      },
      {
        id: "blast-radius",
        label: "A vendor failure stays contained at the boundary",
        evaluate: (config) =>
          config.dependency === "port"
            ? { pass: true, detail: "The failure surfaces inside one adapter, at the edge, where it can be swapped or stubbed." }
            : { pass: false, detail: "The vendor failure detonates inside the domain: the highest-level policy in the garage died because the lowest-level detail did." },
      },
    ],
    successNote: "The arrow flipped: the exit flow depends on a contract the garage owns, and every vendor is a plug. The cashbox went in tonight without touching the domain.",
  },
  rerun: {
    before: "exit flow constructs the vendor, outage stops the garage, CI needs credentials",
    after: "exit flow sees only PaymentPort, cashbox clears the queue, CI runs on a test adapter",
  },
  transferBench: {
    intro: "Hints off. The plate-recognition camera arrives next sprint with its own vendor SDK, and the team is about to call vendorCam.scan() inline from the entry flow. Wire it, then run the entry suite.",
    controls: [
      {
        id: "camera-dep",
        label: "The entry flow reads plates by",
        options: [
          { id: "inline", label: "Calling the camera vendor's SDK inline" },
          { id: "static-helper", label: "A static CameraUtils.scan() helper wrapping the SDK" },
          { id: "port", label: "Receiving a PlateReaderPort from outside" },
        ],
        initial: "inline",
      },
      {
        id: "contract-owner",
        label: "The PlateReader contract is defined in",
        options: [
          { id: "vendor", label: "The vendor SDK's own types, reused directly" },
          { id: "garage", label: "The garage domain, with the vendor adapted to it" },
        ],
        initial: "vendor",
      },
    ],
    rows: [
      {
        id: "entry-ci",
        label: "Entry-flow tests run without camera hardware",
        evaluate: (config) => {
          if (config["camera-dep"] === "port") {
            return { pass: true, detail: "A fake reader sits behind the port. The entry flow tests on any machine." };
          }
          return config["camera-dep"] === "static-helper"
            ? { pass: false, detail: "A static helper is a hard-wired dependency with a nicer name. Nothing can be substituted, so tests still need a camera on the desk." }
            : { pass: false, detail: "The vendor SDK is called inline, so entry tests need real camera hardware. One method call, welded in, exactly like Acme was." };
        },
      },
      {
        id: "vendor-swap",
        label: "The camera vendor can be replaced next year",
        evaluate: (config) => {
          if (config["camera-dep"] !== "port") {
            return { pass: false, detail: "The entry flow speaks the vendor's language directly. Replacing the vendor means rewriting the entry flow." };
          }
          return config["contract-owner"] === "garage"
            ? { pass: true, detail: "The garage owns the contract and the vendor is an adapter. Swapping vendors swaps one adapter." }
            : { pass: false, detail: "The port exists but it is shaped like the vendor's own types. The domain still speaks vendor; the coupling just moved one file over." };
        },
      },
      {
        id: "gate-blast",
        label: "A camera outage cannot stop the gate",
        evaluate: (config) =>
          config["camera-dep"] === "port" && config["contract-owner"] === "garage"
            ? { pass: true, detail: "The gate degrades to manual plate entry behind the same port. The outage belongs to an adapter, not to the entry flow." }
            : { pass: false, detail: "When the camera vendor has its Acme day, the outage will belong to the gate." },
      },
    ],
    successNote: "The garage owns the socket and vendors bring the plug, for cameras exactly as for payments. The direction of the arrow is the principle.",
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
