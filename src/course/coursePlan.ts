export type CourseLength = 15 | 30;
export type TargetLevel = "L4" | "L5" | "L6";
export type CourseTaskKind = "lesson" | "coding" | "design" | "behavioral" | "review" | "mock";

export interface CoursePreferences {
  company: "amazon";
  level: TargetLevel;
  length: CourseLength;
  dailyMinutes: number;
  startDate: string;
  interviewDate?: string;
}

export interface CourseTask {
  id: string;
  title: string;
  description: string;
  minutes: number;
  kind: CourseTaskKind;
  lessonId?: string;
  route?: string;
}

export interface CourseDay {
  day: number;
  title: string;
  focus: string;
  tasks: CourseTask[];
}

function lesson(id: string, title: string, minutes: number, description: string): CourseTask {
  return { id: `lesson-${id}`, title, description, minutes, kind: "lesson", lessonId: id, route: `/lesson/${id}` };
}

function task(
  id: string,
  title: string,
  minutes: number,
  description: string,
  kind: Exclude<CourseTaskKind, "lesson">,
  route?: string,
): CourseTask {
  return { id, title, description, minutes, kind, route };
}

const starStory = (id: string, principle: string): CourseTask =>
  task(
    `story-${id}`,
    `${principle} story`,
    15,
    "Write a metric-backed STAR outline, then answer two likely follow-up questions out loud.",
    "behavioral",
  );

const SPRINT_15: CourseDay[] = [
  {
    day: 1,
    title: "Set the baseline",
    focus: "Measure the real gap before studying",
    tasks: [
      task("d1-coding", "45-minute coding diagnostic", 45, "Solve one medium problem without hints. Record pattern, misses, complexity, and tests.", "coding", "/companies/amazon/sde1"),
      task("d1-design", "45-minute design diagnostic", 45, "Choose Parking Lot for L4 or URL Shortener for L5/L6. Work from a blank page.", "design", "/drill"),
      starStory("d1", "Customer Obsession"),
    ],
  },
  {
    day: 2,
    title: "Arrays and strings",
    focus: "Recognize pointer movement and bounded windows",
    tasks: [
      lesson("two-pointer", "Two Pointers", 12, "Watch the invariant, then drive a different input."),
      lesson("sliding-window", "Sliding Window", 12, "Practice expanding, shrinking, and explaining the window invariant."),
      task("d2-cold", "Four cold array problems", 55, "Two pointer problems and two window problems. Explain the trigger before coding.", "coding", "/companies/amazon/sde1"),
      starStory("d2", "Ownership"),
    ],
  },
  {
    day: 3,
    title: "Trees and graphs",
    focus: "Traversal, shortest path, and visited-state discipline",
    tasks: [
      lesson("bfs", "BFS / Shortest Path", 15, "Trace the queue and say why BFS gives the shortest unweighted path."),
      task("d3-dfs", "DFS and tree traversal set", 50, "Solve one tree DFS, one grid DFS, and one topological-order problem.", "coding", "/companies/amazon/sde1"),
      task("d3-review", "Traversal comparison", 15, "Write when BFS, DFS, and topological sort are each the right default.", "review"),
      starStory("d3", "Dive Deep"),
    ],
  },
  {
    day: 4,
    title: "Ordering patterns",
    focus: "Heap, intervals, and binary search",
    tasks: [
      task("d4-heap", "Heap / Top-K pair", 35, "Solve one selection problem and one streaming Top-K problem.", "coding", "/companies/amazon/sde1"),
      task("d4-intervals", "Intervals and scheduling", 30, "Solve one merge and one meeting-room style problem.", "coding", "/companies/amazon/sde1"),
      task("d4-binary", "Binary-search boundary drill", 25, "Practice first-true/last-false boundary reasoning.", "coding", "/companies/amazon/sde1"),
      starStory("d4", "Bias for Action"),
    ],
  },
  {
    day: 5,
    title: "Search and recurrence",
    focus: "Backtracking and dynamic programming",
    tasks: [
      task("d5-backtracking", "Backtracking pair", 40, "State the choice, constraint, and undo step before coding.", "coding", "/companies/amazon/sde1"),
      task("d5-dp", "Core DP pair", 45, "Define state, transition, base case, and iteration order before implementation.", "coding", "/companies/amazon/sde1"),
      task("d5-errors", "Pattern error log", 15, "Turn every miss from Days 2–5 into a recognition cue.", "review"),
      starStory("d5", "Learn and Be Curious"),
    ],
  },
  {
    day: 6,
    title: "Coding assessment simulation",
    focus: "Two problems, one clock, complete communication",
    tasks: [
      task("d6-oa", "90-minute two-problem mock", 90, "Use one uninterrupted timer. Include tests and complexity before stopping.", "mock"),
      task("d6-review", "Mock autopsy", 30, "Classify every lost minute: recognition, design, implementation, testing, or communication.", "review"),
      starStory("d6", "Deliver Results"),
    ],
  },
  {
    day: 7,
    title: "System-design foundations",
    focus: "Requirements before architecture",
    tasks: [
      lesson("client-server", "System Design 101", 25, "Build the vocabulary for clients, services, storage, and scale."),
      lesson("the-interview", "Clarifying Questions", 25, "Turn a vague prompt into functional and non-functional requirements."),
      task("d7-template", "Write your design opening", 25, "Create a reusable opening: scope, scale, APIs, data, and success metrics.", "design"),
      starStory("d7", "Customer Obsession"),
    ],
  },
  {
    day: 8,
    title: "Scaling primitives",
    focus: "Caching, limiting, and read-heavy systems",
    tasks: [
      lesson("url-shortener", "URL Shortener", 30, "Connect requirements to keys, storage, caching, and availability."),
      lesson("rate-limiter", "Rate Limiter", 25, "Compare token bucket, shared state, and enforcement location."),
      lesson("cache-layer", "Cache Layer", 25, "Practice eviction, stampede control, invalidation, and hot keys."),
      task("d8-cold", "Cold HLD: image delivery", 45, "Design from a blank page and score yourself against the HLD rubric.", "design"),
    ],
  },
  {
    day: 9,
    title: "Real-time and fan-out",
    focus: "Ordering, delivery, and hot users",
    tasks: [
      lesson("chat-app", "Chat / Messaging", 30, "Explain connections, routing, ordering, retries, and offline delivery."),
      lesson("feed", "Feed / Recommendation", 30, "Compare fan-out on write and fan-out on read."),
      task("d9-failure", "Failure injection", 30, "Revisit both systems after a gateway failure and one celebrity-scale hot key.", "design", "/arena"),
      starStory("d9", "Ownership"),
    ],
  },
  {
    day: 10,
    title: "Amazon domain systems",
    focus: "Correctness under operational pressure",
    tasks: [
      lesson("amazon-warehouse", "Amazon Warehouse / Fulfillment", 30, "Track inventory truth, routing, and pick/pack events."),
      lesson("amazon-checkout", "Amazon Checkout / Cart", 30, "Practice reservation, payment, idempotency, and rollback."),
      task("d10-ops", "Prime Day operations pass", 30, "Add monitoring, alarms, recovery, cost, and a 10× traffic scenario.", "design"),
      starStory("d10", "Frugality"),
    ],
  },
  {
    day: 11,
    title: "LLD foundations",
    focus: "Responsibility, behavior, and edge cases",
    tasks: [
      lesson("lld-101", "LLD Basics", 15, "Learn the entity and responsibility heuristics."),
      lesson("parking-lot", "Parking Lot", 35, "Complete the class model, method placement, code, and edge cases."),
      task("d11-redraw", "Parking Lot from memory", 25, "Redraw the classes and relationships without reopening the lesson.", "design", "/arena/pattern-genome"),
      starStory("d11", "Invent and Simplify"),
    ],
  },
  {
    day: 12,
    title: "Amazon LLD",
    focus: "State transitions and resource allocation",
    tasks: [
      lesson("amazon-locker", "Amazon Locker", 35, "Model locker sizing, package state, pickup codes, and expiration."),
      lesson("vending-machine", "Vending Machine", 35, "Use a state machine for payment, selection, dispensing, and refund."),
      task("d12-code", "Code two core methods", 30, "Write one allocation method and one state-transition method with tests.", "coding", "/arena/lld-studio"),
      starStory("d12", "Dive Deep"),
    ],
  },
  {
    day: 13,
    title: "Extensibility and transfer",
    focus: "Patterns used for a reason",
    tasks: [
      lesson("discount-coupon-system", "Discount / Coupon System", 35, "Model eligibility, stacking, validity, and strategy variation."),
      lesson("chess-game", "Chess Game", 35, "Separate board state, piece behavior, validation, and game state."),
      task("d13-patterns", "Spot the Pattern", 20, "Complete the pattern scenarios and explain each rejected alternative.", "review", "/patterns"),
      task("d13-cold", "Cold drill: Library or ATM", 45, "Clarify, model, add edge cases, and compare only after committing.", "design", "/drill"),
    ],
  },
  {
    day: 14,
    title: "Full loop rehearsal",
    focus: "Sustain quality under interview timing",
    tasks: [
      task("d14-coding", "55-minute coding round", 55, "Narrate, test, and give complexity as if an interviewer were present.", "mock"),
      task("d14-design", "55-minute design round", 55, "Use an unseen prompt and ask a partner or recorder to push on trade-offs.", "mock"),
      task("d14-behavior", "Two behavioral rounds", 50, "Answer four LP questions with metrics and follow-up detail.", "mock"),
    ],
  },
  {
    day: 15,
    title: "Final readiness",
    focus: "Prove the weakest skill improved",
    tasks: [
      task("d15-oa", "Final 90-minute coding mock", 90, "Use new problems and the same scoring rules as Day 6.", "mock"),
      task("d15-design", "Final 55-minute design", 55, "Use the weaker of HLD or LLD and score every rubric area.", "mock"),
      task("d15-checklist", "Interview-day checklist", 15, "Freeze recognition cues, design opening, LP story map, and logistics.", "review"),
    ],
  },
];

const SPRINT_30: CourseDay[] = [
  ...SPRINT_15.slice(0, 1),
  { day: 2, title: "Two Pointers", focus: "Pointer invariants", tasks: [lesson("two-pointer", "Two Pointers", 15, "Drive the pattern on a new input."), task("30-d2", "Two cold problems", 45, "State the invariant before coding.", "coding", "/companies/amazon/sde1"), starStory("30-d2", "Customer Obsession")] },
  { day: 3, title: "Sliding Window", focus: "Expand and shrink correctly", tasks: [lesson("sliding-window", "Sliding Window", 15, "Connect the constraint to the shrink condition."), task("30-d3", "Three cold windows", 50, "Mix fixed and variable windows.", "coding", "/companies/amazon/sde1"), starStory("30-d3", "Ownership")] },
  { day: 4, title: "Hashing and prefix sums", focus: "Turn history into constant-time lookup", tasks: [task("30-d4a", "Hash-map pair", 35, "Frequency and seen-state problems.", "coding", "/companies/amazon/sde1"), task("30-d4b", "Prefix-sum pair", 35, "Subarray count and range reasoning.", "coding", "/companies/amazon/sde1"), task("30-d4r", "Recognition notes", 10, "Write the trigger for each pattern.", "review")] },
  { day: 5, title: "Stack, queue, linked list", focus: "Stateful traversal", tasks: [task("30-d5a", "Stack / queue pair", 35, "Include one monotonic-stack problem.", "coding", "/companies/amazon/sde1"), task("30-d5b", "Linked-list pair", 35, "Pointer safety and cycle reasoning.", "coding", "/companies/amazon/sde1"), starStory("30-d5", "Bias for Action")] },
  { day: 6, title: "BFS", focus: "Shortest unweighted paths", tasks: [lesson("bfs", "BFS / Shortest Path", 18, "Trace the queue and visited set."), task("30-d6", "Two BFS problems", 45, "One tree and one grid.", "coding", "/companies/amazon/sde1"), starStory("30-d6", "Dive Deep")] },
  { day: 7, title: "DFS and recursion", focus: "Recursive state and unwind", tasks: [task("30-d7", "Three DFS problems", 65, "Tree, grid, and path construction.", "coding", "/companies/amazon/sde1"), task("30-d7r", "BFS vs DFS", 10, "Write the selection rule.", "review")] },
  { day: 8, title: "Graphs", focus: "Dependencies and connectivity", tasks: [task("30-d8a", "Topological sort", 30, "Model indegree and cycle failure.", "coding", "/companies/amazon/sde1"), task("30-d8b", "Union-find", 30, "Connectivity with path compression.", "coding", "/companies/amazon/sde1"), starStory("30-d8", "Learn and Be Curious")] },
  { day: 9, title: "Heap and intervals", focus: "Ordering and scheduling", tasks: [task("30-d9a", "Heap / Top-K pair", 35, "Selection and streaming.", "coding", "/companies/amazon/sde1"), task("30-d9b", "Interval pair", 35, "Merge and meeting rooms.", "coding", "/companies/amazon/sde1")] },
  { day: 10, title: "Coding mock I", focus: "Two problems in 90 minutes", tasks: [task("30-d10m", "90-minute mock", 90, "No hints or pauses.", "mock"), task("30-d10r", "Mock autopsy", 25, "Classify every miss.", "review")] },
  { day: 11, title: "Binary search", focus: "Boundary correctness", tasks: [task("30-d11", "Three boundary problems", 65, "Practice first true, last false, and search on answer.", "coding", "/companies/amazon/sde1"), starStory("30-d11", "Are Right, A Lot")] },
  { day: 12, title: "Backtracking", focus: "Choice, constraint, undo", tasks: [task("30-d12", "Three backtracking problems", 70, "Subsets, combinations, and constrained search.", "coding", "/companies/amazon/sde1")] },
  { day: 13, title: "Dynamic programming I", focus: "State and transition", tasks: [task("30-d13", "One-dimensional DP", 70, "Define state before recurrence.", "coding", "/companies/amazon/sde1"), task("30-d13r", "State notebook", 10, "Record state, base case, transition, order.", "review")] },
  { day: 14, title: "Dynamic programming II", focus: "Grid and sequence DP", tasks: [task("30-d14", "Two DP problems", 75, "One grid and one sequence problem.", "coding", "/companies/amazon/sde1"), starStory("30-d14", "Think Big")] },
  { day: 15, title: "Coding mock II", focus: "Prove pattern coverage", tasks: [task("30-d15m", "90-minute mock", 90, "Use unseen problems from weak patterns.", "mock"), task("30-d15r", "Weak-pattern queue", 20, "Schedule the three highest-value reviews.", "review")] },
  { day: 16, title: "System-design foundations", focus: "Scope and success metrics", tasks: [lesson("client-server", "System Design 101", 25, "Build core vocabulary."), lesson("the-interview", "Clarifying Questions", 25, "Practice a disciplined opening."), starStory("30-d16", "Customer Obsession")] },
  { day: 17, title: "Storage and consistency", focus: "Choose data behavior deliberately", tasks: [lesson("cache-layer", "Cache Layer", 25, "Caching and hot-key behavior."), task("30-d17", "Consistency trade-off sheet", 30, "Compare strong, eventual, quorum, and idempotent flows.", "design"), starStory("30-d17", "Frugality")] },
  { day: 18, title: "URL Shortener and Rate Limiter", focus: "Read scale and shared state", tasks: [lesson("url-shortener", "URL Shortener", 30, "Keys, storage, and read scaling."), lesson("rate-limiter", "Rate Limiter", 25, "Counters and enforcement."), task("30-d18", "20-minute redesign", 20, "Add multi-region behavior.", "design")] },
  { day: 19, title: "Chat and Feed", focus: "Real-time delivery and fan-out", tasks: [lesson("chat-app", "Chat / Messaging", 30, "Connections and delivery."), lesson("feed", "Feed / Recommendation", 30, "Fan-out trade-offs."), starStory("30-d19", "Ownership")] },
  { day: 20, title: "Cold HLD mock", focus: "Generate the design yourself", tasks: [task("30-d20m", "55-minute unseen HLD", 55, "Requirements, estimates, APIs, data, architecture, failures, cost.", "mock"), task("30-d20r", "Rubric review", 25, "Score every area and identify one redo.", "review")] },
  { day: 21, title: "LLD foundations", focus: "Entities and responsibilities", tasks: [lesson("lld-101", "LLD Basics", 15, "Learn the core heuristic."), lesson("parking-lot", "Parking Lot", 35, "Complete the full model."), starStory("30-d21", "Invent and Simplify")] },
  { day: 22, title: "Amazon Locker", focus: "Allocation and lifecycle", tasks: [lesson("amazon-locker", "Amazon Locker", 35, "Model package and locker state."), task("30-d22", "Locker from memory", 30, "Redraw and code one allocation method.", "design", "/arena/pattern-genome")] },
  { day: 23, title: "Elevator", focus: "Requests and scheduling", tasks: [lesson("elevator-system", "Elevator System", 35, "Model requests and dispatch."), task("30-d23", "Scheduling alternatives", 25, "Compare nearest-car and direction-aware policies.", "design")] },
  { day: 24, title: "Vending Machine", focus: "State-machine design", tasks: [lesson("vending-machine", "Vending Machine", 35, "Model payment and dispensing states."), task("30-d24", "State transition tests", 25, "Write tests for refund and out-of-stock paths.", "coding", "/arena/lld-studio")] },
  { day: 25, title: "Coupon and Chess", focus: "Extensibility and rules", tasks: [lesson("discount-coupon-system", "Discount / Coupon", 35, "Eligibility and strategy variation."), lesson("chess-game", "Chess Game", 35, "Rules and game state."), starStory("30-d25", "Dive Deep")] },
  { day: 26, title: "Design patterns", focus: "Recognize the problem shape", tasks: [task("30-d26p", "Pattern learn mode", 25, "Review patterns through their real examples.", "review", "/patterns"), task("30-d26s", "Spot the Pattern", 25, "Complete every scenario and justify rejected options.", "review", "/patterns")] },
  { day: 27, title: "Cold LLD transfer", focus: "No hints and no copied model", tasks: [task("30-d27a", "Cold drill I", 45, "Choose Library or ATM.", "design", "/drill"), task("30-d27b", "Cold drill II", 45, "Choose a different domain and compare only after committing.", "design", "/drill")] },
  { day: 28, title: "Amazon systems and principles", focus: "Operational depth", tasks: [lesson("amazon-warehouse", "Amazon Warehouse", 30, "Inventory and event flow."), lesson("amazon-checkout", "Amazon Checkout", 30, "Correctness and rollback."), task("30-d28lp", "Four LP follow-up drills", 35, "Metrics, alternatives, failures, and learning.", "behavioral")] },
  { day: 29, title: "Full loop rehearsal", focus: "Interview stamina", tasks: [task("30-d29c", "55-minute coding", 55, "Narrate and test.", "mock"), task("30-d29d", "55-minute design", 55, "Use an unseen prompt.", "mock"), task("30-d29b", "Behavioral follow-ups", 40, "Four questions with probing follow-ups.", "mock")] },
  { day: 30, title: "Final readiness", focus: "Close the loop", tasks: [task("30-d30m", "Final mock", 90, "Use the weakest technical format.", "mock"), task("30-d30r", "Readiness scorecard", 25, "Record final evidence and remaining risks.", "review"), task("30-d30c", "Interview-day checklist", 15, "Freeze notes and logistics.", "review")] },
];

export function buildCoursePlan(length: CourseLength): CourseDay[] {
  return length === 15 ? SPRINT_15 : SPRINT_30;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function atLocalMidnight(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function getCurrentCourseDay(startDate: string, length: CourseLength, now = new Date()): number {
  const start = atLocalMidnight(startDate);
  const today = atLocalMidnight(formatLocalDate(now));
  const elapsed = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, Math.min(length, elapsed + 1));
}

export function getDaysUntil(interviewDate: string | undefined, now = new Date()): number | undefined {
  if (!interviewDate) return undefined;
  const interview = atLocalMidnight(interviewDate);
  const today = atLocalMidnight(formatLocalDate(now));
  return Math.ceil((interview.getTime() - today.getTime()) / 86_400_000);
}

export function getDayMinutes(day: CourseDay): number {
  return day.tasks.reduce((total, current) => total + current.minutes, 0);
}
