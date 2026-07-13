import type { LLDLesson } from "@/types";

export const discountCouponSystem: LLDLesson = {
  id: "discount-coupon-system",
  track: "lld",
  title: "Design a Discount / Coupon System",
  blurb: "An Amazon-flavored LLD prompt — stacking rules, validity windows, eligibility.",
  estMinutes: 8,
  overview:
    "A coupon system looks like a simple percentage-off calculation until you have to handle stacking rules, minimum-spend eligibility, and per-customer redemption limits at the same time. The design payoff is keeping the discount math (DiscountRule) separate from the coupon's metadata (Coupon) and separate again from the orchestration (CouponEngine) — so a new discount type never means touching the class that applies it.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design a discount and coupon system.",
    opening: "Design the core of a coupon system used at checkout — applying discounts, checking eligibility. Where do you want to start?",
    summary:
      "You've scoped it: percentage-off and fixed-amount coupons as pluggable rules, mostly single-use with some explicitly combinable, and eligibility gated by minimum spend, category, and a per-customer limit. That's enough — go identify the classes.",
    questions: [
      {
        id: "types",
        ask: "What kinds of discounts do we need — percentage off, fixed amount off, both?",
        category: "scope",
        answer: "Both — some coupons are a percentage off, others are a flat dollar amount off.",
        why: "This is the strategy-pattern decision — the discount calculation needs to be pluggable, not one fixed formula on Coupon itself.",
        establishes: "Percentage-off and fixed-amount-off, pluggable",
        lp: ["dive-deep"],
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
        ask: "Do coupons have eligibility rules — minimum spend, category restrictions, per-customer limits?",
        category: "constraints",
        answer: "Yes to all three — minimum spend, category restriction, and a per-customer redemption limit.",
        why: "This is what the eligibility check and per-customer redemption tracking actually need to support.",
        establishes: "Min spend + category + per-customer limits",
        lp: ["customer-obsession"],
      },
      {
        id: "storage-premature",
        ask: "Should coupon codes be stored as plain strings or hashed?",
        category: "premature",
        redirect: "That's a storage/security detail — get the eligibility and discount logic right first.",
      },
    ],
  },
  design: {
    entities: [
      { id: "coupon", name: "Coupon", isEntity: true, why: "A single discount instrument — has a code, a discount rule, and a validity window." },
      { id: "rule", name: "DiscountRule", isEntity: true, why: "The actual discount logic — percentage-off or fixed-amount-off — kept separate from Coupon's metadata so new discount types don't require changing Coupon." },
      { id: "cart", name: "Cart", isEntity: true, why: "The set of items being purchased — coupons are evaluated against its contents and subtotal." },
      { id: "eligibility", name: "EligibilityPolicy", isEntity: true, why: "Encapsulates whether a cart or customer qualifies for a coupon — minimum spend, category restriction, per-customer limits." },
      { id: "engine", name: "CouponEngine", isEntity: true, why: "Applies eligible coupons to a cart and computes the final discounted total — the orchestrator, kept separate from any single coupon's own rule." },
      { id: "customer", name: "Customer", isEntity: true, why: "Coupons are often scoped per customer (e.g. one redemption each) — tracking who's used what requires modeling the customer as a first-class participant." },
      { id: "price", name: "Price", isEntity: false, why: "An attribute of a cart line item, not its own class." },
      { id: "campaign", name: "AdCampaign", isEntity: false, why: "Belongs to the marketing system that creates coupon codes, not the system that redeems and applies them." },
      { id: "receipt", name: "Receipt", isEntity: false, why: "A byproduct of a completed purchase, not a class with coupon logic of its own." },
      { id: "notification", name: "Notification", isEntity: false, why: "A delivery mechanism for telling a customer about a coupon, not part of the discount-calculation domain itself." },
    ],
    methods: [
      { id: "m1", signature: "isExpired(): boolean", ownerId: "coupon" },
      { id: "m2", signature: "getCode(): string", ownerId: "coupon" },
      { id: "m3", signature: "apply(cart): Money", ownerId: "rule" },
      { id: "m4", signature: "getSubtotal(): Money", ownerId: "cart" },
      { id: "m5", signature: "addItem(item): void", ownerId: "cart" },
      { id: "m6", signature: "isEligible(cart, customer): boolean", ownerId: "eligibility" },
      { id: "m7", signature: "applyCoupon(coupon, cart, customer): Money", ownerId: "engine" },
      { id: "m8", signature: "applyBestCombination(coupons, cart): Money", ownerId: "engine" },
      { id: "m9", signature: "hasRedeemed(coupon): boolean", ownerId: "customer" },
      { id: "m10", signature: "recordRedemption(coupon): void", ownerId: "customer" },
    ],
    edgeCases: [
      {
        id: "no-stack",
        scenario: "A customer tries to apply two coupons that both say 'not combinable with other offers.'",
        options: [
          { id: "a", label: "Silently apply both anyway and stack the discounts.", correct: false, feedback: "Ignoring an explicit non-stacking rule can discount an order far more than intended — a real revenue bug." },
          { id: "b", label: "CouponEngine checks each coupon's stacking rule and only allows one non-combinable coupon to apply per order.", correct: true, feedback: "Right — stacking rules live on the coupon (or its DiscountRule), and CouponEngine is exactly the class responsible for enforcing them across the whole set being applied." },
          { id: "c", label: "Apply whichever coupon gives the smaller discount, to be safe.", correct: false, feedback: "That's an arbitrary rule nobody specified — the actual requirement is to respect each coupon's own combinability flag." },
        ],
      },
      {
        id: "min-spend-circular",
        scenario: "A coupon requires a $50 minimum purchase, but the discount itself would bring the cart below $50.",
        options: [
          { id: "a", label: "Check eligibility against the subtotal BEFORE the discount is applied, not after.", correct: true, feedback: "Right — EligibilityPolicy.isEligible() has to run against the pre-discount subtotal; checking after the very discount being evaluated creates a circular, ambiguous rule." },
          { id: "b", label: "Check eligibility after the discount, and reject the coupon if it drops below $50.", correct: false, feedback: "This creates a strange edge where applying the coupon retroactively invalidates itself — real systems check against the pre-discount amount precisely to avoid this." },
          { id: "c", label: "Just always allow it regardless of the minimum.", correct: false, feedback: "Ignores the coupon's own stated eligibility rule entirely." },
        ],
      },
      {
        id: "one-per-customer",
        scenario: "A customer tries to redeem a 'one per customer' coupon a second time.",
        options: [
          { id: "a", label: "Allow it — Coupon has no way to know who's used it.", correct: false, feedback: "This is exactly why Customer needs to be modeled — without per-customer redemption tracking, a one-per-customer rule is unenforceable." },
          { id: "b", label: "CouponEngine checks Customer.hasRedeemed(coupon) as part of eligibility, and rejects the second attempt.", correct: true, feedback: "Right — redemption history lives on Customer, and the engine consults it before applying the coupon." },
          { id: "c", label: "Let it through the first two times, then block it.", correct: false, feedback: "Doesn't match the stated rule — 'one per customer' means the second attempt should be blocked immediately." },
        ],
      },
      {
        id: "expired-at-checkout",
        scenario: "A coupon's validity window expires between when it was displayed to the customer and when they check out.",
        options: [
          { id: "a", label: "Honor it anyway since the customer saw it as valid earlier.", correct: false, feedback: "Discount validity has to be enforced at the moment of redemption, not the moment it was viewed — otherwise expiry has no real meaning." },
          { id: "b", label: "Coupon.isExpired() is checked again at checkout time, and an expired coupon is rejected even if it looked valid moments earlier.", correct: true, feedback: "Right — validity is a property you re-check at the point of truth (checkout), not something you trust from an earlier read." },
          { id: "c", label: "Silently extend the coupon's expiration to accommodate the customer.", correct: false, feedback: "The system shouldn't unilaterally rewrite a coupon's terms to smooth over a UX timing issue." },
        ],
      },
    ],
    relationships: [
      "CouponEngine applies a DiscountRule from a Coupon to a Cart",
      "EligibilityPolicy is checked before a Coupon can be applied",
      "Customer's redemption history constrains which Coupons they can still use",
      "DiscountRule is the pluggable piece — percentage-off and fixed-amount-off are different implementations behind the same interface",
    ],
  },
  recap: [
    "DiscountRule is kept separate from Coupon on purpose — it's the pluggable piece, so adding a new discount type never means changing Coupon itself.",
    "Eligibility must be checked against the pre-discount subtotal — checking it after applying the very discount being evaluated creates a circular rule.",
    "'One per customer' is unenforceable without modeling Customer and their redemption history as first-class state, not an afterthought.",
    "Validity (expiry) is re-checked at the moment of redemption, not trusted from whenever it was last displayed.",
  ],
  relatedLessons: ["vending-machine", "url-shortener"],
};
