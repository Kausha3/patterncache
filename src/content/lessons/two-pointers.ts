import type { DSALesson } from "@/types";

export const twoPointers: DSALesson = {
  id: "two-pointer",
  track: "dsa",
  title: "Two Pointers",
  blurb: "On sorted data, one comparison eliminates a whole row of options.",
  estMinutes: 4,
  concept: {
    bruteForce:
      "To find two numbers that sum to a target, the obvious move is to try every pair: for each element, scan the rest of the array. It's correct, but it ignores everything you know about the data.",
    bruteForceComplexity: "O(n²)",
    insight:
      "If the array is sorted, put one pointer at each end. Their sum is too small? The smallest element can never be part of a bigger pair, so move the left one up. Too big? The largest can't help either, so move the right one down. Every comparison discards a whole row of the pair grid.",
    complexity: "O(n)",
    recognize:
      "Reach for two pointers when the input is sorted (or you can sort it) and you're looking for a pair, a triplet, or a partition, basically anywhere a comparison at the ends tells you which side to discard.",
  },
  trace: {
    input: "2,7,11,15|9",
    algorithm: "two-pointer",
    goal: "Find a pair that sums to 9",
  },
  practice: {
    input: "1,3,4,6,8,11|10",
    goal: "You drive the pointers. Find a pair summing to 10.",
  },
  recap: [
    "Sorting turns a 2-D search over all pairs into a 1-D walk from both ends.",
    "The move rule falls straight out of the ordering: too small → advance the low end; too big → retreat the high end.",
    "Recognize it whenever sorted input lets one comparison rule out many candidates at once.",
  ],
  relatedLessons: ["sliding-window", "bfs"],
};
