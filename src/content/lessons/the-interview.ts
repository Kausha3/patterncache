import type { SDLesson } from "@/types";

export const theInterview: SDLesson = {
  id: "the-interview",
  track: "system-design",
  title: "The Interview: Asking the Right Questions",
  blurb: "The prompt is vague on purpose. Learn to drive the conversation.",
  estMinutes: 7,
  overview:
    "A system design interview isn't a quiz with one right answer — it's a conversation where you turn a deliberately vague prompt into a concrete design, out loud. There's a reliable four-phase arc: (1) Clarify the requirements, (2) Estimate the scale, (3) Sketch a high-level design, (4) Go deep on the bottlenecks. Most people panic and jump to phase 3 — drawing boxes. The ones who do well spend the first few minutes in phase 1, asking sharp questions. This lesson drills exactly that: you'll get a vague prompt, choose what to ask, and watch how each answer reshapes the design.",
  terms: ["client", "server", "database", "cache", "throughput", "latency", "consistency", "replica"],
  interview: {
    prompt: "Design a URL shortener.",
    opening: "Let's design a URL shortener — something like bit.ly. Go ahead whenever you're ready.",
    summary:
      "Look at what you have now: shorten + redirect (analytics optional), read-heavy at ~100M new URLs/month with a 100:1 read:write ratio, 5-year retention, fast redirects, and eventual consistency is fine. That shape dictates the design — a key-generation scheme for unique codes, storage sized for 5 years, and because it's read-heavy with relaxed consistency, aggressive caching plus read replicas. You didn't recite a template; you derived the architecture from the answers. That's the whole game — and it's exactly what the 'Scaling a URL Shortener' lesson then builds.",
    questions: [
      {
        id: "scope",
        ask: "What are the core features — just shorten and redirect, or also analytics, custom aliases, expiry?",
        category: "scope",
        answer: "Keep it to the essentials: create a short link and redirect to the original. Basic click analytics is a nice-to-have, not core.",
        why: "Scope first — it decides everything downstream. Designing features they never asked for is the most common way to waste the interview.",
        establishes: "Scope: shorten + redirect",
        lp: ["customer-obsession"],
      },
      {
        id: "scale",
        ask: "What scale are we talking — how many new URLs per day, and how many redirects?",
        category: "scale",
        answer: "Assume ~100M new URLs per month, and reads outnumber writes by about 100 to 1.",
        why: "Scale turns a vague problem into numbers. It's the difference between 'one database is fine' and 'we need caching, replicas, and capacity math'.",
        establishes: "~100M writes/mo · 100:1 read-heavy",
        lp: ["dive-deep"],
        branches: [
          { label: "1k / day (tiny)", approach: "A single database handles this comfortably. No cache, no sharding — and saying 'I wouldn't over-engineer this' is itself a strong signal." },
          { label: "100M / month (this)", approach: "Read-heavy at real scale → cache the hot links, add read replicas to spread reads, and size storage for 5 years of writes." },
          { label: "10B / day (huge)", approach: "Now the datastore must be sharded, you need a dedicated key-generation service to avoid collisions, and a CDN at the edge to serve redirects near users." },
        ],
      },
      {
        id: "retention",
        ask: "How long should links live, and how short does the code need to be?",
        category: "constraints",
        answer: "Assume links live about 5 years, and codes should be as short as is reasonable.",
        why: "Retention drives your storage estimate; code length drives your key space — together they tell you whether a simple counter or a bigger base-62 space is enough.",
        establishes: "5-year retention · short base-62 codes",
        lp: ["frugality"],
      },
      {
        id: "consistency",
        ask: "Any latency or consistency needs — is it OK if a brand-new link takes a second to work everywhere?",
        category: "constraints",
        answer: "Redirects must be fast. A new link being usable a second later is perfectly fine.",
        why: "Latency and consistency needs decide your caching and replication strategy. 'Eventual is fine' is a green light to cache aggressively.",
        establishes: "Low-latency redirects · eventual consistency OK",
        lp: ["bias-for-action"],
        branches: [
          { label: "Eventual OK (this)", approach: "You can cache aggressively and read from replicas freely — stale-by-a-second is acceptable, so reads get cheap and fast." },
          { label: "Strong consistency", approach: "You'd read from the primary (or invalidate caches on every write) — correct, but slower and more expensive. Rarely worth it for a shortener, but you should know the tradeoff." },
        ],
      },
      {
        id: "db-premature",
        ask: "Should we use PostgreSQL or Cassandra for the database?",
        category: "premature",
        redirect: "Let's hold that thought — picking a specific database before we know the access pattern is backwards. Nail the scope and scale first and the data store will fall out of it.",
      },
      {
        id: "encoding-premature",
        ask: "Should the short code be a base-62 encoding or a hash?",
        category: "premature",
        redirect: "That's an implementation detail we can decide later. First let's establish what the encoding even needs to satisfy — uniqueness, length, volume.",
      },
    ],
  },
  recap: [
    "Never start drawing boxes. Spend the first 3–5 minutes clarifying — scope, scale, constraints.",
    "Four questions unlock almost any design: What are the core features? What's the scale (and read:write ratio)? What are the latency & consistency needs? What are the data size & retention?",
    "Repeat the requirements back before designing — it aligns you with the interviewer and buys trust.",
    "The interviewer's answers ARE your constraints. The same prompt becomes a different design at 1k/day vs 10B/day — derive it, don't recite a template.",
  ],
  relatedLessons: ["client-server", "url-shortener"],
};
