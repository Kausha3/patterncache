import type { Company, CompanyQuestion } from "@/types";

/**
 * Company-wise interview-prep data. This is the "Companies" lens on top of
 * the DSA/System-Design tracks — same lessons, filtered and ranked by what a
 * specific company actually asks. Sourced from docs/AMAZON.md (multi-source
 * web research, adversarially verified; see that file for full citations and
 * the honesty caveats this data respects).
 *
 * `frequency` is a qualitative signal tier, NOT a real count — no source
 * publishes hard numbers. `signalNote` always names the kind of evidence
 * behind the tier so nothing here overstates its own certainty.
 */

const amazonHLD: CompanyQuestion[] = [
  {
    lessonId: "amazon-warehouse",
    title: "Design Amazon's Warehouse / Fulfillment System",
    blurb: "Inventory, order routing, pick-and-pack at fulfillment-center scale.",
    bucket: "hld",
    frequency: "very-high",
    signalNote: "Named a top-3 most-repeated prompt across 100+ collected reports — most frequent in SDE & SDM loops specifically.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "url-shortener",
    title: "Design a URL Shortener (TinyURL)",
    blurb: "The classic read-heavy scaling problem — caching, replicas, key generation.",
    bucket: "hld",
    frequency: "very-high",
    signalNote: "Named a top-3 most-repeated prompt across 100+ collected reports; also appears on nearly every other prep vendor's Amazon list.",
    levels: ["L4", "L5", "L6"],
  },
  {
    lessonId: "amazon-checkout",
    title: "Design Amazon's Checkout / Cart System",
    blurb: "100M+ users, 10x traffic spikes on sale days, correctness under concurrency.",
    bucket: "hld",
    frequency: "high",
    signalNote: "Recurring across multiple curated vendor lists (CodeKarle, AlgoMaster, Exponent), consistently framed with Amazon's own scale numbers.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "rate-limiter",
    title: "Design a Rate Limiter",
    blurb: "Token bucket, shared atomic counters, edge enforcement.",
    bucket: "hld",
    frequency: "high",
    signalNote: "Crowd-sourced report dated ~7 months old with 13 independent answers — a genuinely recent, repeated signal.",
    levels: ["L5"],
  },
  {
    lessonId: "feed",
    title: "Design a Recommendation Service",
    blurb: "Closest existing lesson to Amazon's book-review-based recommendation prompt — fan-out and caching patterns transfer directly.",
    bucket: "hld",
    frequency: "high",
    signalNote: "Confirmed in a real April-2025 Amazon SDE2/L5 loop, plus recurring on IGotAnOffer and Educative's Amazon lists. A dedicated Amazon-framed recommendation lesson is on the roadmap.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "amazon-notifications",
    title: "Design a Notification Service",
    blurb: "Fan-out to push/email/SMS, retries, and delivery guarantees at scale.",
    bucket: "hld",
    frequency: "medium",
    signalNote: "Recurs across curated vendor lists; not independently pinned to a specific recent crowd-sourced report.",
    levels: ["L5"],
  },
  {
    lessonId: "chat-app",
    title: "Design a Chat / Messaging System",
    blurb: "Real-time delivery, presence, and fan-out for group chat.",
    bucket: "hld",
    frequency: "medium",
    signalNote: "Listed in Hello Interview's curated Amazon L6 top-5 — a vendor's prep target, weaker as a real-frequency signal than the top-tier items.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "amazon-job-scheduler",
    title: "Design a Distributed Job Scheduler",
    blurb: "Scheduling and executing jobs reliably across a fleet of workers.",
    bucket: "hld",
    frequency: "emerging",
    signalNote: "The single freshest datapoint found — a crowd-sourced report dated only ~1 month old.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "cache-layer",
    title: "Design a Distributed Cache",
    blurb: "Cache-aside, eviction, stampede control, hot-key sharding.",
    bucket: "hld",
    frequency: "medium",
    signalNote: "An evergreen staple across Design Gurus and Exponent's Amazon lists rather than a specific recent report.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "amazon-delivery-tracking",
    title: "Design Delivery Tracking / Shortest-Route Delivery",
    blurb: "Real-time package location updates and route optimization.",
    bucket: "hld",
    frequency: "medium",
    signalNote: "Listed on Educative's Amazon-domain prompt set.",
    levels: ["L5"],
  },
  {
    lessonId: "amazon-prime-video",
    title: "Design the Prime Video Home Page",
    blurb: "Personalized rows, catalog browsing, and caching at streaming scale.",
    bucket: "hld",
    frequency: "emerging",
    signalNote: "A live, individually-tracked crowd-sourced question page on Exponent — real but not yet showing repeat signal.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "amazon-review-abuse",
    title: "Design a Review-Abuse Detection System",
    blurb: "Detecting fake or manipulated reviews on Amazon.com at scale.",
    bucket: "hld",
    frequency: "emerging",
    signalNote: "A live, individually-tracked crowd-sourced question page on Exponent — real but not yet showing repeat signal.",
    levels: ["L6"],
  },
];

const amazonLLD: CompanyQuestion[] = [
  {
    lessonId: "parking-lot",
    title: "Design a Parking Lot / Parking Payment System",
    blurb: "The canonical LLD warm-up — classes, spot allocation, edge cases like a full lot.",
    bucket: "lld",
    frequency: "very-high",
    signalNote: "Named a top-3 most-repeated prompt across 100+ collected reports, overall — not just within the LLD bucket.",
    levels: ["L4", "L5"],
  },
  {
    lessonId: "amazon-locker",
    title: "Design Amazon Locker (getPackage / putPackage)",
    blurb: "Amazon's own pickup-locker system — a real, Amazon-flavored LLD prompt.",
    bucket: "lld",
    frequency: "high",
    signalNote: "Confirmed verbatim in a documented April-2025 Amazon SDE2/L5 loop, and separately listed in Hello Interview's curated top-5.",
    levels: ["L4", "L5"],
  },
  {
    lessonId: "elevator-system",
    title: "Design an Elevator System",
    blurb: "Scheduling algorithm, request queuing, multi-elevator coordination.",
    bucket: "lld",
    frequency: "medium",
    signalNote: "An evergreen LLD staple recurring on candidate-report aggregators (LeetCode Discuss, Cracking Walnuts).",
    levels: ["L4", "L5"],
  },
  {
    lessonId: "vending-machine",
    title: "Design a Vending Machine",
    blurb: "State machine modeling — inventory, payment, dispensing, refunds.",
    bucket: "lld",
    frequency: "medium",
    signalNote: "An evergreen LLD staple recurring on candidate-report aggregators.",
    levels: ["L4", "L5"],
  },
  {
    lessonId: "discount-coupon-system",
    title: "Design a Discount / Coupon System",
    blurb: "An Amazon-flavored LLD prompt — stacking rules, validity windows, eligibility.",
    bucket: "lld",
    frequency: "medium",
    signalNote: "Specifically listed by Exponent as an Amazon LLD prompt (Amazon-flavored, not a generic textbook problem).",
    levels: ["L4", "L5"],
  },
  {
    lessonId: "chess-game",
    title: "Design a Chess Game",
    blurb: "Board state, move validation, and rules as an object model.",
    bucket: "lld",
    frequency: "medium",
    signalNote: "An evergreen LLD staple recurring on candidate-report aggregators.",
    levels: ["L4", "L5"],
  },
];

export const COMPANIES: Record<string, Company> = {
  amazon: {
    id: "amazon",
    name: "Amazon",
    blurb: "Level-gated design bar: light at L4, decisive at L5, make-or-break at L6. Two distinct buckets — distributed system design and object-oriented low-level design — plus Leadership Principles graded inside the conversation.",
    status: "available",
    loopNotes: [
      "L4 / SDE I: system design carries real weight, but the round is often a low-level, object-oriented design (LLD) problem instead of distributed system design.",
      "L5 / SDE II: at least one dedicated 45-minute system-design round (confirmed on Amazon's own SDE II prep page) — described as one of the most important rounds in the loop. A separate 4th round is team-dependent: either LLD or an extra coding round.",
      "L6 / SDE III+: the design round is the defining, make-or-break round. Expect depth over breadth — drilling into 2-3 components under a scale scenario (a recurring example: a 50x Black Friday / Prime Day traffic spike) rather than a broad shallow pass.",
      "There is no separate 'Leadership Principles round' for design — LPs are scored inside the same conversation your design happens in, alongside a dedicated Bar Raiser behavioral round at L6.",
    ],
    valuesFocus: ["customer-obsession", "ownership", "frugality", "dive-deep"],
    hld: amazonHLD,
    lld: amazonLLD,
  },
};

export function getCompany(id: string): Company | undefined {
  return COMPANIES[id];
}

/** All companies, available first — used for the Companies landing grid. */
export function listCompanies(): Company[] {
  return Object.values(COMPANIES).sort((a, b) => (a.status === b.status ? 0 : a.status === "available" ? -1 : 1));
}

/** Look up a question's display title across every company — used so a
 * not-yet-built lesson still shows its real title instead of a generic one. */
export function findQuestionTitle(lessonId: string): string | undefined {
  for (const company of Object.values(COMPANIES)) {
    const hit = [...company.hld, ...company.lld].find((q) => q.lessonId === lessonId);
    if (hit) return hit.title;
  }
  return undefined;
}
