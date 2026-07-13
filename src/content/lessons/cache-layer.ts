import type { SDLesson } from "@/types";

export const cacheLayer: SDLesson = {
  id: "cache-layer",
  track: "system-design",
  title: "Designing a Cache Layer",
  blurb: "Fast reads are easy — correctness, invalidation, and hot keys are the work.",
  estMinutes: 6,
  overview:
    "A cache trades memory for latency: keep hot data close so reads don't hit the slow durable store. Adding one is easy; the hard parts are keeping it correct as data changes, surviving evictions, and handling keys so hot they overwhelm a single node. Each stage takes on one. Click any node to inspect it.",
  stages: [
    {
      title: "Cache-aside reads",
      visibleNodes: ["client", "app", "cache", "origin"],
      problem:
        "Reads hit the durable store every time, even for data that rarely changes and is requested constantly. The store becomes the bottleneck.",
      fix: "Cache-aside: on a read, check the cache first; on a miss, load from the origin store and populate the cache. Hot data now resolves in memory.",
      tradeoff:
        "Huge read speedup for popular keys, but the cache can serve stale data after a write, and a cold cache (after a deploy) sends a burst straight to the origin.",
      metrics: { capacity: 12000, latencyMs: 40 },
    },
    {
      title: "Write policy + TTL",
      visibleNodes: ["client", "app", "cache", "origin"],
      problem:
        "After an update, the cache still holds the old value — readers see stale data until something clears it.",
      fix: "Pick a write policy: write-through (update cache and store together) or write-around plus invalidate-on-write, and give entries a TTL so nothing stays stale forever.",
      tradeoff:
        "Freshness improves, but every policy has a cost: write-through slows writes and can cache data nobody reads; TTLs are a blunt instrument — too short kills hit-rate, too long serves stale. There's no free correctness.",
      metrics: { capacity: 45000, latencyMs: 22 },
    },
    {
      title: "Eviction + stampede control",
      visibleNodes: ["client", "lb", "app", "cache", "origin"],
      problem:
        "Memory is finite, so the cache evicts — and when a hot key expires, thousands of simultaneous misses stampede the origin all at once (a 'cache stampede').",
      fix: "Use an eviction policy (LRU/LFU) sized to your working set, and prevent stampedes: a single request rebuilds an expired key while others briefly serve the stale value or wait on a lock.",
      tradeoff:
        "Stable under memory pressure and immune to stampedes, but eviction tuning is workload-specific and stampede protection adds coordination — you accept slightly staler reads during a rebuild to protect the origin.",
      metrics: { capacity: 200000, latencyMs: 12 },
    },
    {
      title: "Shard the hot keys",
      visibleNodes: ["client", "lb", "app", "cache", "shard", "origin"],
      problem:
        "A single cache node can still be overwhelmed by one extremely hot key (a viral item), and total data outgrows one machine's memory.",
      fix: "Shard the cache across nodes by key hash for capacity, and replicate the hottest keys to several nodes so their read load spreads instead of piling on one.",
      tradeoff:
        "Scales in both capacity and hot-key throughput, at the cost of a rebalancing story (consistent hashing so adding a node doesn't cold-miss everything) and replicating the hottest keys — memory spent to defeat a hotspot.",
      metrics: { capacity: 1200000, latencyMs: 6 },
    },
  ],
  recap: [
    "Caching is a correctness problem disguised as a speed problem — the read win is easy; keeping it fresh is the work.",
    "Every write policy and TTL trades freshness against write cost and hit-rate; there is no setting that's free.",
    "Hot keys and cold starts cause stampedes — protect the origin with single-flight rebuilds, and spread hotspots by replicating those keys.",
    "Recognize these tradeoffs behind any 'add a cache' answer: staleness, invalidation, eviction, stampede, and hotspots.",
  ],
  relatedLessons: ["url-shortener", "feed"],
  terms: ["client", "server", "database", "cache", "cacheAside", "ttl", "eviction", "stampede", "shard"],
};
