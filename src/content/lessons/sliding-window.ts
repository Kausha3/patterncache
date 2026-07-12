import type { DSALesson } from "@/types";

export const slidingWindow: DSALesson = {
  id: "sliding-window",
  track: "dsa",
  title: "Sliding Window",
  blurb: "Turn an O(n²) rescan into a single O(n) pass.",
  estMinutes: 4,
  concept: {
    bruteForce:
      "To find the longest substring with no repeated characters, the obvious move is to check every possible substring — start at each index, extend until you hit a repeat. That's O(n²): you re-scan the same characters again and again.",
    insight:
      "You never actually need to go backwards. Keep a window [L, R]. Push R forward to grow it; when a character repeats, pull L forward just enough to drop the offender. Every character enters the window once and leaves at most once.",
    complexity: "O(n) time, O(k) space",
  },
  trace: {
    input: "abcabcbb",
    algorithm: "sliding-window",
    goal: "Longest substring without repeating characters",
  },
  practice: {
    input: "pwwkew",
    goal: "You drive the window. Find the longest repeat-free substring.",
  },
  recap: [
    "A window that only ever moves forward converts a nested rescan into one linear pass.",
    "The trigger to shrink is a broken invariant (a repeat) — not a fixed window size.",
    "Recognize it when a problem asks for the best contiguous run under some constraint.",
  ],
  relatedLessons: ["two-pointer", "bfs"],
};
