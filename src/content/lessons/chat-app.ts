import type { SDLesson } from "@/types";

export const chatApp: SDLesson = {
  id: "chat-app",
  track: "system-design",
  title: "Designing a Chat App",
  blurb: "Real-time delivery and fan-out — a different shape than read-scaling.",
  estMinutes: 7,
  overview:
    "A chat app inverts the URL shortener's problem. It's write-heavy and latency-critical: a message must reach the right people in milliseconds, in order, whether they're online or not. The hard parts are real-time delivery, routing to the connection that holds a recipient, and fan-out. Each stage fixes the bottleneck the last one exposes — click any node to see what it is.",
  stages: [
    {
      title: "Polling",
      visibleNodes: ["client", "app", "db"],
      problem:
        "The simplest chat: clients POST a message, the server stores it, and everyone polls 'anything new?' every second. Messages lag by up to a poll interval, and the DB gets hammered by polls that usually return nothing.",
      fix: "Establish the core write path — persist each message with a conversation id and timestamp.",
      tradeoff: "Trivial to build, but polling trades away both latency and efficiency. Not real-time in any real sense.",
      metrics: { capacity: 2000, latencyMs: 900 },
    },
    {
      title: "Real-time push",
      visibleNodes: ["client", "gateway", "app", "db"],
      problem:
        "Polling has to go. But if clients hold a live connection, the server that receives a message from sender A often isn't the one holding recipient B's connection — so it has no way to push it.",
      fix: "Put a WebSocket Gateway in front: every client keeps one persistent connection. The server can now push a message down instantly instead of waiting to be polled.",
      tradeoff:
        "Sub-second delivery, but you've introduced stateful connections. The routing question is now explicit: given recipient B, which gateway holds their socket?",
      metrics: { capacity: 20000, latencyMs: 120 },
    },
    {
      title: "Route + fan-out",
      visibleNodes: ["client", "gateway", "app", "presence", "queue", "fanout", "db"],
      problem:
        "Direct server-to-server pushing doesn't scale, and a message to a group has to reach many recipients — some on different gateways, some in different data centers.",
      fix: "Publish each message to a Queue. A Presence service knows which gateway holds each recipient; a Fan-out service writes the message into every recipient's inbox and signals their gateway to push it.",
      tradeoff:
        "Decoupled and horizontally scalable, but async fan-out makes ordering a real concern — recipients must see a conversation's messages in the same order. You now enforce per-conversation sequencing, not global.",
      metrics: { capacity: 150000, latencyMs: 80 },
    },
    {
      title: "Scale + offline",
      visibleNodes: ["client", "gateway", "app", "presence", "queue", "fanout", "cache", "shard", "notif"],
      problem:
        "One database can't hold every conversation's history, a hot group chat overwhelms a single node, and recipients who are offline never get pushed a live message.",
      fix: "Shard the store by conversation id, cache each conversation's most recent messages for instant scroll-back, and hand offline recipients to a Push/Notifications service.",
      tradeoff:
        "Scales to huge volume, but fan-out-on-write is expensive for very large groups — at some point you switch those to fan-out-on-read (recipients pull) to avoid writing one message a million times. Choosing per-conversation is the real design lever.",
      metrics: { capacity: 1200000, latencyMs: 45 },
    },
  ],
  recap: [
    "Chat is write-heavy and delivery-critical — the core problem is routing and fan-out, not read-caching.",
    "Real-time push forces stateful connections, which forces a presence/routing layer to answer 'where is recipient B?'.",
    "Fan-out-on-write vs fan-out-on-read is the central tradeoff: cheap reads at write cost, or cheap writes at read cost — chosen per conversation size.",
    "Async delivery buys scale but costs you easy ordering — you enforce per-conversation sequencing to get it back.",
  ],
  relatedLessons: ["url-shortener", "feed"],
  terms: ["client", "server", "websocket", "presence", "fanout", "queue", "shard", "cache", "consistency"],
  interview: {
    prompt: "Design a chat app.",
    opening: "Let's design a messaging app — think WhatsApp or Slack DMs. Where do you want to start?",
    summary:
      "You've got the shape: 1:1 and group chat with receipts, ~100k messages/sec across 50M users, groups up to a few hundred, at-least-once delivery with per-conversation ordering, offline push, and full history kept. That dictates the design — persistent connections through a gateway, a presence layer to find each recipient, a durable queue plus fan-out for ordered delivery, sharded storage for history, and a push path for offline users. That's exactly what we build next.",
    questions: [
      {
        id: "scope",
        ask: "One-to-one DMs only, or group chats too? And do we need read receipts and typing indicators?",
        category: "scope",
        answer: "Support both 1:1 and group chats. Read receipts and typing indicators are in scope; media can be a follow-up.",
        why: "1:1 vs groups is the single biggest fork in a chat design — delivering to one person is a different problem than fanning out to a whole room.",
        establishes: "1:1 + group chat · receipts + typing",
        branches: [
          { label: "1:1 only", approach: "Delivery is simple — route each message to the one recipient's live connection. No fan-out service needed." },
          { label: "Small groups (this)", approach: "Fan out each message to every member's connection and inbox — manageable at a few hundred members." },
          { label: "Huge broadcast rooms (100k+)", approach: "Fan-out-on-write explodes — switch large rooms to fan-out-on-read (members pull), treating it more like a feed." },
        ],
      },
      {
        id: "scale",
        ask: "How many users and messages per second at peak, and how big can a group get?",
        category: "scale",
        answer: "Assume ~50M daily users, hundreds of thousands of messages/sec at peak, and groups up to a few hundred people.",
        why: "Message rate and max group size decide whether simple fan-out survives or you need queues, sharding, and backpressure.",
        establishes: "50M DAU · 100k+ msg/s · groups ≤ few hundred",
      },
      {
        id: "delivery",
        ask: "What delivery guarantee do we need, and does message order have to be preserved?",
        category: "constraints",
        answer: "Messages must not be lost — at-least-once — and must appear in the same order within a conversation.",
        why: "Delivery and ordering guarantees drive whether you need a durable queue and per-conversation sequencing. They shape the whole pipeline.",
        establishes: "At-least-once · per-conversation ordering",
        branches: [
          { label: "Best-effort, unordered", approach: "Simplest — push and forget. Fine for ephemeral presence pings, not for real chat history." },
          { label: "At-least-once + ordered (this)", approach: "Persist before you ack, and stamp a per-conversation sequence number so clients can order and de-duplicate." },
          { label: "Exactly-once, global order", approach: "Much harder and rarely needed — global ordering across all conversations kills throughput. Push back on this ask." },
        ],
      },
      {
        id: "offline",
        ask: "Do we deliver to users who are offline, and how much history do we keep?",
        category: "constraints",
        answer: "Yes — offline users get a push notification and see the message on return. Keep full history.",
        why: "Offline delivery forces a store-and-push path, not just live sockets; full history means durable, scalable storage from day one.",
        establishes: "Offline push · full history retained",
      },
      {
        id: "transport-premature",
        ask: "Should we use WebSockets or long-polling for the connection?",
        category: "premature",
        redirect: "Let's settle transport once we know the delivery and scale needs — hold it. (It'll be persistent connections, but establish why first.)",
      },
      {
        id: "db-premature",
        ask: "Should messages live in Cassandra or a SQL database?",
        category: "premature",
        redirect: "Too early — the datastore falls out of the access pattern and scale, which we're still pinning down.",
      },
    ],
  },
};
