/**
 * Plain-English glossary. Surfaced (collapsibly) in every system-design lesson
 * so a beginner never hits a term they can't decode in one tap. Written for
 * someone doing interview prep who has never formally studied system design.
 */
export const GLOSSARY: Record<string, { term: string; plain: string }> = {
  client: { term: "Client", plain: "The thing making requests, like a web browser or phone app. It asks and the server answers." },
  server: { term: "Server", plain: "A computer that's always on, waiting to handle requests and do work. Can mean one machine or a whole fleet." },
  request: { term: "Request / response", plain: "A request is a client asking for something ('load my feed'); the response is the server's answer. Almost everything online is this round trip." },
  database: { term: "Database", plain: "Durable storage that remembers data between requests, things like accounts, posts, orders, even if a server restarts." },
  latency: { term: "Latency", plain: "How long a single request takes, in milliseconds. The delay a user actually feels." },
  throughput: { term: "Throughput", plain: "How many requests per second a system can handle before it slows down or fails. Its capacity." },
  loadBalancer: { term: "Load balancer", plain: "A traffic director in front of many servers that spreads requests across them so no single server is overloaded." },
  cache: { term: "Cache", plain: "A small, fast store (usually in memory) holding copies of popular data, so you don't hit the slow database every time." },
  replica: { term: "Read replica", plain: "A read-only copy of a database. Reads spread across replicas so the main database isn't overwhelmed." },
  shard: { term: "Sharding", plain: "Splitting one big dataset across several machines by some key, so no single machine holds or serves all of it." },
  fanout: { term: "Fan-out", plain: "Delivering one item to many recipients, like writing a new post into thousands of followers' feeds." },
  queue: { term: "Queue", plain: "A buffer that holds work to do later, so a slow task doesn't block the fast path. Producers add; consumers process." },
  cdn: { term: "CDN", plain: "A network of servers near users worldwide that serve copies of content, so it loads fast regardless of distance." },
  stateless: { term: "Stateless server", plain: "A server that keeps no important data of its own between requests. Any server can handle any request, so you can add more freely." },
  tokenBucket: { term: "Token bucket", plain: "A rate-limiting method: each caller has a bucket of tokens that refills steadily; each request spends one; empty bucket = rejected." },
  cacheAside: { term: "Cache-aside", plain: "Check the cache first; on a miss, load from the database and put a copy in the cache for next time." },
  replicationLag: { term: "Replication lag", plain: "The short delay before a write on the main database shows up on its read replicas." },
  eviction: { term: "Eviction", plain: "When a cache is full, it drops old or least-used entries to make room (LRU = evict least-recently-used)." },
  ttl: { term: "TTL", plain: "Time-to-live: an expiry timer on cached data so it doesn't stay stale forever." },
  consistency: { term: "Consistency", plain: "Whether everyone sees the same, up-to-date data at the same time." },
  websocket: { term: "WebSocket", plain: "A persistent two-way connection so the server can push data to a client instantly, instead of waiting to be asked." },
  presence: { term: "Presence", plain: "Tracking who's online and, for real-time apps, which server holds each user's live connection." },
  stampede: { term: "Cache stampede", plain: "When a popular cached item expires and thousands of requests miss at once, all hammering the database together." },
};
