import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const MONEY_JAVA = `public class Money {
    private final int cents;

    public Money(int cents) {
        this.cents = cents;
    }

    public int getCents() { return cents; }
    public Money add(Money other) { return new Money(cents + other.cents); }
}
`;

const SIZE_JAVA = `public enum Size {
    SMALL, MEDIUM, LARGE;

    public String label() {
        switch (this) {
            case SMALL: return "Small";
            case MEDIUM: return "Medium";
            default: return "Large";
        }
    }
}
`;

const PIZZA_JAVA = `public interface Pizza {
    Money getCost();
    String getDescription();
}
`;

const TOPPING_JAVA = `public class Topping {
    private final String id;
    private final String name;
    private final Money price;

    public Topping(String id, String name, Money price) {
        this.id = id;
        this.name = name;
        this.price = price;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public Money getPrice() { return price; }
}
`;

const PLAIN_PIZZA_JAVA = `public class PlainPizza implements Pizza {
    private final String id;
    private final Size size;
    private final Money basePrice;

    public PlainPizza(String id, Size size, Money basePrice) {
        this.id = id;
        this.size = size;
        this.basePrice = basePrice;
    }

    public String getId() { return id; }
    public Size getSize() { return size; }

    public Money getCost() { return basePrice; }

    public String getDescription() { return size.label() + " pizza"; }
}
`;

// Both exercises edit ToppingDecorator; each starter stubs only its own
// target method, and both share this fully-implemented reference file.
const TOPPING_DECORATOR_REFERENCE_JAVA = `public class ToppingDecorator implements Pizza {
    private final Pizza wrappedPizza;
    private final Topping topping;

    public ToppingDecorator(Pizza wrappedPizza, Topping topping) {
        this.wrappedPizza = wrappedPizza;
        this.topping = topping;
    }

    public Money getCost() {
        return wrappedPizza.getCost().add(topping.getPrice());
    }

    public String getDescription() {
        return wrappedPizza.getDescription() + " + " + topping.getName();
    }
}
`;

const PIZZA_SUPPORT = [
  { className: "Money", source: MONEY_JAVA },
  { className: "Size", source: SIZE_JAVA },
  { className: "Pizza", source: PIZZA_JAVA },
  { className: "Topping", source: TOPPING_JAVA },
  { className: "PlainPizza", source: PLAIN_PIZZA_JAVA },
];

export const pizzaOrdering: ColdDrillPrompt = {
  id: "pizza-ordering",
  title: "Design a Pizza Ordering System",
  prompt: "Design a pizza ordering system.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is this just placing an order, or does it include kitchen prep and delivery too?",
        why: "Decides whether Delivery and Driver exist at all. An order-only scope drops both classes entirely.",
      },
      {
        question: "Can a pizza be customized (extra toppings, size), or is the menu fixed?",
        why: "Decides whether toppings need to compose onto a pizza at all. A fixed menu means Pizza is just a flat data row, but customizable toppings is exactly what makes a Decorator-shaped model worth it.",
      },
      {
        question: "Is payment in scope, or just the order itself?",
        why: "Decides whether Payment is even a class in the model. Same scoping question Parking Lot's payment clarify-Q asks.",
      },
      {
        question: "One restaurant, or a marketplace of many restaurants?",
        why: "A single restaurant needs no Restaurant class at all, but a marketplace means Pizza and Order both need to reference which restaurant they belong to. That's a structural fork, not a detail.",
      },
    ],
    entities: [
      {
        id: "order",
        name: "Order",
        isEntity: true,
        why: "The customer's order. It owns the line items, tracks status through the whole lifecycle, and is the one thing every other class hangs off of.",
        properties: [
          { name: "id", type: "string" },
          { name: "items", type: "List<OrderItem>" },
          { name: "status", type: "OrderStatus" },
          { name: "total", type: "Money" },
        ],
      },
      {
        id: "orderitem",
        name: "OrderItem",
        isEntity: true,
        why: "One line in the order: a fully-decorated pizza and a quantity. Order itself doesn't need to know how many toppings are stacked on that pizza, just that it owns a list of these.",
        properties: [
          { name: "id", type: "string" },
          { name: "pizza", type: "Pizza" },
          { name: "quantity", type: "int" },
        ],
      },
      {
        id: "pizza",
        name: "Pizza",
        isEntity: true,
        why: "The shared contract PlainPizza and ToppingDecorator both implement, meaning getCost() and getDescription(). It has no fields of its own. It's a behavioral contract, not shared state, and that's what makes decorators stackable and interchangeable with the thing they wrap.",
        properties: [],
      },
      {
        id: "plainpizza",
        name: "PlainPizza",
        isEntity: true,
        why: "The base case: an undecorated pizza with just a size and a base price. Every decorator chain bottoms out at one of these.",
        properties: [
          { name: "id", type: "string" },
          { name: "size", type: "Size" },
          { name: "basePrice", type: "Money" },
        ],
      },
      {
        id: "toppingdecorator",
        name: "ToppingDecorator",
        isEntity: true,
        why: "Wraps any Pizza (a PlainPizza, or another ToppingDecorator) and adds one topping's cost and name on top, while still being a Pizza itself. That means it can be wrapped again or handed to OrderItem with no special-casing.",
        properties: [
          { name: "wrappedPizza", type: "Pizza" },
          { name: "topping", type: "Topping" },
        ],
      },
      {
        id: "topping",
        name: "Topping",
        isEntity: true,
        why: "Menu-level data, name and price, that a ToppingDecorator references rather than hardcodes. So adding a new topping to the menu never means writing a new decorator class.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "price", type: "Money" },
        ],
      },
      {
        id: "payment",
        name: "Payment",
        isEntity: true,
        why: "The money moving is a distinct concern from the order itself, with its own status and its own failure modes. A declined card shouldn't corrupt the order.",
        properties: [
          { name: "id", type: "string" },
          { name: "order", type: "Order" },
          { name: "amount", type: "Money" },
          { name: "status", type: "PaymentStatus" },
        ],
      },
      {
        id: "delivery",
        name: "Delivery",
        isEntity: true,
        why: "Tracks the hand-off from kitchen to customer: a driver, a status, and an ETA. An order picked up in-store never needs one of these, which is why it's not just a field on Order.",
        properties: [
          { name: "id", type: "string" },
          { name: "order", type: "Order" },
          { name: "driver", type: "Driver" },
          { name: "status", type: "DeliveryStatus" },
        ],
      },
      {
        id: "driver",
        name: "Driver",
        isEntity: true,
        why: "A real actor with their own state (available or not) that outlives any single delivery. The same driver delivers order after order.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "isAvailable", type: "boolean" },
        ],
      },
      { id: "menu", name: "Menu", isEntity: false, why: "Just the current list of Pizza and Topping the kitchen already models. Giving it its own class with no new behavior is over-engineering." },
      { id: "address", name: "Address", isEntity: false, why: "A value Order holds (or a customer's field), not a class with its own behavior. Modeling it separately adds a class for no new responsibility." },
      { id: "coupon", name: "Coupon", isEntity: false, why: "Nobody asked for discounts or promotions, so inventing this scope adds complexity the prompt never requested." },
    ],
    methods: [
      { id: "m1", signature: "addItem(item): void", ownerId: "order", justification: "Order owns its own items list; nothing else should be able to reach in and mutate it directly." },
      { id: "m2", signature: "calculateTotal(): Money", ownerId: "order", justification: "Total is derived purely from this order's own items. Order is the only class with the full list to sum, and it does so by summing each item's own calculatePrice()." },
      { id: "m3", signature: "updateStatus(status): void", ownerId: "order", justification: "Status is Order's own lifecycle field; only Order should be the one thing that can transition it, so nothing else can leave it in an invalid state." },
      { id: "m4", signature: "calculatePrice(): Money", ownerId: "orderitem", justification: "OrderItem just multiplies whatever its Pizza reports back by quantity. It never inspects how many toppings are stacked or what they cost, since that math lives entirely inside the Pizza/ToppingDecorator chain now." },
      { id: "m5", signature: "getCost(): Money", ownerId: "plainpizza", justification: "The base case of the decorator chain. PlainPizza just reports its own basePrice, with no wrapped pizza to delegate to." },
      { id: "m6", signature: "getDescription(): String", ownerId: "plainpizza", justification: "Same base-case reasoning as getCost(). PlainPizza describes itself directly (its size), with nothing to delegate to." },
      {
        id: "m7",
        signature: "getCost(): Money",
        ownerId: "toppingdecorator",
        justification: "ToppingDecorator can't know its own total cost without asking the Pizza it wraps first. That wrapped Pizza might itself be another ToppingDecorator, so this call recurses until it bottoms out at a PlainPizza.",
        codeExercise: {
          language: "java",
          starter: "Money getCost() {\n    // your code here\n}",
          reference: "Money getCost() {\n    return wrappedPizza.getCost().add(topping.getPrice());\n}",
          checklist: [
            "Adds this topping's own price to the wrapped pizza's cost, doesn't replace it",
            "Calls wrappedPizza.getCost() rather than assuming the wrapped pizza is a PlainPizza, since it might be another ToppingDecorator",
            "Works correctly no matter how many layers deep the chain is, since each layer only ever asks the one it wraps",
          ],
          java: {
            editClassName: "ToppingDecorator",
            starterFile: `public class ToppingDecorator implements Pizza {
    private final Pizza wrappedPizza;
    private final Topping topping;

    public ToppingDecorator(Pizza wrappedPizza, Topping topping) {
        this.wrappedPizza = wrappedPizza;
        this.topping = topping;
    }

    public Money getCost() {
        // Ask the wrapped pizza for its cost first (it may be another decorator),
        // then add this topping's own price on top.
        return null;
    }

    public String getDescription() {
        return wrappedPizza.getDescription() + " + " + topping.getName();
    }
}
`,
            referenceFile: TOPPING_DECORATOR_REFERENCE_JAVA,
            support: PIZZA_SUPPORT,
            tests: [
              {
                id: "one-topping-total",
                label: "one topping adds its price to the base pizza's cost",
                body: `Pizza plain = new PlainPizza("p1", Size.MEDIUM, new Money(1000));
Pizza withPepperoni = new ToppingDecorator(plain, new Topping("t1", "Pepperoni", new Money(250)));
Money cost = withPepperoni.getCost();
expectedText = "1250 cents (1000 base + 250 topping)";
actualText = cost == null ? "null" : cost.getCents() + " cents";
passed = cost != null && cost.getCents() == 1250;`,
              },
              {
                id: "two-toppings-recurse",
                label: "two stacked decorators recurse down to the plain pizza",
                body: `Pizza plain = new PlainPizza("p1", Size.MEDIUM, new Money(900));
Pizza withPepperoni = new ToppingDecorator(plain, new Topping("t1", "Pepperoni", new Money(200)));
Pizza withCheese = new ToppingDecorator(withPepperoni, new Topping("t2", "Extra Cheese", new Money(150)));
Money cost = withCheese.getCost();
expectedText = "1250 cents (900 + 200 + 150 through two decorator layers)";
actualText = cost == null ? "null" : cost.getCents() + " cents";
passed = cost != null && cost.getCents() == 1250;`,
              },
              {
                id: "free-base-still-charges-topping",
                label: "a free base pizza still charges for its topping, not just the wrapped cost",
                body: `Pizza plain = new PlainPizza("p1", Size.SMALL, new Money(0));
Pizza withOlives = new ToppingDecorator(plain, new Topping("t1", "Olives", new Money(350)));
Money cost = withOlives.getCost();
expectedText = "350 cents (0 base + 350 topping)";
actualText = cost == null ? "null" : cost.getCents() + " cents";
passed = cost != null && cost.getCents() == 350;`,
              },
              {
                id: "double-same-topping",
                label: "the same topping stacked twice is charged twice",
                body: `Topping pepperoni = new Topping("t1", "Pepperoni", new Money(300));
Pizza plain = new PlainPizza("p1", Size.LARGE, new Money(800));
Pizza doublePepperoni = new ToppingDecorator(new ToppingDecorator(plain, pepperoni), pepperoni);
Money cost = doublePepperoni.getCost();
expectedText = "1400 cents (800 base + 300 + 300 for double pepperoni)";
actualText = cost == null ? "null" : cost.getCents() + " cents";
passed = cost != null && cost.getCents() == 1400;`,
              },
              {
                id: "three-layers-deep",
                label: "a three-topping chain sums every layer, however deep",
                body: `Pizza pizza = new PlainPizza("p1", Size.SMALL, new Money(500));
pizza = new ToppingDecorator(pizza, new Topping("t1", "Mushroom", new Money(100)));
pizza = new ToppingDecorator(pizza, new Topping("t2", "Onion", new Money(120)));
pizza = new ToppingDecorator(pizza, new Topping("t3", "Basil", new Money(80)));
Money cost = pizza.getCost();
expectedText = "800 cents (500 + 100 + 120 + 80)";
actualText = cost == null ? "null" : cost.getCents() + " cents";
passed = cost != null && cost.getCents() == 800;`,
              },
            ],
          },
        },
      },
      {
        id: "m8",
        signature: "getDescription(): String",
        ownerId: "toppingdecorator",
        justification: "Same recursive-delegation shape as getCost(). This decorator only knows its own topping's name, so it asks the wrapped Pizza to describe itself first and appends to that.",
        codeExercise: {
          language: "java",
          starter: "String getDescription() {\n    // your code here\n}",
          reference: "String getDescription() {\n    return wrappedPizza.getDescription() + \" + \" + topping.getName();\n}",
          checklist: [
            "Delegates to wrappedPizza.getDescription() first, then appends this decorator's own topping name",
            "Reads the topping's name from this decorator's own field, doesn't hardcode a specific topping",
            "Produces a readable chain like 'Medium pizza + Pepperoni + Extra Cheese' regardless of how many toppings are stacked",
          ],
          java: {
            editClassName: "ToppingDecorator",
            starterFile: `public class ToppingDecorator implements Pizza {
    private final Pizza wrappedPizza;
    private final Topping topping;

    public ToppingDecorator(Pizza wrappedPizza, Topping topping) {
        this.wrappedPizza = wrappedPizza;
        this.topping = topping;
    }

    public Money getCost() {
        return wrappedPizza.getCost().add(topping.getPrice());
    }

    public String getDescription() {
        // Ask the wrapped pizza to describe itself first,
        // then append " + " and this topping's own name.
        return null;
    }
}
`,
            referenceFile: TOPPING_DECORATOR_REFERENCE_JAVA,
            support: PIZZA_SUPPORT,
            tests: [
              {
                id: "one-topping-description",
                label: "one topping appends its name to the base description",
                body: `Pizza plain = new PlainPizza("p1", Size.MEDIUM, new Money(1000));
Pizza withPepperoni = new ToppingDecorator(plain, new Topping("t1", "Pepperoni", new Money(250)));
String description = withPepperoni.getDescription();
expectedText = "Medium pizza + Pepperoni";
actualText = description == null ? "null" : description;
passed = description != null && description.equals("Medium pizza + Pepperoni");`,
              },
              {
                id: "two-toppings-chain",
                label: "two stacked toppings read as one chain in wrap order",
                body: `Pizza plain = new PlainPizza("p1", Size.MEDIUM, new Money(900));
Pizza withPepperoni = new ToppingDecorator(plain, new Topping("t1", "Pepperoni", new Money(200)));
Pizza withCheese = new ToppingDecorator(withPepperoni, new Topping("t2", "Extra Cheese", new Money(150)));
String description = withCheese.getDescription();
expectedText = "Medium pizza + Pepperoni + Extra Cheese";
actualText = description == null ? "null" : description;
passed = description != null && description.equals("Medium pizza + Pepperoni + Extra Cheese");`,
              },
              {
                id: "base-comes-first",
                label: "the wrapped pizza describes itself first, the topping comes after",
                body: `Pizza plain = new PlainPizza("p1", Size.SMALL, new Money(600));
Pizza withOlives = new ToppingDecorator(plain, new Topping("t1", "Olives", new Money(75)));
String description = withOlives.getDescription();
expectedText = "a description starting with 'Small pizza', the wrapped pizza's own words";
actualText = description == null ? "null" : "'" + description + "'";
passed = description != null && description.startsWith("Small pizza");`,
              },
              {
                id: "no-hardcoded-topping",
                label: "the name comes from this decorator's own Topping field, not a hardcoded string",
                body: `Pizza plain = new PlainPizza("p1", Size.LARGE, new Money(1200));
Pizza withJalapeno = new ToppingDecorator(plain, new Topping("t1", "Jalapeno", new Money(90)));
String description = withJalapeno.getDescription();
expectedText = "Large pizza + Jalapeno";
actualText = description == null ? "null" : description;
passed = description != null && description.equals("Large pizza + Jalapeno");`,
              },
              {
                id: "double-topping-listed-twice",
                label: "the same topping stacked twice is listed twice",
                body: `Topping mushroom = new Topping("t1", "Mushroom", new Money(110));
Pizza plain = new PlainPizza("p1", Size.SMALL, new Money(700));
Pizza doubleMushroom = new ToppingDecorator(new ToppingDecorator(plain, mushroom), mushroom);
String description = doubleMushroom.getDescription();
expectedText = "Small pizza + Mushroom + Mushroom";
actualText = description == null ? "null" : description;
passed = description != null && description.equals("Small pizza + Mushroom + Mushroom");`,
              },
            ],
          },
        },
      },
      { id: "m9", signature: "charge(amount): boolean", ownerId: "payment", justification: "Processing the charge is Payment's whole reason to exist, same split as every other transactional system." },
      { id: "m10", signature: "refund(): boolean", ownerId: "payment", justification: "A failed delivery or a mistaken order needs to reverse the same transaction Payment already owns. Keeping refund on Payment means money-movement logic never leaks into Order or Delivery." },
      { id: "m11", signature: "assignDriver(driver): void", ownerId: "delivery", justification: "Delivery is the only class that connects an order to a driver. Driver itself shouldn't need to know which orders it's carrying to do its own job." },
      { id: "m12", signature: "markDelivered(): void", ownerId: "delivery", justification: "Same reasoning as Order's updateStatus(): the class that owns a status field is the only one that should transition it." },
      { id: "m13", signature: "setAvailable(available): void", ownerId: "driver", justification: "isAvailable lives on Driver, so only the class holding the flag should be the one flipping it. Same invariant-protection shape as a ParkingSpot's isOccupied." },
    ],
    relationships: [
      "Order has many OrderItems",
      "OrderItem references one Pizza",
      "ToppingDecorator wraps one Pizza and references one Topping",
      "PlainPizza and ToppingDecorator both implement Pizza",
      "Payment is computed from an Order's total",
      "Delivery references one Order and one Driver",
    ],
    edgeCases: [
      {
        scenario: "A topping's price on the menu changes while it's still stacked inside an already-placed order.",
        handling: "A ToppingDecorator captures the Topping's price at the moment it's built into the chain, not a live reference to a mutable menu row. Otherwise repricing a topping on the menu would silently change the cost of every past order that used it.",
      },
      {
        scenario: "The same topping is added twice to one pizza (double pepperoni).",
        handling: "Nothing stops wrapping two ToppingDecorators referencing the same Topping around one Pizza. Each layer only cares about the one it wraps, so getCost() and getDescription() both handle it correctly, charging and listing the topping twice, which is the physically correct outcome.",
      },
      {
        scenario: "The customer's card is declined after the kitchen has already started making the pizza.",
        handling: "Payment failing doesn't roll back Order, since the kitchen has already sunk the cost. Order moves to a PAYMENT_FAILED-style status that still requires resolution, rather than silently cancelling food that's already being made.",
      },
      {
        scenario: "No driver is available when an order is ready for delivery.",
        handling: "Delivery shouldn't be created at all until a Driver is actually assigned. Order can sit in a READY status with no Delivery object yet, rather than creating a Delivery with a null driver.",
      },
      {
        scenario: "The same order gets marked delivered twice (a duplicate driver-app tap).",
        handling: "markDelivered() should reject a second transition from an already-DELIVERED status. Same invariant-protection shape as a ParkingSpot checking isOccupied before assigning.",
      },
    ],
    tradeoffs: [
      {
        decision: "Toppings are modeled as a ToppingDecorator wrapping a Pizza, instead of OrderItem holding a flat List<Topping>.",
        reasoning: "The flat-list version needs OrderItem.calculatePrice() to know how to sum a base price plus every topping itself. The decorator version pushes that math into the Pizza chain, so calculatePrice() shrinks to pizza.getCost() * quantity, and a brand-new topping can be added to the menu without touching OrderItem or Pizza's existing code. The cost is that a decorated pizza is a chain you have to walk, not one flat object.",
      },
      {
        decision: "One generic ToppingDecorator parameterized by a Topping reference, instead of a separate decorator subclass per topping type (PepperoniDecorator, ExtraCheeseDecorator, and so on).",
        reasoning: "A subclass per topping reads cleanly in a textbook example with three or four fixed options, but a real pizza menu can have dozens of toppings. One generic ToppingDecorator holding a Topping reference scales to any menu size with zero new classes, at the cost of losing a place to hang topping-specific behavior if any single topping ever needed unique logic beyond price and name.",
      },
      {
        decision: "OrderItem is its own class instead of Order holding a flat List<Pizza> with a separate quantities map.",
        reasoning: "Costs one more class, but keeps quantity and per-line pricing attached to the thing it actually describes. A flat list of Pizza can't represent two orders of the same pizza built with different topping stacks.",
      },
      {
        decision: "Delivery is separate from Order instead of putting driver/ETA fields directly on Order.",
        reasoning: "An order picked up in-store never needs a driver or an ETA. Bolting those fields onto Order means every in-store order carries fields that are always null.",
      },
      {
        decision: "Payment is separate from Order, same pattern as the Parking Lot lesson's Ticket/Payment split.",
        reasoning: "The order's contents and the transaction that pays for it fail independently. A declined card shouldn't corrupt what's already in the kitchen queue.",
      },
    ],
    principles: [
      {
        name: "Decorator Pattern",
        explanation: "ToppingDecorator wraps a Pizza and adds its own cost and description on top, while still being a Pizza itself (same getCost()/getDescription() contract). That's what lets decorators stack arbitrarily deep and lets OrderItem treat the whole chain as just 'a Pizza,' never knowing or caring how many toppings are on it.",
      },
      { name: "Single Responsibility Principle", explanation: "OrderItem only knows how to combine a Pizza's reported cost with a quantity. Pizza and its decorators own all topping-pricing logic themselves, and OrderItem never inspects what's inside the chain." },
      { name: "Encapsulation", explanation: "Order.updateStatus() and Driver.setAvailable() are the only ways to change those fields. Nothing else reaches in and flips a status or availability flag directly." },
      { name: "Value objects don't need identity", explanation: "A topping's price-at-decoration-time is copied data, not a class with its own behavior. Giving every value full class treatment models data as if it were an actor." },
    ],
  },
};
