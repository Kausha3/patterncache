import type { Lesson, Track } from "@/types";
import { slidingWindow } from "./lessons/sliding-window";
import { urlShortener } from "./lessons/url-shortener";

/** Fully-built, playable lessons keyed by id. */
export const LESSONS: Record<string, Lesson> = {
  [slidingWindow.id]: slidingWindow,
  [urlShortener.id]: urlShortener,
};

export function getLesson(id: string): Lesson | undefined {
  return LESSONS[id];
}

/**
 * The path map (§2). Each track is a vertical spine of nodes. Some nodes are
 * built lessons ("available"); others are placeholders ("coming-soon") that
 * still route to a real, non-dead-end screen. Nothing is ever truly locked —
 * every node is clickable, honoring the "no dead ends" non-negotiable.
 */
export interface PathNode {
  id: string;
  title: string;
  track: Track;
  status: "available" | "coming-soon";
}

export const PATH: Record<Track, PathNode[]> = {
  dsa: [
    { id: "two-pointer", title: "Two Pointers", track: "dsa", status: "coming-soon" },
    { id: "sliding-window", title: "Sliding Window", track: "dsa", status: "available" },
    { id: "bfs", title: "BFS / Graphs", track: "dsa", status: "coming-soon" },
    { id: "dfs", title: "DFS / Backtracking", track: "dsa", status: "coming-soon" },
    { id: "dp", title: "Dynamic Programming", track: "dsa", status: "coming-soon" },
    { id: "heap", title: "Heaps / Top-K", track: "dsa", status: "coming-soon" },
  ],
  "system-design": [
    { id: "client-server", title: "Client–Server Basics", track: "system-design", status: "coming-soon" },
    { id: "url-shortener", title: "Scaling a URL Shortener", track: "system-design", status: "available" },
    { id: "chat-app", title: "Designing a Chat App", track: "system-design", status: "coming-soon" },
    { id: "feed", title: "Designing a Feed", track: "system-design", status: "coming-soon" },
    { id: "rate-limiter", title: "Designing a Rate Limiter", track: "system-design", status: "coming-soon" },
    { id: "cache-layer", title: "Designing a Cache Layer", track: "system-design", status: "coming-soon" },
  ],
};

export const TRACK_META: Record<Track, { label: string }> = {
  dsa: { label: "DSA Patterns" },
  "system-design": { label: "System Design" },
};

/** The recommended first click on landing — the flagship, shortest lesson. */
export const RECOMMENDED_FIRST = "sliding-window";
