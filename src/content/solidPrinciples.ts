/**
 * SOLID, with receipts. Each principle points at the place in this app where
 * the learner has already used it, or will. No principle is listed with a
 * force-fit example: where our coverage is thin, the entry says so.
 */

export interface SolidPrincipleEntry {
  id: "srp" | "ocp" | "lsp" | "isp" | "dip";
  letter: string;
  name: string;
  plain: string;
  whereYouUsedIt: { label: string; route: string; note: string }[];
  interviewLine: string;
}

export const SOLID_PRINCIPLES: SolidPrincipleEntry[] = [
  {
    id: "srp",
    letter: "S",
    name: "Single Responsibility Principle",
    plain:
      "One class, one job, one reason to change. The practical test isn't 'does this class do a lot,' it's 'who owns the data this behavior touches.' Behavior belongs beside the state it reads and protects.",
    whereYouUsedIt: [
      {
        label: "System Forge · Your First Shift",
        route: "/arena/pattern-genome",
        note: "You put findSpot() on Level because Level already owns the spaces. That whole mission is SRP, experienced before it's named.",
      },
      {
        label: "LLD Basics lesson",
        route: "/lesson/lld-101",
        note: "The alarm clock owns its own alarm state, so it owns setAlarm(). Same rule at the smallest possible size.",
      },
    ],
    interviewLine:
      "\"I'm putting this method on the class that owns the data it touches, so future changes to that data stay inside one class.\"",
  },
  {
    id: "ocp",
    letter: "O",
    name: "Open/Closed Principle",
    plain:
      "Stable code should gain new behavior by ADDING code, not by editing what already works. The tell you're violating it: a new requirement makes you reopen a class that was finished, to add another branch.",
    whereYouUsedIt: [
      {
        label: "Discount / Coupon System lesson",
        route: "/lesson/discount-coupon-system",
        note: "A new discount type ships as a new DiscountRule implementation. Coupon and CouponEngine never get edited for it.",
      },
      {
        label: "Splitwise cold drill",
        route: "/drill/splitwise",
        note: "Equal, exact, and percentage splits are separate strategies, so a new split kind is a new class, not a new branch.",
      },
    ],
    interviewLine:
      "\"When the interviewer adds a requirement, I want to answer 'that's a new class' rather than 'let me edit three existing ones.'\"",
  },
  {
    id: "lsp",
    letter: "L",
    name: "Liskov Substitution Principle",
    plain:
      "Anything that claims a contract must be fully usable through that contract. If calling code has to check which concrete type it got before trusting a method, the substitution is broken.",
    whereYouUsedIt: [
      {
        label: "File System cold drill",
        route: "/drill/file-system",
        note: "Folder.getSize() calls child.getSize() without caring whether the child is a File or another Folder. Both honor the contract completely, which is why the recursion needs no type checks.",
      },
      {
        label: "Pizza Ordering cold drill",
        route: "/drill/pizza-ordering",
        note: "A ToppingDecorator is fully a Pizza. OrderItem calls getCost() on whatever it holds and never needs to know how many layers are stacked.",
      },
    ],
    interviewLine:
      "\"My test for a subtype: can every caller use it through the base contract with zero instanceof checks? If not, the hierarchy is lying.\"",
  },
  {
    id: "isp",
    letter: "I",
    name: "Interface Segregation Principle",
    plain:
      "Keep contracts small enough that implementers use everything they sign up for. A fat interface forces classes to carry methods they can't honestly implement, which is how LSP violations get manufactured.",
    whereYouUsedIt: [
      {
        label: "Pizza Ordering cold drill",
        route: "/drill/pizza-ordering",
        note: "The Pizza contract is exactly two methods, getCost() and getDescription(), which is why both PlainPizza and ToppingDecorator can honor all of it. That smallness is ISP working quietly. We don't have a fat-interface horror story in the app yet; the principle mostly shows up here as contracts kept deliberately narrow.",
      },
    ],
    interviewLine:
      "\"If a class implements an interface and has to throw UnsupportedOperationException somewhere, the interface was too big. Split it.\"",
  },
  {
    id: "dip",
    letter: "D",
    name: "Dependency Inversion Principle",
    plain:
      "High-level logic should depend on an abstraction, and the concrete implementations should depend on that same abstraction from the other side. The stable thing in the middle is the contract, not any class.",
    whereYouUsedIt: [
      {
        label: "Discount / Coupon System lesson",
        route: "/lesson/discount-coupon-system",
        note: "CouponEngine depends on the DiscountRule interface. It never imports percentage-off or fixed-off concretely, which is exactly why new rules don't touch it.",
      },
      {
        label: "Undo/Redo cold drill",
        route: "/drill/undo-redo",
        note: "CommandHistory calls execute() and undo() on the Command contract and never knows which concrete command it's holding.",
      },
    ],
    interviewLine:
      "\"The engine shouldn't know the rule types exist. Both sides depend on the interface, so either side can change without the other noticing.\"",
  },
];

export function listSolidPrinciples(): SolidPrincipleEntry[] {
  return SOLID_PRINCIPLES;
}
