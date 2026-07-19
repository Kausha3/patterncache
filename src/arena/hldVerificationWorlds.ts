import { color } from "@/theme/tokens";

export type HldModuleKind = "traffic" | "data" | "async" | "reliability";

export interface HldZone {
  id: string;
  beginnerName: string;
  technicalName: string;
  description: string;
}

export interface HldModule {
  id: string;
  beginnerName: string;
  technicalName: string;
  description: string;
  kind: HldModuleKind;
  startsInZoneId: string;
  expectedZoneId: string;
  reason: string;
}

export interface HldIncident {
  id: string;
  title: string;
  dispatchLabel: string;
  story: string;
  goal: string;
  requiredModuleIds: string[];
  trace: string[];
  failure: string;
  success: string;
  discovery: string;
}

export interface HldVerificationWorld {
  id: string;
  systemName: string;
  title: string;
  intro: string;
  tagline: string;
  accent: string;
  transferPrompt: string;
  zones: HldZone[];
  modules: HldModule[];
  incidents: HldIncident[];
}

const sharedZones: HldZone[] = [
  { id: "door", beginnerName: "Front Door", technicalName: "Edge Layer", description: "Receives requests and rejects work that should not enter." },
  { id: "workshop", beginnerName: "Main Workshop", technicalName: "Application Service", description: "Coordinates the core user action without becoming permanent storage." },
  { id: "memory", beginnerName: "Record Room", technicalName: "Durable Data Store", description: "Owns facts that must survive restarts and retries." },
  { id: "crew", beginnerName: "Background Crew", technicalName: "Queue and Workers", description: "Absorbs work that can finish after the user gets a response." },
  { id: "tower", beginnerName: "Control Tower", technicalName: "Reliability Plane", description: "Detects failures, limits blast radius, and directs recovery." },
];

const urlShortener: HldVerificationWorld = {
  id: "url-shortener",
  systemName: "URL Shortener",
  title: "The Link City",
  intro: "Keep millions of short links fast, unique, durable, and measurable while traffic and machines change underneath you.",
  tagline: "Traffic becomes visible. Architecture becomes a set of repairable decisions.",
  accent: color.teal,
  transferPrompt: "A product now asks for links that expire after one hour. Explain what changes, what remains stable, and which failure you would test first.",
  zones: sharedZones,
  modules: [
    { id: "hot-link-cache", beginnerName: "Fast shelf for popular links", technicalName: "Read-through cache", description: "Answers repeated redirects without reading permanent storage every time.", kind: "traffic", startsInZoneId: "memory", expectedZoneId: "door", reason: "The fastest safe read happens near incoming traffic, while durable storage remains the source of truth." },
    { id: "id-allocator", beginnerName: "Unique ticket maker", technicalName: "Distributed ID allocator", description: "Creates short codes without two writers issuing the same value.", kind: "data", startsInZoneId: "memory", expectedZoneId: "workshop", reason: "Code creation belongs in the write path, where uniqueness can be coordinated before persistence." },
    { id: "link-map", beginnerName: "Permanent link book", technicalName: "Key-value link mapping", description: "Stores short code to destination mappings durably.", kind: "data", startsInZoneId: "workshop", expectedZoneId: "memory", reason: "A redirect must survive service restarts, deployments, and cache eviction." },
    { id: "click-stream", beginnerName: "Later counting lane", technicalName: "Asynchronous analytics stream", description: "Records clicks without holding up the redirect response.", kind: "async", startsInZoneId: "workshop", expectedZoneId: "crew", reason: "Analytics may lag; redirect latency may not wait for it." },
    { id: "replica-health", beginnerName: "Broken-machine lookout", technicalName: "Health checks and replica failover", description: "Stops routing reads to unhealthy replicas and shifts traffic safely.", kind: "reliability", startsInZoneId: "door", expectedZoneId: "tower", reason: "Failure detection is a system-wide reliability concern, not redirect business logic." },
  ],
  incidents: [
    { id: "celebrity-link", title: "Celebrity link surge", dispatchLabel: "Release the redirect surge", story: "One short link becomes globally popular. Every redirect currently walks to permanent storage.", goal: "Keep redirects fast without making the fast copy the source of truth.", requiredModuleIds: ["hot-link-cache"], trace: ["A redirect reaches the front door", "The system looks for a nearby copy", "A destination is returned", "Permanent storage stays protected"], failure: "The record room is serving every repeated read and latency climbs with the surge.", success: "The edge answers hot redirects and falls back to durable storage on a miss.", discovery: "Caches protect a read-heavy source of truth when their miss path remains correct." },
    { id: "collision", title: "Two creators, one code", dispatchLabel: "Create links from two regions", story: "Two service instances create a short code at the same moment.", goal: "Guarantee that one short code cannot silently point at two destinations.", requiredModuleIds: ["id-allocator", "link-map"], trace: ["Two create requests arrive", "Each asks for a unique code", "One durable mapping is written per code", "Both links remain retrievable"], failure: "Code generation is buried in storage and two writers can race before a durable mapping exists.", success: "The write path allocates unique codes, then persists one authoritative mapping per code.", discovery: "ID generation and durable mapping solve different problems and deserve explicit boundaries." },
    { id: "analytics-storm", title: "Analytics slows redirects", dispatchLabel: "Enable detailed click tracking", story: "The analytics warehouse takes six seconds to accept each click event.", goal: "Return the redirect without losing the event or waiting for the warehouse.", requiredModuleIds: ["click-stream"], trace: ["A redirect succeeds", "A click event enters a buffer", "The user receives the destination", "Workers deliver analytics later"], failure: "The main workshop waits for analytics and turns a reporting slowdown into a user outage.", success: "The redirect completes while a durable asynchronous lane absorbs analytics work.", discovery: "Queues separate user latency from work that may complete later." },
    { id: "replica-outage", title: "A read replica disappears", dispatchLabel: "Take one replica offline", story: "A storage replica stops responding while traffic is still being sent to it.", goal: "Detect the failure, stop the bleed, and keep redirects available.", requiredModuleIds: ["replica-health"], trace: ["A replica misses health checks", "Traffic stops selecting it", "Healthy capacity receives requests", "Recovery remains observable"], failure: "Redirect code is trying to guess infrastructure health one request at a time.", success: "The control tower removes the failed replica and routes around the outage.", discovery: "Reliability policy belongs outside core request behavior so every path can share it." },
  ],
};

const notificationService: HldVerificationWorld = {
  id: "notification-service",
  systemName: "Notification Service",
  title: "Signal Station",
  intro: "Deliver push, email, and SMS through slow providers without duplication, overload, or silent loss.",
  tagline: "A message is not delivered just because an API returned 200.",
  accent: color.violet,
  transferPrompt: "A new provider has strict per-tenant quotas. Explain where quota state belongs and how a retry avoids double delivery.",
  zones: sharedZones,
  modules: [
    { id: "preference-gate", beginnerName: "User permission checker", technicalName: "Preference and policy gate", description: "Rejects channels the user disabled before work fans out.", kind: "traffic", startsInZoneId: "crew", expectedZoneId: "door", reason: "Invalid work should be rejected before it consumes queues and provider capacity." },
    { id: "durable-queue", beginnerName: "Crash-safe waiting line", technicalName: "Durable delivery queue", description: "Holds accepted messages until a worker can deliver them.", kind: "async", startsInZoneId: "workshop", expectedZoneId: "crew", reason: "Provider latency and traffic spikes should not hold the request open or lose accepted work." },
    { id: "delivery-ledger", beginnerName: "Already-sent book", technicalName: "Idempotency and delivery ledger", description: "Records a stable message identity and delivery attempts.", kind: "data", startsInZoneId: "workshop", expectedZoneId: "memory", reason: "Retries need durable knowledge of what was already accepted and delivered." },
    { id: "provider-adapters", beginnerName: "Provider translators", technicalName: "Channel provider adapters", description: "Isolates push, email, and SMS APIs behind one delivery contract.", kind: "traffic", startsInZoneId: "door", expectedZoneId: "workshop", reason: "Core delivery coordinates channels while vendor-specific calls remain replaceable." },
    { id: "retry-dlq", beginnerName: "Retry clock and repair bin", technicalName: "Backoff scheduler and dead-letter queue", description: "Retries transient failures and isolates messages that exhaust their budget.", kind: "reliability", startsInZoneId: "memory", expectedZoneId: "tower", reason: "Retry policy spans providers and must remain observable, bounded, and repairable." },
  ],
  incidents: [
    { id: "opt-out", title: "The opted-out user", dispatchLabel: "Send a campaign", story: "A marketing campaign includes a user who disabled SMS yesterday.", goal: "Stop forbidden work before it spreads across the system.", requiredModuleIds: ["preference-gate"], trace: ["A send request arrives", "Current preferences are checked", "Disabled channels are removed", "Only allowed work continues"], failure: "The preference check happens after fan-out, so forbidden SMS work already consumes capacity.", success: "The front door filters channels before enqueueing any delivery work.", discovery: "Early policy gates protect both user intent and downstream capacity." },
    { id: "provider-slow", title: "Provider slowdown", dispatchLabel: "Slow the email provider", story: "Email calls now take eight seconds while requests continue arriving.", goal: "Accept valid notifications quickly and preserve them for later delivery.", requiredModuleIds: ["durable-queue", "provider-adapters"], trace: ["The request is validated", "Delivery work enters a durable line", "The caller receives acceptance", "Workers call the provider independently"], failure: "The request thread owns the provider call, so one vendor slowdown consumes the whole service.", success: "Accepted work waits durably and isolated adapters let workers deliver at provider speed.", discovery: "Asynchronous boundaries absorb variable latency without pretending delivery is immediate." },
    { id: "retry-duplicate", title: "The lost acknowledgement", dispatchLabel: "Drop one provider response", story: "The provider delivers an SMS but its acknowledgement never reaches your worker.", goal: "Retry safely without charging the user for duplicate messages.", requiredModuleIds: ["delivery-ledger"], trace: ["A stable message id is read", "Prior delivery state is checked", "A retry becomes safe or suppressed", "One final state is recorded"], failure: "The worker has no durable identity for the message and treats every retry as new work.", success: "The ledger uses one stable id to make repeated attempts converge on one delivery outcome.", discovery: "Idempotency turns uncertain retries into repeatable operations." },
    { id: "poison-message", title: "The message that never succeeds", dispatchLabel: "Inject a malformed payload", story: "One malformed event fails instantly and returns to the head of the queue forever.", goal: "Protect healthy deliveries and preserve the bad event for investigation.", requiredModuleIds: ["retry-dlq"], trace: ["A delivery fails", "Its attempt budget is checked", "Backoff limits repeated pressure", "Exhausted work moves aside visibly"], failure: "Unbounded immediate retries starve healthy messages and hide the permanent failure.", success: "Bounded backoff protects capacity and a dead-letter lane keeps the failure inspectable.", discovery: "Retries need limits, spacing, and an explicit terminal path." },
  ],
};

const checkout: HldVerificationWorld = {
  id: "checkout",
  systemName: "Checkout",
  title: "Checkout Under Load",
  intro: "Coordinate inventory, payment, and order creation when retries and partial failures are normal.",
  tagline: "Correctness is visible when the happy path stops being happy.",
  accent: color.amber,
  transferPrompt: "A flash sale adds a ten-minute reservation timeout. Explain which component owns expiry and how payment completion races with release.",
  zones: sharedZones,
  modules: [
    { id: "request-key", beginnerName: "One-checkout stamp", technicalName: "Idempotency key gate", description: "Recognizes repeated submit attempts as one checkout operation.", kind: "traffic", startsInZoneId: "memory", expectedZoneId: "door", reason: "Duplicate requests should collapse before they repeat expensive side effects." },
    { id: "orchestrator", beginnerName: "Checkout conductor", technicalName: "Checkout saga orchestrator", description: "Coordinates reservation, payment, compensation, and order completion.", kind: "reliability", startsInZoneId: "memory", expectedZoneId: "workshop", reason: "One explicit workflow owns progress across services without pretending there is one database transaction." },
    { id: "order-ledger", beginnerName: "Permanent order journal", technicalName: "Order state ledger", description: "Stores each checkout transition durably.", kind: "data", startsInZoneId: "workshop", expectedZoneId: "memory", reason: "Recovery needs durable progress, not only in-memory callbacks." },
    { id: "outbox", beginnerName: "Committed event tray", technicalName: "Transactional outbox", description: "Publishes events only after the related order state is committed.", kind: "async", startsInZoneId: "door", expectedZoneId: "crew", reason: "A local state change and its event must not silently diverge." },
    { id: "reconciliation", beginnerName: "Mismatch patrol", technicalName: "Reconciliation and compensation worker", description: "Finds stuck workflows and applies safe compensation.", kind: "reliability", startsInZoneId: "workshop", expectedZoneId: "tower", reason: "Partial failures need observable repair outside the request path." },
  ],
  incidents: [
    { id: "double-click", title: "The double-click", dispatchLabel: "Submit checkout twice", story: "A slow network makes the user press Buy again before the first response returns.", goal: "Produce one order and one charge from repeated identical requests.", requiredModuleIds: ["request-key"], trace: ["Two requests carry one operation id", "The first claims the operation", "The second observes existing progress", "One checkout result returns"], failure: "Each request starts a new checkout and duplicates side effects.", success: "The front door collapses repeated submissions into one durable operation.", discovery: "Idempotency starts at the boundary where duplicates first enter." },
    { id: "payment-failure", title: "Payment fails after reservation", dispatchLabel: "Decline the payment", story: "Inventory is reserved, then the payment provider declines the charge.", goal: "Release inventory and leave one explainable final order state.", requiredModuleIds: ["orchestrator", "order-ledger"], trace: ["Inventory is reserved", "Payment fails", "The workflow records the transition", "Compensation releases inventory"], failure: "Callbacks coordinate themselves, so no component owns the incomplete workflow.", success: "The orchestrator records progress and runs compensation from a durable order state.", discovery: "A saga makes partial progress and compensation explicit across independent services." },
    { id: "event-gap", title: "Order saved, event lost", dispatchLabel: "Crash after saving the order", story: "The order commits, then the process crashes before publishing OrderCreated.", goal: "Make the state change and its event recover together.", requiredModuleIds: ["outbox"], trace: ["Order state commits", "An event record commits beside it", "A worker publishes the record", "Consumers receive the event eventually"], failure: "Publishing after the commit creates a crash gap that loses the event permanently.", success: "The committed outbox lets a worker retry publication after the process returns.", discovery: "The outbox closes the gap between durable state and asynchronous publication." },
    { id: "stuck-order", title: "A checkout never finishes", dispatchLabel: "Drop a completion callback", story: "Payment succeeds, but the final callback disappears and the order stays pending.", goal: "Detect the mismatch and converge on the correct state without another user request.", requiredModuleIds: ["reconciliation"], trace: ["The control tower finds an aged pending order", "External facts are compared", "A safe repair is chosen", "The workflow reaches a terminal state"], failure: "Only request handlers know how to finish checkout, so abandoned progress is invisible.", success: "Reconciliation detects aged workflows and repairs them through explicit compensation rules.", discovery: "Distributed correctness needs a repair loop, not only a carefully written happy path." },
  ],
};

export const HLD_VERIFICATION_WORLDS: HldVerificationWorld[] = [urlShortener, notificationService, checkout];

export function getHldVerificationWorld(id?: string): HldVerificationWorld | undefined {
  return HLD_VERIFICATION_WORLDS.find((world) => world.id === id);
}

export function getHldVerificationWorldRoute(id: string): string {
  return `/arena/hld-world/${id}`;
}
