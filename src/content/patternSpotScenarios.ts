import type { PatternSpotScenario } from "@/types";

/**
 * "Spot the pattern" — short scenarios, 3-4 choices, commit-then-reveal.
 * Distractors are deliberately each pattern's confusable sibling (see
 * confusedWith in designPatterns.ts), not random noise — the point is
 * practicing the actual disambiguating test, not just recognizing a keyword.
 */
export const PATTERN_SPOT_SCENARIOS: PatternSpotScenario[] = [
  {
    id: "video-call",
    scenario:
      "You're modeling a video call that moves through ringing → connected → on-hold → ended. Only certain actions (mute, hang up, resume) are valid depending on which stage the call is currently in.",
    options: [
      { patternId: "state", correct: true, feedback: "Right — there's a current stage, and what's valid next depends entirely on where the call is right now. That lifecycle-with-valid-next-steps shape is State." },
      { patternId: "strategy", correct: false, feedback: "Strategy has no notion of a 'current stage' at all — any implementation could run at any time. This call very much has a current stage." },
      { patternId: "command", correct: false, feedback: "Nothing here needs to be undone or replayed later — Command is about reversible actions, not lifecycle stages." },
      { patternId: "facade", correct: false, feedback: "No subsystem coordination being simplified here — just one object's own valid-actions-per-stage logic." },
    ],
  },
  {
    id: "shipping-cost",
    scenario:
      "You're computing shipping cost, and the exact calculation depends on which carrier the customer picked — but nothing about the order's own lifecycle changes based on which carrier is chosen. It's just a different formula plugged in.",
    options: [
      { patternId: "strategy", correct: true, feedback: "Right — no lifecycle, no current stage, just a swappable calculation. That's exactly Strategy's shape." },
      { patternId: "state", correct: false, feedback: "There's no sequence of stages here, and no notion of 'what's valid next' — just a formula that varies by which carrier was picked." },
      { patternId: "decorator", correct: false, feedback: "Nothing is being wrapped to add behavior on top of an existing object — this is a single calculation with a swappable implementation." },
      { patternId: "observer", correct: false, feedback: "Nothing is being notified of a change here — this is a one-time calculation, not a push to a list of watchers." },
    ],
  },
  {
    id: "checkout-button",
    scenario:
      "A checkout button needs to validate inventory, charge a card, and create a shipment record — three different subsystems — but the UI just wants to call one method: placeOrder().",
    options: [
      { patternId: "facade", correct: true, feedback: "Right — one simple front-door method hiding coordination across several subsystems underneath. That's Facade." },
      { patternId: "builder", correct: false, feedback: "Nothing optional is being accumulated across multiple calls here — placeOrder() is one call doing real coordination work, not assembling config." },
      { patternId: "command", correct: false, feedback: "No undo/replay requirement described — this is about hiding subsystem complexity, not reversibility." },
      { patternId: "composite", correct: false, feedback: "No tree of same-shaped things being aggregated here — just one method coordinating three unrelated subsystems." },
    ],
  },
  {
    id: "gift-options",
    scenario:
      "A checkout form lets a customer optionally add gift wrap, optionally add a gift card message, and optionally choose expedited shipping — none required — before finally submitting the order.",
    options: [
      { patternId: "builder", correct: true, feedback: "Right — several optional, order-independent choices accumulating before one final commit. That's Builder." },
      { patternId: "facade", correct: false, feedback: "This isn't about hiding subsystem complexity behind one call — it's about accumulating optional configuration over several calls." },
      { patternId: "state", correct: false, feedback: "There's no lifecycle-with-valid-actions-per-stage here, just optional choices that can be made in any order." },
      { patternId: "strategy", correct: false, feedback: "Nothing is being swapped for something else — these are additive, accumulating choices, not a single pluggable calculation." },
    ],
  },
  {
    id: "stock-ticker",
    scenario:
      "A stock ticker needs to update a price display, a trading bot, and a logging service the instant the price changes — and none of those three should have to ask 'did it change yet?' on a loop.",
    options: [
      { patternId: "observer", correct: true, feedback: "Right — one subject pushing a change to a variable set of watchers the instant it happens, instead of each of them polling. That's Observer." },
      { patternId: "command", correct: false, feedback: "No action needs to be reversed or replayed here — this is about broadcasting a state change, not encapsulating an undoable action." },
      { patternId: "state", correct: false, feedback: "No lifecycle-with-valid-actions-per-stage here — just a value changing and several unrelated listeners needing to know." },
      { patternId: "decorator", correct: false, feedback: "Nothing is being wrapped to add behavior — this is about notifying multiple independent listeners, not layering behavior onto one object." },
    ],
  },
  {
    id: "folder-size",
    scenario:
      "A folder can contain files or other folders, and you want folder.getTotalSize() to work correctly no matter how deeply nested the folder tree goes, without special-casing files vs subfolders.",
    options: [
      { patternId: "composite", correct: true, feedback: "Right — a tree of same-shaped things (files and folders both answering to one contract), recursing uniformly. That's Composite." },
      { patternId: "decorator", correct: false, feedback: "Decorator wraps exactly ONE thing to add behavior on top of it — a folder holding many children of mixed types is Composite's shape, not Decorator's." },
      { patternId: "builder", correct: false, feedback: "Nothing is being incrementally assembled toward one final commit here — this is about recursing over an existing tree structure." },
      { patternId: "facade", correct: false, feedback: "No subsystem coordination being simplified — getTotalSize() is recursion over a tree, not a front door over unrelated collaborators." },
    ],
  },
  {
    id: "drawing-undo",
    scenario:
      "A drawing app needs undo/redo — each stroke needs to know not just what it drew, but how to erase exactly what it drew, since the canvas itself doesn't remember the history.",
    options: [
      { patternId: "command", correct: true, feedback: "Right — each action needs to store enough of its own state to reverse itself later. That's exactly what makes this Command, not just a history log." },
      { patternId: "strategy", correct: false, feedback: "Strategy objects compute a result — there's no notion of 'undo' built into Strategy at all. The need to reverse an action is the tell for Command." },
      { patternId: "observer", correct: false, feedback: "No broadcast-to-many-watchers need here — this is about one action knowing how to reverse itself, not notifying listeners of a change." },
      { patternId: "state", correct: false, feedback: "No lifecycle-with-valid-actions-per-stage — each stroke is an independent reversible action, not a stage in a sequence." },
    ],
  },
  {
    id: "coffee-order",
    scenario:
      "A coffee order can have any combination of extra shots, whipped cream, and flavor syrup, each adding its own cost — and you want to stack them in any order without a combinatorial explosion of subclasses for every combination.",
    options: [
      { patternId: "decorator", correct: true, feedback: "Right — each add-on wraps the drink, adds its own cost, and is still fully a 'drink' itself, so they stack arbitrarily. That's Decorator." },
      { patternId: "composite", correct: false, feedback: "Composite holds MANY children to aggregate — a decorated coffee wraps exactly ONE drink at a time, one layer at a time. That's Decorator's shape, not Composite's." },
      { patternId: "builder", correct: false, feedback: "Close, but Builder accumulates config toward one final construction step — each Decorator layer is already a fully real, usable drink on its own, not a work-in-progress." },
      { patternId: "strategy", correct: false, feedback: "Nothing is being swapped for an alternative — these are additive layers stacking on top of each other, not one pluggable calculation." },
    ],
  },
];

export function listPatternSpotScenarios(): PatternSpotScenario[] {
  return PATTERN_SPOT_SCENARIOS;
}
