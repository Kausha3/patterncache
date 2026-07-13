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

/** One alternative interviewer answer and how it would change your approach. */
export interface ClarifyBranch {
  label: string; // e.g. "1k/day (tiny)"
  approach: string; // how the design changes if the answer were this
}

export interface ClarifyQuestion {
  id: string;
  ask: string; // what the candidate asks
  category: "scope" | "scale" | "constraints" | "premature";
  answer?: string; // interviewer's answer (omit for premature)
  why?: string; // why asking this matters
  establishes?: string; // requirement it pins down (a chip in the Requirements panel)
  branches?: ClarifyBranch[]; // "how the answer changes your approach" explorer
  redirect?: string; // for premature/off-track asks — gentle coaching, no requirement
  /** Leadership Principle key(s) this ask/answer demonstrates (into LEADERSHIP_PRINCIPLES). Amazon-specific. */
  lp?: string[];
}

export interface InterviewSpec {
  prompt: string; // the deliberately-vague ask
  opening: string; // interviewer's opening line
  questions: ClarifyQuestion[];
  summary: string; // shown once the core questions are asked
}

export interface SDLesson {
  id: string;
  track: "system-design";
  title: string;
  blurb: string;
  estMinutes: number;
  overview: string;
  /** Architecture walk-through stages. Optional — some lessons are interview-only. */
  stages?: SDStage[];
  recap: string[];
  relatedLessons: string[];
  /** Plain-English glossary keys (into GLOSSARY) relevant to this lesson. */
  terms?: string[];
  /** Override the Problem/Fix/Tradeoff row labels (e.g. for the primer). */
  stageLabels?: { problem: string; fix: string; tradeoff: string };
  /** Interactive clarifying-questions simulator. Adds a "Clarify" step. */
  interview?: InterviewSpec;
}

// ---------------------------------------------------------------------------
// Low-Level / Object-Oriented Design (LLD) — a third lesson grammar. Not
// tiers-and-load like SDLesson — this is entities, responsibilities, and
// edge cases. Drives <ClassModeler />.
// ---------------------------------------------------------------------------

/** A typed field on a class — e.g. `{ name: "isOccupied", type: "boolean" }`. */
export interface PropertyDef {
  name: string;
  type: string; // e.g. "string", "Size", "List<Level>"
}

export interface EntityCandidate {
  id: string;
  name: string; // e.g. "ParkingSpot"
  isEntity: boolean; // true = a real class in the model
  why: string; // shown after the learner checks their answer
  /** Typed fields this class actually holds — only meaningful when isEntity: true. */
  properties?: PropertyDef[];
}

export interface MethodCandidate {
  id: string;
  signature: string; // e.g. "assignVehicle(vehicle): void"
  ownerId: string; // id of the EntityCandidate (isEntity: true) it truly belongs to
}

export interface EdgeCaseOption {
  id: string;
  label: string;
  correct: boolean;
  feedback: string; // shown once this option is chosen, win or lose
}

export interface EdgeCase {
  id: string;
  scenario: string; // "What if the lot is completely full?"
  options: EdgeCaseOption[];
}

/** A named OOD/SOLID principle and how it concretely applies to THIS model —
 * not a generic definition, the specific reason it shows up here. */
export interface DesignPrinciple {
  name: string; // e.g. "Single Responsibility Principle"
  explanation: string;
}

/** A structural decision and the alternative that was rejected — the "we
 * could have done X, here's why we didn't" a real interview probes for. */
export interface DesignTradeoff {
  decision: string; // "Level is its own class instead of ParkingLot owning Spots directly"
  reasoning: string;
}

export interface ClassModelSpec {
  entities: EntityCandidate[];
  methods: MethodCandidate[];
  edgeCases: EdgeCase[];
  /** Static relationship lines shown in the finished diagram, e.g. "ParkingLot has many Levels". */
  relationships: string[];
  /** Named design principles this specific model embodies. Optional so existing lessons keep compiling while being retrofit. */
  principles?: DesignPrinciple[];
  /** Structural decisions and the alternative considered — the real trade-off content, not just entity-selection reasoning. */
  tradeoffs?: DesignTradeoff[];
}

export interface LLDLesson {
  id: string;
  track: "lld";
  title: string;
  blurb: string;
  estMinutes: number;
  overview: string;
  terms?: string[];
  /** Interactive clarifying-questions simulator, same engine as SDLesson. */
  interview?: InterviewSpec;
  design: ClassModelSpec;
  recap: string[];
  relatedLessons: string[];
}

export type Lesson = DSALesson | SDLesson | LLDLesson;

export function isDSA(lesson: Lesson): lesson is DSALesson {
  return lesson.track === "dsa";
}

export function isLLD(lesson: Lesson): lesson is LLDLesson {
  return lesson.track === "lld";
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
// Companies (interview-prep lens) — company-wise question research
// ---------------------------------------------------------------------------

export type QuestionBucket = "hld" | "lld";
export type SdeLevel = "L4" | "L5" | "L6";

/**
 * Qualitative signal strength, NOT a hard frequency count — no source we
 * researched publishes real numbers. Deliberately named to avoid implying
 * false precision; see docs/AMAZON.md §0 for the honesty rationale.
 */
export type FrequencySignal = "very-high" | "high" | "medium" | "emerging";

export interface CompanyQuestion {
  /** Matches a real Lesson id if built; otherwise a stable slug for a coming-soon tile. */
  lessonId: string;
  title: string; // shown even before the lesson exists
  blurb: string;
  bucket: QuestionBucket;
  frequency: FrequencySignal;
  /** One honest sentence citing the kind of signal behind the frequency tier. */
  signalNote: string;
  levels: SdeLevel[];
}

export interface Company {
  id: string;
  name: string;
  blurb: string;
  status: "available" | "coming-soon";
  /** "How this company interviews" bullets — loop structure, what's evaluated. */
  loopNotes?: string[];
  /** Leadership-Principle-style keys most emphasized (company-specific; empty if N/A). */
  valuesFocus?: string[];
  hld: CompanyQuestion[];
  lld: CompanyQuestion[];
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
