/**
 * PatternCache content model — §5 of the build spec.
 *
 * Every lesson is data. Components resolve *behavior* (how to run a trace, how
 * to drive a sandbox) from registries keyed by the lesson's `algorithm`, so
 * adding a lesson is mostly writing JSON, not writing components.
 */

export type Track = "dsa" | "system-design";

export type AlgorithmKey =
  | "sliding-window"
  | "two-pointer"
  | "bfs"
  | "dfs"
  | "dp"
  | "heap";

// ---------------------------------------------------------------------------
// Trace primitives (drives <TraceVisualizer />)
// ---------------------------------------------------------------------------

/**
 * One discrete step of an executed algorithm. `state` is an
 * algorithm-specific snapshot; the matching renderer in the ALGORITHMS
 * registry knows how to draw it. `explanation` is plain-English "why".
 */
export interface TraceStep<S = unknown> {
  state: S;
  explanation: string;
  /** Optional short tag shown in the step, e.g. "shrink", "match". */
  tag?: string;
  /** true when this step is where the running "best" answer improved. */
  milestone?: boolean;
  /** Index (0-based) of the pseudocode line executing at this step. */
  line?: number;
}

// ---------------------------------------------------------------------------
// Sandbox primitives (drives <SandboxPractice />)
// ---------------------------------------------------------------------------

export interface SandboxOutcome<S = unknown> {
  state: S;
  /** Narration of what just happened — always shown, esp. on invalid moves. */
  message: string;
  valid: boolean;
  /** true once the learner reached a terminal state. */
  done: boolean;
}

export interface SandboxAction {
  id: string;
  label: string;
  /** Optional keyboard hint, e.g. "→". */
  key?: string;
}

// ---------------------------------------------------------------------------
// Lesson schemas
// ---------------------------------------------------------------------------

export interface DSALesson {
  id: string;
  track: "dsa";
  title: string;
  blurb: string; // one-liner for the path map
  estMinutes: number;
  concept: {
    bruteForce: string;
    bruteForceComplexity: string; // e.g. "O(n²)"
    insight: string;
    complexity: string; // e.g. "O(n)"
    /** The interview trigger: how to recognize this pattern in the wild. */
    recognize: string;
  };
  trace: {
    input: string;
    algorithm: AlgorithmKey;
    /** What the trace is computing, shown as the goal line. */
    goal: string;
  };
  practice: {
    input: string; // deliberately DIFFERENT from trace input
    goal: string;
  };
  recap: string[]; // bullet takeaways
  relatedLessons: string[];
}

export interface SDStage {
  title: string;
  visibleNodes: string[]; // references into the shared NODES dictionary
  problem: string;
  fix: string;
  tradeoff: string;
  metrics: { capacity: number; latencyMs: number };
}

export interface SDLesson {
  id: string;
  track: "system-design";
  title: string;
  blurb: string;
  estMinutes: number;
  overview: string;
  stages: SDStage[];
  recap: string[];
  relatedLessons: string[];
  /** Plain-English glossary keys (into GLOSSARY) relevant to this lesson. */
  terms?: string[];
  /** Override the Problem/Fix/Tradeoff row labels (e.g. for the primer). */
  stageLabels?: { problem: string; fix: string; tradeoff: string };
}

export type Lesson = DSALesson | SDLesson;

export function isDSA(lesson: Lesson): lesson is DSALesson {
  return lesson.track === "dsa";
}

// ---------------------------------------------------------------------------
// Shared NODES dictionary (system-design diagrams)
// ---------------------------------------------------------------------------

export interface NodeDef {
  id: string;
  label: string;
  /** One-line "what this is" shown on the node's explorer card. */
  what: string;
  /** Rough visual grouping, used only for layout tinting. */
  kind: "client" | "edge" | "compute" | "data" | "async";
}

// ---------------------------------------------------------------------------
// Progress (localStorage) — §7
// ---------------------------------------------------------------------------

export type LessonStatus = "not-started" | "in-progress" | "completed";
export type Confidence = "shaky" | "okay" | "solid";

export interface LessonProgress {
  status: LessonStatus;
  confidence?: Confidence;
  lastVisited?: number; // epoch ms
}

export type ProgressMap = Record<string, LessonProgress>;
