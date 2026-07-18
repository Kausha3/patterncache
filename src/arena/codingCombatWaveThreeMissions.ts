import type { CodingCombatDefenseQuestion, CodingCombatMission } from "./codingCombatMissions";

interface DefenseCopy {
  invariant: string;
  invariantAnswer: string;
  complexity: string;
  complexityAnswer: string;
  trap: string;
  trapAnswer: string;
}

function defense(id: string, copy: DefenseCopy): CodingCombatDefenseQuestion[] {
  const question = (
    suffix: string,
    category: CodingCombatDefenseQuestion["category"],
    prompt: string,
    answer: string,
  ): CodingCombatDefenseQuestion => ({
    id: `${id}-${suffix}`,
    category,
    prompt,
    options: [
      { id: "evidence", label: answer, correct: true, feedback: "Correct. That is the fact your implementation preserves, not just a memorized pattern name." },
      { id: "surface", label: "It works because every input follows the sample's shape", correct: false, feedback: "Samples are evidence, not a proof. Hidden cases deliberately change that shape." },
      { id: "wish", label: "The data structure automatically guarantees the final answer", correct: false, feedback: "A data structure helps only when its contents have a precise meaning that your code preserves." },
    ],
  });
  return [
    question("invariant", "invariant", copy.invariant, copy.invariantAnswer),
    question("complexity", "complexity", copy.complexity, copy.complexityAnswer),
    question("counterexample", "counterexample", copy.trap, copy.trapAnswer),
  ];
}

export const CODING_COMBAT_WAVE_THREE_MISSIONS: CodingCombatMission[] = [
  {
    id: "product-except-self",
    title: "Product Relay Without Division",
    signal: "array · prefix and suffix products · zero-safe",
    difficulty: "Interview",
    minutes: 25,
    functionName: "productExceptSelf",
    signature: "productExceptSelf(nums) → number[]",
    prompt: "Return an array where answer[i] is the product of every input value except nums[i], without division.",
    constraints: ["Use O(n) time.", "Do not use division.", "The output array does not count as extra space."],
    examples: [
      { input: "[1, 2, 3, 4]", output: "[24, 12, 8, 6]", why: "Each slot combines the product to its left and right" },
      { input: "[-1, 1, 0, -3, 3]", output: "[0, 0, 9, 0, 0]", why: "The construction handles zero without special division rules" },
    ],
    starterCode: `function productExceptSelf(nums) { return []; }`,
    java: {
      methodName: "productExceptSelf", signature: "public int[] productExceptSelf(int[] nums)", argTypes: ["int[]"], returnType: "int[]",
      starterCode: `public class Solution {
    public int[] productExceptSelf(int[] nums) {
        // First carry products from the left; then fold in products from the right.
        return new int[0];
    }
}
`,
    },
    visibleTests: [
      { id: "ordinary", label: "four positive values", args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { id: "one-zero", label: "one zero and signed values", args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
      { id: "singleton", label: "single value", args: [[7]], expected: [1] },
    ],
    hiddenTests: [
      { id: "two-zeroes", label: "two zeroes", args: [[0, 4, 0]], expected: [0, 0, 0] },
      { id: "all-negative", label: "three negative values", args: [[-2, -3, -4]], expected: [12, 8, 6] },
      { id: "zero-first", label: "zero at a boundary", args: [[0, 2, 5]], expected: [10, 0, 0] },
      { id: "two-values", label: "minimum pair", args: [[9, -2]], expected: [-2, 9] },
    ],
    hints: ["At index i, the answer is leftProduct(i) × rightProduct(i).", "Write all left products into the answer in one forward pass.", "Walk backward with one running suffix product and multiply it into each answer slot."],
    defense: defense("product", {
      invariant: "What does answer[i] contain after the forward pass?", invariantAnswer: "The product of exactly the values strictly left of i",
      complexity: "Why is the solution O(n) time and O(1) extra space?", complexityAnswer: "Two linear passes use the output plus one running suffix value",
      trap: "What input exposes a division-based solution?", trapAnswer: "Any input containing zero, especially two zeroes",
    }),
  },
  {
    id: "subarray-sum-k",
    title: "Prefix Echo Counter",
    signal: "contiguous subarray · signed values · prefix-frequency map",
    difficulty: "Interview",
    minutes: 25,
    functionName: "subarraySum",
    signature: "subarraySum(nums, target) → number",
    prompt: "Count contiguous, non-empty subarrays whose values sum exactly to target.",
    constraints: ["Values may be negative or zero.", "Count overlapping subarrays.", "Use O(n) expected time."],
    examples: [{ input: "nums = [1, 1, 1], target = 2", output: "2", why: "Both adjacent pairs qualify" }],
    starterCode: `function subarraySum(nums, target) { return 0; }`,
    java: {
      methodName: "subarraySum", signature: "public int subarraySum(int[] nums, int target)", argTypes: ["int[]", "int"], returnType: "int",
      starterCode: `import java.util.*;

public class Solution {
    public int subarraySum(int[] nums, int target) {
        // Count how many earlier prefixes would make the current difference target.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "overlap", label: "overlapping pairs", args: [[1, 1, 1], 2], expected: 2 },
      { id: "two-shapes", label: "single value and longer range", args: [[1, 2, 3], 3], expected: 2 },
      { id: "empty", label: "empty input", args: [[], 0], expected: 0 },
    ],
    hiddenTests: [
      { id: "all-zero", label: "six zero-sum ranges", args: [[0, 0, 0], 0], expected: 6 },
      { id: "negative", label: "negative values invalidate sliding window", args: [[1, -1, 0], 0], expected: 3 },
      { id: "repeated-prefix", label: "same prefix appears repeatedly", args: [[3, 4, -7, 1, 3, 3, 1, -4], 7], expected: 4 },
      { id: "none", label: "no matching range", args: [[2, 4, 6], 5], expected: 0 },
    ],
    hints: ["A subarray from j to i sums to target when prefix[i] - prefix[j] = target.", "Before reading values, record one occurrence of prefix sum 0.", "At each step add frequency[prefix - target], then record the current prefix."],
    defense: defense("subarray", {
      invariant: "What does the frequency map mean at index i?", invariantAnswer: "It counts every prefix sum seen strictly before the next lookup",
      complexity: "What is the expected complexity?", complexityAnswer: "O(n) time and O(n) space for distinct prefix sums",
      trap: "Why is a positive-number sliding window unsafe here?", trapAnswer: "Negative values can decrease a sum, so shrinking and growing are not monotonic",
    }),
  },
  {
    id: "min-stack",
    title: "Minimum Stack Flight Recorder",
    signal: "stack · constant-time minimum · duplicate minima",
    difficulty: "Interview",
    minutes: 25,
    functionName: "minStackTrace",
    signature: "minStackTrace(operations, values) → number[]",
    prompt: "Simulate a MinStack. Return outputs from top and min operations, in order. Push uses the value at the same index; other values are ignored.",
    constraints: ["push, pop, top, and min must each be O(1).", "Operations are valid.", "Duplicate minimum values must survive one pop."],
    examples: [{ input: "push -2, push 0, push -3, min, pop, top, min", output: "[-3, 0, -2]", why: "The historical minimum is restored after pop" }],
    starterCode: `function minStackTrace(operations, values) { return []; }`,
    java: {
      methodName: "minStackTrace", signature: "public int[] minStackTrace(String[] operations, int[] values)", argTypes: ["String[]", "int[]"], returnType: "int[]",
      starterCode: `import java.util.*;

public class Solution {
    public int[] minStackTrace(String[] operations, int[] values) {
        // Preserve enough history to restore the minimum after every pop.
        return new int[0];
    }
}
`,
    },
    visibleTests: [
      { id: "restore", label: "restore earlier minimum", args: [["push", "push", "push", "min", "pop", "top", "min"], [-2, 0, -3, 0, 0, 0, 0]], expected: [-3, 0, -2] },
      { id: "duplicate-min", label: "duplicate minimum survives pop", args: [["push", "push", "min", "pop", "min"], [2, 2, 0, 0, 0]], expected: [2, 2] },
      { id: "one", label: "one value", args: [["push", "top", "min"], [8, 0, 0]], expected: [8, 8] },
    ],
    hiddenTests: [
      { id: "rising", label: "rising values", args: [["push", "push", "push", "min", "pop", "min"], [1, 2, 3, 0, 0, 0]], expected: [1, 1] },
      { id: "falling", label: "minimum changes every pop", args: [["push", "push", "push", "min", "pop", "min", "pop", "min"], [3, 2, 1, 0, 0, 0, 0, 0]], expected: [1, 2, 3] },
      { id: "negative-duplicates", label: "negative duplicate minima", args: [["push", "push", "push", "pop", "min"], [-5, -5, 4, 0, 0]], expected: [-5] },
      { id: "interleaved", label: "interleaved reads", args: [["push", "min", "push", "top", "min", "pop", "top"], [7, 0, -1, 0, 0, 0, 0]], expected: [7, -1, -1, 7] },
    ],
    hints: ["A single currentMin value forgets what should return after pop.", "Keep a second stack of minima, or store the minimum-so-far beside every pushed value.", "When duplicate minima are pushed, preserve both copies or use counts."],
    defense: defense("minstack", {
      invariant: "What must the auxiliary history preserve?", invariantAnswer: "The minimum for every stack depth that may be restored later",
      complexity: "What are the required operation costs?", complexityAnswer: "O(1) time for every operation and O(n) total space",
      trap: "Which case breaks a strict-less-than minima stack?", trapAnswer: "Pushing the same minimum twice and popping once",
    }),
  },
  {
    id: "top-k-frequent",
    title: "Frequency Podium",
    signal: "frequency map · top k · heap or buckets",
    difficulty: "Interview",
    minutes: 25,
    functionName: "topKFrequent",
    signature: "topKFrequent(nums, k) → number[]",
    prompt: "Return the k values with the highest frequencies. Every test has a unique answer set; output order does not matter.",
    constraints: ["Use better than O(n log n) sorting of all input occurrences.", "1 ≤ k ≤ number of distinct values.", "Values may be negative."],
    examples: [{ input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2] in any order", why: "1 and 2 have the two largest counts" }],
    starterCode: `function topKFrequent(nums, k) { return []; }`,
    java: {
      methodName: "topKFrequent", signature: "public int[] topKFrequent(int[] nums, int k)", argTypes: ["int[]", "int"], returnType: "int[]", comparison: "unordered-elements",
      starterCode: `import java.util.*;

public class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        // Count first, then rank distinct values rather than input positions.
        return new int[0];
    }
}
`,
    },
    visibleTests: [
      { id: "ordinary", label: "two winners", args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
      { id: "singleton", label: "one distinct value", args: [[7, 7], 1], expected: [7] },
      { id: "negative", label: "negative winner", args: [[-1, -1, -1, 2, 2, 3], 1], expected: [-1] },
    ],
    hiddenTests: [
      { id: "three-winners", label: "three frequency tiers", args: [[4, 4, 4, 4, 2, 2, 2, 9, 9, 7], 3], expected: [2, 4, 9] },
      { id: "all-distinct", label: "request every distinct value", args: [[5, -2, 8], 3], expected: [-2, 5, 8] },
      { id: "zero", label: "zero is most frequent", args: [[0, 1, 0, 2, 0, 1], 2], expected: [0, 1] },
      { id: "boundary-k", label: "k equals one", args: [[6, 6, 3, 3, 3, 8], 1], expected: [3] },
    ],
    hints: ["Build value → count before choosing winners.", "A size-k min-heap costs O(m log k), where m is the number of distinct values.", "Bucket index = frequency gives O(n) time because no value can appear more than n times."],
    defense: defense("topk", {
      invariant: "What does a size-k min-heap preserve?", invariantAnswer: "The k strongest frequencies seen so far, with the weakest winner at the root",
      complexity: "What does bucket ranking cost?", complexityAnswer: "O(n) time and O(n) space across counting and buckets",
      trap: "What mistake confuses occurrences with candidates?", trapAnswer: "Pushing every input occurrence instead of each distinct value once",
    }),
  },
  {
    id: "task-scheduler",
    title: "Cooldown Flight Control",
    signal: "frequency · cooldown gaps · idle slots",
    difficulty: "Interview",
    minutes: 30,
    functionName: "leastInterval",
    signature: "leastInterval(tasks, cooldown) → number",
    prompt: "Return the minimum time units needed to execute every task when equal letters must be separated by at least cooldown units.",
    constraints: ["Tasks are uppercase letters encoded as one string.", "The CPU may idle.", "cooldown may be zero."],
    examples: [{ input: "tasks = 'AAABBB', cooldown = 2", output: "8", why: "A B idle A B idle A B" }],
    starterCode: `function leastInterval(tasks, cooldown) { return tasks.length; }`,
    java: {
      methodName: "leastInterval", signature: "public int leastInterval(String tasks, int cooldown)", argTypes: ["String", "int"], returnType: "int",
      starterCode: `public class Solution {
    public int leastInterval(String tasks, int cooldown) {
        // Let the most frequent task define the frame, then account for ties.
        return tasks.length();
    }
}
`,
    },
    visibleTests: [
      { id: "idle", label: "idle time required", args: ["AAABBB", 2], expected: 8 },
      { id: "zero-cooldown", label: "no cooldown", args: ["AAABBB", 0], expected: 6 },
      { id: "enough-variety", label: "other work fills every gap", args: ["AAABBBCC", 2], expected: 8 },
    ],
    hiddenTests: [
      { id: "one-kind", label: "one task kind", args: ["AAAA", 3], expected: 13 },
      { id: "many-tied", label: "many tasks tie for maximum", args: ["AABBCC", 2], expected: 6 },
      { id: "large-gap", label: "large cooldown", args: ["AAABC", 4], expected: 11 },
      { id: "single", label: "single task", args: ["Z", 9], expected: 1 },
    ],
    hints: ["Draw the most frequent task first; its copies create fixed gaps.", "If max frequency is f and t task types share that frequency, the frame length is (f - 1) × (cooldown + 1) + t.", "The answer cannot be less than tasks.length because real work may already fill every idle slot."],
    defense: defense("scheduler", {
      invariant: "What determines the minimum frame?", invariantAnswer: "The most frequent task copies create gaps, and every task tied at that frequency occupies the frame's tail",
      complexity: "What is the complexity with an uppercase alphabet?", complexityAnswer: "O(n) time and O(1) auxiliary space",
      trap: "Why must the formula count all maximum-frequency task types?", trapAnswer: "AABBCC with cooldown 2 needs all three tasks in the final frame row",
    }),
  },
  {
    id: "lru-cache",
    title: "LRU Eviction Recorder",
    signal: "hash map · recency order · O(1) eviction",
    difficulty: "Bar raiser",
    minutes: 35,
    functionName: "lruTrace",
    signature: "lruTrace(capacity, operations, args) → number[]",
    prompt: "Simulate an LRU cache and return each get result. A put row is [key,value]; a get row is [key]. Missing keys return -1.",
    constraints: ["get and put must be O(1).", "Updating an existing key refreshes its recency.", "A successful get also refreshes recency."],
    examples: [{ input: "capacity 2; put 1, put 2, get 1, put 3, get 2", output: "[1,-1]", why: "Reading key 1 makes key 2 the least recent" }],
    starterCode: `function lruTrace(capacity, operations, args) { return []; }`,
    java: {
      methodName: "lruTrace", signature: "public int[] lruTrace(int capacity, String[] operations, int[][] args)", argTypes: ["int", "String[]", "int[][]"], returnType: "int[]",
      starterCode: `import java.util.*;

public class Solution {
    public int[] lruTrace(int capacity, String[] operations, int[][] args) {
        // Combine direct key lookup with an order that can move and evict in O(1).
        return new int[0];
    }
}
`,
    },
    visibleTests: [
      { id: "read-refresh", label: "get refreshes recency", args: [2, ["put", "put", "get", "put", "get", "get"], [[1, 1], [2, 2], [1], [3, 3], [2], [3]]], expected: [1, -1, 3] },
      { id: "update", label: "updating key refreshes recency", args: [2, ["put", "put", "put", "put", "get", "get"], [[1, 1], [2, 2], [1, 10], [3, 3], [1], [2]]], expected: [10, -1] },
      { id: "capacity-one", label: "capacity one", args: [1, ["put", "put", "get", "get"], [[4, 4], [5, 5], [4], [5]]], expected: [-1, 5] },
    ],
    hiddenTests: [
      { id: "miss-no-refresh", label: "miss changes nothing", args: [2, ["put", "put", "get", "put", "get", "get"], [[1, 1], [2, 2], [9], [3, 3], [1], [2]]], expected: [-1, -1, 2] },
      { id: "read-chain", label: "several reads reorder eviction", args: [3, ["put", "put", "put", "get", "get", "put", "get", "get"], [[1, 1], [2, 2], [3, 3], [1], [2], [4, 4], [3], [1]]], expected: [1, 2, -1, 1] },
      { id: "negative", label: "negative keys and values", args: [2, ["put", "get", "put", "get"], [[-1, -7], [-1], [2, -3], [2]]], expected: [-7, -3] },
      { id: "repeat-miss", label: "repeated missing read", args: [1, ["get", "get"], [[1], [1]]], expected: [-1, -1] },
    ],
    hints: ["A map gives direct lookup but cannot identify the least-recent key by itself.", "A doubly linked list can remove any known node, append it as most recent, and evict the oldest in O(1).", "Java's access-order LinkedHashMap can express the same invariant, but be ready to explain the map + list design in an interview."],
    defense: defense("lru", {
      invariant: "What does the recency order mean?", invariantAnswer: "The front is the least recently used live key and the back is the most recent",
      complexity: "Why combine a map with a doubly linked list?", complexityAnswer: "The map finds nodes in O(1), while the list moves and evicts known nodes in O(1)",
      trap: "Which operation is often forgotten when updating recency?", trapAnswer: "A successful get and a put that updates an existing key both refresh the key",
    }),
  },
  {
    id: "generate-parentheses",
    title: "Balanced Sequence Foundry",
    signal: "backtracking · legal prefixes · generate all",
    difficulty: "Interview",
    minutes: 25,
    functionName: "generateParenthesis",
    signature: "generateParenthesis(n) → string[]",
    prompt: "Generate every well-formed sequence containing n pairs of parentheses. Output order does not matter.",
    constraints: ["Never generate an invalid prefix.", "Return one empty string for n = 0.", "Do not return duplicates."],
    examples: [{ input: "n = 3", output: "['((()))','(()())','(())()','()(())','()()()']", why: "These are all five legal structures" }],
    starterCode: `function generateParenthesis(n) { return []; }`,
    java: {
      methodName: "generateParenthesis", signature: "public String[] generateParenthesis(int n)", argTypes: ["int"], returnType: "String[]", comparison: "unordered-strings",
      starterCode: `import java.util.*;

public class Solution {
    public String[] generateParenthesis(int n) {
        // Extend only prefixes that could still become a valid sequence.
        return new String[0];
    }
}
`,
    },
    visibleTests: [
      { id: "three", label: "three pairs", args: [3], expected: ["((()))", "(()())", "(())()", "()(())", "()()()"] },
      { id: "one", label: "one pair", args: [1], expected: ["()"] },
      { id: "zero", label: "zero pairs", args: [0], expected: [""] },
    ],
    hiddenTests: [
      { id: "two", label: "two pairs", args: [2], expected: ["(())", "()()"] },
      { id: "four", label: "four pairs", args: [4], expected: ["(((())))", "((()()))", "((())())", "((()))()", "(()(()))", "(()()())", "(()())()", "(())(())", "(())()()", "()((()))", "()(()())", "()(())()", "()()(())", "()()()()"] },
      { id: "count-three", label: "three pairs has exactly five", args: [3], expected: ["((()))", "(()())", "(())()", "()(())", "()()()"] },
      { id: "repeat-one", label: "no duplicate base result", args: [1], expected: ["()"] },
    ],
    hints: ["Track how many open and close parentheses have been placed.", "You may add '(' while open < n.", "You may add ')' only while close < open; that rule prevents every invalid prefix."],
    defense: defense("parentheses", {
      invariant: "What makes a partial sequence legal?", invariantAnswer: "At every prefix, closes never exceed opens, and opens never exceed n",
      complexity: "Why is the runtime output-sensitive?", complexityAnswer: "The algorithm must materialize every Catalan-number result, each of length 2n",
      trap: "What is wasteful about generating all 2^(2n) strings first?", trapAnswer: "Most branches become invalid early and should be pruned before completion",
    }),
  },
  {
    id: "word-search",
    title: "Grid Word Expedition",
    signal: "matrix · DFS backtracking · temporary visited state",
    difficulty: "Interview",
    minutes: 30,
    functionName: "wordSearch",
    signature: "wordSearch(boardRows, word) → boolean",
    prompt: "Return true when the word can be formed by horizontally or vertically adjacent cells without reusing a cell. Each string is one board row.",
    constraints: ["Cells may not be reused in one path.", "The board is rectangular.", "Try every cell as a possible start."],
    examples: [{ input: "['ABCE','SFCS','ADEE'], word = 'ABCCED'", output: "true", why: "One adjacent path spells the word without reusing a cell" }],
    starterCode: `function wordSearch(boardRows, word) { return false; }`,
    java: {
      methodName: "wordSearch", signature: "public boolean wordSearch(String[] boardRows, String word)", argTypes: ["String[]", "String"], returnType: "boolean",
      starterCode: `public class Solution {
    public boolean wordSearch(String[] boardRows, String word) {
        // Choose a cell, mark it for this path, explore, then restore it.
        return false;
    }
}
`,
    },
    visibleTests: [
      { id: "turning-path", label: "path turns through rows", args: [["ABCE", "SFCS", "ADEE"], "ABCCED"], expected: true },
      { id: "short", label: "short adjacent word", args: [["ABCE", "SFCS", "ADEE"], "SEE"], expected: true },
      { id: "reuse", label: "would require reusing a cell", args: [["ABCE", "SFCS", "ADEE"], "ABCB"], expected: false },
    ],
    hiddenTests: [
      { id: "single-yes", label: "single matching cell", args: [["A"], "A"], expected: true },
      { id: "single-no", label: "single nonmatching cell", args: [["A"], "B"], expected: false },
      { id: "restore", label: "failed branch must restore cells", args: [["CAA", "AAA", "BCD"], "AAB"], expected: true },
      { id: "longer-than-board", label: "word longer than cell count", args: [["AB", "CD"], "ABCDA"], expected: false },
    ],
    hints: ["Start DFS only where the current cell matches word[index].", "Mark the cell unavailable before exploring four neighbors.", "Restore the cell when returning so another starting path can use it."],
    defense: defense("wordsearch", {
      invariant: "What does visited mean during one DFS call?", invariantAnswer: "Exactly the cells already used by the current candidate path",
      complexity: "What is the worst-case search cost for word length L?", complexityAnswer: "O(rows × cols × 3^L) after the first step, with O(L) recursion space",
      trap: "Why must a failed branch restore its marked cell?", trapAnswer: "The same cell may be valid in a different path starting elsewhere",
    }),
  },
  {
    id: "house-robber-ii",
    title: "Circular Vault Route",
    signal: "dynamic programming · circular adjacency · two linear cases",
    difficulty: "Interview",
    minutes: 25,
    functionName: "robCircular",
    signature: "robCircular(nums) → number",
    prompt: "Return the maximum amount from circularly arranged houses when adjacent houses cannot both be selected.",
    constraints: ["The first and last houses are adjacent.", "Amounts are non-negative.", "Use O(1) extra space."],
    examples: [{ input: "[2, 3, 2]", output: "3", why: "The first and last cannot both be taken" }],
    starterCode: `function robCircular(nums) { return 0; }`,
    java: {
      methodName: "robCircular", signature: "public int robCircular(int[] nums)", argTypes: ["int[]"], returnType: "int",
      starterCode: `public class Solution {
    public int robCircular(int[] nums) {
        // Break the circle into two linear ranges that cannot choose both endpoints.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "three", label: "three-house circle", args: [[2, 3, 2]], expected: 3 },
      { id: "middle-pair", label: "best excludes both ends", args: [[1, 2, 3, 1]], expected: 4 },
      { id: "singleton", label: "one house", args: [[9]], expected: 9 },
    ],
    hiddenTests: [
      { id: "two", label: "two adjacent houses", args: [[2, 8]], expected: 8 },
      { id: "empty", label: "no houses", args: [[]], expected: 0 },
      { id: "tempting-ends", label: "both ends are tempting but incompatible", args: [[10, 1, 1, 10]], expected: 11 },
      { id: "long", label: "several alternating choices", args: [[4, 1, 2, 7, 5, 3, 1]], expected: 14 },
    ],
    hints: ["Any valid solution excludes the first house or excludes the last house.", "Solve the linear range [0, n-2] and the linear range [1, n-1].", "For a linear range, carry only the best value before and including each house."],
    defense: defense("robber", {
      invariant: "Why do two linear cases cover every valid circular solution?", invariantAnswer: "No valid solution may contain both endpoints, so it must exclude at least one of them",
      complexity: "What complexity do the two passes achieve?", complexityAnswer: "O(n) time and O(1) extra space",
      trap: "Which input breaks the ordinary linear House Robber algorithm?", trapAnswer: "[2, 3, 2], because a linear solver may treat both endpoints as compatible",
    }),
  },
  {
    id: "coin-change",
    title: "Minimum Coin Supply Line",
    signal: "unbounded choices · minimum count · unreachable states",
    difficulty: "Interview",
    minutes: 25,
    functionName: "coinChange",
    signature: "coinChange(coins, amount) → number",
    prompt: "Return the fewest coins needed to make amount, using each denomination any number of times. Return -1 when impossible.",
    constraints: ["amount is non-negative.", "Coin denominations are positive.", "Greedy choice is not generally correct."],
    examples: [{ input: "coins = [1,2,5], amount = 11", output: "3", why: "5 + 5 + 1" }],
    starterCode: `function coinChange(coins, amount) { return -1; }`,
    java: {
      methodName: "coinChange", signature: "public int coinChange(int[] coins, int amount)", argTypes: ["int[]", "int"], returnType: "int",
      starterCode: `import java.util.*;

public class Solution {
    public int coinChange(int[] coins, int amount) {
        // Let dp[x] mean the fewest coins proven to build exactly x.
        return -1;
    }
}
`,
    },
    visibleTests: [
      { id: "ordinary", label: "three-coin answer", args: [[1, 2, 5], 11], expected: 3 },
      { id: "impossible", label: "unreachable amount", args: [[2], 3], expected: -1 },
      { id: "zero", label: "zero amount", args: [[2, 5], 0], expected: 0 },
    ],
    hiddenTests: [
      { id: "greedy-trap", label: "greedy largest-first fails", args: [[1, 3, 4], 6], expected: 2 },
      { id: "single", label: "exact single denomination", args: [[7], 14], expected: 2 },
      { id: "large", label: "larger reachable state", args: [[2, 5, 10, 1], 27], expected: 4 },
      { id: "gcd-gap", label: "denominations cannot form target", args: [[4, 6], 7], expected: -1 },
    ],
    hints: ["Create dp[0] = 0 and mark every other amount unreachable initially.", "For each amount x, try every coin c where c ≤ x and dp[x-c] is reachable.", "Use amount + 1 as a safe sentinel; if it remains, return -1."],
    defense: defense("coin", {
      invariant: "What does dp[x] mean after it is computed?", invariantAnswer: "The minimum number of coins among every valid final-coin choice for exact amount x",
      complexity: "What is the bottom-up complexity?", complexityAnswer: "O(amount × number of coin types) time and O(amount) space",
      trap: "Which case disproves largest-coin-first greedy?", trapAnswer: "coins [1,3,4], amount 6: greedy uses three coins but 3+3 uses two",
    }),
  },
  {
    id: "maximum-subarray",
    title: "Maximum Segment Pulse",
    signal: "contiguous range · running optimum · all-negative input",
    difficulty: "Warm-up",
    minutes: 20,
    functionName: "maxSubArray",
    signature: "maxSubArray(nums) → number",
    prompt: "Return the largest sum of any non-empty contiguous subarray.",
    constraints: ["The input is non-empty.", "Values may all be negative.", "Use O(n) time and O(1) extra space."],
    examples: [{ input: "[-2,1,-3,4,-1,2,1,-5,4]", output: "6", why: "[4,-1,2,1] has the largest sum" }],
    starterCode: `function maxSubArray(nums) { return 0; }`,
    java: {
      methodName: "maxSubArray", signature: "public int maxSubArray(int[] nums)", argTypes: ["int[]"], returnType: "int",
      starterCode: `public class Solution {
    public int maxSubArray(int[] nums) {
        // At each value, choose between extending the old segment and starting fresh.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "mixed", label: "best segment in the middle", args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { id: "one", label: "single value", args: [[1]], expected: 1 },
      { id: "positive", label: "all positive", args: [[5, 4, -1, 7, 8]], expected: 23 },
    ],
    hiddenTests: [
      { id: "all-negative", label: "all negative values", args: [[-8, -3, -6, -2, -5, -4]], expected: -2 },
      { id: "zero", label: "zero beats negative values", args: [[-3, 0, -2]], expected: 0 },
      { id: "restart", label: "must discard harmful prefix", args: [[10, -20, 7, 8]], expected: 15 },
      { id: "alternating", label: "best includes temporary dip", args: [[2, -1, 2, 3, 4, -5]], expected: 10 },
    ],
    hints: ["Let current mean the best non-empty subarray ending exactly at this index.", "For each value, current = max(value, current + value).", "Initialize current and best from nums[0], not zero, so all-negative arrays remain correct."],
    defense: defense("maxsub", {
      invariant: "What does current represent after processing nums[i]?", invariantAnswer: "The maximum sum among non-empty subarrays ending exactly at i",
      complexity: "What complexity does the running-state solution use?", complexityAnswer: "O(n) time and O(1) extra space",
      trap: "Why is initializing best to zero wrong?", trapAnswer: "It invents an empty subarray and returns 0 for an all-negative input",
    }),
  },
];

export const CODING_COMBAT_WAVE_THREE_JS_REFERENCES: Record<string, string> = {
  "product-except-self": `function productExceptSelf(nums) { const out = new Array(nums.length).fill(1); let product = 1; for (let i = 0; i < nums.length; i++) { out[i] = product; product *= nums[i]; } product = 1; for (let i = nums.length - 1; i >= 0; i--) { out[i] *= product; product *= nums[i]; } return out; }`,
  "subarray-sum-k": `function subarraySum(nums, target) { const counts = new Map([[0, 1]]); let prefix = 0, answer = 0; for (const value of nums) { prefix += value; answer += counts.get(prefix - target) || 0; counts.set(prefix, (counts.get(prefix) || 0) + 1); } return answer; }`,
  "min-stack": `function minStackTrace(operations, values) { const stack = [], mins = [], out = []; operations.forEach((op, i) => { if (op === "push") { stack.push(values[i]); mins.push(mins.length ? Math.min(mins[mins.length - 1], values[i]) : values[i]); } else if (op === "pop") { stack.pop(); mins.pop(); } else if (op === "top") out.push(stack[stack.length - 1]); else out.push(mins[mins.length - 1]); }); return out; }`,
  "top-k-frequent": `function topKFrequent(nums, k) { const counts = new Map(); for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1); return [...counts].sort((a,b) => b[1] - a[1] || a[0] - b[0]).slice(0,k).map(([n]) => n).sort((a,b) => a-b); }`,
  "task-scheduler": `function leastInterval(tasks, cooldown) { const counts = new Map(); for (const task of tasks) counts.set(task, (counts.get(task) || 0) + 1); const max = Math.max(0, ...counts.values()); let ties = 0; for (const count of counts.values()) if (count === max) ties++; return Math.max(tasks.length, (max - 1) * (cooldown + 1) + ties); }`,
  "lru-cache": `function lruTrace(capacity, operations, args) { const cache = new Map(), out = []; operations.forEach((op,i) => { const key = args[i][0]; if (op === "get") { if (!cache.has(key)) out.push(-1); else { const value = cache.get(key); cache.delete(key); cache.set(key,value); out.push(value); } } else { if (cache.has(key)) cache.delete(key); cache.set(key,args[i][1]); if (cache.size > capacity) cache.delete(cache.keys().next().value); } }); return out; }`,
  "generate-parentheses": `function generateParenthesis(n) { const out = []; const visit = (text, open, close) => { if (text.length === 2*n) { out.push(text); return; } if (open < n) visit(text + "(", open + 1, close); if (close < open) visit(text + ")", open, close + 1); }; visit("",0,0); return out; }`,
  "word-search": `function wordSearch(rows, word) { const board = rows.map(row => row.split("")); const visit = (r,c,i) => { if (i === word.length) return true; if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c] !== word[i]) return false; const ch = board[r][c]; board[r][c] = "#"; const found = visit(r+1,c,i+1)||visit(r-1,c,i+1)||visit(r,c+1,i+1)||visit(r,c-1,i+1); board[r][c] = ch; return found; }; for (let r=0;r<board.length;r++) for(let c=0;c<board[0].length;c++) if(visit(r,c,0)) return true; return false; }`,
  "house-robber-ii": `function robCircular(nums) { if (!nums.length) return 0; if (nums.length === 1) return nums[0]; const linear = (start,end) => { let prev2=0,prev1=0; for(let i=start;i<=end;i++){ const next=Math.max(prev1,prev2+nums[i]); prev2=prev1; prev1=next; } return prev1; }; return Math.max(linear(0,nums.length-2),linear(1,nums.length-1)); }`,
  "coin-change": `function coinChange(coins, amount) { const dp = new Array(amount+1).fill(amount+1); dp[0]=0; for(let value=1;value<=amount;value++) for(const coin of coins) if(coin<=value) dp[value]=Math.min(dp[value],dp[value-coin]+1); return dp[amount]>amount?-1:dp[amount]; }`,
  "maximum-subarray": `function maxSubArray(nums) { let current=nums[0],best=nums[0]; for(let i=1;i<nums.length;i++){ current=Math.max(nums[i],current+nums[i]); best=Math.max(best,current); } return best; }`,
};

export const CODING_COMBAT_WAVE_THREE_JAVA_REFERENCES: Record<string, string> = {
  "product-except-self": `public class Solution { public int[] productExceptSelf(int[] nums) { int[] out=new int[nums.length]; int p=1; for(int i=0;i<nums.length;i++){out[i]=p;p*=nums[i];} p=1; for(int i=nums.length-1;i>=0;i--){out[i]*=p;p*=nums[i];} return out; } }`,
  "subarray-sum-k": `import java.util.*; public class Solution { public int subarraySum(int[] nums,int target){ Map<Integer,Integer> count=new HashMap<>(); count.put(0,1); int prefix=0,answer=0; for(int n:nums){prefix+=n;answer+=count.getOrDefault(prefix-target,0);count.put(prefix,count.getOrDefault(prefix,0)+1);} return answer;} }`,
  "min-stack": `import java.util.*; public class Solution { public int[] minStackTrace(String[] operations,int[] values){ Deque<Integer> stack=new ArrayDeque<>(),mins=new ArrayDeque<>(); List<Integer> out=new ArrayList<>(); for(int i=0;i<operations.length;i++){String op=operations[i];if(op.equals("push")){stack.push(values[i]);mins.push(mins.isEmpty()?values[i]:Math.min(values[i],mins.peek()));}else if(op.equals("pop")){stack.pop();mins.pop();}else if(op.equals("top"))out.add(stack.peek());else out.add(mins.peek());} return out.stream().mapToInt(Integer::intValue).toArray();} }`,
  "top-k-frequent": `import java.util.*; public class Solution { public int[] topKFrequent(int[] nums,int k){Map<Integer,Integer> counts=new HashMap<>();for(int n:nums)counts.put(n,counts.getOrDefault(n,0)+1);PriorityQueue<Integer> heap=new PriorityQueue<>((a,b)->Integer.compare(counts.get(a),counts.get(b)));for(int n:counts.keySet()){heap.offer(n);if(heap.size()>k)heap.poll();}int[] out=new int[k];for(int i=0;i<k;i++)out[i]=heap.poll();return out;} }`,
  "task-scheduler": `public class Solution { public int leastInterval(String tasks,int cooldown){int[] counts=new int[26];for(int i=0;i<tasks.length();i++)counts[tasks.charAt(i)-'A']++;int max=0,ties=0;for(int count:counts){if(count>max){max=count;ties=1;}else if(count==max&&count>0)ties++;}return Math.max(tasks.length(),(max-1)*(cooldown+1)+ties);} }`,
  "lru-cache": `import java.util.*; public class Solution { public int[] lruTrace(int capacity,String[] operations,int[][] args){LinkedHashMap<Integer,Integer> cache=new LinkedHashMap<>(16,.75f,true);List<Integer> out=new ArrayList<>();for(int i=0;i<operations.length;i++){int key=args[i][0];if(operations[i].equals("get"))out.add(cache.getOrDefault(key,-1));else{cache.put(key,args[i][1]);if(cache.size()>capacity){int oldest=cache.keySet().iterator().next();cache.remove(oldest);}}}return out.stream().mapToInt(Integer::intValue).toArray();} }`,
  "generate-parentheses": `import java.util.*; public class Solution { public String[] generateParenthesis(int n){List<String> out=new ArrayList<>();visit(n,0,0,new StringBuilder(),out);return out.toArray(new String[0]);}private void visit(int n,int open,int close,StringBuilder text,List<String> out){if(text.length()==2*n){out.add(text.toString());return;}if(open<n){text.append('(');visit(n,open+1,close,text,out);text.deleteCharAt(text.length()-1);}if(close<open){text.append(')');visit(n,open,close+1,text,out);text.deleteCharAt(text.length()-1);}} }`,
  "word-search": `public class Solution { public boolean wordSearch(String[] rows,String word){if(rows.length==0)return false;char[][] board=new char[rows.length][];for(int i=0;i<rows.length;i++)board[i]=rows[i].toCharArray();for(int r=0;r<board.length;r++)for(int c=0;c<board[0].length;c++)if(visit(board,word,r,c,0))return true;return false;}private boolean visit(char[][] b,String w,int r,int c,int i){if(i==w.length())return true;if(r<0||r>=b.length||c<0||c>=b[0].length||b[r][c]!=w.charAt(i))return false;char old=b[r][c];b[r][c]='#';boolean found=visit(b,w,r+1,c,i+1)||visit(b,w,r-1,c,i+1)||visit(b,w,r,c+1,i+1)||visit(b,w,r,c-1,i+1);b[r][c]=old;return found;} }`,
  "house-robber-ii": `public class Solution { public int robCircular(int[] nums){if(nums.length==0)return 0;if(nums.length==1)return nums[0];return Math.max(linear(nums,0,nums.length-2),linear(nums,1,nums.length-1));}private int linear(int[] a,int start,int end){int prev2=0,prev1=0;for(int i=start;i<=end;i++){int next=Math.max(prev1,prev2+a[i]);prev2=prev1;prev1=next;}return prev1;} }`,
  "coin-change": `import java.util.*; public class Solution { public int coinChange(int[] coins,int amount){int[] dp=new int[amount+1];Arrays.fill(dp,amount+1);dp[0]=0;for(int value=1;value<=amount;value++)for(int coin:coins)if(coin<=value)dp[value]=Math.min(dp[value],dp[value-coin]+1);return dp[amount]>amount?-1:dp[amount];} }`,
  "maximum-subarray": `public class Solution { public int maxSubArray(int[] nums){int current=nums[0],best=nums[0];for(int i=1;i<nums.length;i++){current=Math.max(nums[i],current+nums[i]);best=Math.max(best,current);}return best;} }`,
};
