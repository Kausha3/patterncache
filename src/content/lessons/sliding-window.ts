import type { DSALesson } from "@/types";

export const slidingWindow: DSALesson = {
  id: "sliding-window",
  track: "dsa",
  title: "Sliding Window",
  blurb: "Turn an O(n²) rescan into a single O(n) pass.",
  estMinutes: 4,
  concept: {
    bruteForce:
      "The obvious move is to check every possible substring — start at each index, extend until you hit a repeat, track the longest. It works, but you re-scan the same characters again and again.",
    bruteForceComplexity: "O(n²)",
    insight:
      "You never actually need to go backwards. Keep a window [L, R]. Push R forward to grow it; when a character repeats, pull L forward just enough to drop the offender. Every character enters the window once and leaves at most once.",
    complexity: "O(n)",
    recognize:
      "Reach for a sliding window when a problem asks for the best (longest / shortest / max-sum) contiguous run that satisfies some constraint — and a brute force would re-scan overlapping ranges.",
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
