import type { Company, CompanyQuestion } from "@/types";

/**
 * Company-wise interview-prep data. This is the "Companies" lens on top of
 * the DSA/System-Design tracks — same lessons, filtered and ranked by what a
 * specific company actually asks. Sourced from the company dossiers in docs/
 * (multi-source web research, adversarially verified; see those files for citations and
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
    signalNote: "Named a top-3 most-repeated prompt across 100+ collected reports. It's most frequent in SDE and SDM loops specifically.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "url-shortener",
    title: "Design a URL Shortener (TinyURL)",
    blurb: "The classic read-heavy scaling problem. Think caching, replicas, key generation.",
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
    signalNote: "Crowd-sourced report dated about 7 months old with 13 independent answers, so it's recent and it's repeated.",
    levels: ["L5"],
  },
  {
    lessonId: "feed",
    title: "Design a Recommendation Service",
    blurb: "Closest existing lesson to Amazon's book-review-based recommendation prompt. The fan-out and caching patterns transfer directly.",
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
    signalNote: "Listed in Hello Interview's curated Amazon L6 top-5, but that's a vendor's prep target, so it's a weaker real-frequency signal than the top-tier items.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "amazon-job-scheduler",
    title: "Design a Distributed Job Scheduler",
    blurb: "Scheduling and executing jobs reliably across a fleet of workers.",
    bucket: "hld",
    frequency: "emerging",
    signalNote: "The single freshest datapoint we found: a crowd-sourced report dated only about a month old.",
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
    signalNote: "A live, individually-tracked crowd-sourced question page on Exponent. It's real, but hasn't shown a repeat signal yet.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "amazon-review-abuse",
    title: "Design a Review-Abuse Detection System",
    blurb: "Detecting fake or manipulated reviews on Amazon.com at scale.",
    bucket: "hld",
    frequency: "emerging",
    signalNote: "A live, individually-tracked crowd-sourced question page on Exponent, real enough but with no repeat signal so far.",
    levels: ["L6"],
  },
];

const amazonLLD: CompanyQuestion[] = [
  {
    lessonId: "parking-lot",
    title: "Design a Parking Lot / Parking Payment System",
    blurb: "The canonical LLD warm-up. Classes, spot allocation, edge cases like a full lot.",
    bucket: "lld",
    frequency: "very-high",
    signalNote: "Named a top-3 most-repeated prompt across 100+ collected reports overall, not just within the LLD bucket.",
    levels: ["L4", "L5"],
  },
  {
    lessonId: "amazon-locker",
    title: "Design Amazon Locker (getPackage / putPackage)",
    blurb: "Amazon's own pickup-locker system, and a real Amazon-flavored LLD prompt.",
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
    blurb: "State machine modeling: inventory, payment, dispensing, refunds.",
    bucket: "lld",
    frequency: "medium",
    signalNote: "An evergreen LLD staple recurring on candidate-report aggregators.",
    levels: ["L4", "L5"],
  },
  {
    lessonId: "discount-coupon-system",
    title: "Design a Discount / Coupon System",
    blurb: "An Amazon-flavored LLD prompt covering stacking rules, validity windows, and eligibility.",
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

const googleHLD: CompanyQuestion[] = [
  {
    lessonId: "google-image-hosting",
    title: "Design an Image and Short-Video Hosting Service",
    blurb: "Upload media, store metadata and binaries, transform formats asynchronously, and serve globally under changing requirements.",
    bucket: "hld",
    frequency: "high",
    signalNote: "Repeated in two independent L5 reports from 2024-2025. Both describe an image or media host and follow-ups about processing, scale, and evolving requirements.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "google-inventory",
    title: "Design an Inventory Management System",
    blurb: "Model stock updates, consistency, concurrency, and synchronization between systems.",
    bucket: "hld",
    frequency: "medium",
    signalNote: "One detailed 2025 L5 candidate report names inventory management, followed by a deeper concurrency and scalability round. Treat it as a recent report, not a frequency claim.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "google-drive",
    title: "Design Cloud File Storage and Sync",
    blurb: "Chunked uploads, metadata, cross-device sync, conflict handling, versioning, and sharing permissions.",
    bucket: "hld",
    frequency: "emerging",
    signalNote: "A transferable Google-scale coverage anchor found across established system-design curricula, not a verified recent Google interview frequency signal.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "google-autocomplete",
    title: "Design Search Autocomplete",
    blurb: "Top-K suggestions under a tight latency budget, with freshness, ranking, and abuse controls.",
    bucket: "hld",
    frequency: "emerging",
    signalNote: "A canonical Google-flavored coverage anchor in established design curricula. We did not find enough recent first-person reports to claim repeat frequency.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "cache-layer",
    title: "Design a Distributed Cache",
    blurb: "Sharding, replication, eviction, hot keys, cache stampedes, and failure recovery.",
    bucket: "hld",
    frequency: "emerging",
    signalNote: "Included as a reusable distributed-systems transfer drill, not as a claim that Google repeatedly asks this exact prompt.",
    levels: ["L5", "L6"],
  },
  {
    lessonId: "chat-app",
    title: "Design Real-Time Messaging",
    blurb: "Persistent connections, presence, delivery ordering, offline fan-out, and multi-device state.",
    bucket: "hld",
    frequency: "emerging",
    signalNote: "Included as a broad architecture coverage anchor. The underlying trade-offs transfer even when Google uses a custom product prompt.",
    levels: ["L5", "L6"],
  },
];

const metaHLD: CompanyQuestion[] = [
  {
    lessonId: "url-shortener",
    title: "Design a URL Shortener",
    blurb: "Key generation, redirect latency, caching, durable mappings, availability, and operational recovery.",
    bucket: "hld",
    frequency: "very-high",
    signalNote: "This is an official example in Meta's current Software Engineer Full Loop Interview Guide. The tier describes source confidence, not observed frequency.",
    levels: ["E4", "E5", "E6"],
  },
  {
    lessonId: "chat-app",
    title: "Design Facebook Chat",
    blurb: "Real-time delivery, sender and receiver latency, online presence, multi-device state, and message history.",
    bucket: "hld",
    frequency: "very-high",
    signalNote: "Facebook Chat is an official system-design example in Meta's current full-loop guide, and chat or feed APIs are official product-architecture examples.",
    levels: ["E4", "E5", "E6"],
  },
  {
    lessonId: "feed",
    title: "Design a Feed API",
    blurb: "Ranking inputs, fan-out, pagination, caching, consistency, and product behavior under scale.",
    bucket: "hld",
    frequency: "high",
    signalNote: "A feed API is named in Meta's official product-architecture examples. This is official scope guidance, not a claim about how often candidates receive it.",
    levels: ["E4", "E5", "E6"],
  },
  {
    lessonId: "meta-video-distribution",
    title: "Architect Worldwide Video Distribution",
    blurb: "Upload, transcoding, origin storage, CDN delivery, adaptive bitrate, abuse resistance, and regional failure.",
    bucket: "hld",
    frequency: "very-high",
    signalNote: "Worldwide video distribution is an official system-design example in Meta's current full-loop guide. The dedicated lesson remains roadmap content.",
    levels: ["E5", "E6"],
  },
  {
    lessonId: "meta-product-api",
    title: "Design a Product or Service API",
    blurb: "API usability, data ownership, protocols, storage models, client-server behavior, and long-term change.",
    bucket: "hld",
    frequency: "high",
    signalNote: "Meta's official guide distinguishes product architecture from systems design and explicitly lists service or product API design as an example.",
    levels: ["E4", "E5", "E6"],
  },
  {
    lessonId: "cache-layer",
    title: "Design a Cache at Meta Scale",
    blurb: "Hot keys, sharding, replicas, invalidation, stampede control, and failure-aware fallbacks.",
    bucket: "hld",
    frequency: "emerging",
    signalNote: "This is a transfer drill derived from the guide's official scalability, availability, performance, and efficiency criteria, not a reported Meta prompt.",
    levels: ["E4", "E5", "E6"],
  },
];

export const COMPANIES: Record<string, Company> = {
  amazon: {
    id: "amazon",
    name: "Amazon",
    blurb: "Level-gated design bar: light at L4, decisive at L5, make-or-break at L6. There are two distinct buckets (distributed system design and object-oriented low-level design), plus Leadership Principles graded inside the conversation.",
    status: "available",
    loopNotes: [
      "L4 / SDE I: system design carries real weight, but the round is often a low-level, object-oriented design (LLD) problem instead of distributed system design.",
      "L5 / SDE II: at least one dedicated 45-minute system-design round (confirmed on Amazon's own SDE II prep page), and it's described as one of the most important rounds in the loop. A separate 4th round is team-dependent: either LLD or an extra coding round.",
      "L6 / SDE III+: the design round is the defining, make-or-break round. Expect depth over breadth: they'll drill into 2-3 components under a scale scenario (a recurring example is a 50x Black Friday / Prime Day traffic spike) instead of doing a broad, shallow pass.",
      "There's no separate 'Leadership Principles round' for design. LPs get scored inside the same conversation your design happens in, alongside a dedicated Bar Raiser behavioral round at L6.",
    ],
    valuesFocus: ["customer-obsession", "ownership", "frugality", "dive-deep"],
    hld: amazonHLD,
    lld: amazonLLD,
  },
  google: {
    id: "google",
    name: "Google",
    blurb: "A reasoning-first loop. Early-career reports are dominated by coding and Googleyness; system design becomes a dedicated signal at senior levels. Clarifying an underspecified prompt, explaining trade-offs, dry-running, and adapting to follow-ups matter more than recognizing a memorized title.",
    status: "available",
    loopNotes: [
      "L3 / early career: recent reports describe several DSA rounds plus a Googleyness and leadership conversation. Prepare to solve custom or underspecified problems aloud, without relying on a compiler.",
      "L4: recent reports still lean heavily toward coding, problem decomposition, clean code, and communication. A design round can vary by role and recruiter packet, so confirm your exact loop instead of assuming one.",
      "L5+: recent first-person reports consistently add a dedicated system-design round. Strong candidates drive requirements, estimate scale, propose a high-level design, then absorb new constraints without rebuilding everything.",
      "Across levels, the transferable behavior is the same: ask what is ambiguous, state an approach before coding, test with your own examples, give time and space complexity, and respond constructively when the interviewer changes the problem.",
      "Googleyness is not a vocabulary quiz. Candidate reports describe evidence about collaboration, handling conflict, learning, ambiguity, inclusion, and leadership without authority.",
    ],
    bucketNotes: {
      hld: "These prompts are for L5+ design preparation. Only the top items have recent first-person Google reports; the rest are labeled transfer drills rather than fake frequency claims.",
      lld: "No dedicated LLD list is promoted here. The recent SWE reports we found emphasize coding at L3/L4 and distributed system design at L5. If your recruiter names an object-design round, use the LLD library, but do not make it your default Google priority.",
    },
    hld: googleHLD,
    lld: [],
  },
  meta: {
    id: "meta",
    name: "Meta",
    blurb: "A fast, conversational full loop grounded in Meta's own current guide: coding emphasizes communication, problem solving, executable structure, and verification; design tests navigation, solution design, technical excellence, and communication; behavioral tests five named signals in an unstructured environment.",
    status: "available",
    loopNotes: [
      "Meta's official full-loop guide describes 4 to 6 conversations of about 45 minutes across coding, design, and behavioral interviews. Your recruiter defines the exact packet.",
      "Coding: expect about two problems in roughly 40 minutes. Narrate, compare approaches, write organized code, test edge cases, and practice without a compiler. The official guide says not to prioritize dynamic programming for this loop.",
      "Design: confirm whether your round is Systems Design or Product Architectural Design. Both are 45-minute, candidate-driven technical discussions with no single right answer.",
      "Systems Design emphasizes distributed systems, scalability, performance, and efficiency. Product Architecture emphasizes APIs, usability, utility, data ownership, protocols, and evolving product requirements.",
      "Behavioral: Meta's guide names resolving conflict, growing continuously, embracing ambiguity, driving results, and communicating effectively as the five signals. Concrete examples and measurable impact matter.",
    ],
    bucketNotes: {
      hld: "The first five prompts come directly from examples or scope in Meta's official full-loop guide. Source confidence is high, but no public source provides real prompt frequency. Confirm your exact Systems Design versus Product Architecture round with your recruiter.",
      lld: "No separate object-oriented LLD bucket is promoted here. Meta's official guide describes Systems Design and Product Architectural Design. Use the LLD library only when your recruiter names an object-design round.",
    },
    hld: metaHLD,
    lld: [],
  },
};

export function getCompany(id: string): Company | undefined {
  return COMPANIES[id];
}

/** All companies, available first — used for the Companies landing grid. */
export function listCompanies(): Company[] {
  return Object.values(COMPANIES).sort((a, b) => (a.status === b.status ? 0 : a.status === "available" ? -1 : 1));
}

/**
 * Every distinct lessonId referenced by any company (built or not). Used by
 * the Progress page so a lesson accessed only through Companies — e.g. an
 * LLD lesson, which deliberately isn't on the main DSA/System-Design path
 * spine — still surfaces in "Revisit" once you've been through it. Without
 * this, confidence saved on a Companies-only lesson would silently vanish.
 */
export function listCompanyQuestionIds(): string[] {
  const ids = new Set<string>();
  for (const company of Object.values(COMPANIES)) {
    for (const q of [...company.hld, ...company.lld]) ids.add(q.lessonId);
  }
  return [...ids];
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
