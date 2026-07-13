import type { SDLesson } from "@/types";

export const rateLimiter: SDLesson = {
  id: "rate-limiter",
  track: "system-design",
  title: "Designing a Rate Limiter",
  blurb: "Reject the excess fast — and keep the count consistent across servers.",
  estMinutes: 6,
  overview:
    "A rate limiter caps how many requests a caller can make in a window — protecting your system from abuse and overload. The interesting parts are the algorithm (how you count) and the distribution problem (many servers must agree on one caller's count). Each stage tightens both. Click any node to inspect it.",
  stages: [
    {
      title: "In-process counter",
      visibleNodes: ["client", "app", "db"],
      problem:
        "The first instinct: keep a per-caller counter in memory on the app server, reset it every window. Simple, but it only sees the traffic that one server handled.",
      fix: "Count requests per caller per fixed window; reject once the count exceeds the limit.",
      tradeoff:
        "Zero latency, but wrong the moment you run more than one server — a caller spread across N servers gets N× their limit. Fixed windows also allow a burst at the boundary (2× at the window edge).",
      metrics: { capacity: 5000, latencyMs: 5 },
    },
    {
      title: "Shared counter store",
      visibleNodes: ["client", "lb", "app", "counter", "db"],
      problem:
        "With multiple app servers, the limit has to be global — every server must see the same count for a given caller.",
      fix: "Move counters to a shared, fast store (Redis) behind the app tier. Every server increments and checks the same key, so the limit holds no matter which server handles the request.",
      tradeoff:
        "Correct across the fleet, but you've added a network hop to every request and made that store a dependency on the hot path — it must be highly available and low latency.",
      metrics: { capacity: 40000, latencyMs: 12 },
    },
    {
      title: "Token bucket + atomic ops",
      visibleNodes: ["client", "lb", "app", "limiter", "counter", "db"],
      problem:
        "Fixed windows are bursty and unfair, and a naive read-then-write on the shared counter races under load — two servers can both read 99 and both allow the 100th.",
      fix: "Use a token-bucket algorithm (tokens refill at a steady rate, each request spends one — smooth, allows controlled bursts) and make the check-and-decrement a single atomic operation in the store so concurrent requests can't both slip through.",
      tradeoff:
        "Accurate, fair, and race-free — but the atomic script and refill math are more complex, and every request still pays the round-trip to the counter store.",
      metrics: { capacity: 150000, latencyMs: 8 },
    },
    {
      title: "Reject at the edge",
      visibleNodes: ["client", "cdn", "limiter", "lb", "app", "counter"],
      problem:
        "Even a fast rejection still travels deep into your system before being turned away — abusive traffic consumes load balancer and app capacity just to be denied.",
      fix: "Push the limiter to the edge (CDN / gateway), close to the caller. Excess requests are rejected before they ever reach your core, with counters synced from the shared store.",
      tradeoff:
        "Abusive load is shed cheaply and far from your app, at the cost of keeping edge counters roughly in sync across regions — usually eventual consistency is acceptable for limiting, so you trade a little exactness for a lot of protection.",
      metrics: { capacity: 1000000, latencyMs: 3 },
    },
  ],
  recap: [
    "A rate limiter has two independent problems: the counting algorithm and keeping the count consistent across many servers.",
    "One server's in-memory counter is wrong the moment you scale out — the limit must live in a shared store.",
    "Token bucket beats fixed windows (smooth, controlled bursts), but only if check-and-decrement is atomic, or concurrent requests race past the limit.",
    "Push enforcement toward the edge so excess traffic is rejected before it costs you — accepting eventual-consistency on the counters as the tradeoff.",
  ],
  relatedLessons: ["url-shortener", "chat-app"],
  terms: ["client", "server", "loadBalancer", "tokenBucket", "cache", "cdn", "consistency", "throughput"],
  interview: {
    prompt: "Design a rate limiter.",
    opening: "Design a rate limiter for an API — something that caps how many requests a caller can make. Go ahead.",
    summary:
      "Clarified: per-API-key, per-endpoint limits, millions of requests/sec across a global fleet, a hard 429 on rejection with slight overshoot acceptable, and controlled bursts allowed. That points to a token-bucket algorithm, a shared counter store with atomic check-and-decrement, and edge enforcement to shed abusive load cheaply — exactly what we build next.",
    questions: [
      {
        id: "scope",
        ask: "What are we limiting by — per user, per IP, per API key? One global limit or different per endpoint?",
        category: "scope",
        answer: "Limit per API key, with different limits for different endpoint tiers.",
        why: "The limit key (user / IP / key) and granularity decide what you count and where the counters live — it's foundational.",
        establishes: "Per-API-key · per-endpoint limits",
        lp: ["customer-obsession"],
      },
      {
        id: "scale",
        ask: "How many callers and requests/sec are we protecting — one service, or a large fleet of servers?",
        category: "scale",
        answer: "Millions of requests/sec across a large fleet of servers, globally.",
        why: "Many servers is the whole challenge — an in-memory counter on one box is wrong the moment traffic spreads. Scale forces a shared counter.",
        establishes: "Millions req/s · distributed fleet",
        lp: ["dive-deep"],
        branches: [
          { label: "Single server", approach: "A local in-memory counter is fine and instant — no shared store needed." },
          { label: "Distributed fleet (this)", approach: "Counters must be shared (Redis) so every server enforces one global limit; each request pays a lookup." },
        ],
      },
      {
        id: "accuracy",
        ask: "On over-limit, do we reject hard (429) or throttle? And how exact must the limit be?",
        category: "constraints",
        answer: "Reject with a 429. Accurate, but a small amount of overshoot under load is acceptable.",
        why: "Hard-reject vs throttle changes behavior, and exact-vs-approximate is a real tradeoff — perfect accuracy needs atomic ops and costs latency.",
        establishes: "Hard 429 · slight overshoot OK",
        lp: ["frugality"],
        branches: [
          { label: "Approximate OK (this)", approach: "Use fast, eventually-synced edge counters — cheaper, with a little overshoot at the margins." },
          { label: "Strictly exact", approach: "Every check-and-decrement must be atomic on one source of truth — correct, but a hot-path round-trip and a scaling bottleneck." },
        ],
      },
      {
        id: "bursts",
        ask: "Should short bursts be allowed, or must the rate be perfectly smooth?",
        category: "constraints",
        answer: "Allow small controlled bursts — a caller shouldn't be blocked for a brief, reasonable spike.",
        why: "Burst tolerance picks your algorithm: token bucket allows controlled bursts; fixed window is bursty at edges; sliding window is smoothest.",
        establishes: "Controlled bursts → token bucket",
        lp: ["invent-and-simplify"],
      },
      {
        id: "deploy-premature",
        ask: "Should we build this as a sidecar or a middleware library?",
        category: "premature",
        redirect: "Deployment shape comes after the algorithm and counter store — hold it until we know the accuracy and scale needs.",
      },
    ],
  },
};
