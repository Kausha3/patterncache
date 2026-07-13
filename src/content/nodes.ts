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
  app: { id: "app", label: "App Server", what: "Stateless application tier — runs request logic and scales horizontally behind the balancer.", kind: "compute" },
  cache: { id: "cache", label: "Cache (Redis)", what: "In-memory key→value store. Sub-millisecond reads for hot keys.", kind: "data" },
  db: { id: "db", label: "Database", what: "The durable source of truth for your core records.", kind: "data" },
  replica: { id: "replica", label: "Read Replica", what: "A read-only copy of the database that absorbs read traffic.", kind: "data" },
  kgs: { id: "kgs", label: "Key-Gen Service", what: "Hands out unique short codes so app servers never collide when writing.", kind: "compute" },
  queue: { id: "queue", label: "Queue", what: "Buffers work so the hot path stays fast and producers/consumers decouple.", kind: "async" },

  // Chat / real-time nodes
  gateway: { id: "gateway", label: "WS Gateway", what: "Holds each client's persistent WebSocket connection and pushes messages the instant they arrive.", kind: "edge" },
  presence: { id: "presence", label: "Presence / Routing", what: "Tracks which gateway holds each user's live connection, so a message can be routed to the right box.", kind: "compute" },
  fanout: { id: "fanout", label: "Fan-out Service", what: "Writes an incoming message into every recipient's inbox/timeline — the expensive part of any social system.", kind: "compute" },
  notif: { id: "notif", label: "Push / Notifications", what: "Delivers messages to users who are offline via mobile/desktop push.", kind: "async" },
  shard: { id: "shard", label: "Sharded Store", what: "Messages partitioned by conversation id so one hot chat never overwhelms a single database.", kind: "data" },
};

export function getNode(id: string): NodeDef {
  return NODES[id] ?? { id, label: id, what: "Undocumented node.", kind: "compute" };
}
