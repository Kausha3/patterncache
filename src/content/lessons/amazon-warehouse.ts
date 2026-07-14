import type { SDLesson } from "@/types";

export const amazonWarehouse: SDLesson = {
  id: "amazon-warehouse",
  track: "system-design",
  title: "Design Amazon's Warehouse / Fulfillment System",
  blurb: "Inventory, order routing, pick-and-pack at fulfillment-center scale.",
  estMinutes: 8,
  overview:
    "This is Amazon's single most-cited system-design prompt, and for good reason. It's really three problems bundled into one: which warehouse should fulfill an order, how do you keep stock counts accurate across hundreds of sites without one giant lock, and what happens when the physical pick-and-pack process doesn't go as planned. Every piece of the design traces back to one tension: stock accuracy versus write throughput.",
  terms: ["client", "server", "database", "cache", "loadBalancer", "queue"],
  interview: {
    prompt: "Design Amazon's warehouse / fulfillment system.",
    opening: "Let's design the system behind Amazon's warehouses, starting from an order coming in to it leaving a fulfillment center. Where do you want to start?",
    summary:
      "You've scoped it: the full flow from routing through inventory to pick/pack, at hundreds of warehouses and tens of millions of orders a day at peak, with eventual consistency acceptable on stock counts. That's enough. Go build it.",
    questions: [
      {
        id: "scope",
        ask: "Are we designing inventory tracking, order routing to warehouses, or the in-warehouse pick/pack workflow? Or all three end to end?",
        category: "scope",
        answer: "All three, end to end, from an order being placed to it leaving a warehouse.",
        why: "This is a genuinely broad prompt; scoping which pieces you're covering keeps the conversation focused instead of drifting.",
        establishes: "End-to-end: routing + inventory + pick/pack",
        lp: ["customer-obsession"],
      },
      {
        id: "scale",
        ask: "How many warehouses, and roughly how many orders per day at peak?",
        category: "scale",
        answer: "Hundreds of fulfillment centers, tens of millions of orders per day at peak. Think Prime Day.",
        why: "This is the number that forces sharding inventory by warehouse and event-driven updates instead of one locking database.",
        establishes: "100s of warehouses, 10s of millions orders/day peak",
        lp: ["dive-deep"],
        branches: [
          { label: "Single warehouse (tiny)", approach: "One inventory table and no routing decision needed at all. Trivial." },
          { label: "100s of warehouses, Prime Day (this)", approach: "Inventory must be sharded per warehouse and updated via an event stream, and routing becomes a real optimization problem (stock + proximity)." },
        ],
      },
      {
        id: "consistency",
        ask: "Can inventory counts be very briefly stale, or must every read be exactly correct?",
        category: "constraints",
        answer: "Brief staleness is fine. A few seconds of lag on a stock count is acceptable.",
        why: "This is the green light for an event-driven, eventually-consistent inventory model instead of one strongly-consistent lock, and it's what makes the whole thing scale.",
        establishes: "Eventual consistency on stock counts OK",
        lp: ["bias-for-action"],
        branches: [
          { label: "Eventual OK (this)", approach: "Stream inventory changes as events. Every consumer catches up within seconds, so it's cheap and scalable." },
          { label: "Must be exact always", approach: "Every stock check needs a synchronous, strongly-consistent read. That's correct, but it turns into a serialization bottleneck under Prime-Day load." },
        ],
      },
      {
        id: "db-premature",
        ask: "Should inventory be stored in DynamoDB or a relational database?",
        category: "premature",
        redirect: "Hold that thought. First nail the access pattern and consistency needs, then the store falls out of that.",
      },
    ],
  },
  stages: [
    {
      title: "Single warehouse, direct write",
      visibleNodes: ["client", "app", "db"],
      problem: "One order-taking service writes directly to one inventory table for one warehouse. Fine for a single site, but there's no way to pick the right warehouse, and every write serializes on one database.",
      fix: "Establish the core flow first: an order decrements stock in a single inventory table.",
      tradeoff: "Trivial to reason about, but a single warehouse and a single DB is both a scale and an availability ceiling.",
      metrics: { capacity: 400, latencyMs: 150 },
    },
    {
      title: "Route to the right warehouse",
      visibleNodes: ["client", "app", "orderRouter", "inventory", "db"],
      problem: "Customers order from anywhere, but stock lives in specific warehouses, and the app has no way to decide which warehouse should fulfill a given order.",
      fix: "Add an Order Router that checks Inventory Service across candidate warehouses and picks the best one by stock and proximity.",
      tradeoff: "Correct routing now, but Inventory Service still serves synchronous reads from one growing table. That table becomes the new bottleneck as warehouse count grows.",
      metrics: { capacity: 4000, latencyMs: 70 },
    },
    {
      title: "Event-driven inventory, sharded",
      visibleNodes: ["client", "app", "orderRouter", "inventory", "eventStream", "wms"],
      problem: "Every warehouse writing and reading the same central inventory table doesn't scale to hundreds of sites, and pick/pack actions need to reflect in stock counts fast.",
      fix: "Shard Inventory Service per warehouse, and stream every stock-changing event through an Event Stream so every consumer sees updates in order without a central lock.",
      tradeoff: "Scales cleanly to hundreds of warehouses and decouples producers from consumers, at the cost of the eventual-consistency lag you already scoped as acceptable.",
      metrics: { capacity: 60000, latencyMs: 35 },
    },
    {
      title: "Handle Prime-Day spikes and failures",
      visibleNodes: ["client", "cdn", "lb", "app", "orderRouter", "inventory", "eventStream", "wms", "cache"],
      problem: "On Prime Day, order volume spikes 10-50x, and in-warehouse failures (say an item scanned as picked but actually out of stock) have to be caught before they become undeliverable orders.",
      fix: "Cache hot-SKU stock counts to absorb read spikes, load-balance across many app-server replicas, and have the warehouse system emit a pick-exception event so Order Router can re-route or refund instead of shipping a broken promise.",
      tradeoff: "Handles the real spike and the real failure mode, at the cost of a genuinely more complex event-driven system with more moving parts to operate.",
      metrics: { capacity: 900000, latencyMs: 20 },
    },
  ],
  recap: [
    "The core tension is stock accuracy vs. write throughput. Eventual consistency via an event stream is what lets hundreds of warehouses update independently without serializing on one table.",
    "Order routing is a real optimization problem (stock availability + proximity), not just 'pick any warehouse with the item'.",
    "Pick/pack failures are a first-class case, not an edge case, so a warehouse-side exception has to flow back and trigger re-routing or refund.",
    "This is Amazon's single most-cited system-design prompt, and the event-driven inventory pattern here generalizes to almost any 'many locations, one shared count' problem.",
  ],
  relatedLessons: ["amazon-checkout", "url-shortener"],
};
