export const PATTERN_GENOME_MISSION_IDS = [
  "subarray-sum",
  "weighted-route",
  "dependency-order",
  "circular-greater",
] as const;

export type PatternGenomeMissionId = (typeof PATTERN_GENOME_MISSION_IDS)[number];
export type GenomeSignalIcon = "segment" | "target" | "range" | "speed" | "positive" | "sorted" | "graph" | "weight" | "directed" | "dependency" | "stack" | "circular";

export interface GenomeSignal {
  id: string;
  label: string;
  detail: string;
  icon: GenomeSignalIcon;
  required: boolean;
}

export interface GenomeChoice {
  id: string;
  label: string;
  detail: string;
  correct: boolean;
  feedback: string;
}

export interface PatternGenomeMission {
  id: PatternGenomeMissionId;
  order: number;
  title: string;
  callSign: string;
  difficulty: "Foundation" | "Interview" | "Advanced";
  problem: string;
  objective: string;
  signals: GenomeSignal[];
  invariantPrompt: string;
  invariantChoices: GenomeChoice[];
  invariantName: string;
  invariantFormula: string;
  invariantExplanation: string;
  originalPattern: string;
  mutation: {
    headline: string;
    detail: string;
    removedSignalId?: string;
    prompt: string;
    choices: GenomeChoice[];
  };
  survivingPattern: string;
  dataStructure: string;
  rejectedPattern: string;
  rejectedReason: string;
  transfer: {
    theme: string;
    title: string;
    prompt: string;
    signals: string[];
    choices: GenomeChoice[];
    explanation: string;
  };
  recallCue: string;
}

export const PATTERN_GENOME_MISSIONS: PatternGenomeMission[] = [
  {
    id: "subarray-sum",
    order: 1,
    title: "Subarray Signal",
    callSign: "Genome 01 · Prefix memory",
    difficulty: "Foundation",
    problem: "Count the number of contiguous subarrays whose sum equals k.",
    objective: "Find the pattern that survives when the input stops being friendly.",
    signals: [
      { id: "contiguous", label: "Contiguous segment", detail: "The answer spans one unbroken range", icon: "segment", required: true },
      { id: "target-equality", label: "Target sum equals k", detail: "An exact equality, not a maximum", icon: "target", required: true },
      { id: "variable-range", label: "Variable range", detail: "The left and right boundary can both move", icon: "range", required: true },
      { id: "single-pass", label: "Single pass preferred", detail: "O(n) is the interview target", icon: "speed", required: true },
      { id: "non-negative", label: "Values non-negative", detail: "Tempting, but not guaranteed after mutation", icon: "positive", required: false },
      { id: "sorted", label: "Sorted values", detail: "The array order cannot be changed", icon: "sorted", required: false },
    ],
    invariantPrompt: "Which relationship stays true for every valid subarray?",
    invariantChoices: [
      {
        id: "prefix-difference",
        label: "prefix[j] − prefix[i] = k",
        detail: "A subarray is the difference between two cumulative sums.",
        correct: true,
        feedback: "Exactly. Reframe the range as two prefix states: if currentPrefix − k was seen before, every occurrence starts a valid subarray.",
      },
      {
        id: "window-direction",
        label: "Move left when the sum is too large",
        detail: "Assumes shrinking always decreases the sum.",
        correct: false,
        feedback: "That is a sliding-window rule, not an invariant. Negative values can make shrinking increase the sum.",
      },
      {
        id: "sorted-pair",
        label: "Two sorted endpoints sum to k",
        detail: "Treat the array like a pair-search problem.",
        correct: false,
        feedback: "Sorting destroys contiguity, so the endpoints no longer describe the original subarray.",
      },
    ],
    invariantName: "Prefix Sum Invariant",
    invariantFormula: "prefix[j] − prefix[i] = k",
    invariantExplanation: "Subarray sum depends only on the difference between two prefix states.",
    originalPattern: "Sliding Window",
    mutation: {
      headline: "Values may be negative",
      detail: "Monotonic sums no longer hold. Expanding can decrease the sum; shrinking can increase it.",
      removedSignalId: "non-negative",
      prompt: "Which implementation still preserves the invariant in one pass?",
      choices: [
        {
          id: "sliding-window",
          label: "Sliding Window + two pointers",
          detail: "Shrink whenever the running sum exceeds k.",
          correct: false,
          feedback: "Mutation breach: the direction rule fails with negative numbers, so a valid range can be skipped.",
        },
        {
          id: "prefix-map",
          label: "Prefix Sum + frequency map",
          detail: "Count how often currentPrefix − k has appeared.",
          correct: true,
          feedback: "Pattern survived. The hash map stores prefix history, so negatives do not affect correctness and the scan remains O(n).",
        },
        {
          id: "sort-prefixes",
          label: "Sort all prefix sums",
          detail: "Search for pairs with difference k.",
          correct: false,
          feedback: "Sorting loses the ordering needed to guarantee i < j and also gives away the one-pass target.",
        },
      ],
    },
    survivingPattern: "Prefix Sum",
    dataStructure: "Hash Map",
    rejectedPattern: "Sliding Window",
    rejectedReason: "Requires monotonicity",
    transfer: {
      theme: "Marketplace ledger",
      title: "Profit / Loss Streaks",
      prompt: "A seller's daily profit and loss values can be positive or negative. Count contiguous periods whose net change equals a target.",
      signals: ["contiguous period", "exact target", "signed values", "count all ranges"],
      choices: [
        { id: "transfer-prefix", label: "Prefix Sum + frequency map", detail: "Remember earlier cumulative balances.", correct: true, feedback: "Same genome. The business story changed; the prefix-difference invariant did not." },
        { id: "transfer-window", label: "Fixed Sliding Window", detail: "Keep one window size.", correct: false, feedback: "There is no fixed range length, and signed values break directional movement." },
        { id: "transfer-kadane", label: "Kadane's Algorithm", detail: "Track the best sum so far.", correct: false, feedback: "Kadane optimizes one maximum; this problem counts every exact-target range." },
      ],
      explanation: "Whenever you see contiguous + exact sum + signed values, think: current prefix needs an earlier prefix of current − target.",
    },
    recallCue: "Exact range sum with negatives → remember prefix history, not window direction.",
  },
  {
    id: "weighted-route",
    order: 2,
    title: "Route Mutation",
    callSign: "Genome 02 · Frontier priority",
    difficulty: "Interview",
    problem: "Find the cheapest route from one service node to every other node.",
    objective: "Separate hop count from true cost before choosing a traversal.",
    signals: [
      { id: "graph", label: "Connected states", detail: "Locations are nodes joined by routes", icon: "graph", required: true },
      { id: "min-cost", label: "Minimum total cost", detail: "Optimize accumulated cost, not hops", icon: "target", required: true },
      { id: "nonnegative-edges", label: "Costs are non-negative", detail: "A settled cheapest path stays settled", icon: "positive", required: true },
      { id: "sparse", label: "Sparse route map", detail: "Adjacency lists avoid a dense matrix", icon: "range", required: true },
      { id: "unweighted", label: "Every edge costs one", detail: "That would reduce the problem to BFS", icon: "weight", required: false },
      { id: "sorted-nodes", label: "Node IDs are sorted", detail: "Labels do not control route cost", icon: "sorted", required: false },
    ],
    invariantPrompt: "When is it safe to finalize the next node's distance?",
    invariantChoices: [
      { id: "min-frontier", label: "Finalize the smallest frontier distance", detail: "No unvisited path can improve it with non-negative edges.", correct: true, feedback: "Correct. The minimum tentative distance is safe because every future extension adds a non-negative cost." },
      { id: "first-seen", label: "Finalize the first time a node is seen", detail: "The BFS rule.", correct: false, feedback: "First seen only means fewest hops. A later route can use more edges and still cost less." },
      { id: "largest-edge", label: "Avoid the largest outgoing edge", detail: "A local greedy shortcut.", correct: false, feedback: "Local edge size does not determine the cheapest total path." },
    ],
    invariantName: "Minimum Frontier Invariant",
    invariantFormula: "settle min(dist[u])",
    invariantExplanation: "Always expand the unsettled state with the lowest known total cost.",
    originalPattern: "Breadth-First Search",
    mutation: {
      headline: "Routes have different costs",
      detail: "Fewest hops is no longer the same as cheapest route.",
      removedSignalId: "unweighted",
      prompt: "Which pattern preserves minimum-frontier ordering?",
      choices: [
        { id: "plain-bfs", label: "BFS + queue", detail: "Process in hop layers.", correct: false, feedback: "A FIFO queue orders by discovery time, not by total path cost." },
        { id: "dijkstra", label: "Dijkstra + min heap", detail: "Pop the smallest tentative distance first.", correct: true, feedback: "Pattern survived. The heap enforces the invariant efficiently: O((V + E) log V)." },
        { id: "dfs", label: "DFS + visited set", detail: "Explore one route fully.", correct: false, feedback: "Traversal depth has no relationship to minimum cost." },
      ],
    },
    survivingPattern: "Dijkstra",
    dataStructure: "Min Heap",
    rejectedPattern: "Plain BFS",
    rejectedReason: "Orders by hops, not cost",
    transfer: {
      theme: "Deployment network",
      title: "Lowest-Latency Rollout",
      prompt: "Services have non-negative propagation delays. Find the earliest time a release reaches every service.",
      signals: ["weighted graph", "non-negative delay", "minimum arrival", "all nodes"],
      choices: [
        { id: "transfer-dijkstra", label: "Dijkstra + min heap", detail: "Expand earliest arrival first.", correct: true, feedback: "Same genome: delivery price became network delay, but the minimum frontier remains the invariant." },
        { id: "transfer-topo", label: "Topological sort", detail: "Process dependencies once.", correct: false, feedback: "The network is not guaranteed to be acyclic." },
        { id: "transfer-union", label: "Union-Find", detail: "Merge connected services.", correct: false, feedback: "Connectivity alone cannot calculate the minimum arrival time." },
      ],
      explanation: "Weighted graph + non-negative cost + shortest total path is Dijkstra territory; the heap is the invariant enforcer.",
    },
    recallCue: "If the frontier has different prices, FIFO becomes a min heap.",
  },
  {
    id: "dependency-order",
    order: 3,
    title: "Dependency Reactor",
    callSign: "Genome 03 · Prerequisite release",
    difficulty: "Interview",
    problem: "Return a valid build order for packages with prerequisite relationships.",
    objective: "Recognize when an ordering problem is really a graph release process.",
    signals: [
      { id: "directed", label: "Directed relationship", detail: "A prerequisite points toward its dependent", icon: "directed", required: true },
      { id: "all-nodes", label: "Order every package", detail: "The result must include the full graph", icon: "graph", required: true },
      { id: "prerequisites", label: "Prerequisites first", detail: "A node unlocks only after dependencies", icon: "dependency", required: true },
      { id: "cycle-risk", label: "Cycles may invalidate", detail: "A loop means no valid order", icon: "circular", required: true },
      { id: "weighted", label: "Edges have costs", detail: "No optimization value is attached", icon: "weight", required: false },
      { id: "lexicographic", label: "Alphabetical order required", detail: "Any valid order is acceptable", icon: "sorted", required: false },
    ],
    invariantPrompt: "Which nodes are safe to release into the build order?",
    invariantChoices: [
      { id: "zero-indegree", label: "Only nodes with zero remaining prerequisites", detail: "Removing one may unlock more nodes.", correct: true, feedback: "Correct. Every emitted node is currently dependency-free; decrementing neighbors preserves the rule." },
      { id: "smallest-name", label: "Always emit the smallest package name", detail: "A stable display order.", correct: false, feedback: "A small name can still have unmet prerequisites." },
      { id: "most-dependents", label: "Emit the node with most dependents", detail: "Try to unlock the graph quickly.", correct: false, feedback: "Popularity does not make a node safe; its own prerequisites decide that." },
    ],
    invariantName: "Prerequisite Release Invariant",
    invariantFormula: "emit only indegree = 0",
    invariantExplanation: "Every emitted node has no unresolved prerequisite in the remaining graph.",
    originalPattern: "Repeated Scanning",
    mutation: {
      headline: "A dependency cycle may exist",
      detail: "The algorithm must prove whether all packages can be released.",
      prompt: "Which implementation exposes both a valid order and cycle failure?",
      choices: [
        { id: "kahn", label: "Topological sort (Kahn) + queue", detail: "Release indegree-zero nodes and count output.", correct: true, feedback: "Pattern survived. If fewer than V nodes are emitted, unresolved indegrees form a cycle." },
        { id: "sort", label: "Sort packages by prerequisite count", detail: "Compute counts once, then sort.", correct: false, feedback: "Indegrees change after each release; sorting one snapshot does not propagate unlocks." },
        { id: "union-find", label: "Union-Find", detail: "Merge packages connected by dependencies.", correct: false, feedback: "Union-Find discards edge direction, which is the core ordering signal." },
      ],
    },
    survivingPattern: "Topological Sort",
    dataStructure: "Queue + Indegree",
    rejectedPattern: "One-time Sort",
    rejectedReason: "Ignores changing prerequisites",
    transfer: {
      theme: "Course planner",
      title: "Semester Schedule",
      prompt: "Courses list prerequisite courses. Produce an order to finish all courses, or report that the plan is impossible.",
      signals: ["directed graph", "prerequisites", "full ordering", "cycle invalidates"],
      choices: [
        { id: "transfer-topo", label: "Topological sort", detail: "Release courses with zero prerequisites.", correct: true, feedback: "Same genome. Packages became courses; prerequisite release still defines correctness." },
        { id: "transfer-bfs", label: "BFS from course zero", detail: "Visit by distance from one node.", correct: false, feedback: "There may be many starting nodes, and distance is not the objective." },
        { id: "transfer-dijkstra", label: "Dijkstra", detail: "Minimize the path cost.", correct: false, feedback: "There are no edge costs to optimize." },
      ],
      explanation: "When items must appear after directed prerequisites, model indegrees and repeatedly release zero-indegree nodes.",
    },
    recallCue: "Ordering after prerequisites → release indegree zero; count releases to detect a cycle.",
  },
  {
    id: "circular-greater",
    order: 4,
    title: "Circular Skyline",
    callSign: "Genome 04 · Deferred answers",
    difficulty: "Advanced",
    problem: "For each temperature, find the next later temperature that is warmer.",
    objective: "Use unresolved candidates as memory, then survive a circular input mutation.",
    signals: [
      { id: "next", label: "Nearest future match", detail: "The first later valid value wins", icon: "target", required: true },
      { id: "comparison", label: "Greater-than condition", detail: "Candidates are resolved by a warmer value", icon: "range", required: true },
      { id: "all-items", label: "Answer for every item", detail: "Unresolved items receive no match", icon: "stack", required: true },
      { id: "linear", label: "Linear target", detail: "Avoid scanning the suffix per item", icon: "speed", required: true },
      { id: "sorted", label: "Input is sorted", detail: "Temperatures arrive in original order", icon: "sorted", required: false },
      { id: "fixed-gap", label: "Answer is one step away", detail: "The warmer day may be much later", icon: "positive", required: false },
    ],
    invariantPrompt: "What should remain on the unresolved-candidate structure?",
    invariantChoices: [
      { id: "decreasing-stack", label: "Indices with decreasing temperatures", detail: "The current warmer value resolves smaller values on top.", correct: true, feedback: "Correct. Every index on the stack is still waiting, and temperatures decrease toward the top." },
      { id: "all-values", label: "Every temperature seen so far", detail: "Preserve full history.", correct: false, feedback: "Full history does not expose the next unresolved candidate efficiently." },
      { id: "increasing-queue", label: "Increasing values in a queue", detail: "Resolve the oldest value first.", correct: false, feedback: "Resolution depends on value order, not arrival order; FIFO cannot pop dominated candidates." },
    ],
    invariantName: "Monotonic Stack Invariant",
    invariantFormula: "stack values decrease",
    invariantExplanation: "The stack holds only unresolved indices; a greater value resolves smaller items from the top.",
    originalPattern: "Monotonic Stack",
    mutation: {
      headline: "The array becomes circular",
      detail: "After the last item, the search may wrap to the beginning, but an item cannot answer itself.",
      prompt: "How does the pattern survive without duplicating the array?",
      choices: [
        { id: "double-pass", label: "Monotonic stack + 2n modulo scan", detail: "Push only during the first pass; use the second to resolve.", correct: true, feedback: "Pattern survived. Modulo simulates wraparound while the first-pass-only push prevents duplicate candidates." },
        { id: "sort-values", label: "Sort values and use binary search", detail: "Find the next greater value globally.", correct: false, feedback: "The nearest future position matters; sorting destroys circular order." },
        { id: "restart-each", label: "Restart a scan for every item", detail: "Walk until a greater value appears.", correct: false, feedback: "Correct but O(n²); it abandons the invariant instead of adapting it." },
      ],
    },
    survivingPattern: "Monotonic Stack",
    dataStructure: "Index Stack",
    rejectedPattern: "Nested Scan",
    rejectedReason: "Repeats unresolved work",
    transfer: {
      theme: "Warehouse carousel",
      title: "Next Taller Package",
      prompt: "Packages move on a circular conveyor. For each package, find the next package ahead that is taller.",
      signals: ["next greater", "circular order", "nearest match", "all positions"],
      choices: [
        { id: "transfer-stack", label: "Monotonic stack + double scan", detail: "Keep unresolved indices and wrap with modulo.", correct: true, feedback: "Same genome. Temperatures became packages; deferred next-greater answers stayed identical." },
        { id: "transfer-heap", label: "Max heap", detail: "Always inspect the tallest package.", correct: false, feedback: "A heap loses the nearest-ahead ordering." },
        { id: "transfer-window", label: "Sliding window", detail: "Maintain a moving local range.", correct: false, feedback: "The answer range has no fixed bound and candidates resolve individually." },
      ],
      explanation: "Next/previous greater or smaller often means a monotonic stack; circularity usually adds a simulated second pass.",
    },
    recallCue: "Next greater → unresolved decreasing stack; circular → read twice, push once.",
  },
];

export function getPatternGenomeMission(id: PatternGenomeMissionId): PatternGenomeMission {
  return PATTERN_GENOME_MISSIONS.find((mission) => mission.id === id) ?? PATTERN_GENOME_MISSIONS[0];
}
