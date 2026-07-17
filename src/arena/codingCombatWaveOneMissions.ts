import type { CodingCombatMission } from "./codingCombatMissions";

/**
 * Wave 1 turns six Amazon-board must-dos into executable Java missions.
 * Every mission uses int[][] somewhere in its public contract, which keeps
 * the harness extension focused while covering intervals, selection, graph
 * traversal, multi-source BFS, and grid DP.
 */
export const CODING_COMBAT_WAVE_ONE_MISSIONS: CodingCombatMission[] = [
  {
    id: "merge-intervals",
    title: "Merge Intervals: Collision Sweep",
    signal: "overlapping ranges / normalize output / sort then sweep",
    difficulty: "Interview",
    minutes: 35,
    functionName: "mergeIntervals",
    signature: "mergeIntervals(intervals) -> normalized intervals",
    prompt: "Given possibly unsorted intervals, merge every overlap and return the disjoint intervals in ascending start order.",
    constraints: [
      "Every interval has exactly two integers [start, end] with start <= end.",
      "Intervals that share an endpoint overlap: [1, 4] and [4, 5] become [1, 5].",
      "Target O(n log n) time for unsorted input; do not assume the caller's array stays unchanged.",
    ],
    examples: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", why: "Only the first two ranges overlap" },
      { input: "[[1,4],[4,5]]", output: "[[1,5]]", why: "Touching endpoints still share a point" },
    ],
    starterCode: `function mergeIntervals(intervals) {
  // First make the next interval comparable to one active merged range.
  return intervals;
}`,
    java: {
      methodName: "mergeIntervals",
      signature: "public int[][] mergeIntervals(int[][] intervals)",
      argTypes: ["int[][]"],
      returnType: "int[][]",
      starterCode: `import java.util.*;

public class Solution {
    public int[][] mergeIntervals(int[][] intervals) {
        // First make the next interval comparable to one active merged range.
        return intervals;
    }
}
`,
    },
    visibleTests: [
      { id: "standard-overlap", label: "two ranges merge inside a longer list", args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { id: "touching-endpoints", label: "shared endpoint counts as overlap", args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { id: "empty-intervals", label: "empty input", args: [[]], expected: [] },
    ],
    hiddenTests: [
      { id: "contained-ranges", label: "smaller ranges sit inside one larger range", args: [[[1, 10], [2, 3], [4, 8]]], expected: [[1, 10]] },
      { id: "unsorted-input", label: "sorting is required before sweeping", args: [[[8, 10], [1, 3], [2, 6]]], expected: [[1, 6], [8, 10]] },
      { id: "negative-ranges", label: "negative and positive boundaries", args: [[[-10, -1], [-5, 0], [3, 4]]], expected: [[-10, 0], [3, 4]] },
      { id: "single-range", label: "one interval is already normalized", args: [[[5, 7]]], expected: [[5, 7]] },
    ],
    hints: [
      "Sort by start. After that, an interval can only overlap the most recently emitted merged interval.",
      "Keep one active [start, end]. If next.start <= active.end, extend active.end to max(active.end, next.end).",
      "When the next interval starts after active.end, the active interval can never change again; emit it and start a new active range.",
    ],
    defense: [
      {
        id: "merge-invariant",
        category: "invariant",
        prompt: "What is true after each interval in sorted order has been processed?",
        options: [
          { id: "normalized-prefix", label: "The output is disjoint and sorted, and its last interval represents every overlap reaching the processed prefix's right edge", correct: true, feedback: "Correct. Sorting makes the last merged interval the only one the next start can possibly touch." },
          { id: "same-count", label: "The output contains exactly as many intervals as the processed input", correct: false, feedback: "Merging deliberately reduces the number of intervals; count is not an invariant." },
          { id: "shortest-first", label: "The active interval always has the smallest duration", correct: false, feedback: "Duration is irrelevant. The active interval is the rightmost normalized interval." },
        ],
      },
      {
        id: "merge-complexity",
        category: "complexity",
        prompt: "What dominates the runtime for arbitrary input order?",
        options: [
          { id: "sort-dominates", label: "O(n log n) time for sorting, followed by O(n) sweeping; O(n) output space", correct: true, feedback: "Correct. The sweep is linear, so comparison sorting is the dominant step." },
          { id: "quadratic-pairs", label: "O(n^2), because every interval must be compared with every other interval", correct: false, feedback: "Sorted order reduces the only relevant comparison to the current merged tail." },
          { id: "linear-unsorted", label: "O(n), because one pass always suffices even when intervals are unsorted", correct: false, feedback: "Without an ordering guarantee, a later interval may reach back into an earlier group. Sorting is what makes one pass safe." },
        ],
      },
      {
        id: "merge-counterexample",
        category: "counterexample",
        prompt: "Which case breaks a merge check that uses next.start < active.end instead of <=?",
        options: [
          { id: "touching", label: "[[1,4],[4,5]]", correct: true, feedback: "Correct. The ranges share point 4, but the strict comparison leaves them separate." },
          { id: "gap", label: "[[1,2],[4,5]]", correct: false, feedback: "Both strict and non-strict checks correctly preserve this real gap." },
          { id: "contained", label: "[[1,8],[2,3]]", correct: false, feedback: "Here 2 is strictly below 8, so either comparison merges the contained range." },
        ],
      },
    ],
  },
  {
    id: "insert-interval",
    title: "Insert Interval: Three-Zone Scan",
    signal: "sorted disjoint ranges / one new range / before-overlap-after",
    difficulty: "Interview",
    minutes: 35,
    functionName: "insertInterval",
    signature: "insertInterval(intervals, newInterval) -> normalized intervals",
    prompt: "Insert one interval into sorted, non-overlapping intervals and return the normalized result without sorting the whole input again.",
    constraints: [
      "The existing intervals are sorted by start and do not overlap.",
      "Both existing and new intervals are inclusive [start, end] ranges.",
      "Target O(n) time; preserve every interval strictly before or after the merged range.",
    ],
    examples: [
      { input: "intervals = [[1,3],[6,9]], new = [2,5]", output: "[[1,5],[6,9]]", why: "The new interval expands the first range only" },
      { input: "intervals = [], new = [5,7]", output: "[[5,7]]", why: "The new interval becomes the whole result" },
    ],
    starterCode: `function insertInterval(intervals, newInterval) {
  // Preserve the ranges that cannot overlap, then merge exactly one middle zone.
  return intervals;
}`,
    java: {
      methodName: "insertInterval",
      signature: "public int[][] insertInterval(int[][] intervals, int[] newInterval)",
      argTypes: ["int[][]", "int[]"],
      returnType: "int[][]",
      starterCode: `import java.util.*;

public class Solution {
    public int[][] insertInterval(int[][] intervals, int[] newInterval) {
        // Preserve non-overlaps, merge one middle zone, then append the tail.
        return intervals;
    }
}
`,
    },
    visibleTests: [
      { id: "merge-first", label: "new range overlaps the first interval", args: [[[1, 3], [6, 9]], [2, 5]], expected: [[1, 5], [6, 9]] },
      { id: "bridge-many", label: "new range bridges several intervals", args: [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], expected: [[1, 2], [3, 10], [12, 16]] },
      { id: "insert-empty", label: "insert into an empty list", args: [[], [5, 7]], expected: [[5, 7]] },
    ],
    hiddenTests: [
      { id: "append-after", label: "new range belongs at the end", args: [[[1, 2]], [5, 6]], expected: [[1, 2], [5, 6]] },
      { id: "prepend-before", label: "new range belongs at the front", args: [[[5, 7]], [1, 3]], expected: [[1, 3], [5, 7]] },
      { id: "contains-all", label: "new range absorbs every existing range", args: [[[2, 3], [5, 7]], [1, 10]], expected: [[1, 10]] },
      { id: "touches-both-sides", label: "shared endpoints bridge two ranges", args: [[[1, 2], [5, 6]], [2, 5]], expected: [[1, 6]] },
    ],
    hints: [
      "First append intervals whose end is strictly before new.start; they can never overlap the new range.",
      "While interval.start <= new.end, expand new.start with min and new.end with max.",
      "Append the merged new interval once, then append the untouched suffix. Each existing interval is visited once.",
    ],
    defense: [
      {
        id: "insert-invariant",
        category: "invariant",
        prompt: "Why can the scan be divided into before, overlap, and after zones?",
        options: [
          { id: "sorted-disjoint", label: "Sorted, disjoint input means once an interval starts after the merged new end, every later interval also belongs after it", correct: true, feedback: "Correct. The ordering turns overlap into one contiguous middle block." },
          { id: "fixed-new", label: "The new interval never changes while overlaps are processed", correct: false, feedback: "Its boundaries must expand to absorb each overlapping interval." },
          { id: "one-overlap", label: "At most one existing interval may overlap the new interval", correct: false, feedback: "A single new range may bridge any number of existing intervals." },
        ],
      },
      {
        id: "insert-complexity",
        category: "complexity",
        prompt: "What is the tight complexity when the existing intervals are already sorted and disjoint?",
        options: [
          { id: "linear", label: "O(n) time and O(n) output space, with no additional sort", correct: true, feedback: "Correct. Every interval enters exactly one of the three zones." },
          { id: "sort-again", label: "O(n log n), because the new interval requires sorting all ranges again", correct: false, feedback: "The existing order and the three-zone scan preserve order without a new sort." },
          { id: "constant", label: "O(1), because only one interval is inserted", correct: false, feedback: "The insertion may overlap or follow intervals anywhere in the input, so a linear scan may be necessary." },
        ],
      },
      {
        id: "insert-counterexample",
        category: "counterexample",
        prompt: "Which input catches code that treats touching endpoints as separate?",
        options: [
          { id: "bridge-touch", label: "intervals = [[1,2],[5,6]], new = [2,5]", correct: true, feedback: "Correct. Inclusive endpoints make the new range overlap both sides, so the answer is [[1,6]]." },
          { id: "middle-gap", label: "intervals = [[1,2],[7,8]], new = [4,5]", correct: false, feedback: "This new interval has a real gap on both sides, so it should stay separate." },
          { id: "inside", label: "intervals = [[1,9]], new = [3,4]", correct: false, feedback: "Strict comparisons still detect this ordinary contained overlap." },
        ],
      },
    ],
  },
  {
    id: "k-closest-points",
    title: "K Closest Points: Proximity Filter",
    signal: "select k of n / distance ranking / bounded max-heap",
    difficulty: "Interview",
    minutes: 35,
    functionName: "kClosestPoints",
    signature: "kClosestPoints(points, k) -> any order of the k closest points",
    prompt: "Return the k points closest to the origin by squared Euclidean distance. The returned rows may be in any order.",
    constraints: [
      "Each point is [x, y], 0 <= k <= points.length, and ties may be returned in any valid order.",
      "Do not use square roots; compare x*x + y*y using long arithmetic in Java.",
      "Target O(n log k) time and O(k) auxiliary space when k is much smaller than n.",
    ],
    examples: [
      { input: "points = [[1,3],[-2,2]], k = 1", output: "[[-2,2]]", why: "8 is smaller than 10" },
      { input: "points = [[3,3],[5,-1],[-2,4]], k = 2", output: "[[3,3],[-2,4]] in any order", why: "Their squared distances are 18 and 20" },
    ],
    starterCode: `function kClosestPoints(points, k) {
  // Keep only the candidates that can still belong to the best k.
  return [];
}`,
    java: {
      methodName: "kClosestPoints",
      signature: "public int[][] kClosestPoints(int[][] points, int k)",
      argTypes: ["int[][]", "int"],
      returnType: "int[][]",
      comparison: "unordered-rows",
      starterCode: `import java.util.*;

public class Solution {
    public int[][] kClosestPoints(int[][] points, int k) {
        // Keep only the candidates that can still belong to the best k.
        return new int[0][0];
    }
}
`,
    },
    visibleTests: [
      { id: "nearest-one", label: "choose one of two points", args: [[[1, 3], [-2, 2]], 1], expected: [[-2, 2]] },
      { id: "nearest-two", label: "return two closest in any row order", args: [[[3, 3], [5, -1], [-2, 4]], 2], expected: [[3, 3], [-2, 4]] },
      { id: "zero-points", label: "k equals zero", args: [[[1, 1]], 0], expected: [] },
    ],
    hiddenTests: [
      { id: "all-points", label: "k includes the complete input", args: [[[-5, 0], [2, 2], [0, 1]], 3], expected: [[0, 1], [2, 2], [-5, 0]] },
      { id: "negative-coordinates", label: "sign does not change distance", args: [[[-1, -1], [4, 0], [0, -2]], 2], expected: [[-1, -1], [0, -2]] },
      { id: "duplicate-point", label: "duplicate rows remain distinct candidates", args: [[[1, 1], [1, 1], [9, 9]], 2], expected: [[1, 1], [1, 1]] },
      { id: "distance-overflow", label: "squared distance needs long arithmetic", args: [[[50000, 50000], [1, 1], [40000, 40000]], 1], expected: [[1, 1]] },
    ],
    hints: [
      "A max-heap of size k keeps the worst current winner at the top. That is the point a better candidate should evict.",
      "For each point, add it, then remove the heap top when size exceeds k. The survivors are the k smallest distances seen so far.",
      "Cast before multiplication: (long) x * x + (long) y * y. Casting after int overflow is too late.",
    ],
    defense: [
      {
        id: "closest-invariant",
        category: "invariant",
        prompt: "What does the bounded max-heap contain after each processed point?",
        options: [
          { id: "best-k-prefix", label: "The k closest points from the processed prefix, with the farthest current winner available for eviction", correct: true, feedback: "Correct. Any new point only needs to beat the worst current winner to enter the set." },
          { id: "farthest-k", label: "The k farthest points seen so far", correct: false, feedback: "The heap is ordered farthest-first only so that the farthest survivor is easy to remove; the survivors themselves are the closest k." },
          { id: "sorted-all", label: "Every processed point in globally sorted order", correct: false, feedback: "The heap stores at most k points and does not fully sort them." },
        ],
      },
      {
        id: "closest-complexity",
        category: "complexity",
        prompt: "Why is a size-k heap useful when k is much smaller than n?",
        options: [
          { id: "n-log-k", label: "O(n log k) time and O(k) space; each point causes at most one bounded heap insertion and removal", correct: true, feedback: "Correct. Full sorting would pay O(n log n) even though only k points survive." },
          { id: "n-log-n", label: "O(n log n) time and O(n) space is unavoidable for any top-k problem", correct: false, feedback: "A bounded heap avoids storing or ordering the points that cannot survive." },
          { id: "constant", label: "O(n) time and O(1) space for all k", correct: false, feedback: "This heap approach stores k candidates and pays log k per update." },
        ],
      },
      {
        id: "closest-counterexample",
        category: "counterexample",
        prompt: "Which case exposes distance arithmetic performed entirely as int?",
        options: [
          { id: "overflow", label: "points = [[50000,50000],[1,1]], k = 1", correct: true, feedback: "Correct. 50000 squared overflows a 32-bit int, potentially making the far point look artificially close." },
          { id: "small", label: "points = [[1,2],[2,1]], k = 1", correct: false, feedback: "These small products do not overflow, so the arithmetic bug stays hidden." },
          { id: "origin", label: "points = [[0,0]], k = 1", correct: false, feedback: "Zero is represented exactly and cannot expose overflow." },
        ],
      },
    ],
  },
  {
    id: "number-of-islands",
    title: "Number of Islands: Archipelago Scan",
    signal: "grid components / four-direction neighbors / consume each cell once",
    difficulty: "Interview",
    minutes: 35,
    functionName: "countIslands",
    signature: "countIslands(grid) -> component count",
    prompt: "Count the four-directionally connected groups of land in a binary integer grid, where 1 is land and 0 is water.",
    constraints: [
      "Diagonal cells are not connected; only up, down, left, and right are neighbors.",
      "The grid may be empty. You may mark visited land directly in the provided grid.",
      "Target O(rows * columns) time so no land cell is explored as a new island twice.",
    ],
    examples: [
      { input: "[[1,1,0],[1,0,0],[0,0,1]]", output: "2", why: "The upper-left land and lower-right land are separate components" },
      { input: "[[1,0],[0,1]]", output: "2", why: "Diagonal contact does not connect islands" },
    ],
    starterCode: `function countIslands(grid) {
  // A counted island must be consumed before the outer scan can see it again.
  return 0;
}`,
    java: {
      methodName: "countIslands",
      signature: "public int countIslands(int[][] grid)",
      argTypes: ["int[][]"],
      returnType: "int",
      starterCode: `import java.util.*;

public class Solution {
    public int countIslands(int[][] grid) {
        // Count a component once, then consume all of its connected land.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "two-components", label: "two separated land components", args: [[[1, 1, 0], [1, 0, 0], [0, 0, 1]]], expected: 2 },
      { id: "three-components", label: "three components with different shapes", args: [[[1, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]], expected: 3 },
      { id: "empty-grid", label: "empty grid", args: [[]], expected: 0 },
    ],
    hiddenTests: [
      { id: "diagonal-separation", label: "diagonal land remains separate", args: [[[1, 0], [0, 1]]], expected: 2 },
      { id: "thin-grid", label: "one row with two islands", args: [[[1, 1, 0, 1]]], expected: 2 },
      { id: "all-water", label: "no land", args: [[[0, 0], [0, 0]]], expected: 0 },
      { id: "ring-is-one", label: "land around a water hole is one component", args: [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], expected: 1 },
    ],
    hints: [
      "Scan every cell. When you encounter an unvisited 1, increment the answer before starting a flood fill.",
      "The flood fill turns every reachable 1 into 0, or marks it visited, so the outer scan cannot count that component again.",
      "Check row and column bounds before reading a neighbor, and recurse or queue only for cells whose value is still 1.",
    ],
    defense: [
      {
        id: "islands-invariant",
        category: "invariant",
        prompt: "What makes one increment correspond to exactly one island?",
        options: [
          { id: "consume-component", label: "Each increment starts at unvisited land, and its flood fill marks the entire reachable component before scanning continues", correct: true, feedback: "Correct. No cell in that component can trigger a later increment, while disconnected land remains untouched." },
          { id: "count-cells", label: "Every land cell increments the answer once", correct: false, feedback: "That counts land area, not connected components." },
          { id: "row-groups", label: "Every contiguous group in a row is one complete island", correct: false, feedback: "Groups in different rows may connect vertically and belong to the same island." },
        ],
      },
      {
        id: "islands-complexity",
        category: "complexity",
        prompt: "Why does repeated flood fill still run in O(rows * columns) time?",
        options: [
          { id: "visited-once", label: "Each cell is scanned and each land cell is marked at most once, so all flood fills share one linear budget", correct: true, feedback: "Correct. The traversals are separate calls but their visited cells do not overlap." },
          { id: "one-island", label: "The grid is guaranteed to contain at most one island", correct: false, feedback: "Multiple components are allowed; linearity comes from marking, not from a one-island guarantee." },
          { id: "four-constant", label: "Checking four directions makes the algorithm O(4) regardless of grid size", correct: false, feedback: "Four is the work per visited cell; the number of visited cells still scales with the grid." },
        ],
      },
      {
        id: "islands-counterexample",
        category: "counterexample",
        prompt: "Which grid breaks a flood fill that incorrectly treats diagonals as neighbors?",
        options: [
          { id: "diagonal", label: "[[1,0],[0,1]]", correct: true, feedback: "Correct. Diagonal traversal merges two islands and returns 1 instead of 2." },
          { id: "solid", label: "[[1,1],[1,1]]", correct: false, feedback: "All land is already connected vertically and horizontally, so diagonal behavior changes nothing." },
          { id: "water", label: "[[0,0],[0,0]]", correct: false, feedback: "There is no land for the incorrect neighbor rule to connect." },
        ],
      },
    ],
  },
  {
    id: "rotting-oranges",
    title: "Rotting Oranges: Contagion Clock",
    signal: "many starting sources / simultaneous layers / unreachable fresh cells",
    difficulty: "Interview",
    minutes: 40,
    functionName: "minutesUntilRotten",
    signature: "minutesUntilRotten(grid) -> minimum minutes or -1",
    prompt: "Return the minimum minutes until every fresh orange becomes rotten, with all rotten oranges spreading to four-direction neighbors simultaneously each minute.",
    constraints: [
      "Cells are 0 for empty, 1 for fresh, and 2 for rotten.",
      "All initially rotten oranges begin spreading at minute zero.",
      "Return 0 when no fresh orange exists and -1 when at least one fresh orange is unreachable.",
    ],
    examples: [
      { input: "[[2,1,1],[1,1,0],[0,1,1]]", output: "4", why: "The final orange is reached after four simultaneous layers" },
      { input: "[[0,2]]", output: "0", why: "There is no fresh orange to wait for" },
    ],
    starterCode: `function minutesUntilRotten(grid) {
  // One queue must represent every source at the same moment in time.
  return 0;
}`,
    java: {
      methodName: "minutesUntilRotten",
      signature: "public int minutesUntilRotten(int[][] grid)",
      argTypes: ["int[][]"],
      returnType: "int",
      starterCode: `import java.util.*;

public class Solution {
    public int minutesUntilRotten(int[][] grid) {
        // Seed one queue with every source before advancing the first minute.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "four-minutes", label: "infection crosses four time layers", args: [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], expected: 4 },
      { id: "unreachable-fresh", label: "a wall isolates fresh fruit", args: [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], expected: -1 },
      { id: "nothing-fresh", label: "no fresh oranges", args: [[[0, 2]]], expected: 0 },
    ],
    hiddenTests: [
      { id: "empty-orange-grid", label: "empty grid", args: [[]], expected: 0 },
      { id: "multiple-sources", label: "two sources spread simultaneously", args: [[[2, 1, 1], [1, 1, 1], [1, 1, 2]]], expected: 2 },
      { id: "fresh-without-source", label: "fresh orange but no rotten source", args: [[[1]]], expected: -1 },
      { id: "one-minute", label: "adjacent fresh orange", args: [[[2, 1]]], expected: 1 },
    ],
    hints: [
      "Count fresh oranges and enqueue every initially rotten cell before BFS starts. This creates one virtual super-source.",
      "Process the queue one level at a time. Increment minutes only after a level actually rots at least one fresh neighbor.",
      "Each time a fresh neighbor becomes rotten, decrement fresh immediately and enqueue it. At the end, fresh == 0 decides between minutes and -1.",
    ],
    defense: [
      {
        id: "oranges-invariant",
        category: "invariant",
        prompt: "Why must every initial rotten orange enter the queue before minute one?",
        options: [
          { id: "simultaneous-frontier", label: "The queue frontier then contains every cell rotten at the same minute, so one BFS layer models one simultaneous minute", correct: true, feedback: "Correct. Multi-source BFS is ordinary BFS from a virtual source connected to all initial rotten cells." },
          { id: "avoid-duplicates", label: "It is the only way to prevent the same cell from entering the queue twice", correct: false, feedback: "Marking a fresh cell rotten when enqueued prevents duplicates; seeding all sources is about time correctness." },
          { id: "sorted-grid", label: "It sorts the grid by row and column before traversal", correct: false, feedback: "Queue insertion order within one minute does not sort the grid and does not need to." },
        ],
      },
      {
        id: "oranges-complexity",
        category: "complexity",
        prompt: "What is the tight complexity of the multi-source traversal?",
        options: [
          { id: "grid-linear", label: "O(rows * columns) time and O(rows * columns) worst-case queue space", correct: true, feedback: "Correct. Each cell is scanned and can enter the queue at most once." },
          { id: "sources-times-grid", label: "O(number of rotten sources * rows * columns)", correct: false, feedback: "All sources share one traversal; the grid is not rescanned separately per source." },
          { id: "minutes-only", label: "O(minutes), because only the final elapsed time matters", correct: false, feedback: "Every reachable cell must still be inspected even when many cells rot in the same minute." },
        ],
      },
      {
        id: "oranges-counterexample",
        category: "counterexample",
        prompt: "Which input most clearly exposes processing each rotten source to completion before starting the next source?",
        options: [
          { id: "two-ended", label: "[[2,1,1,1,2]]", correct: true, feedback: "Correct. Both ends spread at once and finish in two minutes; a one-source-at-a-time simulation can overcount." },
          { id: "one-source", label: "[[2,1]]", correct: false, feedback: "There is only one source, so sequential and simultaneous simulations are identical." },
          { id: "no-fresh", label: "[[2,0,2]]", correct: false, feedback: "No spread occurs, so source scheduling cannot change the answer." },
        ],
      },
    ],
  },
  {
    id: "unique-paths-obstacles",
    title: "Unique Paths II: Obstacle Router",
    signal: "count paths / top-and-left recurrence / blocked state resets",
    difficulty: "Interview",
    minutes: 35,
    functionName: "countPathsWithObstacles",
    signature: "countPathsWithObstacles(grid) -> path count",
    prompt: "Count paths from the top-left to bottom-right of a grid with obstacles, moving only right or down.",
    constraints: [
      "A 0 cell is open and a 1 cell is blocked. The grid may be empty.",
      "A blocked start or destination has zero valid paths.",
      "Every open cell's path count comes only from the cell above and the cell to its left.",
    ],
    examples: [
      { input: "[[0,0,0],[0,1,0],[0,0,0]]", output: "2", why: "The center obstacle leaves one route around each side" },
      { input: "[[1]]", output: "0", why: "The starting cell is blocked" },
    ],
    starterCode: `function countPathsWithObstacles(grid) {
  // Define what one DP cell means before choosing the traversal order.
  return 0;
}`,
    java: {
      methodName: "countPathsWithObstacles",
      signature: "public int countPathsWithObstacles(int[][] obstacleGrid)",
      argTypes: ["int[][]"],
      returnType: "int",
      starterCode: `import java.util.*;

public class Solution {
    public int countPathsWithObstacles(int[][] obstacleGrid) {
        // Let dp[col] mean paths to the current row's cell at that column.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "center-obstacle", label: "two routes around one obstacle", args: [[[0, 0, 0], [0, 1, 0], [0, 0, 0]]], expected: 2 },
      { id: "single-open", label: "start is also destination", args: [[[0]]], expected: 1 },
      { id: "blocked-start", label: "start cell is blocked", args: [[[1, 0], [0, 0]]], expected: 0 },
    ],
    hiddenTests: [
      { id: "blocked-destination", label: "destination cell is blocked", args: [[[0, 0], [0, 1]]], expected: 0 },
      { id: "single-corridor", label: "one narrow valid route", args: [[[0, 1, 0], [0, 0, 0]]], expected: 1 },
      { id: "first-row-block", label: "obstacle cuts off the rest of the first row", args: [[[0, 1, 0, 0]]], expected: 0 },
      { id: "empty-path-grid", label: "empty grid", args: [[]], expected: 0 },
    ],
    hints: [
      "Let dp[col] mean the number of ways to reach column col in the current row after processing the current cell.",
      "On an obstacle, set dp[col] = 0. On an open cell, dp[col] = dp[col] + dp[col - 1], where the old value is from above.",
      "Seed dp[0] = 1 only when the start is open. An obstacle in the first row or column naturally zeros every cell beyond it.",
    ],
    defense: [
      {
        id: "paths-invariant",
        category: "invariant",
        prompt: "During a left-to-right row scan, what do dp[col] and dp[col - 1] represent before the update?",
        options: [
          { id: "above-and-left", label: "dp[col] is paths from above, while dp[col - 1] is the already-updated path count from the left", correct: true, feedback: "Correct. Their sum is exactly the two legal ways to enter the current open cell." },
          { id: "future-cells", label: "Both values describe cells in the next row", correct: false, feedback: "The one-row optimization mixes the previous row at col with the current row at col - 1, not future state." },
          { id: "shortest-length", label: "They store the length of the shortest path through each neighbor", correct: false, feedback: "The problem counts all valid paths; it does not optimize path length." },
        ],
      },
      {
        id: "paths-complexity",
        category: "complexity",
        prompt: "What does the one-row dynamic program cost?",
        options: [
          { id: "grid-cols", label: "O(rows * columns) time and O(columns) auxiliary space", correct: true, feedback: "Correct. Every cell is processed once and only the previous-row value per column survives." },
          { id: "exponential", label: "O(2^(rows+columns)) time because each move branches right or down", correct: false, feedback: "That is naive recursion. DP combines repeated subproblems once per cell." },
          { id: "constant-space", label: "O(rows * columns) time and O(1) space for any number of columns", correct: false, feedback: "The one-row method stores one count per column, so its auxiliary space scales with grid width." },
        ],
      },
      {
        id: "paths-counterexample",
        category: "counterexample",
        prompt: "Which input breaks first-row initialization that keeps every later cell at 1 even after an obstacle?",
        options: [
          { id: "blocked-row", label: "[[0,1,0,0]]", correct: true, feedback: "Correct. No move can cross the obstacle, so every cell to its right must have zero paths." },
          { id: "open-row", label: "[[0,0,0]]", correct: false, feedback: "Every cell really does have one path, so the broken initialization appears correct." },
          { id: "blocked-start-only", label: "[[1]]", correct: false, feedback: "Many implementations special-case the start; the later-cell propagation bug is clearer with an obstacle after an open start." },
        ],
      },
    ],
  },
];
