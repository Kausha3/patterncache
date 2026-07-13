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
];

export function listDesignPatterns(): DesignPatternEntry[] {
  return DESIGN_PATTERNS;
}
