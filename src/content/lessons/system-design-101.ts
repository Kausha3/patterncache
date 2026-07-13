import type { SDLesson } from "@/types";

export const systemDesign101: SDLesson = {
  id: "client-server",
  track: "system-design",
  title: "System Design 101",
  blurb: "Start here. What a system even is — from one request to many.",
  estMinutes: 6,
  overview:
    "If you've never done system design, start here — no prior knowledge assumed. Every system-design question, no matter how fancy it sounds, is the same shape: users make requests, servers do work, data gets stored — and it all has to keep working as more and more users show up. We'll build that picture from a single request, meet the two numbers every design is judged by, and see exactly why one server eventually isn't enough. After this, the other lessons will click.",
  stageLabels: { problem: "The question", fix: "The idea", tradeoff: "In an interview" },
  stages: [
    {
      title: "A request and a response",
      visibleNodes: ["client", "app"],
      problem: "What actually happens when you open an app or a website? Before any 'scaling', this is the whole thing.",
      fix: "A client — your browser or phone — sends a request ('give me the home page') across the internet to a server: a computer that's always on, waiting to do work. The server figures out the answer and sends back a response. That request → response round trip is the atom of every system online.",
      tradeoff: "Say it plainly: 'A client sends a request, a server handles it and responds.' Everything else in system design is this same loop, repeated billions of times and kept fast and reliable.",
      metrics: { capacity: 800, latencyMs: 40 },
    },
    {
      title: "Where the data lives",
      visibleNodes: ["client", "app", "db"],
      problem: "The server answered — but it forgot everything the instant it did. Where do your account, your posts, your orders actually persist?",
      fix: "In a database: durable storage that remembers data between requests, even if a server crashes and restarts. Think of it as the system's long-term memory. The server is the worker; the database is what it reads from and writes to. Keeping the server itself 'stateless' — holding no important data of its own — is the quiet trick that lets you run many servers later.",
      tradeoff: "Splitting compute (the server) from storage (the database) is the first move in almost every design. Naming it out loud — 'stateless app servers, a database for persistence' — instantly signals you know the shape.",
      metrics: { capacity: 800, latencyMs: 60 },
    },
    {
      title: "The two numbers: latency & throughput",
      visibleNodes: ["client", "app", "db"],
      problem: "How do you even judge whether a design is 'good'? Two numbers decide almost everything — and you can feel them right here.",
      fix: "Latency is how long one request takes (milliseconds) — the wait a user feels. Throughput is how many requests per second the system can handle before it chokes — its capacity. Drag the load slider below: with headroom, latency stays flat and nothing drops. Push past the throughput ceiling and latency spikes while requests get shed. Every tradeoff in every later lesson is really about moving these two numbers.",
      tradeoff: "This is the vocabulary that makes you sound fluent: 'this system is read-heavy, so I'll optimize for read throughput and keep p50 latency low.' Latency and throughput are the axes every interview answer is measured on.",
      metrics: { capacity: 2500, latencyMs: 60 },
    },
    {
      title: "Why one server isn't enough",
      visibleNodes: ["client", "app", "db"],
      problem: "One server was fine for a handful of users. Drag the load up — what breaks when a million show up at once?",
      fix: "Every single machine has a ceiling: CPU, memory, open connections. Past it, latency spikes and requests start failing (you just watched it happen). And you can't buy a bigger machine forever. So the entire rest of system design is answering one question, in different ways for different problems: how do we serve more load than a single server can? More servers behind a load balancer, caches, queues, replicas — each lesson is one answer.",
      tradeoff: "This is the pivot into everything else. URL Shortener, Chat, Feed, Rate Limiter, Cache — each one is a different way to handle 'more load than one box can take.' Now they'll read as variations on a theme, not a wall of jargon.",
      metrics: { capacity: 2500, latencyMs: 60 },
    },
  ],
  recap: [
    "Every system is just clients making requests to servers that read and write storage — the rest is keeping that fast and reliable as load grows.",
    "Latency (time per request) and throughput (requests per second) are the two numbers every tradeoff moves.",
    "Separating stateless servers from a durable database is what makes scaling possible in the first place.",
    "Every scaling lesson answers one question: how do we handle more load than a single server can?",
  ],
  relatedLessons: ["url-shortener", "chat-app"],
  terms: ["client", "server", "request", "database", "latency", "throughput", "stateless", "loadBalancer"],
};
