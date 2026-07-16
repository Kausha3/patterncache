import type { ArenaChallenge, ArenaMode } from "./types";

export const ARENA_MODE_META: Record<ArenaMode, {
  label: string;
  kicker: string;
  description: string;
  skills: string[];
}> = {
  coding: {
    label: "Pattern Combat",
    kicker: "Timed coding recognition",
    description: "Read the constraints, identify the invariant, and commit before the clock drains.",
    skills: ["pattern signal", "complexity", "invariants"],
  },
  hld: {
    label: "Incident Command",
    kicker: "Production system failures",
    description: "Stabilize a live system by choosing the smallest correct intervention under pressure.",
    skills: ["failure modes", "tradeoffs", "operations"],
  },
  lld: {
    label: "Model Defense",
    kicker: "Object-design boss fight",
    description: "Protect class boundaries, state transitions, and extensibility as requirements mutate.",
    skills: ["responsibility", "state", "extensibility"],
  },
};

export const ARENA_CHALLENGES: Record<ArenaMode, ArenaChallenge[]> = {
  coding: [
    {
      id: "coding-target-pair",
      mode: "coding",
      title: "Target Pair Intercept",
      signal: "sorted input · pair sum · constant extra space",
      context: "A sorted telemetry stream contains negative and positive values. You need two values whose sum equals the target.",
      prompt: "Which approach satisfies O(n) time and O(1) extra space—and what makes it safe?",
      seconds: 45,
      takeaway: "Sorted order gives a monotonic decision: a small sum can only improve by moving left forward; a large sum can only improve by moving right backward.",
      visualNodes: [
        { id: "left", label: "L: -8", kind: "input", detail: "Smallest remaining value", critical: true },
        { id: "mid-a", label: "-2", kind: "input", detail: "Candidate value" },
        { id: "mid-b", label: "5", kind: "input", detail: "Candidate value" },
        { id: "right", label: "R: 13", kind: "input", detail: "Largest remaining value", critical: true },
      ],
      choices: [
        { id: "nested", label: "Try every pair with two nested loops", correct: false, feedback: "It uses constant space, but O(n²) ignores the strongest clue: the array is sorted." },
        { id: "hash", label: "Scan once and store every complement in a hash set", correct: false, feedback: "That reaches O(n) time but spends O(n) extra space, violating the explicit constraint." },
        { id: "pointers", label: "Place pointers at both ends and move the side implied by the current sum", correct: true, feedback: "Correct. Sorted order makes each move eliminate an impossible region without discarding a valid pair." },
      ],
    },
    {
      id: "coding-window-breach",
      mode: "coding",
      title: "Window Breach",
      signal: "longest contiguous range · no repeated characters",
      context: "A request signature must contain the longest contiguous run with no duplicate character.",
      prompt: "What state lets you process the string once while preserving a valid candidate range?",
      seconds: 45,
      takeaway: "The invariant is not 'the window is large'; it is 'the window contains no duplicates.' Shrink only until that invariant is restored.",
      visualNodes: [
        { id: "stream", label: "a b c a", kind: "input", detail: "Incoming character stream" },
        { id: "window", label: "[b c a]", kind: "compute", detail: "Current valid window", critical: true },
        { id: "seen", label: "lastSeen", kind: "cache", detail: "Most recent character index" },
        { id: "best", label: "best = 3", kind: "data", detail: "Longest valid range" },
      ],
      choices: [
        { id: "fixed", label: "Use a fixed-size window and test every size", correct: false, feedback: "The valid length changes with the data. Guessing sizes adds repeated work and loses the one-pass property." },
        { id: "dynamic", label: "Expand right, track last-seen positions, and move left past any duplicate", correct: true, feedback: "Correct. Each pointer moves forward only, so the validity invariant is restored in O(n) total time." },
        { id: "sort", label: "Sort the characters first, then count unique values", correct: false, feedback: "Sorting destroys contiguity, which is the central requirement of the problem." },
      ],
    },
    {
      id: "coding-shortest-route",
      mode: "coding",
      title: "Shortest Route Lock",
      signal: "unweighted graph · minimum number of edges",
      context: "Services form an unweighted dependency graph. You need the fewest hops from Checkout to Inventory.",
      prompt: "Which traversal proves the first discovered route is the shortest?",
      seconds: 40,
      takeaway: "BFS explores the graph in distance layers. The first time a node is reached, no undiscovered route can use fewer edges.",
      visualNodes: [
        { id: "checkout", label: "Checkout", kind: "compute", detail: "Distance 0", critical: true },
        { id: "order", label: "Order", kind: "compute", detail: "Distance 1" },
        { id: "payment", label: "Payment", kind: "compute", detail: "Distance 1" },
        { id: "inventory", label: "Inventory", kind: "data", detail: "Target service", critical: true },
      ],
      choices: [
        { id: "dfs", label: "Depth-first search; stop at the first route found", correct: false, feedback: "DFS may follow a deep branch first. Its first route has no shortest-path guarantee." },
        { id: "dijkstra", label: "Dijkstra with a priority queue", correct: false, feedback: "It works, but all edges have equal cost, so the priority queue adds machinery without adding correctness." },
        { id: "bfs", label: "Breadth-first search with a queue and visited set", correct: true, feedback: "Correct. Level-order exploration makes the first visit to Inventory the minimum-hop route." },
      ],
    },
  ],
  hld: [
    {
      id: "hld-double-charge",
      mode: "hld",
      title: "Double-Charge Incident",
      signal: "client timeout · retry · non-idempotent side effect",
      context: "During a Prime Day spike, Checkout times out after Payment succeeds. The client retries and some customers are charged twice.",
      prompt: "What is the smallest durable fix at the boundary where money changes state?",
      seconds: 50,
      takeaway: "Retries are unavoidable. Make the side effect idempotent by storing a caller-stable key with the payment result and returning that result for every retry.",
      visualNodes: [
        { id: "client", label: "Client", kind: "input", detail: "Retries after timeout" },
        { id: "checkout", label: "Checkout", kind: "compute", detail: "Orchestrates order" },
        { id: "payment", label: "Payment", kind: "compute", detail: "Charges customer", critical: true },
        { id: "ledger", label: "Payment Ledger", kind: "data", detail: "Durable idempotency record", critical: true },
      ],
      choices: [
        { id: "lock", label: "Put a global distributed lock around all checkout requests", correct: false, feedback: "A global lock destroys throughput and still does not give a timed-out client a durable answer after the lock is released." },
        { id: "idempotency", label: "Require an idempotency key and atomically store key → payment result", correct: true, feedback: "Correct. Every retry converges on the same durable result, even across process crashes and network timeouts." },
        { id: "no-retry", label: "Disable client retries and show an error after any timeout", correct: false, feedback: "That replaces duplicate charges with abandoned successful orders. Networks fail; the operation must tolerate retries." },
      ],
    },
    {
      id: "hld-cache-stampede",
      mode: "hld",
      title: "Cache Stampede",
      signal: "hot key · synchronized expiry · database saturation",
      context: "A product-detail key expires at noon. Thousands of requests miss together and overwhelm the database.",
      prompt: "Which response protects the database without serving stale data forever?",
      seconds: 50,
      takeaway: "Combine request coalescing with TTL jitter and bounded stale-while-revalidate. The goal is one refresh, not thousands of identical refreshes.",
      visualNodes: [
        { id: "traffic", label: "40k req/s", kind: "input", detail: "Synchronized hot-key traffic", critical: true },
        { id: "cache", label: "Cache MISS", kind: "cache", detail: "Popular key expired", critical: true },
        { id: "coalescer", label: "Single Flight", kind: "async", detail: "One refresh in flight" },
        { id: "database", label: "Catalog DB", kind: "data", detail: "Protected origin" },
      ],
      choices: [
        { id: "scale-db", label: "Immediately add enough database replicas for every miss", correct: false, feedback: "It treats a coordination bug as permanent capacity demand and can still fail before replicas are ready." },
        { id: "coalesce", label: "Coalesce refreshes, jitter expiries, and allow bounded stale reads", correct: true, feedback: "Correct. It removes synchronized work while keeping freshness bounded and origin load predictable." },
        { id: "no-ttl", label: "Remove TTLs so the cache never expires", correct: false, feedback: "That prevents the spike by making stale data permanent, which breaks correctness for changing product data." },
      ],
    },
    {
      id: "hld-celebrity-fanout",
      mode: "hld",
      title: "Celebrity Fan-Out Meltdown",
      signal: "fan-out on write · extreme follower skew",
      context: "A creator with 80 million followers posts. Precomputing every follower feed creates a queue backlog measured in hours.",
      prompt: "How do you preserve fast reads for normal users without making celebrity writes explosive?",
      seconds: 50,
      takeaway: "Skew demands a hybrid: fan out normal accounts on write, but merge celebrity posts into feeds on read and cache the result.",
      visualNodes: [
        { id: "author", label: "Creator", kind: "input", detail: "80M followers", critical: true },
        { id: "events", label: "Post Events", kind: "async", detail: "Fan-out work queue" },
        { id: "feeds", label: "Feed Store", kind: "data", detail: "Precomputed normal feeds" },
        { id: "merge", label: "Read Merge", kind: "compute", detail: "Pulls celebrity posts", critical: true },
      ],
      choices: [
        { id: "write-all", label: "Keep fan-out on write and add more queue workers", correct: false, feedback: "Worker count does not remove the 80-million-write amplification or its cost and recovery backlog." },
        { id: "read-all", label: "Switch every account to fan-out on read", correct: false, feedback: "That fixes celebrity writes but makes every normal feed read perform expensive multi-source assembly." },
        { id: "hybrid", label: "Push normal accounts on write; merge high-fanout authors on read", correct: true, feedback: "Correct. The design treats the skewed minority differently while preserving cheap reads for the majority." },
      ],
    },
  ],
  lld: [
    {
      id: "lld-parking-ownership",
      mode: "lld",
      title: "Responsibility Breach",
      signal: "method ownership · data locality · single responsibility",
      context: "ParkingLot currently mutates ParkingSpot.isOccupied directly when assigning and releasing vehicles.",
      prompt: "Where should occupancy mutation live, and what should ParkingLot still own?",
      seconds: 50,
      takeaway: "The object holding the invariant should protect it. ParkingSpot owns assign/release; ParkingLot coordinates search across levels and spots.",
      visualNodes: [
        { id: "lot", label: "ParkingLot", kind: "entity", detail: "Coordinates allocation" },
        { id: "level", label: "Level", kind: "entity", detail: "Groups spots" },
        { id: "spot", label: "ParkingSpot", kind: "entity", detail: "Owns occupancy", critical: true },
        { id: "vehicle", label: "Vehicle", kind: "entity", detail: "Carries size" },
      ],
      choices: [
        { id: "lot-all", label: "Keep every mutation in ParkingLot so behavior is centralized", correct: false, feedback: "Centralized is not cohesive. ParkingLot becomes a god object that reaches into data another object owns." },
        { id: "spot-own", label: "ParkingSpot owns assign/release; ParkingLot finds the correct spot", correct: true, feedback: "Correct. Mutation stays beside the occupancy invariant, while orchestration stays at the aggregate level." },
        { id: "vehicle", label: "Vehicle decides which spot to occupy and mutates it", correct: false, feedback: "Vehicle does not own lot capacity or spot state. It is the subject of allocation, not the allocator." },
      ],
    },
    {
      id: "lld-coupon-extension",
      mode: "lld",
      title: "Coupon Rule Mutation",
      signal: "new discount behavior · avoid conditional explosion",
      context: "Percentage, fixed-amount, and buy-one-get-one coupons now have different calculation and eligibility rules.",
      prompt: "Which model lets new coupon types ship without rewriting a growing switch statement?",
      seconds: 50,
      takeaway: "Compose a Coupon from calculation and eligibility policies. New behavior becomes a new strategy implementation, not another branch in a central engine.",
      visualNodes: [
        { id: "coupon", label: "Coupon", kind: "entity", detail: "Configuration and lifecycle" },
        { id: "engine", label: "CouponEngine", kind: "compute", detail: "Coordinates evaluation" },
        { id: "discount", label: "DiscountPolicy", kind: "rule", detail: "Calculates amount", critical: true },
        { id: "eligibility", label: "EligibilityPolicy", kind: "rule", detail: "Approves context", critical: true },
      ],
      choices: [
        { id: "switch", label: "Add one switch branch per coupon type inside CouponEngine", correct: false, feedback: "Every new type forces edits to the same class and combines unrelated calculation rules into one growing method." },
        { id: "subclasses", label: "Create a deep Coupon subclass tree for every combination", correct: false, feedback: "Calculation and eligibility vary independently, so inheritance produces a combinatorial subclass explosion." },
        { id: "policies", label: "Compose Coupon with DiscountPolicy and EligibilityPolicy strategies", correct: true, feedback: "Correct. Independent axes of change stay independent, and the engine depends on stable interfaces." },
      ],
    },
    {
      id: "lld-vending-compensation",
      mode: "lld",
      title: "Dispense Failure",
      signal: "state machine · side-effect failure · compensation",
      context: "Payment succeeds, but the dispenser jams before the product drops. The current code still marks the transaction complete.",
      prompt: "What state transition preserves the customer and inventory invariants?",
      seconds: 45,
      takeaway: "A side effect can fail after payment. Transition to a failure/refund state, compensate the charge, and do not decrement inventory until dispense succeeds.",
      visualNodes: [
        { id: "selected", label: "Selected", kind: "rule", detail: "Product chosen" },
        { id: "paid", label: "Paid", kind: "rule", detail: "Funds captured", critical: true },
        { id: "dispense", label: "Dispensing", kind: "compute", detail: "Hardware side effect" },
        { id: "refund", label: "Refunded", kind: "rule", detail: "Compensating state", critical: true },
      ],
      choices: [
        { id: "complete", label: "Mark complete because payment already succeeded", correct: false, feedback: "That charges the customer for an undelivered product and corrupts inventory truth." },
        { id: "retry-forever", label: "Stay in Dispensing and retry forever", correct: false, feedback: "An unbounded retry can trap the machine and customer in a permanent intermediate state." },
        { id: "compensate", label: "Move to failure/refund, compensate payment, and preserve inventory", correct: true, feedback: "Correct. The state machine makes the unhappy path explicit and restores the externally visible invariant." },
      ],
    },
  ],
};

