import type { LLDLesson } from "@/types";

// Compilable domain model shared by this lesson's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.
// Money is backed by int cents so discount math never touches raw doubles.

const DISCOUNT_TYPE_JAVA = `public enum DiscountType {
    PERCENTAGE, FIXED_AMOUNT;
}
`;

const MONEY_JAVA = `public class Money {
    private final int cents;

    private Money(int cents) {
        this.cents = cents;
    }

    public static Money ofCents(int cents) { return new Money(cents); }

    public static Money of(double amount) { return new Money((int) Math.round(amount * 100.0)); }

    public static Money min(Money a, Money b) { return a.cents <= b.cents ? a : b; }

    public int getCents() { return cents; }

    public Money multiply(double factor) { return new Money((int) Math.round(cents * factor)); }

    public boolean isLessThan(Money other) { return cents < other.cents; }
}
`;

const CART_ITEM_JAVA = `public class CartItem {
    private final String name;
    private final String category;
    private final Money price;

    public CartItem(String name, String category, Money price) {
        this.name = name;
        this.category = category;
        this.price = price;
    }

    public String getName() { return name; }
    public String getCategory() { return category; }
    public Money getPrice() { return price; }
}
`;

const CART_JAVA = `import java.util.ArrayList;
import java.util.List;

public class Cart {
    private final String id;
    private final List<CartItem> items;

    public Cart(String id) {
        this.id = id;
        this.items = new ArrayList<CartItem>();
    }

    public String getId() { return id; }

    public void addItem(CartItem item) { items.add(item); }

    public Money getSubtotal() {
        int totalCents = 0;
        for (CartItem item : items) {
            totalCents += item.getPrice().getCents();
        }
        return Money.ofCents(totalCents);
    }

    public boolean containsAnyCategory(List<String> categories) {
        for (CartItem item : items) {
            if (categories.contains(item.getCategory())) {
                return true;
            }
        }
        return false;
    }
}
`;

// Support version of Customer for the isEligible exercise. recordRedemption()
// exists so tests can seed a customer who has already used coupons.
const CUSTOMER_JAVA = `import java.util.ArrayList;
import java.util.List;

public class Customer {
    private final String id;
    private final List<String> redeemedCouponIds;

    public Customer(String id) {
        this.id = id;
        this.redeemedCouponIds = new ArrayList<String>();
    }

    public String getId() { return id; }
    public List<String> getRedeemedCouponIds() { return redeemedCouponIds; }
    public void recordRedemption(String couponId) { redeemedCouponIds.add(couponId); }
}
`;

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
          java: {
            editClassName: "DiscountRule",
            starterFile: `public class DiscountRule {
    private final String id;
    private final DiscountType type;
    private final double value;

    public DiscountRule(String id, DiscountType type, double value) {
        this.id = id;
        this.type = type;
        this.value = value;
    }

    public String getId() { return id; }
    public DiscountType getType() { return type; }
    public double getValue() { return value; }

    public Money apply(Cart cart) {
        // Compute what this rule is worth against the cart's subtotal.
        // PERCENTAGE treats value as a percent; FIXED_AMOUNT must never exceed the subtotal.
        return null;
    }
}
`,
            referenceFile: `public class DiscountRule {
    private final String id;
    private final DiscountType type;
    private final double value;

    public DiscountRule(String id, DiscountType type, double value) {
        this.id = id;
        this.type = type;
        this.value = value;
    }

    public String getId() { return id; }
    public DiscountType getType() { return type; }
    public double getValue() { return value; }

    public Money apply(Cart cart) {
        Money subtotal = cart.getSubtotal();
        if (type == DiscountType.PERCENTAGE) {
            return subtotal.multiply(value / 100.0);
        }
        if (type == DiscountType.FIXED_AMOUNT) {
            return Money.min(subtotal, Money.of(value));
        }
        throw new IllegalStateException("Unknown discount type: " + type);
    }
}
`,
            support: [
              { className: "DiscountType", source: DISCOUNT_TYPE_JAVA },
              { className: "Money", source: MONEY_JAVA },
              { className: "CartItem", source: CART_ITEM_JAVA },
              { className: "Cart", source: CART_JAVA },
            ],
            tests: [
              {
                id: "twenty-percent-off",
                label: "20 percent off a 5000-cent cart is 1000 cents off",
                body: `Cart cart = new Cart("c1");
cart.addItem(new CartItem("headphones", "electronics", Money.ofCents(5000)));
DiscountRule rule = new DiscountRule("r1", DiscountType.PERCENTAGE, 20.0);
Money discount = rule.apply(cart);
expectedText = "1000 cents off";
actualText = discount == null ? "null" : discount.getCents() + " cents off";
passed = discount != null && discount.getCents() == 1000;`,
              },
              {
                id: "percentage-uses-full-subtotal",
                label: "a percentage rule discounts the whole subtotal, not just one item",
                body: `Cart cart = new Cart("c2");
cart.addItem(new CartItem("keyboard", "electronics", Money.ofCents(2000)));
cart.addItem(new CartItem("novel", "books", Money.ofCents(3000)));
DiscountRule rule = new DiscountRule("r2", DiscountType.PERCENTAGE, 10.0);
Money discount = rule.apply(cart);
expectedText = "500 cents off the 5000-cent subtotal";
actualText = discount == null ? "null" : discount.getCents() + " cents off the 5000-cent subtotal";
passed = discount != null && discount.getCents() == 500;`,
              },
              {
                id: "fixed-amount-off",
                label: "a 15 dollar fixed coupon takes 1500 cents off a bigger cart",
                body: `Cart cart = new Cart("c3");
cart.addItem(new CartItem("blender", "kitchen", Money.ofCents(6000)));
DiscountRule rule = new DiscountRule("r3", DiscountType.FIXED_AMOUNT, 15.0);
Money discount = rule.apply(cart);
expectedText = "1500 cents off";
actualText = discount == null ? "null" : discount.getCents() + " cents off";
passed = discount != null && discount.getCents() == 1500;`,
              },
              {
                id: "fixed-never-exceeds-subtotal",
                label: "a 25 dollar coupon on a 10 dollar cart caps at the subtotal, never negative",
                body: `Cart cart = new Cart("c4");
cart.addItem(new CartItem("mug", "kitchen", Money.ofCents(1000)));
DiscountRule rule = new DiscountRule("r4", DiscountType.FIXED_AMOUNT, 25.0);
Money discount = rule.apply(cart);
expectedText = "1000 cents off, capped at the subtotal";
actualText = discount == null ? "null" : discount.getCents() + " cents off";
passed = discount != null && discount.getCents() == 1000;`,
              },
              {
                id: "fixed-covers-whole-cart",
                label: "a fixed coupon exactly equal to the subtotal makes the cart free, not negative",
                body: `Cart cart = new Cart("c5");
cart.addItem(new CartItem("poster", "home", Money.ofCents(3000)));
DiscountRule rule = new DiscountRule("r5", DiscountType.FIXED_AMOUNT, 30.0);
Money discount = rule.apply(cart);
expectedText = "3000 cents off, the whole cart";
actualText = discount == null ? "null" : discount.getCents() + " cents off";
passed = discount != null && discount.getCents() == 3000;`,
              },
            ],
          },
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
          java: {
            editClassName: "EligibilityPolicy",
            starterFile: `import java.util.List;

public class EligibilityPolicy {
    private final String id;
    private final Money minSpend;
    private final List<String> allowedCategories;
    private final int perCustomerLimit;

    public EligibilityPolicy(String id, Money minSpend, List<String> allowedCategories, int perCustomerLimit) {
        this.id = id;
        this.minSpend = minSpend;
        this.allowedCategories = allowedCategories;
        this.perCustomerLimit = perCustomerLimit;
    }

    public String getId() { return id; }
    public Money getMinSpend() { return minSpend; }
    public List<String> getAllowedCategories() { return allowedCategories; }
    public int getPerCustomerLimit() { return perCustomerLimit; }

    public boolean isEligible(Cart cart, Customer customer) {
        // Gate on min spend, category restriction, and the per-customer limit.
        // An empty allowedCategories list means no category restriction at all.
        return false;
    }
}
`,
            referenceFile: `import java.util.List;

public class EligibilityPolicy {
    private final String id;
    private final Money minSpend;
    private final List<String> allowedCategories;
    private final int perCustomerLimit;

    public EligibilityPolicy(String id, Money minSpend, List<String> allowedCategories, int perCustomerLimit) {
        this.id = id;
        this.minSpend = minSpend;
        this.allowedCategories = allowedCategories;
        this.perCustomerLimit = perCustomerLimit;
    }

    public String getId() { return id; }
    public Money getMinSpend() { return minSpend; }
    public List<String> getAllowedCategories() { return allowedCategories; }
    public int getPerCustomerLimit() { return perCustomerLimit; }

    public boolean isEligible(Cart cart, Customer customer) {
        if (cart.getSubtotal().isLessThan(minSpend)) {
            return false;
        }
        if (!allowedCategories.isEmpty() && !cart.containsAnyCategory(allowedCategories)) {
            return false;
        }
        return customer.getRedeemedCouponIds().size() < perCustomerLimit;
    }
}
`,
            support: [
              { className: "Money", source: MONEY_JAVA },
              { className: "CartItem", source: CART_ITEM_JAVA },
              { className: "Cart", source: CART_JAVA },
              { className: "Customer", source: CUSTOMER_JAVA },
            ],
            tests: [
              {
                id: "exactly-at-min-spend",
                label: "a cart exactly at the minimum spend qualifies",
                body: `Cart cart = new Cart("c1");
cart.addItem(new CartItem("headphones", "electronics", Money.ofCents(5000)));
EligibilityPolicy policy = new EligibilityPolicy("p1", Money.ofCents(5000), java.util.Collections.<String>emptyList(), 1);
boolean eligible = policy.isEligible(cart, new Customer("u1"));
expectedText = "eligible, 5000 cents meets a 5000-cent minimum";
actualText = eligible ? "eligible, 5000 cents meets a 5000-cent minimum" : "rejected at exactly the minimum";
passed = eligible;`,
              },
              {
                id: "just-below-min-spend",
                label: "a cart one cent under the minimum spend is rejected",
                body: `Cart cart = new Cart("c2");
cart.addItem(new CartItem("headphones", "electronics", Money.ofCents(4999)));
EligibilityPolicy policy = new EligibilityPolicy("p2", Money.ofCents(5000), java.util.Collections.<String>emptyList(), 1);
boolean eligible = policy.isEligible(cart, new Customer("u2"));
expectedText = "not eligible, 4999 cents is under the 5000-cent minimum";
actualText = eligible ? "eligible despite missing the minimum" : "not eligible, 4999 cents is under the 5000-cent minimum";
passed = !eligible;`,
              },
              {
                id: "empty-categories-no-restriction",
                label: "an empty category list restricts nothing",
                body: `Cart cart = new Cart("c3");
cart.addItem(new CartItem("mug", "kitchen", Money.ofCents(2000)));
EligibilityPolicy policy = new EligibilityPolicy("p3", Money.ofCents(1000), java.util.Collections.<String>emptyList(), 1);
boolean eligible = policy.isEligible(cart, new Customer("u3"));
expectedText = "eligible, no category restriction applies";
actualText = eligible ? "eligible, no category restriction applies" : "rejected even though no categories are restricted";
passed = eligible;`,
              },
              {
                id: "wrong-category-rejected",
                label: "a books-only coupon rejects an electronics-only cart",
                body: `Cart cart = new Cart("c4");
cart.addItem(new CartItem("keyboard", "electronics", Money.ofCents(4000)));
EligibilityPolicy policy = new EligibilityPolicy("p4", Money.ofCents(1000), java.util.Arrays.asList("books"), 1);
boolean eligible = policy.isEligible(cart, new Customer("u4"));
expectedText = "not eligible, nothing in the cart is a book";
actualText = eligible ? "eligible despite the category restriction" : "not eligible, nothing in the cart is a book";
passed = !eligible;`,
              },
              {
                id: "limit-reached-rejected",
                label: "a customer who already hit the per-customer limit is rejected",
                body: `Cart cart = new Cart("c5");
cart.addItem(new CartItem("novel", "books", Money.ofCents(3000)));
Customer repeat = new Customer("u5");
repeat.recordRedemption("coupon-a");
repeat.recordRedemption("coupon-b");
EligibilityPolicy policy = new EligibilityPolicy("p5", Money.ofCents(1000), java.util.Collections.<String>emptyList(), 2);
boolean eligible = policy.isEligible(cart, repeat);
expectedText = "not eligible, 2 redemptions already used of a limit of 2";
actualText = eligible ? "eligible despite hitting the limit" : "not eligible, 2 redemptions already used of a limit of 2";
passed = !eligible;`,
              },
              {
                id: "under-limit-still-eligible",
                label: "one prior redemption under a limit of two still qualifies",
                body: `Cart cart = new Cart("c6");
cart.addItem(new CartItem("novel", "books", Money.ofCents(3000)));
Customer returning = new Customer("u6");
returning.recordRedemption("coupon-a");
EligibilityPolicy policy = new EligibilityPolicy("p6", Money.ofCents(1000), java.util.Collections.<String>emptyList(), 2);
boolean eligible = policy.isEligible(cart, returning);
expectedText = "eligible, 1 redemption used of a limit of 2";
actualText = eligible ? "eligible, 1 redemption used of a limit of 2" : "rejected for having any history at all";
passed = eligible;`,
              },
            ],
          },
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
