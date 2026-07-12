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
  app: { id: "app", label: "App Server", what: "Runs your logic: generates short codes, looks up and redirects long URLs.", kind: "compute" },
  cache: { id: "cache", label: "Cache (Redis)", what: "In-memory key→value store. Sub-millisecond reads for hot short codes.", kind: "data" },
  db: { id: "db", label: "Database", what: "Durable store of the short-code → long-URL mapping. The source of truth.", kind: "data" },
  replica: { id: "replica", label: "Read Replica", what: "A read-only copy of the database that absorbs read traffic.", kind: "data" },
  kgs: { id: "kgs", label: "Key-Gen Service", what: "Hands out unique short codes so app servers never collide when writing.", kind: "compute" },
  queue: { id: "queue", label: "Queue", what: "Buffers writes (e.g. click analytics) so the hot path stays fast.", kind: "async" },
};

export function getNode(id: string): NodeDef {
  return NODES[id] ?? { id, label: id, what: "Undocumented node.", kind: "compute" };
}
