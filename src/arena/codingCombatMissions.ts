import type { CodingCombatMissionId } from "./types";

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
  functionName: string;
  signature: string;
  prompt: string;
  constraints: string[];
  examples: { input: string; output: string; why: string }[];
  starterCode: string;
  visibleTests: CodingCombatTestCase[];
  hiddenTests: CodingCombatTestCase[];
  hints: string[];
  defense: CodingCombatDefenseQuestion[];
}

export const CODING_COMBAT_MISSIONS: CodingCombatMission[] = [
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
      "The graph may contain cycles and nodes missing from the adjacency object.",
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
];

export function getCodingCombatMission(id: string): CodingCombatMission | undefined {
  return CODING_COMBAT_MISSIONS.find((mission) => mission.id === id);
}
