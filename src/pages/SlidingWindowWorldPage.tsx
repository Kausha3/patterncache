import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { EditorView } from "@codemirror/view";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import {
  SLIDING_WINDOW_SAMPLE,
  SLIDING_WINDOW_SIZE,
  SLIDING_WINDOW_STARTER_CODE,
  SLIDING_WINDOW_WORLD_MISSION,
  analyzeSlidingWindowRun,
  gradeSlidingWindowExplanation,
  type SlidingWindowRunAnalysis,
  type SlidingWindowTraceEvent,
} from "@/arena/slidingWindowWorld";
import { runJavaCombat, type JavaRunStage } from "@/java/javaCombatRunner";
import { ensureJavaRuntime } from "@/java/javaRunner";
import { useGameProgress } from "@/hooks/useGameProgress";
import { Button, Eyebrow, InlineCode } from "@/components/ui";
import { Icon } from "@/components/Icon";
import "@/theme/sliding-window-world.css";

const EDITOR_EXTENSIONS = [
  java(),
  EditorView.contentAttributes.of({
    "aria-label": "Sliding Window Maximum Java editor",
    "aria-describedby": "window-world-editor-help",
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
  running: "Sending rush hour through your Java...",
};

export function SlidingWindowWorldPage() {
  const { codingCombatScores, recordCodingCombatRun } = useGameProgress();
  const [code, setCode] = useState(SLIDING_WINDOW_STARTER_CODE);
  const [analysis, setAnalysis] = useState<SlidingWindowRunAnalysis>();
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
    return () => {
      disposed.current = true;
    };
  }, []);

  useEffect(() => {
    if (!playing || !analysis?.trace.length) return;
    if (cursor >= analysis.trace.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setCursor((current) => current + 1), 360);
    return () => window.clearTimeout(timer);
  }, [analysis?.trace.length, cursor, playing]);

  const frame = useMemo(() => buildFrame(analysis?.trace ?? [], cursor), [analysis?.trace, cursor]);
  const explanationGrade = useMemo(() => gradeSlidingWindowExplanation(explanation), [explanation]);
  const savedScore = codingCombatScores["sliding-window-max"];

  const runWorld = async (includeHidden: boolean) => {
    if (isRunning || (includeHidden && !analysis?.efficient)) return;
    setIsRunning(true);
    setPlaying(false);
    setRunScope(includeHidden ? "hidden" : "visible");
    setRunStage("loading-runtime");
    const result = await runJavaCombat(code, SLIDING_WINDOW_WORLD_MISSION, includeHidden, {
      onStage: (stage) => {
        if (!disposed.current) setRunStage(stage);
      },
    });
    if (disposed.current) return;
    const nextAnalysis = analyzeSlidingWindowRun(result);
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
      recordCodingCombatRun("sliding-window-max", 400 + explanationGrade.score, 500);
    }
  };

  const resetWorld = () => {
    setCode(SLIDING_WINDOW_STARTER_CODE);
    setAnalysis(undefined);
    setHasObservedJam(false);
    setPrivateRunPassed(false);
    setIsRunning(false);
    setRunStage(undefined);
    setCursor(0);
    setPlaying(false);
    setCodeChanged(false);
    setExplanation("");
    setExplanationSubmitted(false);
    setCompleted(false);
    recorded.current = false;
  };

  return (
    <div className="window-world">
      <header className="window-world-hero">
        <div className="window-world-hero-nav">
          <Link to="/arena/coding-lab"><Icon name="arrowLeft" size={14} /> Coding Combat</Link>
          <span>{savedScore ? `Previous clear ${savedScore.bestScore}/${savedScore.maxScore}` : "Prototype world 01"}</span>
        </div>
        <div className="window-world-title-row">
          <div>
            <Eyebrow tone="var(--teal)">Code-driven Algorithm World · actual Java controls the simulation</Eyebrow>
            <h1>Sliding Window Control Room</h1>
            <p>
              Every fixed-size window needs its maximum. The current scanner returns the right answers,
              but nobody has tested it under rush-hour load. Run the Java before deciding what to change.
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

      <section className={`window-world-simulation ${analysis?.efficient ? "is-clear" : hasObservedJam ? "is-jammed" : ""}`} aria-labelledby="world-simulation-heading">
        <div className="window-world-section-head">
          <div>
            <Eyebrow tone="var(--teal)">Live control room</Eyebrow>
            <h2 id="world-simulation-heading">Your Java creates every move below</h2>
          </div>
          <span className="window-world-live"><i /> {isRunning ? RUN_STAGE_COPY[runStage ?? "running"] : analysis ? "Replay loaded" : "Waiting for first run"}</span>
        </div>

        <div className="window-world-board">
          <div className="window-world-array" aria-label="Rush-hour input values">
            {SLIDING_WINDOW_SAMPLE.map((value, index) => {
              const inWindow = index >= frame.left && index <= frame.right;
              const queued = frame.queue.some((item) => item.index === index);
              const focused = frame.event?.index === index;
              return (
                <div
                  key={index}
                  className={`window-world-cell${inWindow ? " in-window" : ""}${queued ? " queued" : ""}${focused ? " focused" : ""}`}
                >
                  <small>{index}</small>
                  <strong>{value}</strong>
                  <span>{queued ? "candidate" : inWindow ? "inside" : ""}</span>
                </div>
              );
            })}
          </div>

          <div className="window-world-lanes">
            <div className="window-world-lane">
              <span>Current window</span>
              <strong>{analysis ? `[${frame.left}..${frame.right}]` : "not started"}</strong>
            </div>
            <div className="window-world-lane candidate-lane">
              <span>Candidate lane</span>
              <div>
                {frame.queue.length ? frame.queue.map((item) => (
                  <b key={item.index}><small>#{item.index}</small>{item.value}</b>
                )) : <em>{hasObservedJam ? "No reusable candidates: the scanner starts over" : "Waiting for Java events"}</em>}
              </div>
            </div>
            <div className="window-world-lane">
              <span>Maxima shipped</span>
              <strong>{frame.outputs.length ? frame.outputs.join("  ·  ") : "none yet"}</strong>
            </div>
          </div>

          <div className="window-world-event" aria-live="polite">
            <Icon name={analysis?.efficient ? "insight" : hasObservedJam ? "gauge" : "play"} size={18} />
            <div>
              <strong>{eventTitle(frame.event)}</strong>
              <span>{eventDescription(frame.event)}</span>
            </div>
          </div>

          <div className="window-world-replay">
            <Button variant="subtle" icon="stepBack" aria-label="Previous Java event" disabled={!analysis?.trace.length || cursor === 0} onClick={() => { setPlaying(false); setCursor((current) => Math.max(0, current - 1)); }} />
            <Button variant="ghost" icon={playing ? "pause" : "play"} disabled={!analysis?.trace.length} onClick={() => setPlaying((current) => !current)}>
              {playing ? "Pause actual run" : "Play actual run"}
            </Button>
            <Button variant="subtle" icon="stepForward" aria-label="Next Java event" disabled={!analysis?.trace.length || cursor >= (analysis?.trace.length ?? 1) - 1} onClick={() => { setPlaying(false); setCursor((current) => Math.min((analysis?.trace.length ?? 1) - 1, current + 1)); }} />
            <span>{analysis?.trace.length ? `${cursor + 1} / ${analysis.trace.length} Java events` : "0 Java events"}</span>
          </div>
        </div>

        <div className="window-world-metrics">
          <Metric label="Correct output" value={analysis ? (analysis.correct ? "PASS" : "FAIL") : "-"} tone={analysis?.correct ? "good" : analysis ? "bad" : "neutral"} />
          <Metric label="Measured work" value={analysis ? String(analysis.inspections || analysis.queueMutations) : "-"} tone={analysis?.efficient ? "good" : hasObservedJam ? "bad" : "neutral"} />
          <Metric label="Growth under load" value={analysis?.efficient ? "O(n)" : hasObservedJam ? "O(n × k)" : "unknown"} tone={analysis?.efficient ? "good" : hasObservedJam ? "bad" : "neutral"} />
          <Metric label="Private incidents" value={privateRunPassed ? `${SLIDING_WINDOW_WORLD_MISSION.hiddenTests.length}/${SLIDING_WINDOW_WORLD_MISSION.hiddenTests.length}` : "locked"} tone={privateRunPassed ? "good" : "neutral"} />
        </div>

        {analysis ? (
          <div className={`window-world-incident ${analysis.efficient ? "clear" : "jam"}`}>
            <Icon name={analysis.efficient ? "check" : "gauge"} size={19} />
            <div><strong>{analysis.efficient ? "Rush hour cleared" : analysis.correct ? "Correct is not fast enough" : "The world stopped"}</strong><p>{analysis.summary}</p></div>
          </div>
        ) : null}
      </section>

      <section className="window-world-workbench" aria-labelledby="world-editor-heading">
        <div className="window-world-contract">
          <Eyebrow tone="var(--amber)">{hasObservedJam ? "Repair brief unlocked by the failure" : "Mission contract"}</Eyebrow>
          <h2>{hasObservedJam ? "Build a lane of candidates that can still win" : "First, trust nothing but the run"}</h2>
          {!hasObservedJam ? (
            <>
              <p>Do not optimize from a pattern name. Compile the supplied Java, watch its work, and use the failure as evidence.</p>
              <ul>
                <li>Expected output: <InlineCode>[3, 3, 5, 5, 6, 7]</InlineCode></li>
                <li>Window size: <InlineCode>k = 3</InlineCode></li>
                <li>Success requires correct output and a responsive world.</li>
              </ul>
            </>
          ) : (
            <>
              <p>The run proved that starting from zero for every window repeats work. A useful candidate survives only while it is inside the window and no newer value makes it irrelevant.</p>
              <div className="window-world-discovery">
                <span><b>Expiry</b>An index left of the current window cannot win again.</span>
                <span><b>Dominance</b>A smaller value behind a newer larger value cannot win again.</span>
                <span><b>Signal</b>The strongest surviving candidate should be immediately available.</span>
              </div>
              <details className="window-world-api">
                <summary>Open the instrumented WorldDeque API</summary>
                <p>These calls animate only when your Java executes them:</p>
                <code>isEmpty() · firstIndex() · firstValue() · lastValue()<br />removeFirst() · removeLast() · addLast(index) · snapshot()</code>
                <p>Call <InlineCode>WorldTrace.step(right, left, right)</InlineCode> once per input value and <InlineCode>WorldTrace.output(right, max, candidates.snapshot())</InlineCode> when a complete window ships.</p>
              </details>
            </>
          )}
        </div>

        <div className="window-world-editor">
          <header>
            <div><Icon name="code" size={16} /><strong id="world-editor-heading">Solution.java</strong><span>{codeChanged ? "edited · run to update the world" : "actual JVM input"}</span></div>
            <button type="button" onClick={resetWorld}>Reset world</button>
          </header>
          <p id="window-world-editor-help" className="sr-only">Edit the Java method. Visible and hidden tests run locally in your browser on a real JVM.</p>
          <CodeMirror
            value={code}
            height="520px"
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
              {isRunning && runScope === "visible" ? RUN_STAGE_COPY[runStage ?? "running"] : hasObservedJam ? "Run repaired Java" : "Run rush hour"}
            </Button>
            <Button variant="ghost" icon="shield" disabled={isRunning || !analysis?.efficient || completed} onClick={() => void runWorld(true)}>
              {isRunning && runScope === "hidden" ? "Running private incidents..." : `Prove against ${SLIDING_WINDOW_WORLD_MISSION.hiddenTests.length} private incidents`}
            </Button>
            <span>Runs locally · Java 8 · first run downloads the cached JVM</span>
          </footer>
        </div>
      </section>

      {analysis ? <RunEvidence analysis={analysis} includeHidden={runScope === "hidden"} /> : null}

      {privateRunPassed ? (
        <section className={`window-world-explain${completed ? " complete" : ""}`} aria-labelledby="window-explain-heading">
          <Eyebrow tone="var(--amber)">{completed ? "Mission clear" : "Final interview room · no answer choices"}</Eyebrow>
          <h2 id="window-explain-heading">Why is your repaired algorithm O(n), and why is the front always the maximum?</h2>
          <p>The code has already passed. Now defend the invariant in your own words as if the interviewer challenged the approach.</p>
          <textarea
            aria-label="Interview explanation"
            value={explanation}
            disabled={completed}
            onChange={(event) => { setExplanation(event.target.value); setExplanationSubmitted(false); }}
            placeholder="Explain what the deque stores, when indices leave, why weaker values are removed, where the maximum lives, and why the total work is linear."
          />
          {explanationSubmitted ? (
            <div className={`window-world-explanation-grade ${explanationGrade.passed ? "pass" : "retry"}`}>
              <strong>{explanationGrade.passed ? `${explanationGrade.score}/100 · Interview-ready` : `${explanationGrade.score}/100 · Strengthen the proof`}</strong>
              {explanationGrade.strengths.length ? <p>Supported: {explanationGrade.strengths.join("; ")}.</p> : null}
              {explanationGrade.missing.length && !explanationGrade.passed ? <p>Still missing: {explanationGrade.missing.join(" ")}</p> : null}
            </div>
          ) : null}
          <Button icon={completed ? "check" : "microphone"} disabled={completed || explanation.trim().length < 40} onClick={submitExplanation}>
            {completed ? "World cleared and evidence saved" : "Defend my algorithm"}
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

function RunEvidence({ analysis, includeHidden }: { analysis: SlidingWindowRunAnalysis; includeHidden: boolean }) {
  return (
    <section className="window-world-evidence" aria-label="Java test evidence">
      <div><Eyebrow>Machine evidence</Eyebrow><h2>{includeHidden ? "Private incident report" : "Visible output report"}</h2></div>
      <div className="window-world-test-list">
        {analysis.result.results.map((result) => (
          <span key={result.id} className={result.passed ? "pass" : "fail"}>
            <Icon name={result.passed ? "check" : "close"} size={14} />
            <b>{result.hidden ? "Private case" : result.label}</b>
            <small>{result.passed ? "passed on JVM" : result.error ?? `expected ${String(result.expected)}, got ${String(result.actual)}`}</small>
          </span>
        ))}
      </div>
      {analysis.result.fatalError ? <pre>{analysis.result.compileLog ?? analysis.result.fatalError}</pre> : null}
    </section>
  );
}

interface WorldFrame {
  event?: SlidingWindowTraceEvent;
  left: number;
  right: number;
  queue: SlidingWindowTraceEvent["queue"];
  outputs: number[];
}

function buildFrame(trace: SlidingWindowTraceEvent[], cursor: number): WorldFrame {
  if (!trace.length) return { left: 0, right: SLIDING_WINDOW_SIZE - 1, queue: [], outputs: [] };
  const boundedCursor = Math.max(0, Math.min(cursor, trace.length - 1));
  const seen = trace.slice(0, boundedCursor + 1);
  const event = seen[seen.length - 1];
  const queueEvent = [...seen].reverse().find((entry) => entry.kind === "push" || entry.kind === "pop-front" || entry.kind === "pop-back" || (entry.kind === "output" && entry.queue.length));
  return {
    event,
    left: event.left,
    right: event.right,
    queue: queueEvent?.queue ?? [],
    outputs: seen.filter((entry) => entry.kind === "output").map((entry) => entry.value ?? 0),
  };
}

function eventTitle(event: SlidingWindowTraceEvent | undefined): string {
  if (!event) return "Run the world to create a trace";
  if (event.kind === "scan") return `Scanner inspects index ${event.index}`;
  if (event.kind === "step") return `Window reaches index ${event.index}`;
  if (event.kind === "push") return `Value ${event.value} enters the candidate lane`;
  if (event.kind === "pop-front") return `Expired index ${event.index} leaves the front`;
  if (event.kind === "pop-back") return `Value ${event.value} can no longer win`;
  return `Maximum ${event.value} ships for this window`;
}

function eventDescription(event: SlidingWindowTraceEvent | undefined): string {
  if (!event) return "The array is loaded, but no Java operation has happened yet.";
  if (event.kind === "scan") return `The current window is searched again. Best seen so far: ${event.best}.`;
  if (event.kind === "step") return `The active boundary is now [${event.left}..${event.right}].`;
  if (event.kind === "push") return "This index remains eligible to become a future maximum.";
  if (event.kind === "pop-front") return "It is outside the active window, so keeping it would corrupt the answer.";
  if (event.kind === "pop-back") return "A newer value is at least as large and will remain available longer.";
  return event.queue.length
    ? "The front candidate is emitted without rescanning the window."
    : "The scanner ships the best value only after searching this window again.";
}
