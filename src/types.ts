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

/** One machine-checked scenario for a JavaExerciseSpec. The body is authored
 * Java statements that run inside a per-test try/catch with three locals in
 * scope to assign: `passed` (boolean verdict), `expectedText` and `actualText`
 * (what the learner sees on failure). A thrown exception is reported as that
 * test's error without stopping later tests. */
export interface JavaExerciseTest {
  id: string;
  label: string;
  body: string;
}

/** Everything needed to compile and run a lesson exercise on the in-browser
 * JVM. The learner edits one complete class file; the support files provide
 * the surrounding domain model so the whole thing genuinely compiles. */
export interface JavaExerciseSpec {
  /** Class the learner edits; saved as <editClassName>.java. */
  editClassName: string;
  /** Full compilable class the learner starts from: fields and constructor
   * given, the target method stubbed so the first run fails honestly. */
  starterFile: string;
  /** The same file with the method implemented correctly; must pass every test. */
  referenceFile: string;
  /** Supporting domain classes, each a complete compilable file. */
  support: { className: string; source: string }[];
  tests: JavaExerciseTest[];
}

/** A real "write it yourself" exercise for the handful of methods that actually
 * have interesting logic (search/filter, state mutation) — not every method
 * needs one. Exercises with a `java` spec compile and run on the in-browser
 * JVM against a real test suite; the rest grade by commit-then-compare against
 * a reference solution, the same "ground truth reveal" philosophy as the rest
 * of the app. */
export interface CodeExercise {
  language: "java";
  /** Method stub shown before the learner writes anything — signature + a comment, no logic. */
  starter: string;
  /** A correct, real implementation — revealed after the learner commits their own attempt. */
  reference: string;
  /** What a correct solution must handle — self-checked against the learner's own code, not scored. */
  checklist: string[];
  /** When present, the exercise runs for real: javac + JVM in the browser. */
  java?: JavaExerciseSpec;
}

export interface MethodCandidate {
  id: string;
  signature: string; // e.g. "assignVehicle(vehicle): void"
  ownerId: string; // id of the EntityCandidate (isEntity: true) it truly belongs to
  /** WHY it belongs there — the real teaching content, not just the fact of ownership. Optional so un-retrofit lessons still compile. */
  justification?: string;
  /** Present only for the 2-3 methods per lesson worth actually coding — most methods don't need this. */
  codeExercise?: CodeExercise;
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

// ---------------------------------------------------------------------------
// Cold Design Drill — the transfer test. No Watch phase, no chip-picking, no
// guided lesson: a bare prompt, a blank workspace, and a reference design
// revealed only after the learner commits their own attempt. Deliberately
// covers prompts with no full LLDLesson — the skill this tests is "can you
// apply the heuristic to something you've never drilled," not "did you
// memorize this specific answer."
// ---------------------------------------------------------------------------

/** A reference edge case for the drill — plain reveal, not an interactive
 * multiple-choice quiz (that would just reintroduce recognition-over-recall
 * for this one piece too). */
export interface DrillEdgeCase {
  scenario: string;
  handling: string;
}

/** A clarifying question worth asking before designing — plain reveal, same
 * reasoning as DrillEdgeCase. Real interviews clarify before naming classes;
 * the drill's own free-form "questions you'd ask" list gets compared against
 * this, same self-comparison philosophy as everything else in the drill. */
export interface DrillClarifyingQuestion {
  question: string;
  why: string;
}

/** The known-good answer a learner's free-form attempt gets compared against.
 * Reuses EntityCandidate/MethodCandidate so the same <ClassCard/> rendering
 * from <ClassModeler/> works here unchanged. */
export interface ColdDrillReference {
  clarifyingQuestions: DrillClarifyingQuestion[];
  entities: EntityCandidate[];
  methods: MethodCandidate[];
  relationships: string[];
  edgeCases: DrillEdgeCase[];
  tradeoffs?: DesignTradeoff[];
  principles?: DesignPrinciple[];
}

export interface ColdDrillPrompt {
  id: string;
  title: string;
  /** The bare prompt, exactly as an interviewer would open with it — no scoping hints. */
  prompt: string;
  reference: ColdDrillReference;
}

export type Lesson = DSALesson | SDLesson | LLDLesson;

// ---------------------------------------------------------------------------
// Design patterns reference — cross-cutting, not per-lesson. Only patterns
// that genuinely show up in an existing LLD lesson or Cold Drill design get
// an entry here; nothing is force-fit just to pad the list.
// ---------------------------------------------------------------------------

export interface DesignPatternExample {
  /** Id of the LLDLesson or ColdDrillPrompt this example lives in. */
  refId: string;
  /** true if refId points to a Cold Drill prompt id rather than an LLDLesson id. */
  isDrill?: boolean;
  title: string;
  /** Concrete — names the actual class/method in that design, not a generic description. */
  howItShowsUp: string;
}

/** The pattern this one gets mixed up with, and the one-sentence test that
 * actually tells them apart. patternId is omitted when the confusable
 * sibling isn't itself one of the patterns tracked in this list (e.g.
 * Factory, Mediator) — the comparison is still worth naming even without a
 * clickable cross-reference. */
export interface ConfusedWith {
  patternName: string;
  patternId?: string;
  test: string;
}

export interface DesignPatternEntry {
  id: string;
  name: string;
  /** Plain-English recognition cue: what problem shape makes you reach for this pattern. */
  whenToUse: string;
  examples: DesignPatternExample[];
  confusedWith?: ConfusedWith;
}

/** One "spot the pattern" scenario — same {scenario, options[]} shape as
 * EdgeCase, reusing the exact commit-then-reveal mechanic already proven in
 * <ClassModeler/>'s edge cases phase. Distractor options are deliberately
 * the pattern's confusable siblings, not random noise. */
export interface PatternSpotOption {
  patternId: string;
  correct: boolean;
  feedback: string;
}

export interface PatternSpotScenario {
  id: string;
  scenario: string;
  options: PatternSpotOption[];
}

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
export type SdeLevel = "L3" | "L4" | "L5" | "L6";

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
  /** Honest context for a bucket, including when the evidence says not to prioritize it. */
  bucketNotes?: Partial<Record<QuestionBucket, string>>;
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
