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
      "Reach for this when an object's valid actions change depending on where it is in a lifecycle, and you're tempted to guard every method with an if/else on a status field. Pulling that status into its own class — with the gating logic living there instead of scattered across every caller — makes invalid sequences impossible by construction, not just handled after the fact.",
    examples: [
      {
        refId: "vending-machine",
        title: "VendingMachineState gates every action",
        howItShowsUp:
          "VendingMachineState is a real class, not a status enum on VendingMachine — canSelect() and transitionTo() hold the actual gating logic, so a second purchase can't start mid-dispense because the state itself refuses the transition, not because some caller remembered to check first.",
      },
      {
        refId: "atm",
        isDrill: true,
        title: "Session.state gates the ATM's card→PIN→dispense flow",
        howItShowsUp:
          "You can't verifyPin() before insertCard(), and you can't dispense before PIN verification succeeds — Session.state is what encodes that ordering, kept deliberately separate from the always-on ATM hardware class itself.",
      },
    ],
  },
  {
    id: "strategy",
    name: "Strategy Pattern",
    whenToUse:
      "Reach for this when 'how this calculation works' needs to vary independently of the class that uses the result — a new variant should be a new implementation, not a new branch inside an existing method. The tell in an interview: you catch yourself writing 'if type == X, do this; if type == Y, do that' inside a class that shouldn't need to know about every type.",
    examples: [
      {
        refId: "discount-coupon-system",
        title: "DiscountRule is the pluggable piece behind Coupon",
        howItShowsUp:
          "DiscountRule.apply(cart) has two real implementations — percentage-off and fixed-amount-off — behind one signature. CouponEngine and Coupon never branch on discount type; a new discount type ships as a new DiscountRule, not a new if-branch in Coupon.",
      },
      {
        refId: "elevator-system",
        title: "Dispatcher.assignElevator()'s selection rule — a live example of Strategy's actual trade-off",
        howItShowsUp:
          "This one's a good look at Strategy from the OTHER side: assignElevator()'s own checklist calls out a direction-aware variant as a documented L5+ alternative to the simple nearest-distance rule the reference implements. Nothing pluggable exists in the code yet — it's one hardcoded method — but the shape ('this exact decision is expected to vary by requirement') is precisely why Strategy exists as a pattern. Worth naming out loud in an interview even before you've built the interface.",
      },
    ],
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
          "A courier or customer only ever wants 'a locker for this package' or 'my package back' — not to pick a specific Locker or generate a PickupCode themselves. putPackage()/getPackage() live on LockerLocation precisely so it can be the front door while Locker and PickupCode stay pure internal resources nobody calls directly — named explicitly as a trade-off in this lesson's own reasoning.",
      },
    ],
  },
  {
    id: "builder",
    name: "Builder Pattern",
    whenToUse:
      "Reach for this when constructing an object requires several optional, order-independent steps rather than one constructor call demanding every field upfront — especially when some combinations of choices need to be validated together before the object can be considered valid at all.",
    examples: [
      {
        refId: "pc-builder",
        isDrill: true,
        title: "PCBuilder accumulates components before producing an immutable PCBuild",
        howItShowsUp:
          "selectCpu()/selectMotherboard()/selectGpu()/selectPsu() each add one piece across separate calls, checking compatibility as choices come in, and only build() commits everything into a final, immutable PCBuild — named explicitly as this design's own Builder Pattern principle.",
      },
    ],
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
          "Stock.updatePrice() loops over its own subscribers list and calls onPriceUpdate() on each PriceAlert directly — Stock never checks whether any alert's threshold was crossed, it just pushes the update and lets each alert decide for itself. That push-not-pull inversion, plus Stock never needing to know how many observers exist or what any of their thresholds are, is the whole pattern.",
      },
    ],
  },
  {
    id: "composite",
    name: "Composite Pattern",
    whenToUse:
      "Reach for this when you have a tree of 'things that hold other things of the same kind' — folders holding files or more folders, categories holding items or subcategories — and you want calling code to treat a single leaf and an entire nested branch through the exact same interface, without ever branching on which one it's actually holding.",
    examples: [
      {
        refId: "file-system",
        isDrill: true,
        title: "File and Folder both answer to the same FileSystemNode contract",
        howItShowsUp:
          "Folder.getSize() sums child.getSize() across its children without checking whether any given child is a File (the base case) or another Folder (which recurses again) — the exact same method call works uniformly whether you're standing on a single file or the root of a thousand-file tree.",
      },
    ],
  },
];

export function listDesignPatterns(): DesignPatternEntry[] {
  return DESIGN_PATTERNS;
}
