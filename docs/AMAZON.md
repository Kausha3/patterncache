# Amazon System Design — Question Research & Build Plan

_Company-specific interview-prep content, Amazon first. Compiled from a multi-source web
research pass (19 sources fetched, 85 claims extracted, 25 adversarially verified — 20
confirmed, 5 refuted). Reference date: mid-2026._

---

## 0. How to read this (source honesty first)

- **No source publishes hard frequency counts.** The "ranking" below is a synthesis of
  qualitative signals ("repeated multiple times across 100+ reports") + a few self-reported
  recency labels. Treat it as _directional_, not statistical.
- **Almost everything is secondary** (IGotAnOffer, Exponent, Hello Interview, Design Gurus,
  Educative, AlgoMaster) plus two n=1 candidate blogs. The **only primary corroboration** is
  Amazon's own `amazon.jobs` prep pages — and only for _loop structure_, not question lists.
- I mark each item **[recurring-recent]** (genuinely reported in ~2026), **[evergreen]**
  (textbook staple that keeps coming up), or **[curated]** (a vendor's prep list, weak as a
  real-frequency signal).
- A **"Refuted" list** at the bottom names claims that failed verification — do **not** build
  lessons off those.

---

## 1. TL;DR — what to build for Amazon

1. Amazon tests **two different things** people conflate: **distributed/high-level system
   design (HLD)** and **object-oriented / low-level design (LLD)**. LLD is huge at Amazon and
   is a **different lesson grammar** than our current StageBuilder — it needs a new component.
2. The **strongest single frequency signal** (IGotAnOffer, 100+ reports) names three most-repeated
   prompts: **Parking payment system (LLD)**, **Amazon warehouse system (HLD)**, **URL shortener /
   TinyURL (HLD)**.
3. Amazon **localizes prompts to its own products** (warehouse, lockers, cart/checkout, inventory,
   Prime Video, recommendations, delivery routing). Same core problem, Amazon skin.
4. **Leadership Principles are graded _inside_ the design round**, not separately — Customer
   Obsession (requirement clarification), Ownership (monitoring/failure recovery), Frugality
   (data-tiering Redis→DynamoDB→S3). This is an **Amazon-specific coaching layer** we don't have.
5. The bar is **level-gated**: L4 often gets LLD instead of distributed; L5 = "one of the most
   important rounds"; L6 = "the make-or-break round."

**We already have 4–5 of the top HLD lessons** (URL Shortener, Rate Limiter, Chat, Cache, and Feed
≈ recommendation). The net-new work is: an **LLD track + component**, a handful of **Amazon-domain
HLD lessons** (warehouse/inventory, checkout, notifications, recommendation), and an **LP + level
overlay**.

---

## 2. The two buckets

### Bucket A — Distributed / High-Level System Design (HLD)
Scales-and-tiers problems. **Fits our existing `StageBuilder` + `ClarifyInterview` engine.**
Heaviest at L5+.

### Bucket B — Object-Oriented / Low-Level Design (LLD / OOD)
Class-modeling problems: entities, interfaces, methods, relationships, edge cases. Evaluated on
"clean class hierarchy" and edge handling (e.g. _"what if the parking lot is full?"_). Very common
at Amazon, **especially L4/SDE I** and team-dependent L5 loops. **Needs a NEW component** — this is
not tiers-and-load, it's objects-and-methods.

> Confirmed: junior loops "frequently" replace distributed design with an LLD round. The claim that
> L5 always splits them into two clean separate rounds was **refuted** — the 4th round is
> team-dependent (LLD _or_ extra coding).

---

## 3. Frequency-ranked questions

### 3A. Distributed / HLD prompts

| Rank | Prompt | Signal | Level | We have it? |
|-----|--------|--------|-------|-------------|
| 1 | **Design a warehouse / fulfillment system for Amazon** (inventory, order routing, pick/pack) | [recurring-recent] "most frequent in SDE & SDM loops" (IGotAnOffer) | L5–L6 | ❌ build |
| 2 | **Design URL shortener / TinyURL** | [evergreen]+[recurring] top-3 (IGotAnOffer); Hello Interview L6 top-5 | L4–L6 | ✅ have |
| 3 | **Design a rate limiter** | [recurring-recent] Exponent ~7mo ago, 13 answers | L5 | ✅ have |
| 4 | **Design a recommendation service** (incl. book-review-based recs) | [recurring] IGotAnOffer, Educative, a real Apr-2025 L5 loop | L5–L6 | ⚠️ Feed is adjacent; build Amazon rec |
| 5 | **Design Amazon e-commerce / cart-checkout** (100M users, 10x sale peak, <500ms) | [recurring] CodeKarle, AlgoMaster, Exponent | L5–L6 | ❌ build |
| 6 | **Design a chat / messaging system** | [curated] Hello Interview L6 top-5 | L5 | ✅ have (chat-app) |
| 7 | **Design a notification service** | [curated]/[recurring] common across vendors | L5 | ❌ build |
| 8 | **Design a distributed job scheduler** | [recurring-recent] Exponent ~1mo ago (freshest datapoint) | L5–L6 | ❌ build |
| 9 | **Design firmware/OTA update delivery to devices** | [recurring-recent] Exponent ~3mo ago | L5–L6 | ❌ build (Devices/Alexa org flavor) |
| 10 | **Design a distributed cache / KV store** | [evergreen] Design Gurus, Exponent | L5–L6 | ✅ have (cache-layer) |
| 11 | **Design delivery tracking / shortest-route delivery** | [curated] Educative | L5 | ❌ build |
| 12 | **Design Prime Video home page** | [recurring] Exponent live page | L5–L6 | ❌ build |
| 13 | **Design review-abuse / fake-review detection on Amazon.com** | [recurring] Exponent live page (note: a broader "fake review detection most-asked" claim was refuted — this specific prompt page is real) | L5–L6 | ❌ build |
| — | Google Docs, Ticket Booking | [curated] Hello Interview L6 top-5 (generic, not Amazon-flavored) | L5–L6 | optional |

### 3B. Object-Oriented / LLD prompts

| Rank | Prompt | Signal | Level | Notes |
|-----|--------|--------|-------|-------|
| 1 | **Design a parking lot / parking payment system** | [evergreen]+[recurring] IGotAnOffer top-3 overall | L4–L5 | The canonical LLD warm-up |
| 2 | **Design Amazon Locker** (implement `getPackage()` / `putPackage()`) | [recurring-recent] concrete Apr-2025 L5 loop; Hello Interview top-5 | L4–L5 | Amazon-flavored LLD — high value |
| 3 | **Design an elevator system** | [evergreen] Cracking Walnuts, LeetCode | L4–L5 | |
| 4 | **Design a vending machine** | [evergreen] Cracking Walnuts, LeetCode | L4–L5 | |
| 5 | **Design a discount / coupon system** | [recurring] Exponent lists as LLD prompt | L4–L5 | Amazon-flavored |
| 6 | **Design a chess game / card game** | [evergreen] Exponent, LeetCode | L4–L5 | State + rules modeling |
| 7 | Ride-share dispatch | [weak] weakest Amazon-specific link | L5 | lower priority |

---

## 4. Level segmentation & loop structure (loop facts have PRIMARY support)

| Level | System-design weight | Typical loop |
|-------|---------------------|--------------|
| **L4 / SDE I** | Real weight, but **often an LLD round instead of distributed** | LLD-leaning |
| **L5 / SDE II** | "One of the most important rounds" — **≥1 dedicated 45-min SD round** (confirmed by amazon.jobs) | ~2 coding + 1 SD + 1 (LLD **or** extra coding) + Bar Raiser |
| **L6 / SDE III+** | **The defining, make-or-break round** | ~2 coding + 1 SD + 1 (OOD **or** project deep-dive) + Bar Raiser |

**Bar rises by level:** L5 = assemble the building blocks correctly. L6 = add access control, QA/
testability, business rationale, cross-team impact, and **drill deep into 2–3 components** under a
scale scenario (the recurring example: _"a 50× Black Friday / Prime Day traffic spike"_) — depth over
breadth. (The exact L6 rubric enumeration is largely single-sourced to Exponent/Hello Interview —
directional, not an official rubric.)

---

## 5. What Amazon evaluates — and the Leadership Principles angle

LPs are scored **inside** the design conversation (L6 also has a _separate_ Bar Raiser behavioral round):

- **Customer Obsession** → do you clarify requirements / non-functionals before designing? (Skipping
  this is described as "failing the most important LP.")
- **Ownership** → monitoring, alerting, deployment, failure recovery — do you own it in production?
- **Frugality** → cost-aware data tiering (hot in Redis → warm in DynamoDB → cold in S3), not
  over-provisioning.
- **Dive Deep / Bias for Action** → can you go 2–3 levels deep on a component and justify tradeoffs
  (eventual vs strong consistency) out loud, often tied back to a real past project.

**Product implication:** our `ClarifyInterview` already teaches requirement-clarification (Customer
Obsession) — we just need to _name the LP_. Add an **"LP lens"** overlay to the design round: at key
decision points, surface which Leadership Principle the interviewer is reading.

---

## 6. "Must-do" convergence list (highest ROI)

Where recent sources overlap, this is the shortlist:
1. **Parking lot** (LLD) — the universal warm-up.
2. **Amazon warehouse / inventory** (HLD) — most-cited SDE/SDM prompt.
3. **URL shortener** (HLD) — appears on nearly every list. ✅ we have it.
4. **Amazon Locker** (LLD) — Amazon-flavored, `getPackage/putPackage`.
5. **Rate limiter** (HLD) — freshly reported. ✅ we have it.
6. **E-commerce checkout/cart** + **recommendation service** (HLD) — Amazon-domain core.
7. Do **one LLD and one HLD** end-to-end minimum; know how to say _"here's how I'd clarify first."_

---

## 7. Gap analysis — have vs. need

**✅ Already built (reuse; re-tag "Asked at Amazon" + Amazon-localize the framing):**
URL Shortener · Rate Limiter · Chat App · Cache Layer · News Feed (≈ recommendation adjacent)

**❌ Net-new HLD lessons (fit existing StageBuilder + Clarify — mostly content):**
Warehouse/Inventory · E-commerce Checkout/Cart · Notification Service · Recommendation Service ·
Distributed Job Scheduler · Delivery Tracking (+ later: Prime Video, firmware/OTA, review-abuse)

**❌ Net-new — requires a NEW component (LLD track):**
Parking Lot · Amazon Locker · Elevator · Vending Machine · Discount/Coupon
→ These are **class/interface/method modeling**, not tiers-and-load. Need an interactive
**LLD builder** (see §9).

**❌ Net-new — Amazon overlay (small, cross-cutting):**
Leadership-Principle "lens" callouts · level badges (L4/L5/L6) · Bar-Raiser note · "50× peak"
scenario in the load simulator.

---

## 8. Proposed information architecture — the "Companies" section

```
TOP NAV:  Path (DSA · System Design)   ·   Companies   ·   Progress

COMPANIES
└── Amazon
    ├── System Design (HLD)      ← reuses existing SD lessons + Amazon-domain new ones
    │     Warehouse/Inventory · Checkout · Rate Limiter* · URL Shortener* · Notifications ...
    ├── Low-Level Design (LLD)   ← NEW track + component
    │     Parking Lot · Amazon Locker · Elevator · Vending Machine ...
    └── How Amazon interviews    ← level calibration + LP lens + loop structure + Bar Raiser
         (* = existing lesson, tagged "Asked at Amazon")
```

- A `company` is data: `{ id, name, hld: lessonId[], lld: lessonId[], notes }`. Existing lessons get
  an optional `askedAt: ["amazon"]` tag so they surface in both places without duplication.
- Keeps the pure DSA/SD tracks intact for non-interview learners; Companies is the interview-prep lens.

---

## 9. The one real new component: an LLD builder

LLD lessons can't use StageBuilder. Proposed interactive grammar (keeps our "watch reasoning happen"
principle), a staged OO-modeling flow:

1. **Clarify** — reuse `ClarifyInterview` (scope the objects: "one parking lot or many? payment?").
2. **Identify entities** — learner picks the nouns that become classes from the prompt (ParkingLot,
   Level, Spot, Vehicle, Ticket) — interactive, with distractors.
3. **Wire relationships + methods** — assign key methods to classes (`Spot.assign()`,
   `Lot.findSpot(vehicle)`), see a live class diagram grow.
4. **Edge cases** — the graded part: "lot is full", "vehicle too big for spot", "lost ticket" —
   learner handles each; this is what Amazon actually probes.
5. **Recap** — the class diagram + the OO principles it exercised (encapsulation, strategy pattern
   for pricing, etc.).

This is buildable as a `<ClassModeler/>` analogous to `StageBuilder`, driven by lesson data.

---

## 10. Suggested build order

- **Phase A (prove the Companies shell + reuse):** ship the Companies → Amazon page; tag the 5
  existing lessons as "Asked at Amazon"; add level badges + the LP-lens overlay to SD lessons.
  _Low effort, immediately useful._
- **Phase B (top HLD gaps):** Warehouse/Inventory, Checkout/Cart, Notification Service,
  Recommendation — all on the existing engine.
- **Phase C (the LLD track):** build `<ClassModeler/>` + Parking Lot as the flagship, then Amazon
  Locker, Elevator, Vending Machine.
- **Phase D (long tail):** Job scheduler, delivery tracking, Prime Video, firmware/OTA, review-abuse.

---

## 11. Refuted / do-NOT-build-on claims (failed verification)

- ❌ "L6 offers OOD as an _alternative_ chosen by the hiring team, with parking-garage/library
  scenarios." (0-3)
- ❌ "Most-asked = A/B experimentation platform / delivery-locker-capacity / fake-review detection."
  (0-3) — the individual _Prime Video_ and _review-abuse_ prompt pages are real, but this "most-asked
  bundle" framing is not.
- ❌ "L5 loops cleanly separate OOP and distributed into two distinct rounds." (1-2) — split is real
  but not guaranteed as two rounds.
- ❌ "SDE II = two distinct 60-min rounds with ~20% / ~15% weights." (0-3, Cracking Walnuts)
- ❌ "SDE II prompts: order service / notifications / rate limiting / recommendation cache."
  (0-3, Cracking Walnuts) — do not cite these as _confirmed frequent_.

---

## 12. Open questions the research couldn't close

- Real numeric frequency per prompt (no source publishes counts).
- True last-3-months trend vs evergreen (only a few Exponent timestamps address it).
- Prompt variation by org (AWS vs Retail vs Devices/Alexa vs Ads) — "team-specific" but unmapped.
- For SDE II, how often the 4th round is LLD vs extra coding.

---

## Sources (fetched & extracted)

- IGotAnOffer — Amazon System Design (100+ reports; updated 2026-04-30) — _strongest frequency signal_
- Exponent — Amazon SD guide + crowd-sourced question bank (recency labels) — _freshest datapoints_
- Hello Interview — Amazon L6 guide (loop + top-5 + LP-woven)
- Design Gurus (Substack + blog) — level calibration + LP-inside-design
- Educative — Amazon-domain prompt set
- AlgoMaster / CodeKarle — e-commerce/checkout canonical
- amazon.jobs — SDE II/III prep (PRIMARY, loop structure only)
- LeetCode Discuss, Roundz, Cracking Walnuts — n=1 candidate reports (Amazon Locker Apr-2025 loop, etc.)

_Full per-claim evidence, votes, and URLs: research transcript
`subagents/workflows/wf_2d8dfd38-3ff/journal.jsonl`._
