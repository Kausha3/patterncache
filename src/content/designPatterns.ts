import type { DesignPatternEntry } from "@/types";

/**
 * Design patterns that genuinely show up in an existing LLD lesson or Cold
 * Drill design — not a padded GoF checklist. Every example points at a real
 * class/method already in this codebase; a pattern with zero real example
 * here simply isn't included, on purpose.
 */
export const DESIGN_PATTERNS: DesignPatternEntry[] = [
  {
    id: "state",
    name: "State Pattern",
    whenToUse:
      "Reach for this when an object's valid actions change depending on where it is in a lifecycle, and you keep guarding every method with an if/else on a status field. Pull that status into its own class so the gating logic lives there instead of getting scattered across every caller. Do that and invalid sequences become impossible by construction, not just handled after the fact.",
    examples: [
      {
        refId: "vending-machine",
        title: "VendingMachineState gates every action",
        howItShowsUp:
          "VendingMachineState is a real class, not a status enum on VendingMachine. canSelect() and transitionTo() hold the actual gating logic, so a second purchase can't start mid-dispense. The state itself refuses the transition; it's not that some caller remembered to check first.",
      },
      {
        refId: "atm",
        isDrill: true,
        title: "Session.state gates the ATM's card→PIN→dispense flow",
        howItShowsUp:
          "You can't verifyPin() before insertCard(), and you can't dispense before PIN verification succeeds. Session.state is what encodes that ordering, and it's kept deliberately separate from the always-on ATM hardware class itself.",
      },
    ],
    confusedWith: {
      patternName: "Strategy Pattern",
      patternId: "strategy",
      test: "Does the object move through a SEQUENCE of stages where only certain actions are valid at each one, and today's state determines what tomorrow's state can be? That's State. Does 'how to do X' just vary by a flag with no notion of a current stage or a next-allowed-stage at all? That's Strategy.",
    },
  },
  {
    id: "strategy",
    name: "Strategy Pattern",
    whenToUse:
      "Reach for this when 'how this calculation works' needs to vary independently of the class that uses the result, so a new variant should be a new implementation, not a new branch inside an existing method. The tell in an interview: you catch yourself writing 'if type == X, do this; if type == Y, do that' inside a class that shouldn't need to know about every type.",
    examples: [
      {
        refId: "discount-coupon-system",
        title: "DiscountRule is the pluggable piece behind Coupon",
        howItShowsUp:
          "DiscountRule.apply(cart) has two real implementations, percentage-off and fixed-amount-off, behind one signature. CouponEngine and Coupon never branch on discount type, and a new discount type ships as a new DiscountRule, not a new if-branch in Coupon.",
      },
      {
        refId: "elevator-system",
        title: "Dispatcher.assignElevator()'s selection rule shows Strategy's real trade-off",
        howItShowsUp:
          "This one's a good look at Strategy from the OTHER side: assignElevator()'s own checklist calls out a direction-aware variant as a documented L5+ alternative to the simple nearest-distance rule the reference implements. Nothing pluggable exists in the code yet, it's just one hardcoded method, but the shape ('this exact decision is expected to vary by requirement') is exactly why Strategy exists as a pattern. It's worth naming out loud in an interview even before you've built the interface.",
      },
    ],
    confusedWith: {
      patternName: "State Pattern",
      patternId: "state",
      test: "Is there a 'current step' that determines what happens next, where the object can only reach certain future steps from where it is right now? That's State. Can any implementation run at any time with zero notion of sequence, so you're just swapping which algorithm is plugged in? That's Strategy.",
    },
  },
  {
    id: "facade",
    name: "Facade Pattern",
    whenToUse:
      "Reach for this when a caller genuinely only wants one or two high-level operations, but achieving them requires coordinating several classes underneath. Give the caller one front-door class with a small, clean interface, and keep the classes actually doing the work as internal collaborators nobody outside calls directly.",
    examples: [
      {
        refId: "amazon-locker",
        title: "LockerLocation as the only public entry point over Locker + PickupCode",
        howItShowsUp:
          "A courier or customer only ever wants 'a locker for this package' or 'my package back.' They're not trying to pick a specific Locker or generate a PickupCode themselves. putPackage()/getPackage() live on LockerLocation precisely so it can be the front door, while Locker and PickupCode stay pure internal resources nobody calls directly. That trade-off is named explicitly in this lesson's own reasoning.",
      },
    ],
    confusedWith: {
      patternName: "a plain 'service class with a lot of methods'",
      test: "A real Facade specifically simplifies access to OTHER classes that already exist and do the actual work underneath it. Its whole job is coordinating them. If your 'facade' class is doing every bit of the real logic itself with nothing underneath left to coordinate, it isn't a Facade, it's just the class that does the thing. Naming it Facade doesn't make hidden complexity appear.",
    },
  },
  {
    id: "builder",
    name: "Builder Pattern",
    whenToUse:
      "Reach for this when constructing an object requires several optional, order-independent steps rather than one constructor call demanding every field upfront. This matters especially when some combinations of choices need to be validated together before the object can be considered valid at all.",
    examples: [
      {
        refId: "pc-builder",
        isDrill: true,
        title: "PCBuilder accumulates components before producing an immutable PCBuild",
        howItShowsUp:
          "selectCpu()/selectMotherboard()/selectGpu()/selectPsu() each add one piece across separate calls, checking compatibility as choices come in, and only build() commits everything into a final, immutable PCBuild. That's named explicitly as this design's own Builder Pattern principle.",
      },
    ],
    confusedWith: {
      patternName: "Factory Pattern",
      patternId: "factory",
      test: "Factory creates ONE object in ONE call, usually deciding WHICH concrete type to hand back. Builder assembles ONE object across SEVERAL calls, accumulating optional pieces before a final build() commits it. Ask 'which subtype should this be?' → Factory. Ask 'what's been chosen so far?' → Builder.",
    },
  },
  {
    id: "observer",
    name: "Observer Pattern",
    whenToUse:
      "Reach for this when one object's state change needs to reach a variable, possibly-changing set of other objects, and polling every one of them on some schedule would be wasteful or too slow. Give the subject a list of observers it actively notifies the moment its own state changes, instead of making every observer ask the subject 'has anything changed yet?' on repeat.",
    examples: [
      {
        refId: "stock-price-alerts",
        isDrill: true,
        title: "Stock notifies every subscribed PriceAlert the instant its price changes",
        howItShowsUp:
          "Stock.updatePrice() loops over its own subscribers list and calls onPriceUpdate() on each PriceAlert directly. Stock never checks whether any alert's threshold was crossed, it just pushes the update and lets each alert decide for itself. That push-not-pull inversion, plus the fact that Stock never needs to know how many observers exist or what any of their thresholds are, is the whole pattern.",
      },
    ],
    confusedWith: {
      patternName: "Mediator",
      test: "In Observer, the subject doesn't know or care what its observers DO with a notification. Each one reacts independently, on its own. A Mediator actively COORDINATES how several objects interact, often deciding on their behalf. If the notified objects only handle their own reaction, that's Observer. If one central object is orchestrating interactions between the others, that's Mediator.",
    },
  },
  {
    id: "composite",
    name: "Composite Pattern",
    whenToUse:
      "Reach for this when you have a tree of 'things that hold other things of the same kind' (folders holding files or more folders, categories holding items or subcategories) and you want calling code to treat a single leaf and an entire nested branch through the exact same interface, without ever branching on which one it's actually holding.",
    examples: [
      {
        refId: "file-system",
        isDrill: true,
        title: "File and Folder both answer to the same FileSystemNode contract",
        howItShowsUp:
          "Folder.getSize() sums child.getSize() across its children without checking whether any given child is a File (the base case) or another Folder (which recurses again). The exact same method call works uniformly whether you're standing on a single file or the root of a thousand-file tree.",
      },
    ],
    confusedWith: {
      patternName: "Decorator Pattern",
      patternId: "decorator",
      test: "Composite holds MANY children (of the same shared type) to aggregate them. A folder can have any number of files inside it. Decorator wraps exactly ONE thing to add behavior on top of it: a decorated pizza wraps exactly one pizza. Ask 'how many children does this hold?' → Composite. Ask 'what is this one thing gaining?' → Decorator.",
    },
  },
  {
    id: "command",
    name: "Command Pattern",
    whenToUse:
      "Reach for this when you need to reverse or replay an action later, and reversing it takes more than just knowing what happened. A plain history log of 'insert happened at position 4' isn't enough to undo it. Wrap each action in its own object that knows how to execute() itself AND undo() itself, storing whatever state it needs to reverse its own effect.",
    examples: [
      {
        refId: "undo-redo",
        isDrill: true,
        title: "InsertTextCommand and DeleteTextCommand both implement execute()/undo()",
        howItShowsUp:
          "CommandHistory.executeCommand() and undo() never know which concrete command they're holding. They just call execute()/undo() on it. DeleteTextCommand specifically captures the real deleted substring the moment it removes it, since by the time undo() runs later the document has already changed shape and can't say what used to be there.",
      },
    ],
    confusedWith: {
      patternName: "Strategy Pattern",
      patternId: "strategy",
      test: "Both wrap 'a thing to do' in its own object, and that's the source of the confusion. But a Strategy object just computes a result; there's no notion of reversing a Strategy call. A Command object specifically stores whatever state it needs to UNDO its own effect later. If 'can this be reversed' matters, that's Command. If you just need to swap which computation runs, that's Strategy.",
    },
  },
  {
    id: "decorator",
    name: "Decorator Pattern",
    whenToUse:
      "Reach for this when you need to add responsibilities to one specific object at runtime, stacking optional behavior on top of a base object, without touching the base class's code or creating a new subclass for every combination of add-ons. The decorator has to look exactly like the thing it wraps (same interface), which is what lets you stack several of them and still treat the whole chain as just one instance of the base type.",
    examples: [
      {
        refId: "pizza-ordering",
        isDrill: true,
        title: "ToppingDecorator wraps a Pizza to add cost and description",
        howItShowsUp:
          "PlainPizza is the base case; ToppingDecorator wraps any Pizza (including another ToppingDecorator) and adds one topping's cost and name on top. getCost() and getDescription() both recurse through however many layers are stacked, and OrderItem never needs to know how many toppings are on the pizza it's holding, just that it's holding 'a Pizza.'",
      },
    ],
    confusedWith: {
      patternName: "Composite Pattern",
      patternId: "composite",
      test: "Decorator wraps exactly ONE thing to add behavior on top of it. A decorated pizza is still exactly one pizza, just with layers added. Composite holds MANY children to aggregate them: a folder can have any number of files inside it. Ask 'what is this one thing gaining?' → Decorator. Ask 'how many children does this hold?' → Composite.",
    },
  },
  {
    id: "factory",
    name: "Factory Pattern",
    whenToUse:
      "Reach for this when SOMETHING has to decide which concrete implementation to construct, and you don't want that decision copied into every caller as an if/else on a type string. Put the construction decision in one place. A new variant then means one new class plus one new line in the factory, and no caller changes at all.",
    examples: [
      {
        refId: "discount-coupon-system",
        title: "Where DiscountRules come from",
        howItShowsUp:
          "The lesson keeps CouponEngine free of discount-type branching: a new discount ships as a new DiscountRule implementation. Follow that thread one step further and a question appears the lesson leaves open: when a coupon is loaded from config, WHAT constructs the right DiscountRule for it? That constructor-picker is a Factory, whether or not you name it. Naming it in an interview shows you see where creation decisions live.",
      },
    ],
    confusedWith: {
      patternName: "Builder Pattern",
      patternId: "builder",
      test: "Factory answers 'WHICH type should this be?' in one call and hands back a finished object. Builder answers 'what has been chosen so far?' across several calls before one final build(). If the decision is between subtypes, that's Factory. If the work is accumulating optional parts of one object, that's Builder.",
    },
  },
  {
    id: "singleton",
    name: "Singleton Pattern",
    whenToUse:
      "Reach for this when exactly one shared instance genuinely makes sense, which is rarer than interviews make it look. The honest use here: stateless objects that many owners can safely share. The honest warning: a Singleton holding mutable state is a global variable wearing a pattern name, and interviewers often offer it as bait to see whether you'll take it.",
    examples: [
      {
        refId: "vending-machine",
        title: "Stateless VendingMachineStates could be shared instances",
        howItShowsUp:
          "Each state object (idle, has-money, dispensing) gates actions but holds no per-machine data of its own; the machine holds the money and inventory. Because the states are stateless, one shared instance of each could serve every machine in a fleet. The lesson doesn't name this, and that's the honest lesson: Singleton is a sharing decision you justify with statelessness, not a default.",
      },
    ],
    confusedWith: {
      patternName: "a static utility class",
      test: "A Singleton is still an OBJECT: it can implement an interface, be passed as a dependency, and be swapped for a fake in tests. A class of static methods can't do any of that. If you need substitutability, you want the (carefully justified) Singleton. If it's pure stateless functions nobody ever swaps, statics are simpler and more honest.",
    },
  },
];

export function listDesignPatterns(): DesignPatternEntry[] {
  return DESIGN_PATTERNS;
}
