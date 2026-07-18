import type { CodingCombatMissionId } from "@/arena/types";

export type AmazonPrepTier = "must" | "good" | "stretch";
export type AmazonPrepTrack = "dsa" | "lld";
export type AmazonPrepSignal = "repeated-report" | "recent-report" | "coverage-anchor";

export interface AmazonPrepQuestion {
  id: string;
  title: string;
  track: AmazonPrepTrack;
  tier: AmazonPrepTier;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
  minutes: number;
  href: string;
  signal: AmazonPrepSignal;
  why: string;
  recallCue: string;
  proof: string;
  variations: [string, string];
}

export interface AmazonPrepDay {
  day: number;
  title: string;
  focus: string;
  minutes: number;
  questionIds: string[];
  checkpoint: string;
}

export interface AmazonResearchSource {
  id: string;
  label: string;
  href: string;
  kind: "official" | "candidate-report";
}

const dsa = (
  id: string,
  title: string,
  tier: AmazonPrepTier,
  pattern: string,
  difficulty: AmazonPrepQuestion["difficulty"],
  minutes: number,
  slug: string,
  signal: AmazonPrepSignal,
  why: string,
  recallCue: string,
  proof: string,
  variations: [string, string],
): AmazonPrepQuestion => ({
  id: `dsa-${id}`,
  title,
  track: "dsa",
  tier,
  pattern,
  difficulty,
  minutes,
  href: `https://leetcode.com/problems/${slug}/`,
  signal,
  why,
  recallCue,
  proof,
  variations,
});

const lld = (
  id: string,
  title: string,
  tier: AmazonPrepTier,
  minutes: number,
  href: string,
  signal: AmazonPrepSignal,
  why: string,
  recallCue: string,
  proof: string,
  variations: [string, string],
): AmazonPrepQuestion => ({
  id: `lld-${id}`,
  title,
  track: "lld",
  tier,
  pattern: "Object-oriented design",
  difficulty: "Medium",
  minutes,
  href,
  signal,
  why,
  recallCue,
  proof,
  variations,
});

/**
 * A coverage-first list for Amazon SDE I. The evidence signals deliberately do
 * not claim exact frequency: public candidate reports are anecdotal and loops
 * vary by location, team, and interviewer.
 */
export const AMAZON_SDE1_QUESTIONS: AmazonPrepQuestion[] = [
  dsa("two-sum", "Two Sum", "must", "Hash map", "Easy", 25, "two-sum", "coverage-anchor", "The smallest clean test of complement lookup and one-pass state.", "Need a pair, but sorting would lose original indices.", "Explain why checking before inserting prevents reusing the same element.", ["Return every valid pair", "Input is sorted and extra space is forbidden"]),
  dsa("product-except-self", "Product of Array Except Self", "must", "Prefix / suffix", "Medium", 35, "product-of-array-except-self", "recent-report", "A 2026 SDE-I report described this exact problem; it also tests in-place prefix/suffix reasoning.", "Each output needs everything to its left and right; division is forbidden.", "Derive the two passes and account for zeros without special-case division.", ["Use O(1) auxiliary space", "Return results modulo a fixed number"]),
  dsa("subarray-sum-k", "Subarray Sum Equals K", "must", "Prefix sum + hash map", "Medium", 40, "subarray-sum-equals-k", "coverage-anchor", "Covers the essential prefix-frequency pattern for counting non-monotonic subarrays.", "Count subarrays with a target sum and values may be negative.", "State why a previous prefix of currentSum − k completes a valid subarray.", ["Longest subarray with sum k", "Binary array with a target count"]),
  dsa("longest-substring", "Longest Substring Without Repeating Characters", "must", "Sliding window", "Medium", 35, "longest-substring-without-repeating-characters", "coverage-anchor", "The canonical variable-window invariant and already playable in Coding Combat.", "Find the longest contiguous region while maintaining uniqueness.", "Prove the left boundary never moves backward, including the 'abba' case.", ["At most K distinct characters", "Replace at most K characters"]),
  dsa("sliding-window-max", "Sliding Window Maximum", "must", "Monotonic deque", "Hard", 45, "sliding-window-maximum", "repeated-report", "It appears in a selected 2025 SDE-I report and tests a high-value deque invariant.", "Every fixed window needs an extreme value faster than rescanning.", "Explain why values smaller than a new value can never become maximum again.", ["Sliding window minimum", "Online stream with changing window size"]),
  dsa("min-stack", "Min Stack", "must", "Stack design", "Medium", 30, "min-stack", "recent-report", "A 2025 SDE-I loop reported an O(1) Min Stack implementation.", "A stack needs a historical aggregate after every pop.", "Show that duplicate minima remain correct after one minimum is removed.", ["Max Stack", "Use one stack with encoded values"]),
  dsa("top-k-frequent", "Top K Frequent Elements", "must", "Heap / bucket sort", "Medium", 35, "top-k-frequent-elements", "recent-report", "Recent reports include frequency/top-K and bucket-sort variants.", "Return a small ranked subset after counting occurrences.", "Compare heap O(n log k) with bucket O(n) and choose from constraints.", ["K most frequent words", "Streaming top K with updates"]),
  dsa("merge-intervals", "Merge Intervals", "must", "Intervals", "Medium", 35, "merge-intervals", "repeated-report", "Overlapping-interval and merge variants recur in recent SDE-I reports.", "Ranges overlap and the output must be normalized.", "State the sort key and the exact condition for extending the active interval.", ["Insert one new interval", "Intervals arrive as a stream"]),
  dsa("insert-interval", "Insert Interval", "must", "Intervals", "Medium", 35, "insert-interval", "coverage-anchor", "Forces the three-phase interval scan without hiding behind a general sort.", "Sorted non-overlapping ranges receive one new range.", "Partition the scan into before, overlap, and after without losing an interval.", ["Intervals are initially unsorted", "Return only the newly covered length"]),
  dsa("k-closest", "K Closest Points to Origin", "must", "Heap / selection", "Medium", 35, "k-closest-points-to-origin", "coverage-anchor", "A compact Amazon-style top-K problem with several defensible trade-offs.", "Select k items by a computed score without fully ordering everything.", "Compare max-heap and quickselect, including worst-case behavior.", ["K closest values to x", "Points arrive continuously"]),
  dsa("task-scheduler", "Task Scheduler", "must", "Greedy + heap", "Medium", 40, "task-scheduler", "recent-report", "Recent reports include process/task scheduling variants using counts and heaps.", "Repeated task types need cooldown gaps while total time is minimized.", "Derive the idle-slot formula or simulate cycles and defend correctness.", ["Different cooldown per task", "Tasks have execution durations"]),
  dsa("lru-cache", "LRU Cache", "must", "Hash map + linked list", "Medium", 50, "lru-cache", "coverage-anchor", "Combines API design, O(1) constraints, ownership, and edge-case testing.", "Need O(1) lookup plus O(1) recency updates and eviction.", "Assign one invariant to the map and one to the doubly linked list.", ["Add item weights/capacity", "Make it thread-safe"]),
  dsa("reorder-list", "Reorder List", "must", "Linked list", "Medium", 40, "reorder-list", "recent-report", "A 2025 SDE-I report described this exact linked-list problem.", "Rearrange nodes from alternating ends without allocating another list.", "Explain split, reverse, and merge, especially odd-length termination.", ["Palindrome linked list", "Reverse nodes in k-sized groups"]),
  dsa("level-order", "Binary Tree Level Order Traversal", "must", "Tree BFS", "Medium", 30, "binary-tree-level-order-traversal", "coverage-anchor", "Foundational queue-by-level reasoning used by many tree and graph variants.", "The output is grouped by distance from the root.", "Show two correct ways to separate levels and give queue space complexity.", ["Zigzag order", "Right-side view"]),
  dsa("validate-bst", "Validate Binary Search Tree", "must", "Tree DFS", "Medium", 35, "validate-binary-search-tree", "coverage-anchor", "Tests whether the candidate carries global bounds rather than checking only parents.", "Every node is constrained by all ancestors, not only its parent.", "Use open lower/upper bounds and handle integer extremes safely.", ["Recover a swapped BST", "Return the first invalid node"]),
  dsa("lca", "Lowest Common Ancestor of a Binary Tree", "must", "Tree DFS", "Medium", 40, "lowest-common-ancestor-of-a-binary-tree", "repeated-report", "LCA appears across multiple recent SDE-I reports and follow-up discussions.", "Two target paths first meet at one deepest node.", "Explain what each recursive return value means and when the current node is the answer.", ["Targets may be absent", "Parent pointers are available"]),
  dsa("distance-k", "All Nodes Distance K in Binary Tree", "must", "Tree + graph BFS", "Medium", 45, "all-nodes-distance-k-in-binary-tree", "recent-report", "A 2025 SDE-I report described this exact problem.", "Traversal must move both down to children and up to parents.", "Turn the tree into an undirected neighborhood and prevent revisits.", ["Return nodes within distance K", "Multiple starting targets"]),
  dsa("path-sum", "Path Sum", "must", "Tree DFS", "Easy", 25, "path-sum", "recent-report", "Tree path-sum variants appeared in a selected 2026 SDE-I experience.", "A root-to-leaf path must satisfy an accumulated target.", "Define why only leaves may accept the remaining sum.", ["Count every downward target-sum path", "Return the maximum path sum"]),
  dsa("number-islands", "Number of Islands", "must", "Grid DFS / BFS", "Medium", 35, "number-of-islands", "repeated-report", "Grid connectivity and Number of Islands variants appear in recent 2025–2026 reports.", "Count connected components in a grid while consuming each cell once.", "Define visited state, neighbors, and O(rows × cols) complexity.", ["Largest island after one flip", "Dynamic islands as land is added"]),
  dsa("rotting-oranges", "Rotting Oranges", "must", "Multi-source BFS", "Medium", 40, "rotting-oranges", "repeated-report", "This exact problem or a close variant is repeatedly reported in 2025–2026 SDE-I loops.", "Many sources spread simultaneously in discrete time steps.", "Explain why all initial sources enter the queue before the first minute.", ["Weighted spread times", "Return which cells never become reachable"]),
  dsa("course-schedule-ii", "Course Schedule II", "must", "Topological sort", "Medium", 45, "course-schedule-ii", "repeated-report", "Course Schedule / II appears in multiple recent SDE-I reports.", "Dependencies require a valid ordering and cycles make it impossible.", "State the indegree invariant and why processedCount detects a cycle.", ["Return one cycle", "Prerequisites are added online"]),
  dsa("search-rotated", "Search in Rotated Sorted Array", "must", "Binary search", "Medium", 40, "search-in-rotated-sorted-array", "repeated-report", "This exact problem appears in multiple recent SDE-I reports.", "One side of every search interval remains normally sorted.", "Prove which half is sorted and whether the target lies inside it.", ["Duplicates are allowed", "Find the minimum instead of a target"]),
  dsa("generate-parentheses", "Generate Parentheses", "must", "Backtracking", "Medium", 35, "generate-parentheses", "recent-report", "A 2025 SDE-I loop reported this exact backtracking problem.", "Build only prefixes that can still become valid answers.", "State the open/close constraints and why no invalid prefix is explored.", ["Generate valid bracket types", "Return only the count"]),
  dsa("word-search", "Word Search", "must", "Backtracking", "Medium", 40, "word-search", "coverage-anchor", "Covers reversible grid state and branch pruning under tight interview time.", "A path cannot reuse a cell and failed branches must restore state.", "Explain mark, explore, unmark, and an early frequency-based rejection.", ["Find many dictionary words", "Diagonal movement is allowed"]),
  dsa("unique-paths-ii", "Unique Paths II", "must", "Grid DP", "Medium", 35, "unique-paths-ii", "recent-report", "A recent SDE-I report described a unique-paths-with-obstacles variant.", "Count grid paths where each cell depends on the top and left states.", "Define obstacle initialization and why one row of memory is enough.", ["Minimum path sum", "Paths may move diagonally"]),
  dsa("house-robber-ii", "House Robber II", "must", "1-D DP", "Medium", 40, "house-robber-ii", "recent-report", "House Robber followed by the circular variant appeared in a selected 2026 report.", "Local choices conflict with adjacent choices, and the endpoints also conflict.", "Reduce the circle to two linear cases and define the rolling-state invariant.", ["Return selected indices", "Rob houses arranged as a tree"]),
  dsa("coin-change", "Coin Change", "must", "Unbounded DP", "Medium", 40, "coin-change", "coverage-anchor", "A compact way to prove state definition, impossible-state handling, and iteration order.", "Find a minimum count from reusable choices and overlapping subproblems.", "Define dp[amount], infinity handling, and why greedy is not generally valid.", ["Count combinations instead", "Each coin has limited inventory"]),
  dsa("maximum-subarray", "Maximum Subarray", "must", "Kadane / DP", "Medium", 30, "maximum-subarray", "recent-report", "Circular maximum-subarray variants were reported in recent SDE-I loops.", "At each index, decide whether to extend the previous segment or restart.", "State what currentBest and globalBest mean, including all-negative input.", ["Maximum circular subarray", "Return the segment boundaries"]),

  dsa("count-univalue", "Count Univalue Subtrees", "good", "Tree postorder", "Medium", 40, "count-univalue-subtrees", "recent-report", "Reported in a 2025 SDE-I round; useful postorder transfer after the tree must-dos.", "A parent result depends on complete validity information from both children.", "Return subtree validity upward while counting exactly once.", ["Largest univalue subtree", "Longest same-value path"]),
  dsa("falling-path", "Minimum Falling Path Sum", "good", "Grid DP", "Medium", 35, "minimum-falling-path-sum", "recent-report", "A maximum-falling-path variation appeared in a 2025 SDE-I loop.", "Each row depends on a small neighborhood in the previous row.", "Define transition boundaries and reduce memory to one row.", ["Maximum falling path", "Blocked cells"]),
  dsa("single-sorted", "Single Element in a Sorted Array", "good", "Binary search", "Medium", 35, "single-element-in-a-sorted-array", "recent-report", "Reported alongside Sliding Window Maximum in a selected 2025 experience.", "Paired indices change parity after the single element.", "Normalize mid to the start of a pair and prove which half contains the break.", ["Every value occurs k times", "Input is not sorted"]),
  dsa("next-permutation", "Next Permutation", "good", "Array / greedy", "Medium", 40, "next-permutation", "recent-report", "The exact problem appeared in a 2026 interview report.", "Find the smallest lexicographic increase using a suffix that is already maximal.", "Explain pivot, successor, and suffix reversal.", ["Previous permutation", "K-th next permutation"]),
  dsa("clone-graph", "Clone Graph", "good", "Graph DFS / BFS", "Medium", 35, "clone-graph", "coverage-anchor", "Tests identity mapping, cycles, and object construction—useful crossover into LLD.", "Copy a cyclic object graph without duplicating the same node twice.", "Map original identity to clone before traversing neighbors.", ["Copy a graph with random pointers", "Preserve edge metadata"]),
  dsa("word-ladder", "Word Ladder", "good", "Implicit-graph BFS", "Hard", 45, "word-ladder", "coverage-anchor", "Strengthens shortest-path modeling when edges are generated rather than stored.", "Minimum transformations imply BFS over an implicit unweighted graph.", "Compare wildcard buckets with testing every possible character.", ["Return every shortest sequence", "Weighted transformation costs"]),
  dsa("accounts-merge", "Accounts Merge", "good", "Union-find / graph", "Medium", 45, "accounts-merge", "coverage-anchor", "Adds connectivity-set coverage without consuming must-do time before core graph traversal.", "Shared attributes connect records into components.", "Defend DFS versus DSU and account for output sorting.", ["Connections are removed", "Merge by multiple identifiers"]),
  dsa("kth-largest", "Kth Largest Element in an Array", "good", "Heap / quickselect", "Medium", 35, "kth-largest-element-in-an-array", "coverage-anchor", "Complements top-K with selection and partition reasoning.", "Need one rank statistic, not a complete ordering.", "Compare heap, sorting, and randomized quickselect.", ["Kth largest in a stream", "Median of a data stream"]),
  dsa("maximal-square", "Maximal Square", "good", "2-D DP", "Medium", 40, "maximal-square", "coverage-anchor", "Builds a non-obvious grid recurrence after the introductory DP set.", "A square ending here is limited by three neighboring squares.", "Derive 1 + min(top, left, diagonal) and explain why all three matter.", ["Largest rectangle", "Return the square coordinates"]),
  dsa("trapping-water", "Trapping Rain Water", "good", "Two pointers", "Hard", 45, "trapping-rain-water", "coverage-anchor", "A strong invariant test after basic pointer problems.", "Water at the lower boundary is determined without knowing the other side's future.", "Prove why moving the smaller maximum is safe.", ["2-D rain water", "Return water at each index"]),
  dsa("subsets", "Subsets", "good", "Backtracking", "Medium", 30, "subsets", "coverage-anchor", "The cleanest decision-tree foundation before harder combination search.", "Every element creates an include/exclude decision.", "Explain why copying the current path is required.", ["Input has duplicates", "Return subsets of size k"]),
  dsa("daily-temperatures", "Daily Temperatures", "good", "Monotonic stack", "Medium", 35, "daily-temperatures", "coverage-anchor", "Adds monotonic-stack coverage with a memorable unresolved-index invariant.", "Each new value resolves earlier smaller values in LIFO order.", "State what indices remain on the stack and why each pops once.", ["Next greater element", "Circular temperatures"]),
  dsa("jump-game", "Jump Game", "good", "Greedy", "Medium", 30, "jump-game", "recent-report", "Jump/DP variants occur in recent SDE-I reports.", "Only the farthest reachable boundary matters for feasibility.", "Prove failure when the current index exceeds farthestReach.", ["Minimum jumps", "Negative jumps are allowed"]),
  dsa("sort-colors", "Sort Colors", "good", "Three pointers", "Medium", 30, "sort-colors", "recent-report", "Bucket-sort and partition variants appear in recent reports.", "A tiny fixed alphabet can be partitioned in place in one pass.", "Maintain the low/mid/high region invariants.", ["Four colors", "Stable partition required"]),

  dsa("median-two", "Median of Two Sorted Arrays", "stretch", "Binary-search partition", "Hard", 55, "median-of-two-sorted-arrays", "recent-report", "A median-of-two-arrays-like question appeared in a selected 2026 experience; high effort, so it stays optional.", "Partition two sorted inputs so left halves contain exactly half the values.", "Derive partition movement from the two cross-boundary inequalities.", ["Kth element of two sorted arrays", "Inputs arrive as streams"]),
  dsa("domino-tromino", "Domino and Tromino Tiling", "stretch", "State-machine DP", "Medium", 50, "domino-and-tromino-tiling", "recent-report", "Reported in a 2026 SDE-I loop, but its specialized recurrence is lower return than core DP.", "Partial board states are required because one column may be overhung.", "Define complete and gapped states before writing recurrence.", ["Different tile shapes", "Blocked cells"]),
  dsa("skyline", "The Skyline Problem", "stretch", "Line sweep + heap", "Hard", 60, "the-skyline-problem", "recent-report", "Line-sweep/heap variants appear in 2026 reports; this is a demanding representative.", "Only event boundaries can change the active maximum height.", "Order start/end events correctly and remove stale heap entries.", ["Maximum concurrent intervals", "Return covered area"]),
  dsa("alien-dictionary", "Alien Dictionary", "stretch", "Graph + topological sort", "Hard", 50, "alien-dictionary", "coverage-anchor", "A harder dependency-ordering transfer after Course Schedule.", "The first differing character in adjacent words creates one ordering edge.", "Handle invalid prefixes, duplicate edges, and cycles.", ["Return every valid order", "Alphabet changes online"]),
  dsa("regex", "Regular Expression Matching", "stretch", "2-D DP", "Hard", 60, "regular-expression-matching", "coverage-anchor", "Deep DP state practice only after the interview-critical core is stable.", "A star changes the transition from one-to-one matching to zero-or-more use.", "Define dp[i][j] and separate star from non-star transitions.", ["Wildcard matching", "Return one matching parse"]),
  dsa("burst-balloons", "Burst Balloons", "stretch", "Interval DP", "Hard", 60, "burst-balloons", "coverage-anchor", "Useful for advanced interval DP, but too costly before must-do mastery.", "Choosing the last action inside an interval makes neighboring values stable.", "Explain why the recurrence chooses the last balloon, not the first.", ["Matrix-chain multiplication", "Return the popping order"]),
  dsa("network-delay", "Network Delay Time", "stretch", "Dijkstra", "Medium", 45, "network-delay-time", "coverage-anchor", "Adds weighted shortest paths after BFS and topological coverage.", "Non-negative weighted edges require settling the cheapest reachable node next.", "State the stale-entry check and final unreachable condition.", ["Negative edges", "Multiple source nodes"]),

  lld("parking-lot", "Design a Parking Lot", "must", 55, "/lesson/parking-lot", "recent-report", "A Parking Lot-like LLD appeared in a 2026 SDE-I report and remains a strong responsibility/allocation baseline.", "Resources of different types are allocated, occupied, released, and billed.", "Defend aggregate boundaries, spot ownership, allocation policy, and ticket lifecycle.", ["Add reservations and EV charging", "Support multiple entrances concurrently"]),
  lld("circular-buffer", "Design a Circular Buffer", "must", 50, "/drill/circular-buffer", "recent-report", "A 2025 SDE-I loop explicitly reported Circular Buffer as the LLD prompt.", "A fixed-capacity structure reuses storage while head and tail wrap around.", "Define empty/full unambiguously and test wraparound, overwrite, and capacity one.", ["Make writes overwrite the oldest item", "Support thread-safe producers and consumers"]),
  lld("lru-cache", "Design an LRU Cache", "must", 55, "/drill/lru-cache", "coverage-anchor", "Exercises class ownership, O(1) API constraints, and an implementation the interviewer can test deeply.", "Recency order and key lookup must change together atomically.", "Assign invariants to Cache, Node, map, and list; walk update and eviction.", ["Add TTL expiration", "Abstract LFU as another eviction policy"]),
  lld("amazon-locker", "Design Amazon Locker", "must", 55, "/lesson/amazon-locker", "coverage-anchor", "Amazon-domain allocation and lifecycle practice with a complete interactive lesson.", "Packages move through allocation, delivery, pickup, expiration, and release.", "Model package/locker states, size policy, pickup-code security, and retries.", ["One order has multiple packages", "Locker is temporarily out of service"]),
  lld("vending-machine", "Design a Vending Machine", "must", 55, "/lesson/vending-machine", "coverage-anchor", "The cleanest SDE-I state-machine prompt for success and failure transitions.", "Behavior changes with money, selection, inventory, dispense, and refund state.", "Defend state ownership and show failed dispense compensation.", ["Accept cards asynchronously", "Multiple product slots share inventory"]),
  lld("elevator", "Design an Elevator System", "must", 55, "/lesson/elevator-system", "coverage-anchor", "Covers request modeling, dispatch policy, movement states, and extensibility.", "Requests originate both inside cars and on floors; scheduling can vary independently.", "Separate Elevator state from Dispatcher policy and handle direction changes.", ["Add emergency/fire mode", "Optimize a high-rise with elevator banks"]),

  lld("coupon", "Design a Discount / Coupon System", "good", 55, "/lesson/discount-coupon-system", "recent-report", "Coupon/discount LLD is reported for Amazon and builds strategy/composition instincts.", "Eligibility, calculation, stacking, limits, and expiry vary independently.", "Use policies without a subclass explosion and define deterministic stacking.", ["Add seller-funded promotions", "Evaluate coupons concurrently"]),
  lld("library", "Design a Library Management System", "good", 50, "/drill/library-management", "coverage-anchor", "A strong transfer prompt for copies, members, loans, reservations, and fines.", "A title and a physical copy have different identities and lifecycles.", "Clarify scope, separate Book from Copy, and own checkout invariants.", ["Add wait-list notifications", "Support multiple branches"]),
  lld("atm", "Design an ATM", "good", 50, "/drill/atm", "coverage-anchor", "Combines a state machine, external services, cash inventory, and unhappy paths.", "Authentication and transaction states gate every operation.", "Model session state, cash dispensing, rollback, and partial hardware failure.", ["Cash dispenser jams after debit", "Support deposits"]),
  lld("file-system", "Design an In-Memory File System", "good", 50, "/drill/file-system", "coverage-anchor", "Exercises composite structure, path resolution, and responsibility placement.", "Files and folders share tree behavior but only some nodes contain children or content.", "Defend composite modeling and path traversal edge cases.", ["Add permissions", "Support symbolic links"]),
  lld("splitwise", "Design Splitwise", "good", 55, "/drill/splitwise", "coverage-anchor", "Useful for domain modeling, money invariants, strategies, and derived balances.", "Expenses are immutable facts while balances are derived across users and groups.", "Model split validation, money precision, settlement, and equal/exact/percentage strategies.", ["Minimize settlement transactions", "Support multiple currencies"]),

  lld("chess", "Design Chess", "stretch", 60, "/lesson/chess-game", "coverage-anchor", "Rich rule modeling, but larger than the usual SDE-I timebox; attempt after core prompts.", "Piece movement, board state, turn validation, and game status evolve separately.", "Keep rule validation extensible without burying everything in Board or Game.", ["Add undo/replay", "Support arbitrary board sizes"]),
  lld("ride-share", "Design a Ride-Sharing Service", "stretch", 60, "/drill/ride-share-dispatch", "coverage-anchor", "A larger eventful domain for testing transfer after resource-allocation prompts.", "Driver availability, trip lifecycle, matching, and pricing are different axes of change.", "Draw lifecycle states and separate matching policy from Trip state.", ["Add pooled rides", "Driver disconnects during pickup"]),
  lld("restaurant", "Design Restaurant Reservations", "stretch", 55, "/drill/restaurant-reservation", "coverage-anchor", "Builds time-slot allocation and double-booking correctness.", "Tables are capacity resources reserved over time under party-size constraints.", "Define the overlap invariant and handle cancellation/no-show transitions.", ["Combine adjacent tables", "Add a wait list"]),
  lld("tic-tac-toe", "Design Tic-Tac-Toe", "stretch", 45, "/drill/tic-tac-toe", "coverage-anchor", "A compact rules prompt for clean APIs and O(1) win detection.", "Moves mutate board state while turn and victory invariants remain valid.", "Place responsibilities and compare board scan with row/column counters.", ["Generalize to n × n and k-in-a-row", "Add undo"]),
];

export const AMAZON_SDE1_15_DAY_PLAN: AmazonPrepDay[] = [
  { day: 1, title: "Hashing under pressure", focus: "Complements and prefix history", minutes: 120, questionIds: ["dsa-two-sum", "dsa-product-except-self", "dsa-subarray-sum-k"], checkpoint: "Say the lookup invariant before touching code." },
  { day: 2, title: "Windows and state", focus: "Forward-only boundaries and historical minima", minutes: 120, questionIds: ["dsa-longest-substring", "dsa-sliding-window-max", "dsa-min-stack"], checkpoint: "Break each solution with duplicates or a boundary case." },
  { day: 3, title: "Ordering work", focus: "Top-K and interval normalization", minutes: 120, questionIds: ["dsa-top-k-frequent", "dsa-merge-intervals", "dsa-insert-interval"], checkpoint: "Choose heap, bucket, or sort from the constraints—not habit." },
  { day: 4, title: "Selection and data-structure design", focus: "Heaps, cooldowns, and O(1) APIs", minutes: 130, questionIds: ["dsa-k-closest", "dsa-task-scheduler", "dsa-lru-cache"], checkpoint: "Name every invariant the data structures jointly maintain." },
  { day: 5, title: "Pointers into trees", focus: "Safe mutation and recursive bounds", minutes: 115, questionIds: ["dsa-reorder-list", "dsa-level-order", "dsa-validate-bst"], checkpoint: "Dry-run odd lengths, null roots, and integer boundaries." },
  { day: 6, title: "Tree signal extraction", focus: "What recursive returns actually mean", minutes: 120, questionIds: ["dsa-lca", "dsa-distance-k", "dsa-path-sum"], checkpoint: "Explain every return value without referring to code syntax." },
  { day: 7, title: "Graph foundations", focus: "Components, spreading, and dependency order", minutes: 125, questionIds: ["dsa-number-islands", "dsa-rotting-oranges", "dsa-course-schedule-ii"], checkpoint: "Choose visited timing and prove you cannot process a node incorrectly twice." },
  { day: 8, title: "Search and backtrack", focus: "Eliminate halves; prune invalid prefixes", minutes: 120, questionIds: ["dsa-search-rotated", "dsa-generate-parentheses", "dsa-word-search"], checkpoint: "State the binary-search or backtracking invariant first." },
  { day: 9, title: "Dynamic programming", focus: "State, transition, base, order", minutes: 120, questionIds: ["dsa-unique-paths-ii", "dsa-house-robber-ii", "dsa-coin-change"], checkpoint: "Write the state sentence before the recurrence." },
  { day: 10, title: "Coding assessment checkpoint", focus: "Kadane plus a timed mixed mock", minutes: 120, questionIds: ["dsa-maximum-subarray"], checkpoint: "Run a 70-minute two-problem mock, then classify every lost minute." },
  { day: 11, title: "LLD ownership", focus: "Resource allocation and fixed-capacity state", minutes: 125, questionIds: ["lld-parking-lot", "lld-circular-buffer"], checkpoint: "Clarify first, then place each invariant beside the object that owns it." },
  { day: 12, title: "LLD performance and lifecycle", focus: "O(1) contracts and package state", minutes: 125, questionIds: ["lld-lru-cache", "lld-amazon-locker"], checkpoint: "Code two core methods and test failure, retry, and capacity boundaries." },
  { day: 13, title: "LLD state and policy", focus: "State machines and replaceable scheduling", minutes: 125, questionIds: ["lld-vending-machine", "lld-elevator"], checkpoint: "Add one new requirement without rewriting the stable classes." },
  { day: 14, title: "Amazon loop rehearsal", focus: "One 70-minute coding mock + one 45-minute LLD mock", minutes: 135, questionIds: [], checkpoint: "Narrate trade-offs, test edge cases, and answer complexity without prompts." },
  { day: 15, title: "Confidence gate", focus: "Redo the two weakest DSA and one weakest LLD from memory", minutes: 135, questionIds: [], checkpoint: "Pass the readiness checklist honestly; schedule misses for the next 1/3/7 days." },
];

export const AMAZON_SDE1_RESEARCH_SOURCES: AmazonResearchSource[] = [
  { id: "amazon-topics", label: "Amazon: software development interview topics", href: "https://www.amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics", kind: "official" },
  { id: "amazon-oa", label: "Amazon: university SDE online assessment", href: "https://amazon.jobs/content/en/how-we-hire/university/sde-oa", kind: "official" },
  { id: "amazon-student", label: "Amazon: software development for students and graduates", href: "https://amazon.jobs/content/en/career-programs/university/sde", kind: "official" },
  { id: "report-feb-2025", label: "Candidate report: February 2025", href: "https://leetcode.com/discuss/post/6461439/amazon-sde-1-feb-2025-interview-/", kind: "candidate-report" },
  { id: "report-sep-2025", label: "Candidate report: September 2025", href: "https://leetcode.com/discuss/post/7154883/", kind: "candidate-report" },
  { id: "report-circular-2025", label: "Candidate report: Circular Buffer / Min Stack", href: "https://www.reddit.com/r/leetcode/comments/1nl7oij/amazon_sde_1_interview_experience/", kind: "candidate-report" },
  { id: "report-2026-trees", label: "Candidate report: March 2026", href: "https://leetcode.com/discuss/post/8029194/", kind: "candidate-report" },
  { id: "report-2026-graphs", label: "Candidate report: June 2026", href: "https://www.reddit.com/r/leetcode/comments/1u0yzoq/amazon_sde1_interview_experience_2026_4_rounds_2/", kind: "candidate-report" },
];

export const AMAZON_PREP_TIER_LABELS: Record<AmazonPrepTier, string> = {
  must: "Must-do",
  good: "Good-to-do",
  stretch: "If time permits",
};

export const AMAZON_PREP_SIGNAL_LABELS: Record<AmazonPrepSignal, string> = {
  "repeated-report": "Repeated recent signal",
  "recent-report": "Recent reported signal",
  "coverage-anchor": "Core coverage",
};

/** Exact problem-to-mission bridges; near matches are deliberately omitted. */
export const AMAZON_COMBAT_MISSION_BY_QUESTION: Partial<Record<string, CodingCombatMissionId>> = {
  "dsa-two-sum": "pair-sum-map",
  "dsa-longest-substring": "unique-window",
  "dsa-merge-intervals": "merge-intervals",
  "dsa-insert-interval": "insert-interval",
  "dsa-k-closest": "k-closest-points",
  "dsa-number-islands": "number-of-islands",
  "dsa-rotting-oranges": "rotting-oranges",
  "dsa-unique-paths-ii": "unique-paths-obstacles",
  "dsa-search-rotated": "rotated-search",
  "dsa-reorder-list": "reorder-list",
  "dsa-level-order": "tree-level-order",
  "dsa-validate-bst": "validate-bst",
  "dsa-lca": "lowest-common-ancestor",
  "dsa-distance-k": "distance-k-tree",
  "dsa-path-sum": "path-sum-tree",
  "dsa-sliding-window-max": "sliding-window-max",
};

export function getAmazonCombatMissionId(questionId: string): CodingCombatMissionId | undefined {
  return AMAZON_COMBAT_MISSION_BY_QUESTION[questionId];
}

export function getAmazonPrepQuestion(id: string): AmazonPrepQuestion | undefined {
  return AMAZON_SDE1_QUESTIONS.find((question) => question.id === id);
}

export function isExternalPrepHref(href: string): boolean {
  return href.startsWith("https://");
}
