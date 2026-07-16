import type { Lesson, Track } from "@/types";
import { slidingWindow } from "./lessons/sliding-window";
import { twoPointers } from "./lessons/two-pointers";
import { bfs } from "./lessons/bfs";
import { systemDesign101 } from "./lessons/system-design-101";
import { theInterview } from "./lessons/the-interview";
import { urlShortener } from "./lessons/url-shortener";
import { chatApp } from "./lessons/chat-app";
import { feed } from "./lessons/feed";
import { rateLimiter } from "./lessons/rate-limiter";
import { cacheLayer } from "./lessons/cache-layer";
import { lld101 } from "./lessons/lld-101";
import { parkingLot } from "./lessons/parking-lot";
import { amazonLocker } from "./lessons/amazon-locker";
import { elevatorSystem } from "./lessons/elevator-system";
import { vendingMachine } from "./lessons/vending-machine";
import { discountCouponSystem } from "./lessons/discount-coupon-system";
import { chessGame } from "./lessons/chess-game";
import { amazonWarehouse } from "./lessons/amazon-warehouse";
import { amazonCheckout } from "./lessons/amazon-checkout";

/** Fully-built, playable lessons keyed by id. */
export const LESSONS: Record<string, Lesson> = {
  [slidingWindow.id]: slidingWindow,
  [twoPointers.id]: twoPointers,
  [bfs.id]: bfs,
  [systemDesign101.id]: systemDesign101,
  [theInterview.id]: theInterview,
  [urlShortener.id]: urlShortener,
  [chatApp.id]: chatApp,
  [feed.id]: feed,
  [rateLimiter.id]: rateLimiter,
  [cacheLayer.id]: cacheLayer,
  [lld101.id]: lld101,
  [parkingLot.id]: parkingLot,
  [amazonLocker.id]: amazonLocker,
  [elevatorSystem.id]: elevatorSystem,
  [vendingMachine.id]: vendingMachine,
  [discountCouponSystem.id]: discountCouponSystem,
  [chessGame.id]: chessGame,
  [amazonWarehouse.id]: amazonWarehouse,
  [amazonCheckout.id]: amazonCheckout,
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
  /** Optional sub-heading within a track's spine — used to split System Design
   * into "High-Level Design" and "Low-Level Design" without adding a third
   * top-level track. A node's group differing from the previous node's group
   * renders a small divider in <PathMap/>. */
  group?: string;
  /** Optional accent override for this node's marker/heading, so LLD nodes
   * keep reading as violet (their brand color everywhere else in the app)
   * even while nested inside the blue System Design spine. */
  groupAccent?: string;
}

const LLD_ACCENT = "#9A82D4"; // color.violet — LLD's brand color everywhere else in the app

export const PATH: Record<Track, PathNode[]> = {
  dsa: [
    { id: "two-pointer", title: "Two Pointers", track: "dsa", status: "available" },
    { id: "sliding-window", title: "Sliding Window", track: "dsa", status: "available" },
    { id: "bfs", title: "BFS / Shortest Path", track: "dsa", status: "available" },
    { id: "dfs", title: "DFS / Backtracking", track: "dsa", status: "coming-soon" },
    { id: "dp", title: "Dynamic Programming", track: "dsa", status: "coming-soon" },
    { id: "heap", title: "Heaps / Top-K", track: "dsa", status: "coming-soon" },
  ],
  "system-design": [
    { id: "client-server", title: "System Design 101", track: "system-design", status: "available", group: "High-Level Design" },
    { id: "the-interview", title: "The Interview: Clarifying Questions", track: "system-design", status: "available", group: "High-Level Design" },
    { id: "url-shortener", title: "Scaling a URL Shortener", track: "system-design", status: "available", group: "High-Level Design" },
    { id: "chat-app", title: "Designing a Chat App", track: "system-design", status: "available", group: "High-Level Design" },
    { id: "feed", title: "Designing a News Feed", track: "system-design", status: "available", group: "High-Level Design" },
    { id: "rate-limiter", title: "Designing a Rate Limiter", track: "system-design", status: "available", group: "High-Level Design" },
    { id: "cache-layer", title: "Designing a Cache Layer", track: "system-design", status: "available", group: "High-Level Design" },
    { id: "lld-101", title: "LLD Basics: Classes, Objects, Responsibility", track: "system-design", status: "available", group: "Low-Level Design", groupAccent: LLD_ACCENT },
    { id: "parking-lot", title: "Design a Parking Lot", track: "system-design", status: "available", group: "Low-Level Design", groupAccent: LLD_ACCENT },
    { id: "amazon-locker", title: "Design Amazon Locker", track: "system-design", status: "available", group: "Low-Level Design", groupAccent: LLD_ACCENT },
    { id: "elevator-system", title: "Design an Elevator System", track: "system-design", status: "available", group: "Low-Level Design", groupAccent: LLD_ACCENT },
    { id: "vending-machine", title: "Design a Vending Machine", track: "system-design", status: "available", group: "Low-Level Design", groupAccent: LLD_ACCENT },
    { id: "discount-coupon-system", title: "Design a Discount / Coupon System", track: "system-design", status: "available", group: "Low-Level Design", groupAccent: LLD_ACCENT },
    { id: "chess-game", title: "Design a Chess Game", track: "system-design", status: "available", group: "Low-Level Design", groupAccent: LLD_ACCENT },
  ],
};

export const TRACK_META: Record<Track, { label: string }> = {
  dsa: { label: "DSA Patterns" },
  "system-design": { label: "System Design" },
};

/** The recommended first click on landing — the flagship, shortest lesson. */
export const RECOMMENDED_FIRST = "sliding-window";
