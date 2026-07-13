import type { SDLesson } from "@/types";

export const urlShortener: SDLesson = {
  id: "url-shortener",
  track: "system-design",
  title: "Scaling a URL Shortener",
  blurb: "A read-heavy service: watch it grow from one box to global scale.",
  estMinutes: 6,
  overview:
    "A URL shortener is deceptively simple — store a short code, redirect to the long URL. The interesting part is scale: it's overwhelmingly read-heavy (billions of redirects, comparatively few creates). Each stage below fixes the bottleneck the previous one exposes. Click any node to see what it is.",
  stages: [
    {
      title: "One box",
      visibleNodes: ["client", "app", "db"],
      problem:
        "Everything runs on a single server: it generates codes, and it reads the DB on every redirect. Works for a demo, falls over under real traffic and dies entirely if that box dies.",
      fix: "Start here to establish the core flow: write a mapping on create, look it up on redirect.",
      tradeoff: "Simplest possible thing. Zero redundancy, zero headroom — a single point of failure.",
      metrics: { capacity: 500, latencyMs: 120 },
    },
    {
      title: "Cache the hot codes",
      visibleNodes: ["client", "app", "cache", "db"],
      problem:
        "Redirects hammer the database, but traffic is heavily skewed — a tiny fraction of links get most of the clicks. The DB is doing repetitive work for popular codes.",
      fix: "Put an in-memory cache (Redis) in front of the DB. On a redirect, check the cache first; only miss through to the DB. Popular links now resolve in sub-millisecond time.",
      tradeoff:
        "Huge read speedup, but you've added a consistency question: if a mapping changes, stale cache entries must be invalidated. For a shortener, mappings are effectively immutable, so this is cheap — a great fit.",
      metrics: { capacity: 8000, latencyMs: 25 },
    },
    {
      title: "Scale out reads",
      visibleNodes: ["client", "lb", "app", "cache", "replica", "db"],
      problem:
        "One app server is now the ceiling, and every cache miss still funnels to a single primary database.",
      fix: "Add a load balancer in front of multiple stateless app servers, and add read replicas so cache misses spread across copies of the data. Writes still go to the primary; reads fan out.",
      tradeoff:
        "Big horizontal headroom. Replicas introduce replication lag — a just-created link might briefly miss on a replica — acceptable for a shortener where creates are rare and a retry resolves it.",
      metrics: { capacity: 60000, latencyMs: 18 },
    },
    {
      title: "Global edge + safe writes",
      visibleNodes: ["client", "cdn", "lb", "app", "cache", "kgs", "replica", "db"],
      problem:
        "Users are worldwide, so latency is dominated by distance, and multiple app servers generating codes risk colliding on the same short code.",
      fix: "Serve redirects from a CDN edge close to the user, and add a Key-Generation Service that pre-allocates unique code ranges to each app server so writes never collide.",
      tradeoff:
        "Near-user latency and collision-free code generation, at the cost of more moving parts to operate. The KGS becomes a component you must keep highly available — but it removes a whole class of write bugs.",
      metrics: { capacity: 500000, latencyMs: 8 },
    },
  ],
  recap: [
    "A read-heavy system is a caching and read-fan-out problem before it's anything else.",
    "Each layer was added to fix the specific bottleneck the previous layer exposed — never speculatively.",
    "Immutable mappings are what make aggressive caching safe here; a mutable domain would force harder consistency tradeoffs.",
  ],
  relatedLessons: ["chat-app"],
  terms: ["client", "server", "database", "cache", "loadBalancer", "replica", "cdn", "latency", "throughput"],
};
