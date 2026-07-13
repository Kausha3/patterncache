import type { ColdDrillPrompt } from "@/types";

/**
 * Cold Design Drill prompt bank — deliberately prompts with no full guided
 * lesson anywhere else in the app. The point isn't "did you memorize this
 * answer," it's "can you apply the same noun-filtering / responsibility-
 * assignment heuristic to something you've never drilled." New prompts are
 * just data — see docs in ColdDrill.tsx for how a reference gets compared
 * against the learner's own free-form attempt.
 */

const pizzaOrdering: ColdDrillPrompt = {
  id: "pizza-ordering",
  title: "Design a Pizza Ordering System",
  prompt: "Design a pizza ordering system.",
  reference: {
    entities: [
      {
        id: "order",
        name: "Order",
        isEntity: true,
        why: "The customer's order — owns the line items, tracks status through the whole lifecycle, and is the one thing every other class hangs off of.",
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
        why: "One line in the order — a specific pizza, its customizations, and a quantity. Order itself doesn't need to know about toppings or sizes, just that it owns a list of these.",
        properties: [
          { name: "id", type: "string" },
          { name: "pizza", type: "Pizza" },
          { name: "toppings", type: "List<Topping>" },
          { name: "quantity", type: "int" },
        ],
      },
      {
        id: "pizza",
        name: "Pizza",
        isEntity: true,
        why: "A menu definition — name, size, and base price. It's data the menu publishes, not something with its own behavior.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "size", type: "Size" },
          { name: "basePrice", type: "Money" },
        ],
      },
      {
        id: "topping",
        name: "Topping",
        isEntity: true,
        why: "Has its own identity and price, and gets reused across many pizzas and many orders — that's exactly what makes it a real class instead of just a string.",
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
        why: "The money moving is a distinct concern from the order itself, with its own status and its own failure modes — a declined card shouldn't corrupt the order.",
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
        why: "Tracks the hand-off from kitchen to customer — a driver, a status, and an ETA. An order picked up in-store never needs one of these, which is exactly why it's not just a field on Order.",
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
        why: "A real actor with their own state (available or not) that outlives any single delivery — the same driver delivers order after order.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "isAvailable", type: "boolean" },
        ],
      },
      { id: "menu", name: "Menu", isEntity: false, why: "Just the current list of Pizza and Topping the kitchen already models — giving it its own class with no new behavior is over-engineering." },
      { id: "address", name: "Address", isEntity: false, why: "A value Order holds (or a customer's field), not a class with its own behavior — modeling it separately adds a class for no new responsibility." },
      { id: "coupon", name: "Coupon", isEntity: false, why: "Nobody asked for discounts or promotions — inventing this scope adds complexity the prompt never requested." },
    ],
    methods: [
      { id: "m1", signature: "addItem(item): void", ownerId: "order", justification: "Order owns its own items list; nothing else should be able to reach in and mutate it directly." },
      { id: "m2", signature: "calculateTotal(): Money", ownerId: "order", justification: "Total is derived purely from this order's own items — Order is the only class with the full list to sum, and it does so by summing each item's own calculatePrice()." },
      { id: "m3", signature: "updateStatus(status): void", ownerId: "order", justification: "Status is Order's own lifecycle field; only Order should be the one thing that can transition it, so nothing else can leave it in an invalid state." },
      { id: "m4", signature: "calculatePrice(): Money", ownerId: "orderitem", justification: "Price for one line depends on this item's own pizza, toppings, and quantity — Order shouldn't need to know pizza/topping pricing to total itself." },
      { id: "m5", signature: "charge(amount): boolean", ownerId: "payment", justification: "Processing the charge is Payment's whole reason to exist — same split as every other transactional system." },
      { id: "m6", signature: "refund(): boolean", ownerId: "payment", justification: "A failed delivery or a mistaken order needs to reverse the same transaction Payment already owns — keeping refund on Payment means money-movement logic never leaks into Order or Delivery." },
      { id: "m7", signature: "assignDriver(driver): void", ownerId: "delivery", justification: "Delivery is the only class that connects an order to a driver — Driver itself shouldn't need to know which orders it's carrying to do its own job." },
      { id: "m8", signature: "markDelivered(): void", ownerId: "delivery", justification: "Same reasoning as Order's updateStatus() — the class that owns a status field is the only one that should transition it." },
      { id: "m9", signature: "setAvailable(available): void", ownerId: "driver", justification: "isAvailable lives on Driver — only the class holding the flag should be the one flipping it, same invariant-protection shape as a ParkingSpot's isOccupied." },
    ],
    relationships: [
      "Order has many OrderItems",
      "OrderItem references one Pizza and many Toppings",
      "Payment is computed from an Order's total",
      "Delivery references one Order and one Driver",
    ],
    edgeCases: [
      {
        scenario: "A topping is removed from the menu while it's still sitting inside an already-placed order.",
        handling: "OrderItem holds its own copy of the topping's price and name at order time, not a live reference to the menu — otherwise removing a topping from the menu would silently corrupt the price of every past order that used it.",
      },
      {
        scenario: "The customer's card is declined after the kitchen has already started making the pizza.",
        handling: "Payment failing doesn't roll back Order — the kitchen has already sunk the cost. Order moves to a PAYMENT_FAILED-style status that still requires resolution, rather than silently cancelling food that's already being made.",
      },
      {
        scenario: "No driver is available when an order is ready for delivery.",
        handling: "Delivery shouldn't be created at all until a Driver is actually assigned — Order can sit in a READY status with no Delivery object yet, rather than creating a Delivery with a null driver.",
      },
      {
        scenario: "The same order gets marked delivered twice (a duplicate driver-app tap).",
        handling: "markDelivered() should reject a second transition from an already-DELIVERED status — same invariant-protection shape as a ParkingSpot checking isOccupied before assigning.",
      },
    ],
    tradeoffs: [
      {
        decision: "OrderItem is its own class instead of Order holding a flat List<Pizza> with a separate quantities map.",
        reasoning: "Costs one more class, but keeps quantity, toppings, and per-line pricing attached to the thing they actually describe — a flat list of Pizza can't represent two of the same pizza with different toppings.",
      },
      {
        decision: "Delivery is separate from Order instead of putting driver/ETA fields directly on Order.",
        reasoning: "An order picked up in-store never needs a driver or an ETA — bolting those fields onto Order means every in-store order carries fields that are always null.",
      },
      {
        decision: "Payment is separate from Order, same pattern as the Parking Lot lesson's Ticket/Payment split.",
        reasoning: "The order's contents and the transaction that pays for it fail independently — a declined card shouldn't corrupt what's already in the kitchen queue.",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "OrderItem only knows how to price itself from its own pizza+toppings+quantity; Order only knows how to sum whatever items it holds — neither reaches into the other's math." },
      { name: "Encapsulation", explanation: "Order.updateStatus() and Driver.setAvailable() are the only ways to change those fields — nothing else reaches in and flips a status or availability flag directly." },
      { name: "Value objects don't need identity", explanation: "A topping's price-at-order-time is copied data, not a class with its own behavior — giving every value full class treatment models data as if it were an actor." },
    ],
  },
};

const COLD_DRILLS: ColdDrillPrompt[] = [pizzaOrdering];

export function listColdDrills(): ColdDrillPrompt[] {
  return COLD_DRILLS;
}

export function getColdDrill(id: string): ColdDrillPrompt | undefined {
  return COLD_DRILLS.find((d) => d.id === id);
}
