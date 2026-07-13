import type { SDLesson } from "@/types";

export const feed: SDLesson = {
  id: "feed",
  track: "system-design",
  title: "Designing a News Feed",
  blurb: "The fan-out question: precompute every feed, or assemble it on read?",
  estMinutes: 7,
  overview:
    "A social feed shows each user a merged, ranked stream of posts from everyone they follow. It's read-dominated — people scroll far more than they post — so the central question is when you do the expensive merge work: at write time (precompute every follower's feed) or at read time (assemble on demand). Each stage below trades those costs, and the 'celebrity' case breaks the naive answer. Click any node to inspect it.",
  stages: [
    {
      title: "Pull on read",
      visibleNodes: ["client", "app", "db"],
      problem:
        "The simplest feed: when a user opens the app, query the posts of everyone they follow, merge, sort by time, return. Correct, but every single feed load runs a big fan-in query — and popular users are read constantly.",
      fix: "Establish the read path — fetch-followees-then-merge (fan-out-on-read).",
      tradeoff: "Writes are trivial (just store the post), but reads are expensive and get slower the more people you follow. Fine at small scale, painful at large.",
      metrics: { capacity: 3000, latencyMs: 400 },
    },
    {
      title: "Cache the hot reads",
      visibleNodes: ["client", "lb", "app", "cache", "db"],
      problem:
        "The same feeds and the same popular authors are read over and over, hammering the database with repeated merge queries.",
      fix: "Add a cache in front of the DB for hot authors' recent posts and recently-built feeds, behind a load balancer across app servers.",
      tradeoff:
        "Big read speedup, but a cached feed goes stale the instant someone you follow posts — you're now trading freshness for latency, and the read-time merge still happens on cache misses.",
      metrics: { capacity: 30000, latencyMs: 90 },
    },
    {
      title: "Fan-out on write",
      visibleNodes: ["client", "lb", "app", "queue", "fanout", "timeline", "db"],
      problem:
        "Read-time merging can't keep up at scale — assembling a feed from hundreds of followees on every open is fundamentally too much work per read.",
      fix: "Flip it: when a user posts, a Fan-out service (fed by a queue) writes that post id into each follower's precomputed Timeline. Reads become a single cheap lookup of an already-built list.",
      tradeoff:
        "Reads are now O(1) and instant — but writes are expensive: one post by someone with 10k followers is 10k timeline writes. You've moved the cost from read to write, which pays off only because reads vastly outnumber writes.",
      metrics: { capacity: 200000, latencyMs: 30 },
    },
    {
      title: "Hybrid — the celebrity problem",
      visibleNodes: ["client", "cdn", "lb", "app", "queue", "fanout", "timeline", "shard", "db"],
      problem:
        "Fan-out-on-write explodes for celebrities: one post by a user with 50M followers means 50M timeline writes, and a spike of them can stall the whole fan-out pipeline.",
      fix: "Go hybrid. Fan out normal users on write; for a handful of high-follower accounts, skip fan-out and merge their posts in at read time. Shard timelines by user id and serve static assets from a CDN.",
      tradeoff:
        "Best of both — cheap reads for the common case, no write explosion for celebrities — at the cost of two code paths and a threshold to tune (when does an account become 'celebrity'?). That threshold is the real design lever.",
      metrics: { capacity: 1500000, latencyMs: 25 },
    },
  ],
  recap: [
    "A feed is a read-heavy merge problem; the core decision is whether the merge happens at write time or read time.",
    "Fan-out-on-write makes reads O(1) by paying at write time — worth it only because reads dwarf writes.",
    "The celebrity case breaks pure fan-out-on-write, so real systems go hybrid: precompute for most, merge-on-read for the few with huge follower counts.",
    "Almost every 'timeline' or 'activity feed' question reduces to picking that fan-out strategy and its threshold.",
  ],
  relatedLessons: ["chat-app", "url-shortener"],
  terms: ["client", "server", "database", "cache", "fanout", "queue", "shard", "cdn", "loadBalancer"],
  interview: {
    prompt: "Design a news feed.",
    opening: "Design the home feed for a social app — the merged stream of posts from everyone you follow. Go ahead.",
    summary:
      "Clarified: a read-heavy, reverse-chronological feed for hundreds of millions of users, with celebrity accounts in the mix, and a few seconds of delay for new posts is fine. That points straight at fan-out-on-write for the common case (precomputed timelines), a hybrid merge-on-read path for celebrities, and heavy caching — exactly the design we build next.",
    questions: [
      {
        id: "scope",
        ask: "Chronological or ranked feed? And what's in a post — text, images, video?",
        category: "scope",
        answer: "Start with a reverse-chronological feed of text and images. Ranking can come later.",
        why: "Ranked vs chronological changes the read path a lot — ranking adds a scoring step and usually more precomputation. Pin it early.",
        establishes: "Reverse-chron · text + images",
        lp: ["customer-obsession"],
        branches: [
          { label: "Chronological (this)", approach: "Merge followees' recent posts by time — no scoring step, a simpler read path." },
          { label: "Ranked / ML", approach: "Add a ranking service that scores candidate posts per user — more compute, a candidate-generation step, and usually precomputed." },
        ],
      },
      {
        id: "graph",
        ask: "How many users, and how lopsided is the follower graph — any accounts with tens of millions of followers?",
        category: "scale",
        answer: "Hundreds of millions of users, and yes — some accounts have tens of millions of followers.",
        why: "Follower distribution is THE feed question. A handful of mega-accounts break naive fan-out-on-write and force a hybrid.",
        establishes: "100Ms of users · celebrity accounts exist",
        lp: ["dive-deep"],
        branches: [
          { label: "Everyone ~hundreds of followers", approach: "Fan-out-on-write works cleanly — precompute each follower's timeline the moment someone posts." },
          { label: "Celebrities with millions (this)", approach: "Fan-out-on-write explodes for them → go hybrid: precompute for normal users, merge celebrity posts in at read time." },
        ],
      },
      {
        id: "freshness",
        ask: "How fresh must the feed be — is a few seconds of delay for a new post acceptable?",
        category: "constraints",
        answer: "A few seconds of delay is fine; it doesn't have to be real-time to the millisecond.",
        why: "Freshness tolerance decides how aggressively you can precompute and cache. Loose freshness unlocks fan-out-on-write and heavy caching.",
        establishes: "Eventual freshness OK (seconds)",
        lp: ["bias-for-action"],
      },
      {
        id: "ratio",
        ask: "How does viewing compare to posting — read-heavy or write-heavy?",
        category: "scale",
        answer: "Massively read-heavy — people scroll far more than they post.",
        why: "The read:write ratio decides whether you pay at write time (fan-out) or read time. Heavy reads justify precomputing feeds.",
        establishes: "Very read-heavy → precompute reads",
        lp: ["frugality"],
      },
      {
        id: "cache-premature",
        ask: "Should the timeline cache be Redis or Memcached?",
        category: "premature",
        redirect: "Cache tech is a later detail — first decide fan-out-on-write vs read, which determines what you're even caching.",
      },
    ],
  },
};
