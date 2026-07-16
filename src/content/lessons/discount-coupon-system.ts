import type { LLDLesson } from "@/types";

export const discountCouponSystem: LLDLesson = {
  id: "discount-coupon-system",
  track: "lld",
  title: "Design a Discount / Coupon System",
  blurb: "An Amazon-flavored LLD prompt that covers stacking rules, validity windows, and eligibility.",
  estMinutes: 35,
  overview:
    "A coupon system looks like a simple percentage-off calculation until you have to handle stacking rules, minimum-spend eligibility, and per-customer redemption limits at the same time. The design payoff is keeping the discount math (DiscountRule) separate from the coupon's metadata (Coupon), and separate again from the orchestration (CouponEngine). Do that and a new discount type never means touching the class that applies it.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design a discount and coupon system.",
    opening: "Design the core of a coupon system used at checkout. That means applying discounts and checking eligibility. Where do you want to start?",
    summary:
      "You've scoped it: percentage-off and fixed-amount coupons as pluggable rules, mostly single-use with some explicitly combinable, and eligibility gated by minimum spend, category, and a per-customer limit. That's enough. Go identify the classes.",
    questions: [
      {
        id: "types",
        ask: "What kinds of discounts do we need? Percentage off, fixed amount off, or both?",
        category: "scope",
        answer: "Both. Some coupons are a percentage off, others are a flat dollar amount off.",
        why: "This is the strategy-pattern decision, because the discount calculation needs to be pluggable and not one fixed formula on Coupon itself.",
        establishes: "Percentage-off and fixed-amount-off, pluggable",
        lp: ["dive-deep"],
        branches: [
          { label: "One fixed formula only", approach: "DiscountRule wouldn't exist as its own class. Coupon would just have a single discountPercent field and a hardcoded formula. Simpler, but every new discount type (BOGO, tiered pricing) means editing Coupon itself." },
          { label: "Pluggable percentage + fixed (this)", approach: "DiscountRule becomes its own class behind a single apply(cart) method, and that's exactly why the Strategy-pattern split exists in the model at all." },
        ],
      },
      {
        id: "stacking",
        ask: "Can coupons be combined, or is it one coupon per order?",
        category: "constraints",
        answer: "Generally one at a time, but some coupons are explicitly marked as combinable with others.",
        why: "This decides whether the engine needs stacking logic at all, and what rule governs it.",
        establishes: "Mostly single-use, some explicitly combinable",
        lp: ["customer-obsession"],
      },
      {
        id: "eligibility",
        ask: "Do coupons have eligibility rules, like minimum spend, category restrictions, or per-customer limits?",
        category: "constraints",
        answer: "Yes to all three: minimum spend, category restriction, and a per-customer redemption limit.",
        why: "This is what the eligibility check and per-customer redemption tracking actually need to support.",
        establishes: "Min spend + category + per-customer limits",
        lp: ["customer-obsession"],
        branches: [
          { label: "No eligibility rules at all", approach: "EligibilityPolicy wouldn't exist as a class. CouponEngine would just call rule.apply(cart) directly with no gating step. One fewer class, but there's no way to express 'minimum $50 purchase' or 'one per customer.'" },
          { label: "Min spend + category + per-customer limit (this)", approach: "EligibilityPolicy becomes a real class CouponEngine consults before applying anything. That's exactly why Customer needs its own redemption history, since 'per-customer limit' is unenforceable without it." },
        ],
      },
      {
        id: "storage-premature",
        ask: "Should coupon codes be stored as plain strings or hashed?",
        category: "premature",
        redirect: "That's a storage/security detail. Get the eligibility and discount logic right first.",
      },
    ],
  },
  design: {
    entities: [
      {
        id: "coupon",
        name: "Coupon",
        isEntity: true,
        why: "A single discount instrument that has a code, a discount rule, and a validity window.",
        properties: [
          { name: "id", type: "string" },
          { name: "code", type: "string" },
          { name: "rule", type: "DiscountRule" },
          { name: "validUntil", type: "DateTime" },
          { name: "combinable", type: "boolean" },
        ],
      },
      {
        id: "rule",
        name: "DiscountRule",
        isEntity: true,
        why: "The actual discount logic (percentage-off or fixed-amount-off), kept separate from Coupon's metadata so new discount types don't require changing Coupon.",
        properties: [
          { name: "id", type: "string" },
          { name: "type", type: "DiscountType" },
          { name: "value", type: "double" },
        ],
      },
      {
        id: "cart",
        name: "Cart",
        isEntity: true,
        why: "The set of items being purchased. Coupons are evaluated against its contents and subtotal.",
        properties: [
          { name: "id", type: "string" },
          { name: "items", type: "List<CartItem>" },
        ],
      },
      {
        id: "eligibility",
        name: "EligibilityPolicy",
        isEntity: true,
        why: "Encapsulates whether a cart or customer qualifies for a coupon, covering minimum spend, category restriction, and per-customer limits.",
        properties: [
          { name: "id", type: "string" },
          { name: "minSpend", type: "Money" },
          { name: "allowedCategories", type: "List<String>" },
          { name: "perCustomerLimit", type: "int" },
        ],
      },
      {
        id: "engine",
        name: "CouponEngine",
        isEntity: true,
        why: "Applies eligible coupons to a cart and computes the final discounted total. It's the orchestrator, kept separate from any single coupon's own rule. It holds no state of its own and works entirely by calling into Coupon, EligibilityPolicy, and Customer.",
        properties: [],
      },
      {
        id: "customer",
        name: "Customer",
        isEntity: true,
        why: "Coupons are often scoped per customer (e.g. one redemption each), so tracking who's used what requires modeling the customer as a first-class participant.",
        properties: [
          { name: "id", type: "string" },
          { name: "redeemedCouponIds", type: "List<String>" },
        ],
      },
      { id: "price", name: "Price", isEntity: false, why: "An attribute of a cart line item, not its own class." },
      { id: "campaign", name: "AdCampaign", isEntity: false, why: "Belongs to the marketing system that creates coupon codes, not the system that redeems and applies them." },
      { id: "receipt", name: "Receipt", isEntity: false, why: "A byproduct of a completed purchase, not a class with coupon logic of its own." },
      { id: "notification", name: "Notification", isEntity: false, why: "A delivery mechanism for telling a customer about a coupon, not part of the discount-calculation domain itself." },
    ],
    methods: [
      {
        id: "m1",
        signature: "isExpired(): boolean",
        ownerId: "coupon",
        justification: "Expiry is derived purely from Coupon's own validUntil field. No other class needs to reach in to compute it, and checking it anywhere else would mean duplicating the date logic wherever it's needed.",
      },
      {
        id: "m2",
        signature: "getCode(): string",
        ownerId: "coupon",
        justification: "code is data Coupon itself holds, so a plain accessor belongs on the object whose field it's reading, not wherever the code string happens to be needed next.",
      },
      {
        id: "m3",
        signature: "apply(cart): Money",
        ownerId: "rule",
        justification: "The actual percentage-off or fixed-amount-off math is DiscountRule's whole reason to exist. Coupon shouldn't know HOW to compute a discount, only that it HAS one, and that's exactly what keeps a new discount type from ever touching Coupon.",
        codeExercise: {
          language: "java",
          starter: "Money apply(Cart cart) {\n    // your code here\n}",
          reference:
            "Money apply(Cart cart) {\n    Money subtotal = cart.getSubtotal();\n    if (type == DiscountType.PERCENTAGE) {\n        return subtotal.multiply(value / 100.0);\n    }\n    if (type == DiscountType.FIXED_AMOUNT) {\n        return Money.min(subtotal, Money.of(value));\n    }\n    throw new IllegalStateException(\"Unknown discount type: \" + type);\n}",
          checklist: [
            "Handles both PERCENTAGE and FIXED_AMOUNT without assuming which one this rule is",
            "A fixed-amount discount never exceeds the cart's own subtotal (no negative totals)",
            "Doesn't silently return zero or null for an unrecognized discount type, and fails loudly instead",
            "Bonus (L5+, not required here): notes that currency rounding needs a defined rule, not raw floating-point math",
          ],
        },
      },
      {
        id: "m4",
        signature: "getSubtotal(): Money",
        ownerId: "cart",
        justification: "Subtotal is derived entirely from Cart's own item list. Computing it elsewhere means exposing Cart's internal items to whichever class needs the number.",
      },
      {
        id: "m5",
        signature: "addItem(item): void",
        ownerId: "cart",
        justification: "Cart owns its own items list; nothing else should be able to reach in and mutate it directly, same invariant-protection shape as any class that owns a mutable collection.",
      },
      {
        id: "m6",
        signature: "isEligible(cart, customer): boolean",
        ownerId: "eligibility",
        justification: "Eligibility rules (min spend, category, per-customer limit) are EligibilityPolicy's entire responsibility. Bundling this check into Coupon or CouponEngine would mean the rule logic lives in two different places depending on who's asking.",
        codeExercise: {
          language: "java",
          starter: "boolean isEligible(Cart cart, Customer customer) {\n    // your code here\n}",
          reference:
            "boolean isEligible(Cart cart, Customer customer) {\n    if (cart.getSubtotal().isLessThan(minSpend)) {\n        return false;\n    }\n    if (!allowedCategories.isEmpty() && !cart.containsAnyCategory(allowedCategories)) {\n        return false;\n    }\n    return customer.getRedeemedCouponIds().size() < perCustomerLimit;\n}",
          checklist: [
            "Checks the cart's subtotal against minSpend BEFORE any discount is applied, not after",
            "Skips the category check entirely when allowedCategories is empty, instead of rejecting everything",
            "Compares the customer's redemption count against perCustomerLimit, not just checking if it's zero",
            "Returns false rather than throwing when a rule isn't met, since ineligibility isn't an error condition",
          ],
        },
      },
      {
        id: "m7",
        signature: "applyCoupon(coupon, cart, customer): Money",
        ownerId: "engine",
        justification: "Orchestrating 'check eligibility, then apply the rule, then record the redemption' across three different classes is exactly what CouponEngine exists to do. No single one of those three classes should be reaching into the other two itself.",
      },
      {
        id: "m8",
        signature: "applyBestCombination(coupons, cart): Money",
        ownerId: "engine",
        justification: "Choosing which combinable coupons to stack is a cross-cutting decision that spans multiple Coupon and DiscountRule instances at once, so no single Coupon has enough context to decide this for itself.",
      },
      {
        id: "m9",
        signature: "hasRedeemed(coupon): boolean",
        ownerId: "customer",
        justification: "Redemption history is Customer's own state. Coupon shouldn't need to know who's redeemed it, since that would mean every Coupon tracking a growing list of every customer that's ever used it.",
      },
      {
        id: "m10",
        signature: "recordRedemption(coupon): void",
        ownerId: "customer",
        justification: "Same reasoning as hasRedeemed(): the class that owns the redemption history is the only one that should be allowed to add to it, so the 'no double-counting' invariant stays enforced in one place.",
      },
    ],
    edgeCases: [
      {
        id: "no-stack",
        scenario: "A customer tries to apply two coupons that both say 'not combinable with other offers.'",
        options: [
          { id: "a", label: "Silently apply both anyway and stack the discounts.", correct: false, feedback: "Ignoring an explicit non-stacking rule can discount an order far more than intended. That's a real revenue bug." },
          { id: "b", label: "CouponEngine checks each coupon's stacking rule and only allows one non-combinable coupon to apply per order.", correct: true, feedback: "Right. Stacking rules live on the coupon (or its DiscountRule), and CouponEngine is exactly the class responsible for enforcing them across the whole set being applied." },
          { id: "c", label: "Apply whichever coupon gives the smaller discount, to be safe.", correct: false, feedback: "That's an arbitrary rule nobody specified. The actual requirement is to respect each coupon's own combinability flag." },
        ],
      },
      {
        id: "min-spend-circular",
        scenario: "A coupon requires a $50 minimum purchase, but the discount itself would bring the cart below $50.",
        options: [
          { id: "a", label: "Check eligibility against the subtotal BEFORE the discount is applied, not after.", correct: true, feedback: "Right. EligibilityPolicy.isEligible() has to run against the pre-discount subtotal, because checking after the very discount being evaluated creates a circular, ambiguous rule." },
          { id: "b", label: "Check eligibility after the discount, and reject the coupon if it drops below $50.", correct: false, feedback: "This creates a strange edge where applying the coupon retroactively invalidates itself. Real systems check against the pre-discount amount precisely to avoid this." },
          { id: "c", label: "Just always allow it regardless of the minimum.", correct: false, feedback: "Ignores the coupon's own stated eligibility rule entirely." },
        ],
      },
      {
        id: "one-per-customer",
        scenario: "A customer tries to redeem a 'one per customer' coupon a second time.",
        options: [
          { id: "a", label: "Allow it. Coupon has no way to know who's used it.", correct: false, feedback: "This is exactly why Customer needs to be modeled. Without per-customer redemption tracking, a one-per-customer rule is unenforceable." },
          { id: "b", label: "CouponEngine checks Customer.hasRedeemed(coupon) as part of eligibility, and rejects the second attempt.", correct: true, feedback: "Right, redemption history lives on Customer, and the engine consults it before applying the coupon." },
          { id: "c", label: "Let it through the first two times, then block it.", correct: false, feedback: "Doesn't match the stated rule: 'one per customer' means the second attempt should be blocked immediately." },
        ],
      },
      {
        id: "expired-at-checkout",
        scenario: "A coupon's validity window expires between when it was displayed to the customer and when they check out.",
        options: [
          { id: "a", label: "Honor it anyway since the customer saw it as valid earlier.", correct: false, feedback: "Discount validity has to be enforced at the moment of redemption, not the moment it was viewed. Otherwise expiry has no real meaning." },
          { id: "b", label: "Coupon.isExpired() is checked again at checkout time, and an expired coupon is rejected even if it looked valid moments earlier.", correct: true, feedback: "Right. Validity is a property you re-check at the point of truth (checkout), not something you trust from an earlier read." },
          { id: "c", label: "Silently extend the coupon's expiration to accommodate the customer.", correct: false, feedback: "The system shouldn't unilaterally rewrite a coupon's terms to smooth over a UX timing issue." },
        ],
      },
    ],
    relationships: [
      "CouponEngine applies a DiscountRule from a Coupon to a Cart",
      "EligibilityPolicy is checked before a Coupon can be applied",
      "Customer's redemption history constrains which Coupons they can still use",
      "DiscountRule is the pluggable piece: percentage-off and fixed-amount-off are different implementations behind the same interface",
    ],
    tradeoffs: [
      {
        decision: "DiscountRule is a separate class from Coupon instead of Coupon holding a discountType enum and a discountValue field directly.",
        reasoning: "Costs one more class, but means a new discount type (e.g. buy-one-get-one) is a new DiscountRule implementation, not a new branch inside Coupon's own logic. That's exactly the Strategy-pattern trade-off the 'types' clarify question already flagged.",
      },
      {
        decision: "EligibilityPolicy is its own class instead of eligibility checks living directly inside CouponEngine.applyCoupon().",
        reasoning: "Costs a class most candidates skip, but keeps 'is this allowed' cleanly separate from 'do the application.' CouponEngine can add new orchestration steps without ever touching the rules that decide whether a coupon qualifies.",
      },
      {
        decision: "Customer tracks its own redemption history instead of CouponEngine keeping one global redemption log.",
        reasoning: "A global log would need to be searched by customer every time. Putting redeemedCouponIds on Customer means the one check that actually matters (has THIS customer used THIS coupon) is a lookup on the object that already represents them.",
      },
    ],
    principles: [
      {
        name: "Strategy Pattern",
        explanation: "DiscountRule is the pluggable piece behind a single apply(cart) signature. Percentage-off and fixed-amount-off are two implementations CouponEngine never has to distinguish between, which is exactly what lets a new discount type ship without touching Coupon or CouponEngine.",
      },
      {
        name: "Single Responsibility Principle",
        explanation: "EligibilityPolicy only decides whether a coupon can be used, and DiscountRule only decides how much it's worth. CouponEngine.applyCoupon() calls both instead of encoding either decision itself.",
      },
      {
        name: "Encapsulation",
        explanation: "Customer.recordRedemption() is the only way redeemedCouponIds grows. Nothing else appends to that list directly, so the 'one per customer' invariant can't be bypassed from outside Customer.",
      },
      {
        name: "Separation of Concerns",
        explanation: "Cart (what's being bought) and Coupon (what discount applies) stay separate even though CouponEngine constantly relates them. A cart doesn't need to know discount math, and a coupon doesn't need to know what's in someone's cart until it's evaluated.",
      },
    ],
  },
  recap: [
    "DiscountRule is kept separate from Coupon on purpose. It's the pluggable piece, so adding a new discount type never means changing Coupon itself.",
    "Eligibility must be checked against the pre-discount subtotal. Checking it after applying the very discount being evaluated creates a circular rule.",
    "'One per customer' is unenforceable without modeling Customer and their redemption history as first-class state, not an afterthought.",
    "Validity (expiry) is re-checked at the moment of redemption, not trusted from whenever it was last displayed.",
  ],
  relatedLessons: ["vending-machine", "url-shortener"],
};
