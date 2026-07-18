import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { EditorView } from "@codemirror/view";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import {
  COURSE_LABELS,
  COURSE_SCHEDULE_STARTER_CODE,
  COURSE_SCHEDULE_WORLD_MISSION,
  analyzeCourseScheduleRun,
  gradeCourseExplanation,
  type CourseScheduleRunAnalysis,
  type CourseTraceEvent,
} from "@/arena/courseScheduleWorld";
import { runJavaCombat, type JavaRunStage } from "@/java/javaCombatRunner";
import { ensureJavaRuntime } from "@/java/javaRunner";
import { useGameProgress } from "@/hooks/useGameProgress";
import { Button, Eyebrow, InlineCode } from "@/components/ui";
import { Icon } from "@/components/Icon";
import "@/theme/sliding-window-world.css";
import "@/theme/course-schedule-world.css";

const EDITOR_EXTENSIONS = [
  java(),
  EditorView.contentAttributes.of({
    "aria-label": "Course Schedule II Java editor",
    "aria-describedby": "course-world-editor-help",
    spellcheck: "false",
  }),
];

const EDITOR_SETUP = {
  lineNumbers: true,
  foldGutter: true,
  highlightActiveLine: true,
  autocompletion: true,
  bracketMatching: true,
};

const RUN_STAGE_COPY: Record<JavaRunStage, string> = {
  "loading-runtime": "Starting the in-browser Java runtime...",
  compiling: "Compiling your Solution.java...",
  running: "Launching courses through your Java...",
};

export function CourseScheduleWorldPage() {
  const { codingCombatScores, recordCodingCombatRun } = useGameProgress();
  const [code, setCode] = useState(COURSE_SCHEDULE_STARTER_CODE);
  const [analysis, setAnalysis] = useState<CourseScheduleRunAnalysis>();
  const [hasObservedJam, setHasObservedJam] = useState(false);
  const [privateRunPassed, setPrivateRunPassed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runStage, setRunStage] = useState<JavaRunStage>();
  const [runScope, setRunScope] = useState<"visible" | "hidden">("visible");
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [codeChanged, setCodeChanged] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [explanationSubmitted, setExplanationSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const disposed = useRef(false);
  const recorded = useRef(false);

  useEffect(() => {
    disposed.current = false;
    ensureJavaRuntime().catch(() => undefined);
    return () => { disposed.current = true; };
  }, []);

  useEffect(() => {
    if (!playing || !analysis?.trace.length) return;
    if (cursor >= analysis.trace.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setCursor((current) => current + 1), 390);
    return () => window.clearTimeout(timer);
  }, [analysis?.trace.length, cursor, playing]);

  const frame = useMemo(() => buildFrame(analysis?.trace ?? [], cursor), [analysis?.trace, cursor]);
  const explanationGrade = useMemo(() => gradeCourseExplanation(explanation), [explanation]);
  const savedScore = codingCombatScores["course-schedule-ii"];

  const runWorld = async (includeHidden: boolean) => {
    if (isRunning || (includeHidden && !analysis?.efficient)) return;
    setIsRunning(true);
    setPlaying(false);
    setRunScope(includeHidden ? "hidden" : "visible");
    setRunStage("loading-runtime");
    const result = await runJavaCombat(code, COURSE_SCHEDULE_WORLD_MISSION, includeHidden, {
      onStage: (stage) => { if (!disposed.current) setRunStage(stage); },
    });
    if (disposed.current) return;
    const nextAnalysis = analyzeCourseScheduleRun(result);
    setAnalysis(nextAnalysis);
    setIsRunning(false);
    setRunStage(undefined);
    setCursor(0);
    setPlaying(nextAnalysis.trace.length > 1);
    setCodeChanged(false);
    if (nextAnalysis.correct && !nextAnalysis.efficient) setHasObservedJam(true);
    if (includeHidden) setPrivateRunPassed(nextAnalysis.correct && nextAnalysis.efficient);
  };

  const submitExplanation = () => {
    setExplanationSubmitted(true);
    if (!privateRunPassed || !explanationGrade.passed) return;
    setCompleted(true);
    if (!recorded.current) {
      recorded.current = true;
      recordCodingCombatRun("course-schedule-ii", 400 + explanationGrade.score, 500);
    }
  };

  const resetWorld = () => {
    setCode(COURSE_SCHEDULE_STARTER_CODE);
    setAnalysis(undefined);
    setHasObservedJam(false);
    setPrivateRunPassed(false);
    setIsRunning(false);
    setRunStage(undefined);
    setRunScope("visible");
    setCursor(0);
    setPlaying(false);
    setCodeChanged(false);
    setExplanation("");
    setExplanationSubmitted(false);
    setCompleted(false);
    recorded.current = false;
  };

  return (
    <div className="window-world course-world">
      <header className="window-world-hero course-world-hero">
        <div className="window-world-hero-nav">
          <Link to="/arena/coding-lab"><Icon name="arrowLeft" size={14} /> Coding Combat</Link>
          <span>{savedScore ? `Previous clear ${savedScore.bestScore}/${savedScore.maxScore}` : "Algorithm world 02"}</span>
        </div>
        <div className="window-world-title-row">
          <div>
            <Eyebrow tone="var(--violet)">Code-driven Algorithm World · actual Java controls the launch grid</Eyebrow>
            <h1>Dependency Launch Control</h1>
            <p>
              Six courses must launch, but none may start before its prerequisites. The current scheduler
              produces a legal order. Run it under load before deciding whether the design is good enough.
            </p>
          </div>
          <div className="window-world-loop" aria-label="Mission stages">
            <Stage active={!hasObservedJam} done={hasObservedJam} number="1" label="Observe" />
            <Stage active={hasObservedJam && !analysis?.efficient} done={!!analysis?.efficient} number="2" label="Repair" />
            <Stage active={!!analysis?.efficient && !privateRunPassed} done={privateRunPassed} number="3" label="Prove" />
            <Stage active={privateRunPassed && !completed} done={completed} number="4" label="Explain" />
          </div>
        </div>
      </header>

      <section className={`window-world-simulation ${analysis?.efficient ? "is-clear" : hasObservedJam ? "is-jammed" : ""}`} aria-labelledby="course-simulation-heading">
        <div className="window-world-section-head">
          <div>
            <Eyebrow tone="var(--violet)">Live dependency grid</Eyebrow>
            <h2 id="course-simulation-heading">Your Java decides what becomes ready</h2>
          </div>
          <span className="window-world-live"><i /> {isRunning ? RUN_STAGE_COPY[runStage ?? "running"] : analysis ? "Replay loaded" : "Waiting for first run"}</span>
        </div>

        <div className="course-world-board-wrap">
          <div className="course-world-board" aria-label="Six-course prerequisite graph">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {EDGE_LINES.map((edge) => <line key={edge.id} {...edge} />)}
            </svg>
            {COURSE_LABELS.map((label, course) => {
              const complete = frame.completed.includes(course);
              const ready = frame.ready.includes(course);
              const focused = frame.event?.course === course || frame.event?.prerequisite === course;
              const remaining = frame.remaining[course];
              return (
                <div
                  key={course}
                  className={`course-node node-${course}${complete ? " complete" : ready ? " ready" : " locked"}${focused ? " focused" : ""}`}
                >
                  <small>C{course}</small>
                  <strong>{label}</strong>
                  <span>{!analysis ? "unobserved" : complete ? "launched" : ready ? "ready" : `${remaining} blocked`}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="course-world-lanes">
          <div><span>Ready queue</span><strong>{frame.ready.length ? frame.ready.map((course) => `C${course}`).join(" → ") : "empty"}</strong></div>
          <div><span>Launch order</span><strong>{frame.completed.length ? frame.completed.map((course) => `C${course}`).join(" → ") : "none yet"}</strong></div>
          <div><span>Current operation</span><strong>{eventTitle(frame.event)}</strong></div>
        </div>

        <div className="window-world-event course-world-event" aria-live="polite">
          <Icon name={analysis?.efficient ? "insight" : hasObservedJam ? "gauge" : "play"} size={18} />
          <div><strong>{eventTitle(frame.event)}</strong><span>{eventDescription(frame.event)}</span></div>
        </div>

        <div className="window-world-replay">
          <Button variant="subtle" icon="stepBack" aria-label="Previous Java event" disabled={!analysis?.trace.length || cursor === 0} onClick={() => { setPlaying(false); setCursor((current) => Math.max(0, current - 1)); }} />
          <Button variant="ghost" icon={playing ? "pause" : "play"} disabled={!analysis?.trace.length} onClick={() => setPlaying((current) => !current)}>
            {playing ? "Pause actual run" : "Play actual run"}
          </Button>
          <Button variant="subtle" icon="stepForward" aria-label="Next Java event" disabled={!analysis?.trace.length || cursor >= (analysis?.trace.length ?? 1) - 1} onClick={() => { setPlaying(false); setCursor((current) => Math.min((analysis?.trace.length ?? 1) - 1, current + 1)); }} />
          <span>{analysis?.trace.length ? `${cursor + 1} / ${analysis.trace.length} Java events` : "0 Java events"}</span>
        </div>

        <div className="window-world-metrics">
          <Metric label="Valid order" value={analysis ? (analysis.correct ? "PASS" : "FAIL") : "-"} tone={analysis?.correct ? "good" : analysis ? "bad" : "neutral"} />
          <Metric label="Measured work" value={analysis ? String(analysis.prerequisiteScans || analysis.graphOperations) : "-"} tone={analysis?.efficient ? "good" : hasObservedJam ? "bad" : "neutral"} />
          <Metric label="Growth under load" value={analysis?.efficient ? "O(V + E)" : hasObservedJam ? "O(V × E)" : "unknown"} tone={analysis?.efficient ? "good" : hasObservedJam ? "bad" : "neutral"} />
          <Metric label="Private incidents" value={privateRunPassed ? `${COURSE_SCHEDULE_WORLD_MISSION.hiddenTests.length}/${COURSE_SCHEDULE_WORLD_MISSION.hiddenTests.length}` : "locked"} tone={privateRunPassed ? "good" : "neutral"} />
        </div>

        {analysis ? (
          <div className={`window-world-incident ${analysis.efficient ? "clear" : "jam"}`}>
            <Icon name={analysis.efficient ? "check" : "gauge"} size={19} />
            <div><strong>{analysis.efficient ? "Launch grid cleared" : analysis.correct ? "Legal order, failing scale" : "Launch aborted"}</strong><p>{analysis.summary}</p></div>
          </div>
        ) : null}
      </section>

      <section className="window-world-workbench" aria-labelledby="course-world-editor-heading">
        <div className="window-world-contract">
          <Eyebrow tone="var(--amber)">{hasObservedJam ? "Repair brief unlocked by the run" : "Mission contract"}</Eyebrow>
          <h2>{hasObservedJam ? "Stop polling. Let readiness move through the graph." : "First, observe the scheduler you inherited"}</h2>
          {!hasObservedJam ? (
            <>
              <p>Do not begin by naming an algorithm. Compile the supplied Java and use measured behavior as the reason to change it.</p>
              <ul>
                <li>Six courses and seven prerequisite links.</li>
                <li>Any legal order is accepted—not one memorized sequence.</li>
                <li>A cycle must return <InlineCode>new int[0]</InlineCode>.</li>
              </ul>
            </>
          ) : (
            <>
              <p>The run proved that asking every locked course the same question repeats work. Instead, remember how many prerequisites each course still needs.</p>
              <div className="window-world-discovery">
                <span><b>Remaining work</b>Each course starts with a count of incoming prerequisite links.</span>
                <span><b>Readiness</b>A course with zero remaining prerequisites can enter the queue.</span>
                <span><b>Propagation</b>Completing a course decrements only the courses that depend on it.</span>
                <span><b>Deadlock</b>If the queue empties before all courses launch, a cycle remains.</span>
              </div>
              <details className="window-world-api">
                <summary>Open the instrumented dependency API</summary>
                <p>These calls animate only when your Java executes them:</p>
                <code>initialReady() · dependents(course) · completePrerequisite(course)<br />WorldTopoTrace.enqueue(course) · take(course, position) · cycle(processed)</code>
              </details>
            </>
          )}
        </div>

        <div className="window-world-editor">
          <header>
            <div><Icon name="code" size={16} /><strong id="course-world-editor-heading">Solution.java</strong><span>{codeChanged ? "edited · run to update the grid" : "actual JVM input"}</span></div>
            <button type="button" onClick={resetWorld}>Reset world</button>
          </header>
          <p id="course-world-editor-help" className="sr-only">Edit the Java method. Visible and hidden tests run locally in your browser on a real JVM.</p>
          <CodeMirror
            value={code}
            height="540px"
            theme={vscodeDark}
            extensions={EDITOR_EXTENSIONS}
            editable={!isRunning && !completed}
            onChange={(value) => {
              setCode(value);
              setCodeChanged(true);
              setPrivateRunPassed(false);
              setExplanationSubmitted(false);
            }}
            basicSetup={EDITOR_SETUP}
            style={{ fontSize: 13 }}
          />
          <footer>
            <Button icon="play" disabled={isRunning || completed} onClick={() => void runWorld(false)}>
              {isRunning && runScope === "visible" ? RUN_STAGE_COPY[runStage ?? "running"] : hasObservedJam ? "Run repaired Java" : "Run launch plan"}
            </Button>
            <Button variant="ghost" icon="shield" disabled={isRunning || !analysis?.efficient || completed} onClick={() => void runWorld(true)}>
              {isRunning && runScope === "hidden" ? "Running private incidents..." : `Prove against ${COURSE_SCHEDULE_WORLD_MISSION.hiddenTests.length} private incidents`}
            </Button>
            <span>Runs locally · Java 8 · any valid topological order passes</span>
          </footer>
        </div>
      </section>

      {analysis ? <RunEvidence analysis={analysis} includeHidden={runScope === "hidden"} /> : null}

      {privateRunPassed ? (
        <section className={`window-world-explain${completed ? " complete" : ""}`} aria-labelledby="course-explain-heading">
          <Eyebrow tone="var(--amber)">{completed ? "Mission clear" : "Final interview room · no answer choices"}</Eyebrow>
          <h2 id="course-explain-heading">Why does the ready queue produce a legal order, and how does it expose a cycle?</h2>
          <p>The code has passed. Defend the graph model, the readiness invariant, the update rule, cycle detection, and the O(V + E) cost in your own words.</p>
          <textarea
            aria-label="Interview explanation"
            value={explanation}
            disabled={completed}
            onChange={(event) => { setExplanation(event.target.value); setExplanationSubmitted(false); }}
            placeholder="Explain edge direction, indegree, the zero-indegree queue, how dependents unlock, what an incomplete processed count means, and why every vertex and edge is handled once."
          />
          {explanationSubmitted ? (
            <div className={`window-world-explanation-grade ${explanationGrade.passed ? "pass" : "retry"}`}>
              <strong>{explanationGrade.passed ? `${explanationGrade.score}/100 · Interview-ready` : `${explanationGrade.score}/100 · Strengthen the proof`}</strong>
              {explanationGrade.strengths.length ? <p>Supported: {explanationGrade.strengths.join("; ")}.</p> : null}
              {explanationGrade.missing.length && !explanationGrade.passed ? <p>Still missing: {explanationGrade.missing.join(" ")}</p> : null}
            </div>
          ) : null}
          <Button icon={completed ? "check" : "microphone"} disabled={completed || explanation.trim().length < 40} onClick={submitExplanation}>
            {completed ? "World cleared and evidence saved" : "Defend my scheduler"}
          </Button>
        </section>
      ) : null}
    </div>
  );
}

function Stage({ number, label, active, done }: { number: string; label: string; active: boolean; done: boolean }) {
  return <span className={`${active ? "active" : ""}${done ? " done" : ""}`}><b>{done ? "✓" : number}</b>{label}</span>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "neutral" }) {
  return <div className={`window-world-metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function RunEvidence({ analysis, includeHidden }: { analysis: CourseScheduleRunAnalysis; includeHidden: boolean }) {
  return (
    <section className="window-world-evidence" aria-label="Java test evidence">
      <div><Eyebrow>Machine evidence</Eyebrow><h2>{includeHidden ? "Private incident report" : "Visible output report"}</h2></div>
      <div className="window-world-test-list">
        {analysis.result.results.map((result) => (
          <span key={result.id} className={result.passed ? "pass" : "fail"}>
            <Icon name={result.passed ? "check" : "close"} size={14} />
            <b>{result.hidden ? "Private case" : result.label}</b>
            <small>{result.passed ? "valid order on JVM" : result.error ?? `expected ${String(result.expected)}, got ${String(result.actual)}`}</small>
          </span>
        ))}
      </div>
      {analysis.result.fatalError ? <pre>{analysis.result.compileLog ?? analysis.result.fatalError}</pre> : null}
    </section>
  );
}

interface CourseFrame {
  event?: CourseTraceEvent;
  completed: number[];
  ready: number[];
  remaining: number[];
}

function buildFrame(trace: CourseTraceEvent[], cursor: number): CourseFrame {
  const remaining = [2, 1, 2, 1, 1, 0];
  if (!trace.length) return { completed: [], ready: [], remaining };
  const seen = trace.slice(0, Math.max(0, Math.min(cursor, trace.length - 1)) + 1);
  const ready: number[] = [];
  const completed: number[] = [];
  for (const event of seen) {
    if (event.kind === "enqueue" && event.course !== undefined && !ready.includes(event.course)) ready.push(event.course);
    if (event.kind === "take" && event.course !== undefined) {
      const readyIndex = ready.indexOf(event.course);
      if (readyIndex >= 0) ready.splice(readyIndex, 1);
      if (!completed.includes(event.course)) completed.push(event.course);
    }
    if (event.kind === "release" && event.course !== undefined && !completed.includes(event.course)) completed.push(event.course);
    if (event.kind === "decrement" && event.course !== undefined && event.remaining !== undefined) remaining[event.course] = event.remaining;
  }
  return { event: seen[seen.length - 1], completed, ready, remaining };
}

function eventTitle(event: CourseTraceEvent | undefined): string {
  if (!event) return "Run the world to create a trace";
  if (event.kind === "round") return `Polling round ${(event.round ?? 0) + 1}`;
  if (event.kind === "scan") return `C${event.course} rechecks C${event.prerequisite}`;
  if (event.kind === "release") return `C${event.course} launches after polling`;
  if (event.kind === "enqueue") return `C${event.course} enters the ready queue`;
  if (event.kind === "take") return `C${event.course} launches from readiness`;
  if (event.kind === "decrement") return `C${event.course} has ${event.remaining} blockers left`;
  return `Queue stalled after ${event.processed} launches`;
}

function eventDescription(event: CourseTraceEvent | undefined): string {
  if (!event) return "The dependency map is loaded, but no Java operation has happened yet.";
  if (event.kind === "round") return "The inherited scheduler wakes every locked course and asks the same questions again.";
  if (event.kind === "scan") return "This prerequisite link is being inspected again instead of reacting only when its source completes.";
  if (event.kind === "release") return `The order is still legal: ${event.order.map((course) => `C${course}`).join(" → ")}. The problem is repeated work.`;
  if (event.kind === "enqueue") return "Its unresolved prerequisite count reached zero, so this course is now safe to run.";
  if (event.kind === "take") return "Removing a ready course cannot violate any prerequisite, because its blocker count is zero.";
  if (event.kind === "decrement") return "Only a direct dependent changes when one prerequisite completes.";
  return "Unfinished courses remain but nothing is ready. Those courses participate in a dependency cycle.";
}

const EDGE_LINES = [
  { id: "5-3", x1: 17, y1: 49, x2: 31, y2: 27 },
  { id: "5-4", x1: 17, y1: 52, x2: 31, y2: 72 },
  { id: "3-1", x1: 39, y1: 24, x2: 55, y2: 18 },
  { id: "3-2", x1: 39, y1: 30, x2: 55, y2: 58 },
  { id: "4-2", x1: 39, y1: 72, x2: 55, y2: 62 },
  { id: "1-0", x1: 64, y1: 20, x2: 84, y2: 39 },
  { id: "2-0", x1: 64, y1: 59, x2: 84, y2: 43 },
] as const;
