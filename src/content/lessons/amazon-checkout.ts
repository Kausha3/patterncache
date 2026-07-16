import type { SDLesson } from "@/types";

export const amazonCheckout: SDLesson = {
  id: "amazon-checkout",
  track: "system-design",
  title: "Design Amazon's Checkout / Cart System",
  blurb: "100M+ users, 10x traffic spikes on sale days, correctness under concurrency.",
  estMinutes: 30,
  overview:
    "Checkout is a distributed-transaction problem wearing a shopping-cart costume. There are three steps across three services (reserve stock, charge the customer, create the order), and they all have to succeed together or roll back together. On top of that, it has to survive concurrent buyers racing for the last unit and a 10x traffic spike on sale day.",
  terms: ["client", "server", "database", "cache", "consistency", "loadBalancer", "cdn"],
  interview: {
    prompt: "Design Amazon's checkout and cart system.",
    opening: "Design the checkout flow, starting from an item in the cart all the way to a confirmed, paid order. Go ahead whenever you're ready.",
    summary:
      "You've scoped it: checkout built on top of an existing Inventory Service, at 100M users with 10x traffic spikes on sale days, and a hard guarantee against double-charging or charging without a confirmed order. That's enough to start designing.",
    questions: [
      {
        id: "scope",
        ask: "Is inventory management in scope, or can we assume Inventory Service already exists and just needs to be called?",
        category: "scope",
        answer: "Assume Inventory Service already exists. We're building checkout on top of it, not inventory itself.",
        why: "Keeps the conversation focused on the actual ask: the checkout flow, not re-deriving warehouse inventory.",
        establishes: "Inventory Service assumed to exist",
        lp: ["customer-obsession"],
      },
      {
        id: "scale",
        ask: "What's the scale we're talking about, a normal day or a big sale event like Prime Day?",
        category: "scale",
        answer: "Assume 100M active users, with sale-day traffic spiking to 10x normal.",
        why: "The 10x spike is the actual design constraint. A system that's fine at baseline but falls over on the one day revenue matters most is a failed design.",
        establishes: "100M users, 10x spike on sale days",
        lp: ["dive-deep"],
        branches: [
          { label: "Normal day", approach: "A modest fleet of app servers and a single payment integration handles it comfortably." },
          { label: "10x Prime-Day spike (this)", approach: "Inventory reservation must be atomic and fast, payment calls need timeouts and circuit-breaking, and the checkout path needs real horizontal headroom." },
        ],
      },
      {
        id: "guarantee",
        ask: "If payment succeeds but order confirmation fails, what should happen? Can we guarantee no double-charge and no lost payment?",
        category: "constraints",
        answer: "Yes. A customer must never be charged without getting a confirmed order, and never charged twice for one checkout.",
        why: "This is the correctness bar the whole design has to satisfy, and it's why we need an idempotent, orchestrated multi-step flow instead of independent fire-and-forget calls.",
        establishes: "No double-charge, no charge-without-order",
        lp: ["customer-obsession"],
      },
      {
        id: "2pc-premature",
        ask: "Should we use two-phase commit across services, or eventual consistency?",
        category: "premature",
        redirect: "That's the mechanism. First we should agree on the steps and the failure guarantee needed, then choose how to enforce it.",
      },
    ],
  },
  stages: [
    {
      title: "Direct checkout, one server",
      visibleNodes: ["client", "app", "db"],
      problem: "Checkout does reserve-stock, charge, and create-order as three separate calls with no coordination. If it crashes between any two steps, the cart is left in an inconsistent state.",
      fix: "Establish the core flow first: cart, then reserve, then charge, then order, called in sequence.",
      tradeoff: "It's simple to read, but there's zero failure handling. A crash between charge and order creation loses the customer's money with nothing to show for it.",
      metrics: { capacity: 500, latencyMs: 300 },
    },
    {
      title: "Orchestrate with a saga",
      visibleNodes: ["client", "app", "cartService", "inventoryReserve", "paymentService", "saga", "orderService"],
      problem: "The three-step checkout needs to either fully complete or cleanly roll back, with nothing in between.",
      fix: "Introduce a Saga/Orchestrator that drives reserve, charge, then confirm as one coordinated sequence, issuing compensating actions if any step fails.",
      tradeoff: "This buys correctness under partial failure, but it costs real orchestration complexity. Every step now needs an explicit undo, not just a happy path.",
      metrics: { capacity: 8000, latencyMs: 140 },
    },
    {
      title: "Make it idempotent and race-free",
      visibleNodes: ["client", "lb", "app", "cartService", "inventoryReserve", "paymentService", "saga", "orderService"],
      problem: "A retried request could re-run the saga and double-charge, and two customers checking out the last unit at once could both succeed the reservation step.",
      fix: "Give every checkout attempt an idempotency key so retries are safe, and make inventory reservation an atomic check-and-decrement so only one concurrent buyer wins.",
      tradeoff: "This closes the double-charge and oversell races, but now every service has to honor idempotency keys. That's a discipline that has to be enforced everywhere, not just at the edge.",
      metrics: { capacity: 60000, latencyMs: 60 },
    },
    {
      title: "Scale for the 10x spike",
      visibleNodes: ["client", "cdn", "lb", "app", "cartService", "inventoryReserve", "paymentService", "saga", "orderService", "cache"],
      problem: "On a sale day, checkout traffic spikes 10x, and payment providers themselves can slow down under that load. Just adding servers doesn't fix a slow downstream dependency.",
      fix: "Cache cart/session state and static checkout assets at the edge, autoscale the app tier, and wrap the payment call with a timeout and circuit breaker so a slow provider degrades gracefully.",
      tradeoff: "This handles the real failure mode of a sale-day spike, but the system gets a lot more operationally complex. Circuit breakers and idempotency need real monitoring before you can trust them in production.",
      metrics: { capacity: 700000, latencyMs: 35 },
    },
  ],
  recap: [
    "Checkout is a distributed-transaction problem. Reserve, charge, and confirm must succeed or roll back together, and that's exactly what a saga with compensating actions is for.",
    "Idempotency keys are what make retries safe. Without them, a client timeout that actually succeeded server-side turns into a double-charge on retry.",
    "Inventory reservation must be atomic (check-and-decrement in one step), or two concurrent buyers can both 'win' the last unit.",
    "A 10x sale-day spike isn't just 'more traffic.' It's a stress test on your slowest downstream dependency, which is why circuit breakers matter as much as autoscaling.",
  ],
  relatedLessons: ["amazon-warehouse", "rate-limiter"],
};
