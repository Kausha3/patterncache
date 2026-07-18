import type { CodingCombatMissionId } from "./types";
import type { JavaCombatSpec } from "@/java/javaHarness";
import { CODING_COMBAT_WAVE_ONE_MISSIONS } from "./codingCombatWaveOneMissions";
import { CODING_COMBAT_WAVE_TWO_MISSIONS } from "./codingCombatWaveTwoMissions";
import { SLIDING_WINDOW_WORLD_MISSION } from "./slidingWindowWorld";

export interface CodingCombatTestCase {
  id: string;
  label: string;
  args: unknown[];
  expected: unknown;
}

export interface CodingCombatDefenseOption {
  id: string;
  label: string;
  correct: boolean;
  feedback: string;
}

export interface CodingCombatDefenseQuestion {
  id: string;
  category: "invariant" | "complexity" | "counterexample";
  prompt: string;
  options: CodingCombatDefenseOption[];
}

export interface CodingCombatMission {
  id: CodingCombatMissionId;
  title: string;
  signal: string;
  difficulty: "Warm-up" | "Interview" | "Bar raiser";
  minutes: number;
  /** Name of the JS function, used by the prototype JS runner and its tests. */
  functionName: string;
  signature: string;
  prompt: string;
  constraints: string[];
  examples: { input: string; output: string; why: string }[];
  /** JS starter, used by the prototype JS runner and its tests. */
  starterCode: string;
  /** The real thing: what the workbench compiles and runs in the browser JVM. */
  java: JavaCombatSpec;
  visibleTests: CodingCombatTestCase[];
  hiddenTests: CodingCombatTestCase[];
  hints: string[];
  defense: CodingCombatDefenseQuestion[];
  /** A code-driven world can replace the standard editor/MCQ workbench. */
  worldRoute?: string;
}

const CODING_COMBAT_CORE_MISSIONS: CodingCombatMission[] = [
  {
    id: "target-pair",
    title: "Target Pair Intercept",
    signal: "sorted input · exact pair · constant extra space",
    difficulty: "Warm-up",
    minutes: 20,
    functionName: "findTargetPair",
    signature: "findTargetPair(nums, target) → [leftIndex, rightIndex]",
    prompt: "Given a sorted array, return the indices of two distinct values whose sum equals target. Return [-1, -1] when no pair exists.",
    constraints: [
      "The array is sorted in ascending order.",
      "Use O(1) extra space and O(n) time.",
      "Return zero-based indices with leftIndex < rightIndex.",
    ],
    examples: [
      { input: "nums = [-4, -1, 0, 3, 10], target = 6", output: "[0, 4]", why: "-4 + 10 = 6" },
      { input: "nums = [1, 3, 5], target = 100", output: "[-1, -1]", why: "No valid pair exists" },
    ],
    starterCode: `function findTargetPair(nums, target) {
  // Keep the invariant explicit while you move through the array.
  return [-1, -1];
}`,
    java: {
      methodName: "findTargetPair",
      signature: "public int[] findTargetPair(int[] nums, int target)",
      argTypes: ["int[]", "int"],
      returnType: "int[]",
      starterCode: `import java.util.*;

public class Solution {
    public int[] findTargetPair(int[] nums, int target) {
        // Keep the invariant explicit while you move through the array.
        return new int[] { -1, -1 };
    }
}
`,
    },
    visibleTests: [
      { id: "mixed-values", label: "negative and positive values", args: [[-4, -1, 0, 3, 10], 6], expected: [0, 4] },
      { id: "middle-pair", label: "pair inside both boundaries", args: [[1, 2, 4, 7, 11], 9], expected: [1, 3] },
      { id: "empty", label: "empty input", args: [[], 5], expected: [-1, -1] },
    ],
    hiddenTests: [
      { id: "duplicates", label: "duplicate values", args: [[2, 2], 4], expected: [0, 1] },
      { id: "negative-target", label: "negative target", args: [[-12, -7, -3, 2, 9], -10], expected: [0, 3] },
      { id: "no-pair", label: "no valid pair", args: [[1, 3, 5], 100], expected: [-1, -1] },
      { id: "two-values", label: "minimum valid input", args: [[-5, 8], 3], expected: [0, 1] },
    ],
    hints: [
      "Start with one pointer at each end. The sorted order tells you which pointer can improve the sum.",
      "If the sum is too small, moving the right pointer cannot help. If it is too large, moving the left pointer cannot help.",
      "Stop when left is no longer strictly before right; using the same element twice violates the contract.",
    ],
    defense: [
      {
        id: "pair-invariant",
        category: "invariant",
        prompt: "Which invariant makes each pointer move safe?",
        options: [
          { id: "sorted-elimination", label: "Every value outside [left, right] has already been proven unable to form a valid pair", correct: true, feedback: "Correct. Each monotonic move eliminates only values that cannot repair the current sum." },
          { id: "closest", label: "The values at the pointers are always numerically closest to the target", correct: false, feedback: "Pointer values can be far from the target; correctness comes from eliminated regions, not numerical closeness." },
          { id: "one-answer", label: "The input is guaranteed to contain exactly one answer", correct: false, feedback: "No uniqueness guarantee is needed. The algorithm only needs to return one valid pair if any exists." },
        ],
      },
      {
        id: "pair-complexity",
        category: "complexity",
        prompt: "What is the tight complexity of the two-pointer solution?",
        options: [
          { id: "linear-constant", label: "O(n) time and O(1) extra space", correct: true, feedback: "Correct. Each pointer crosses each position at most once and no input-sized structure is allocated." },
          { id: "linear-linear", label: "O(n) time and O(n) extra space", correct: false, feedback: "That describes a hash-set approach, not the constant-space solution requested here." },
          { id: "quadratic", label: "O(n²) time and O(1) extra space", correct: false, feedback: "No pair is reconsidered; monotonic elimination avoids the nested-loop cost." },
        ],
      },
      {
        id: "pair-counterexample",
        category: "counterexample",
        prompt: "Which case breaks the rule ‘when the sum is too small, move the right pointer left’?",
        options: [
          { id: "breaks", label: "nums = [1, 4, 6, 9], target = 13", correct: true, feedback: "Correct. The initial sum is 10. Moving right loses 9 and discards the valid pair 4 + 9." },
          { id: "already-match", label: "nums = [1, 4, 6, 9], target = 10", correct: false, feedback: "The first pair already matches, so the incorrect movement rule is never exercised." },
          { id: "no-answer", label: "nums = [1, 2], target = 99", correct: false, feedback: "There is no valid pair to lose, so this does not demonstrate why the movement rule is unsafe." },
        ],
      },
    ],
  },
  {
    id: "unique-window",
    title: "Unique Window Lock",
    signal: "longest contiguous run · repeated symbols · dynamic boundary",
    difficulty: "Interview",
    minutes: 25,
    functionName: "longestUniqueRun",
    signature: "longestUniqueRun(text) → number",
    prompt: "Return the length of the longest contiguous substring containing no repeated character.",
    constraints: [
      "Process the string in O(n) time.",
      "The empty string returns 0.",
      "A repeated character may force the left boundary to jump forward, never backward.",
    ],
    examples: [
      { input: "text = 'abcabcbb'", output: "3", why: "'abc' is a longest valid window" },
      { input: "text = 'bbbbb'", output: "1", why: "Every valid window contains one character" },
    ],
    starterCode: `function longestUniqueRun(text) {
  // Track exactly enough state to restore the no-duplicates invariant.
  return 0;
}`,
    java: {
      methodName: "longestUniqueRun",
      signature: "public int longestUniqueRun(String text)",
      argTypes: ["String"],
      returnType: "int",
      starterCode: `import java.util.*;

public class Solution {
    public int longestUniqueRun(String text) {
        // Track exactly enough state to restore the no-duplicates invariant.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "repeating-cycle", label: "repeating cycle", args: ["abcabcbb"], expected: 3 },
      { id: "same-character", label: "one repeated character", args: ["bbbbb"], expected: 1 },
      { id: "empty-text", label: "empty string", args: [""], expected: 0 },
    ],
    hiddenTests: [
      { id: "boundary-regression", label: "left boundary never regresses", args: ["abba"], expected: 2 },
      { id: "overlapping", label: "overlapping candidate windows", args: ["dvdf"], expected: 3 },
      { id: "late-best", label: "best window appears late", args: ["tmmzuxt"], expected: 5 },
      { id: "single-space", label: "single whitespace character", args: [" "], expected: 1 },
    ],
    hints: [
      "Keep a left and right boundary plus the most recent index of each character.",
      "On a repeat, left becomes max(left, lastSeen[character] + 1). The max prevents a regression.",
      "Update the character's last-seen index and compare right - left + 1 with the best length.",
    ],
    defense: [
      {
        id: "window-invariant",
        category: "invariant",
        prompt: "What must be true after processing each right boundary?",
        options: [
          { id: "unique-current", label: "Every character inside [left, right] is unique", correct: true, feedback: "Correct. The left boundary moves only far enough to restore this property." },
          { id: "longest-current", label: "The current window is always the longest window seen", correct: false, feedback: "The current valid window can be shorter than an earlier best; that is why best is tracked separately." },
          { id: "all-seen", label: "Every previously seen character remains inside the current window", correct: false, feedback: "Characters are deliberately discarded when left advances." },
        ],
      },
      {
        id: "window-complexity",
        category: "complexity",
        prompt: "Why is the algorithm linear even though the left boundary may move many positions?",
        options: [
          { id: "forward-only", label: "Both boundaries move only forward, so each index is entered and discarded at most once", correct: true, feedback: "Correct. Total pointer movement is bounded by a constant multiple of n." },
          { id: "map-constant", label: "Map lookups make every algorithm that uses them O(n)", correct: false, feedback: "Constant-time lookup alone does not prevent nested or repeated traversal." },
          { id: "alphabet", label: "The alphabet is always a fixed size of 26", correct: false, feedback: "The solution should work for general characters; linearity comes from pointer movement." },
        ],
      },
      {
        id: "window-counterexample",
        category: "counterexample",
        prompt: "Which input exposes a bug if left is assigned lastSeen[ch] + 1 without taking max(left, ...)?",
        options: [
          { id: "abba", label: "'abba'", correct: true, feedback: "Correct. The final 'a' was last seen before the current left boundary; assigning directly would move left backward." },
          { id: "abcdef", label: "'abcdef'", correct: false, feedback: "There is no repeat, so the faulty update never runs." },
          { id: "aaaa", label: "'aaaa'", correct: false, feedback: "Every previous occurrence is inside the current window, so max does not change the update." },
        ],
      },
    ],
  },
  {
    id: "shortest-hop",
    title: "Dependency Rescue Route",
    signal: "unweighted graph · minimum hops · cycles and isolation",
    difficulty: "Bar raiser",
    minutes: 30,
    functionName: "shortestHopCount",
    signature: "shortestHopCount(graph, start, end) → number",
    prompt: "Given an unweighted adjacency-list graph, return the minimum number of edges from start to end. Return -1 when end is unreachable.",
    constraints: [
      "The graph may contain cycles and nodes missing from the adjacency map.",
      "When start equals end, return 0.",
      "Visit each reachable node at most once.",
    ],
    examples: [
      { input: "A → [B, C], B → [D], start A, end D", output: "2", why: "A → B → D" },
      { input: "start X, end X", output: "0", why: "No edge is needed" },
    ],
    starterCode: `function shortestHopCount(graph, start, end) {
  // Explore the graph in a way that makes the first arrival minimal.
  return -1;
}`,
    java: {
      methodName: "shortestHopCount",
      signature: "public int shortestHopCount(Map<String, List<String>> graph, String start, String end)",
      argTypes: ["Map<String,List<String>>", "String", "String"],
      returnType: "int",
      starterCode: `import java.util.*;

public class Solution {
    public int shortestHopCount(Map<String, List<String>> graph, String start, String end) {
        // Explore the graph in a way that makes the first arrival minimal.
        return -1;
    }
}
`,
    },
    visibleTests: [
      { id: "two-hops", label: "target two levels away", args: [{ A: ["B", "C"], B: ["D"], C: [], D: [] }, "A", "D"], expected: 2 },
      { id: "unreachable", label: "isolated target", args: [{ A: ["B"], B: [], Z: [] }, "A", "Z"], expected: -1 },
      { id: "same-node", label: "start equals end", args: [{ A: ["B"], B: [] }, "A", "A"], expected: 0 },
    ],
    hiddenTests: [
      { id: "cycle", label: "cycle without repeated work", args: [{ A: ["B"], B: ["C"], C: ["A", "D"], D: [] }, "A", "D"], expected: 3 },
      { id: "direct", label: "direct dependency", args: [{ API: ["DB", "Cache"], DB: [], Cache: [] }, "API", "Cache"], expected: 1 },
      { id: "missing-start", label: "start missing from graph", args: [{ A: [] }, "Missing", "A"], expected: -1 },
      { id: "shorter-branch", label: "first shallow route wins", args: [{ A: ["B", "C"], B: ["E"], E: ["D"], C: ["D"], D: [] }, "A", "D"], expected: 2 },
    ],
    hints: [
      "Use a queue so nodes are processed in distance layers rather than one deep branch at a time.",
      "Store [node, distance] together and mark a node visited when it is enqueued, not later when dequeued.",
      "Treat a missing adjacency list as an empty list so isolated or unknown nodes fail safely.",
    ],
    defense: [
      {
        id: "bfs-invariant",
        category: "invariant",
        prompt: "Why is the first arrival at end guaranteed to use the fewest edges?",
        options: [
          { id: "layers", label: "The queue processes all distance-d nodes before any distance-(d+1) node", correct: true, feedback: "Correct. A shorter undiscovered route cannot exist once the target is reached in level order." },
          { id: "visited", label: "A visited set automatically makes every graph traversal shortest", correct: false, feedback: "Visited prevents repeated work, but DFS with visited still has no shortest-path guarantee." },
          { id: "unweighted", label: "Every route in an unweighted graph has the same number of edges", correct: false, feedback: "Routes can have different lengths; only individual edges have equal weight." },
        ],
      },
      {
        id: "bfs-complexity",
        category: "complexity",
        prompt: "What is the tight graph-traversal complexity?",
        options: [
          { id: "vertices-edges", label: "O(V + E) time and O(V) space", correct: true, feedback: "Correct. Each reachable vertex is queued once and each outgoing edge is inspected once." },
          { id: "vertices-squared", label: "O(V²) time and O(1) space", correct: false, feedback: "That does not describe adjacency-list BFS, which needs a queue and visited set." },
          { id: "edges-log", label: "O(E log V) time and O(V) space", correct: false, feedback: "The logarithmic factor belongs to priority-queue approaches such as Dijkstra, which is unnecessary here." },
        ],
      },
      {
        id: "bfs-counterexample",
        category: "counterexample",
        prompt: "Which graph most clearly breaks ‘use DFS and return the first route found’?",
        options: [
          { id: "deep-first", label: "A connects to B and C; B→E→D while C→D", correct: true, feedback: "Correct. DFS can descend through B and return a three-edge route before examining the two-edge route through C." },
          { id: "single-edge", label: "A connects directly to D and has no other edges", correct: false, feedback: "There is only one route, so traversal order cannot produce a wrong answer." },
          { id: "unreachable-graph", label: "A and D are disconnected", correct: false, feedback: "Both traversals return unreachable; this does not expose the first-route problem." },
        ],
      },
    ],
  },
  {
    id: "pair-sum-map",
    title: "Complement Map Ambush",
    signal: "unsorted input / complement lookup / one pass",
    difficulty: "Warm-up",
    minutes: 20,
    functionName: "findPairIndices",
    signature: "findPairIndices(nums, target) -> [smallerIndex, largerIndex]",
    prompt: "Given an unsorted integer array, return the indices of the two distinct elements that sum to target, in ascending order. Return [-1, -1] when no pair exists.",
    constraints: [
      "The array is not sorted and may contain negative values and duplicates.",
      "An index cannot pair with itself; at most one valid pair exists in every input.",
      "Target O(n) time with a single pass over the array.",
    ],
    examples: [
      { input: "nums = [2, 7, 11, 15], target = 9", output: "[0, 1]", why: "2 + 7 = 9" },
      { input: "nums = [4], target = 8", output: "[-1, -1]", why: "An element cannot pair with itself" },
    ],
    starterCode: `function findPairIndices(nums, target) {
  // Sorting is off the table: the answer is a pair of ORIGINAL indices.
  return [-1, -1];
}`,
    java: {
      methodName: "findPairIndices",
      signature: "public int[] findPairIndices(int[] nums, int target)",
      argTypes: ["int[]", "int"],
      returnType: "int[]",
      starterCode: `import java.util.*;

public class Solution {
    public int[] findPairIndices(int[] nums, int target) {
        // Sorting is off the table: the answer is a pair of ORIGINAL indices.
        return new int[] { -1, -1 };
    }
}
`,
    },
    visibleTests: [
      { id: "classic-pair", label: "pair at the front", args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { id: "later-pair", label: "pair skips the first element", args: [[3, 2, 4], 6], expected: [1, 2] },
      { id: "empty", label: "empty input", args: [[], 5], expected: [-1, -1] },
    ],
    hiddenTests: [
      { id: "duplicate-values", label: "duplicate values form the pair", args: [[3, 3], 6], expected: [0, 1] },
      { id: "single-element", label: "single element cannot pair with itself", args: [[4], 8], expected: [-1, -1] },
      { id: "no-self-match", label: "half of target present only once", args: [[5, 1, 7], 10], expected: [-1, -1] },
      { id: "boundary-pair", label: "first and last elements pair", args: [[10, 3, 20, 30, -5], 5], expected: [0, 4] },
    ],
    hints: [
      "You get one pass. At each value, ask: which number would complete the pair, and have I already seen it?",
      "Keep a map from value to index. Look up target - nums[i] BEFORE inserting nums[i], so an element can never match itself.",
      "When the lookup hits, the stored index is always smaller than i, so [storedIndex, i] is already in ascending order.",
    ],
    defense: [
      {
        id: "map-invariant",
        category: "invariant",
        prompt: "What must be true about the map when index i is processed?",
        options: [
          { id: "seen-before", label: "It contains exactly the values at indices before i, so one lookup of target - nums[i] checks every earlier partner", correct: true, feedback: "Correct. Check-then-insert keeps the map one step behind the scan, which is what makes a single pass complete and prevents self-matching." },
          { id: "whole-array", label: "It already contains every value in the array", correct: false, feedback: "Prefilling the whole map lets a value match its own entry, and it costs a second pass for nothing." },
          { id: "sorted-keys", label: "Its keys are kept in ascending order", correct: false, feedback: "A hash map has no useful ordering, and none is needed; correctness comes from what has been inserted, not how it is arranged." },
        ],
      },
      {
        id: "map-complexity",
        category: "complexity",
        prompt: "How does the one-pass map compare with sorting plus two pointers?",
        options: [
          { id: "linear-space", label: "O(n) time and O(n) space, versus O(n log n) time and destroyed index information for the sorting approach", correct: true, feedback: "Correct. The map buys a faster pass by spending memory, and it is the only one of the two that can still report original indices directly." },
          { id: "both-linear", label: "Both approaches are O(n) time; the map just uses less memory", correct: false, feedback: "Sorting alone costs O(n log n), and the map uses more memory, not less." },
          { id: "map-log", label: "The map approach is O(n log n) because each lookup is logarithmic", correct: false, feedback: "Hash map lookups are expected O(1); logarithmic lookups belong to tree maps, which are not needed here." },
        ],
      },
      {
        id: "map-counterexample",
        category: "counterexample",
        prompt: "Which input breaks a version that fills the whole map first, then scans for target - nums[i]?",
        options: [
          { id: "self-match", label: "nums = [5, 2, 9], target = 10", correct: true, feedback: "Correct. The complement of 5 is 5 itself, and the prefilled map contains it, so the scan reports a pair built from index 0 twice." },
          { id: "dup-safe", label: "nums = [3, 3], target = 6", correct: false, feedback: "The second insert overwrites the index to 1, so the scan at index 0 still reports [0, 1]. Duplicates survive prefilling; self-matching does not." },
          { id: "no-pair", label: "nums = [1, 2, 4], target = 100", correct: false, feedback: "No lookup succeeds in either version, so this input cannot separate them." },
        ],
      },
    ],
  },
  {
    id: "rotated-search",
    title: "Rotated Array Recon",
    signal: "rotated sorted array / one half is always sorted / logarithmic bar",
    difficulty: "Interview",
    minutes: 25,
    functionName: "findInRotated",
    signature: "findInRotated(nums, target) -> index",
    prompt: "A sorted array of distinct integers was rotated at an unknown pivot. Return the index of target, or -1 when it is not present.",
    constraints: [
      "All values are distinct; the array may be empty or not rotated at all.",
      "Run in O(log n) time; a linear scan does not meet the bar.",
      "Return the zero-based index of target, or -1 when it is absent.",
    ],
    examples: [
      { input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 0", output: "4", why: "The sorted right half [0, 1, 2] contains 0" },
      { input: "nums = [1, 2, 3, 4, 5], target = 4", output: "3", why: "A rotation at index 0 leaves the array fully sorted" },
    ],
    starterCode: `function findInRotated(nums, target) {
  // Every split leaves one half sorted. Decide which half to keep from that.
  return -1;
}`,
    java: {
      methodName: "findInRotated",
      signature: "public int findInRotated(int[] nums, int target)",
      argTypes: ["int[]", "int"],
      returnType: "int",
      starterCode: `import java.util.*;

public class Solution {
    public int findInRotated(int[] nums, int target) {
        // Every split leaves one half sorted. Decide which half to keep from that.
        return -1;
    }
}
`,
    },
    visibleTests: [
      { id: "rotated-hit", label: "target in the rotated tail", args: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4 },
      { id: "first-index", label: "target at index 0", args: [[4, 5, 6, 7, 0, 1, 2], 4], expected: 0 },
      { id: "empty", label: "empty input", args: [[], 5], expected: -1 },
    ],
    hiddenTests: [
      { id: "single-element", label: "single element array", args: [[1], 1], expected: 0 },
      { id: "not-rotated", label: "rotation at index 0", args: [[1, 2, 3, 4, 5], 4], expected: 3 },
      { id: "two-rotated", label: "two elements, equal lo and mid", args: [[3, 1], 1], expected: 1 },
      { id: "pivot-target", label: "target is the pivot minimum", args: [[5, 6, 7, 1, 2, 3], 1], expected: 3 },
    ],
    hints: [
      "Plain binary search fails because the whole array is not sorted, but every [lo, mid, hi] split leaves at least one half fully sorted.",
      "Use nums[lo] <= nums[mid] to identify the sorted half. The <= matters when lo and mid are the same index.",
      "If target lies between the sorted half's endpoints, keep that half; otherwise keep the other one. Check nums[mid] == target before either move.",
    ],
    defense: [
      {
        id: "rotated-invariant",
        category: "invariant",
        prompt: "What property of every [lo, mid, hi] split makes binary search survive the rotation?",
        options: [
          { id: "one-sorted-half", label: "At least one of the two halves is fully sorted, and comparing target against that half's endpoints decides which half to discard", correct: true, feedback: "Correct. The rotation point falls in at most one half, so the other half supports an ordinary range check, and one certain half is enough to halve the search space safely." },
          { id: "mid-is-pivot", label: "The midpoint always lands on the rotation pivot", correct: false, feedback: "The pivot can be anywhere; if the midpoint reliably found it there would be nothing left to search for." },
          { id: "both-sorted", label: "Both halves are always sorted on their own", correct: false, feedback: "The half containing the rotation point is not sorted; that is exactly why the endpoint comparison is needed to find the half that is." },
        ],
      },
      {
        id: "rotated-complexity",
        category: "complexity",
        prompt: "What is the complexity, and why does a linear scan fail the bar?",
        options: [
          { id: "log-n", label: "O(log n): every step discards half the range, and the rotation was the only reason to consider O(n) at all", correct: true, feedback: "Correct. The interviewer gave you a sorted-then-rotated array precisely so you would recover the logarithm; scanning throws that structure away." },
          { id: "log-when-lucky", label: "O(log n) only when the array is not rotated, O(n) otherwise", correct: false, feedback: "The sorted-half test works at every step regardless of where the pivot is, so the logarithmic bound holds unconditionally." },
          { id: "nlogn", label: "O(n log n), because you must first locate the pivot", correct: false, feedback: "No pivot pre-pass is needed, and even finding the pivot first would be one O(log n) search followed by another." },
        ],
      },
      {
        id: "rotated-counterexample",
        category: "counterexample",
        prompt: "Which input breaks a version that tests the sorted half with strict nums[lo] < nums[mid]?",
        options: [
          { id: "two-elements", label: "nums = [3, 1], target = 1", correct: true, feedback: "Correct. Here lo and mid are both index 0, so nums[lo] equals nums[mid]. Strict < calls the left half unsorted, the search keeps the wrong side, and 1 is never found." },
          { id: "plain-sorted", label: "nums = [1, 2, 3, 4, 5], target = 4", correct: false, feedback: "With distinct values and lo different from mid, strict and non-strict comparisons agree, so the unrotated case does not expose the bug." },
          { id: "standard-rotated", label: "nums = [4, 5, 6, 7, 0, 1, 2], target = 0", correct: false, feedback: "Every split here has lo strictly below mid with distinct values, so both comparison variants pick the same halves." },
        ],
      },
    ],
  },
  {
    id: "balanced-brackets",
    title: "Bracket Stack Sentinel",
    signal: "matching pairs / last opened closes first / stack discipline",
    difficulty: "Warm-up",
    minutes: 15,
    functionName: "isBalanced",
    signature: "isBalanced(text) -> boolean",
    prompt: "Return true when every bracket in the string is closed by the matching bracket type in the correct order.",
    constraints: [
      "The input contains only the six bracket characters: ( ) [ ] { }.",
      "Every closer must match the most recently opened, still unclosed bracket.",
      "The empty string is balanced. Run in O(n) time.",
    ],
    examples: [
      { input: "text = '([{}])'", output: "true", why: "Every closer matches the most recent unclosed opener" },
      { input: "text = '([)]'", output: "false", why: "')' arrives while '[' is still the newest unclosed opener" },
    ],
    starterCode: `function isBalanced(text) {
  // The most recent unfinished promise is the one that must be kept first.
  return false;
}`,
    java: {
      methodName: "isBalanced",
      signature: "public boolean isBalanced(String text)",
      argTypes: ["String"],
      returnType: "boolean",
      starterCode: `import java.util.*;

public class Solution {
    public boolean isBalanced(String text) {
        // The most recent unfinished promise is the one that must be kept first.
        return false;
    }
}
`,
    },
    visibleTests: [
      { id: "flat-pairs", label: "three flat pairs", args: ["()[]{}"], expected: true },
      { id: "wrong-type", label: "mismatched closer type", args: ["(]"], expected: false },
      { id: "empty", label: "empty string", args: [""], expected: true },
    ],
    hiddenTests: [
      { id: "interleaved", label: "interleaved pairs", args: ["([)]"], expected: false },
      { id: "deep-nesting", label: "all three types nested", args: ["{[()]}"], expected: true },
      { id: "closer-first", label: "closer before any opener", args: [")("], expected: false },
      { id: "lone-opener", label: "single unclosed opener", args: ["("], expected: false },
    ],
    hints: [
      "Read left to right. Each opener is a promise of a closer later, and the newest promise must be kept first.",
      "Push openers on a stack. On a closer, pop and compare: the popped opener must be the matching type.",
      "Two failure modes remain: a closer arriving on an empty stack, and openers left on the stack at the end. Return false for both.",
    ],
    defense: [
      {
        id: "bracket-invariant",
        category: "invariant",
        prompt: "What does the stack top represent at every point in the scan?",
        options: [
          { id: "newest-unclosed", label: "The most recently opened bracket that has not been closed yet, so a valid closer only ever needs to match the top", correct: true, feedback: "Correct. Bracket nesting is last-opened-first-closed, so a single top comparison replaces any search through earlier openers." },
          { id: "all-brackets", label: "The stack holds every bracket seen so far, open or closed", correct: false, feedback: "Closed pairs are popped off. Keeping closed brackets around would make the top meaningless as a matching target." },
          { id: "first-opener", label: "The stack top is always the first opener in the string", correct: false, feedback: "The first opener sits at the bottom. The whole point of the stack is that the newest opener, not the oldest, is due next." },
        ],
      },
      {
        id: "bracket-complexity",
        category: "complexity",
        prompt: "What is the tight complexity of the stack check?",
        options: [
          { id: "linear-linear", label: "O(n) time and O(n) space, because a string of all openers stacks every character", correct: true, feedback: "Correct. Each character is pushed and popped at most once, and the worst-case input like '(((((' keeps them all on the stack at once." },
          { id: "constant-space", label: "O(n) time and O(1) space, because only three bracket types exist", correct: false, feedback: "The stack must remember nesting depth, not just types. '([' and '[(' need different futures, and depth can grow with n." },
          { id: "quadratic", label: "O(n^2) time, because each closer must scan back for its opener", correct: false, feedback: "No scan happens. The invariant puts the only candidate opener on the top of the stack, one comparison per closer." },
        ],
      },
      {
        id: "bracket-counterexample",
        category: "counterexample",
        prompt: "Which input passes a checker that only counts openers and closers of each type?",
        options: [
          { id: "interleave", label: "'([)]'", correct: true, feedback: "Correct. Counts match perfectly for both types, but the order is wrong. The same hole lets ')(' through, which is also why popping an empty stack must fail instead of crash." },
          { id: "lone", label: "'((('", correct: false, feedback: "Three openers and zero closers: even a counting checker rejects this one, so it proves nothing about ordering." },
          { id: "mismatch", label: "'(]'", correct: false, feedback: "The counts disagree for each type, one '(' without ')' and one ']' without '[', so counting already catches it." },
        ],
      },
    ],
  },
];

export const CODING_COMBAT_MISSIONS: CodingCombatMission[] = [
  ...CODING_COMBAT_CORE_MISSIONS,
  ...CODING_COMBAT_WAVE_ONE_MISSIONS,
  ...CODING_COMBAT_WAVE_TWO_MISSIONS,
  SLIDING_WINDOW_WORLD_MISSION,
];

export function getCodingCombatMission(id: string): CodingCombatMission | undefined {
  return CODING_COMBAT_MISSIONS.find((mission) => mission.id === id);
}

export function getCodingCombatMissionRoute(id: string): string {
  const mission = getCodingCombatMission(id);
  return mission?.worldRoute ?? `/arena/coding-lab?mission=${encodeURIComponent(id)}`;
}
