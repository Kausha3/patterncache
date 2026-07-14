import type { NodeDef } from "@/types";

/**
 * Shared NODES dictionary — §5. Reused across every system-design lesson.
 * A stage references node ids; the per-stage problem/fix/tradeoff text is
 * lesson-specific, but the node's identity and "what it is" live here once.
 */
export const NODES: Record<string, NodeDef> = {
  client: { id: "client", label: "Client", what: "The user's browser or app making requests.", kind: "client" },
  dns: { id: "dns", label: "DNS", what: "Resolves the short domain to a server IP. First hop of every request.", kind: "edge" },
  lb: { id: "lb", label: "Load Balancer", what: "Spreads incoming requests across many app servers so no single one is overwhelmed.", kind: "edge" },
  cdn: { id: "cdn", label: "CDN", what: "Edge cache near the user. Serves hot content without hitting your origin.", kind: "edge" },
  app: { id: "app", label: "App Server", what: "Stateless application tier. Runs request logic and scales horizontally behind the balancer.", kind: "compute" },
  cache: { id: "cache", label: "Cache (Redis)", what: "In-memory key→value store. Sub-millisecond reads for hot keys.", kind: "data" },
  db: { id: "db", label: "Database", what: "The durable source of truth for your core records.", kind: "data" },
  replica: { id: "replica", label: "Read Replica", what: "A read-only copy of the database that absorbs read traffic.", kind: "data" },
  kgs: { id: "kgs", label: "Key-Gen Service", what: "Hands out unique short codes so app servers never collide when writing.", kind: "compute" },
  queue: { id: "queue", label: "Queue", what: "Buffers work so the hot path stays fast and producers/consumers decouple.", kind: "async" },

  // Chat / real-time nodes
  gateway: { id: "gateway", label: "WS Gateway", what: "Holds each client's persistent WebSocket connection and pushes messages the instant they arrive.", kind: "edge" },
  presence: { id: "presence", label: "Presence / Routing", what: "Tracks which gateway holds each user's live connection, so a message can be routed to the right box.", kind: "compute" },
  fanout: { id: "fanout", label: "Fan-out Service", what: "Writes an incoming message into every recipient's inbox/timeline. This is the expensive part of any social system.", kind: "compute" },
  notif: { id: "notif", label: "Push / Notifications", what: "Delivers messages to users who are offline via mobile/desktop push.", kind: "async" },
  shard: { id: "shard", label: "Sharded Store", what: "Data partitioned by a key (conversation, user, hash) so one hot partition never overwhelms a single node.", kind: "data" },
  limiter: { id: "limiter", label: "Rate Limiter", what: "Checks and decrements each caller's request budget before the work reaches your app, rejecting the excess fast and cheap.", kind: "edge" },
  counter: { id: "counter", label: "Counter Store", what: "A fast shared store (Redis) holding per-caller counters/tokens so every server enforces the same limit.", kind: "data" },
  timeline: { id: "timeline", label: "Timeline Cache", what: "Each user's precomputed feed, ready to serve instantly. This is the read side of fan-out-on-write.", kind: "data" },
  origin: { id: "origin", label: "Origin Store", what: "The durable write store, where source-of-truth records land before any caching or fan-out.", kind: "data" },

  // Warehouse / fulfillment
  inventory: { id: "inventory", label: "Inventory Service", what: "Tracks real-time stock counts per SKU per warehouse location. It's the single source of truth for 'how many do we have'.", kind: "compute" },
  orderRouter: { id: "orderRouter", label: "Order Router", what: "Decides which warehouse should fulfill an order, based on stock availability and proximity to the customer.", kind: "compute" },
  wms: { id: "wms", label: "Warehouse Mgmt (Pick/Pack)", what: "Coordinates the physical pick, pack, and ship workflow inside one warehouse.", kind: "compute" },
  eventStream: { id: "eventStream", label: "Event Stream", what: "A durable, ordered log of inventory-changing events (unlike a plain queue, every consumer sees the same order) so every service's view of stock stays consistent.", kind: "async" },

  // Checkout / cart
  cartService: { id: "cartService", label: "Cart Service", what: "Owns each user's in-progress cart contents and running price, before checkout.", kind: "compute" },
  inventoryReserve: { id: "inventoryReserve", label: "Inventory Reservation", what: "Temporarily holds stock for items in an active checkout so two carts can't both buy the last unit.", kind: "compute" },
  paymentService: { id: "paymentService", label: "Payment Service", what: "Charges the customer and returns a definitive success or failure. It's the one place money actually moves.", kind: "compute" },
  orderService: { id: "orderService", label: "Order Service", what: "The durable record of a placed order, created only once payment has actually succeeded.", kind: "data" },
  saga: { id: "saga", label: "Order Saga / Orchestrator", what: "Coordinates the multi-step checkout (reserve stock → charge → confirm order) and rolls back cleanly if any step fails.", kind: "compute" },

  // Notifications
  templateService: { id: "templateService", label: "Template Service", what: "Renders the right message content and format for a notification type and channel.", kind: "compute" },
  providerAdapter: { id: "providerAdapter", label: "Provider Adapters", what: "Thin integrations to each channel's real delivery API: push, email, and SMS vendors.", kind: "edge" },
  deliveryTracker: { id: "deliveryTracker", label: "Delivery Tracker", what: "Records sent, delivered, and failed status per notification. Retries and analytics read from this.", kind: "data" },

  // Job scheduling
  scheduler: { id: "scheduler", label: "Scheduler", what: "Decides when each job is due to run and hands ready jobs off to workers.", kind: "compute" },
  workerPool: { id: "workerPool", label: "Worker Pool", what: "A fleet of workers that pull ready jobs and execute them.", kind: "compute" },
  jobStore: { id: "jobStore", label: "Job Store", what: "The durable record of every job's definition, schedule, and current status.", kind: "data" },
  coordinator: { id: "coordinator", label: "Leader Coordinator", what: "Elects a single active scheduler instance so a job is never scheduled twice by two competing schedulers.", kind: "compute" },

  // Delivery tracking
  gpsIngest: { id: "gpsIngest", label: "GPS Ingest", what: "Receives a continuous stream of location pings from delivery vehicles.", kind: "edge" },
  routeOptimizer: { id: "routeOptimizer", label: "Route Optimizer", what: "Computes efficient delivery routes and re-routes drivers when conditions change.", kind: "compute" },
  geoIndex: { id: "geoIndex", label: "Geospatial Index", what: "A location-indexed store that answers 'where is package X right now' and nearby-driver queries fast.", kind: "data" },

  // Prime Video
  catalog: { id: "catalog", label: "Catalog Service", what: "The durable metadata store of every title, with regional availability.", kind: "data" },
  personalization: { id: "personalization", label: "Personalization Engine", what: "Ranks and assembles the personalized rows a specific user sees on their home page.", kind: "compute" },
  manifestService: { id: "manifestService", label: "Manifest / Streaming Service", what: "Serves the video manifest and stream segments a player actually needs to play a title.", kind: "compute" },

  // Review-abuse detection
  reviewIngest: { id: "reviewIngest", label: "Review Ingest", what: "Receives every newly submitted review before it's published.", kind: "edge" },
  mlScorer: { id: "mlScorer", label: "ML Scoring Service", what: "Runs a trained model over each review to produce a fraud/abuse likelihood score.", kind: "compute" },
  featureStore: { id: "featureStore", label: "Feature Store", what: "Precomputed signals (reviewer history, posting velocity, IP reputation) that the model reads at scoring time.", kind: "data" },
  moderationQueue: { id: "moderationQueue", label: "Moderation Queue", what: "Holds borderline-scored reviews for human review before they're published or rejected.", kind: "async" },
};

export function getNode(id: string): NodeDef {
  return NODES[id] ?? { id, label: id, what: "Undocumented node.", kind: "compute" };
}
