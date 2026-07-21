import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import type { CodeExercise, JavaExerciseSpec } from "@/types";
import { runJavaExercise } from "@/java/javaExerciseRunner";
import type { JavaExerciseRunResult } from "@/java/javaExerciseRunner";
import type { JavaRunStage } from "@/java/javaProgram";
import { recordExerciseRun } from "@/game/exerciseProgress";
import { color, font, radius } from "@/theme/tokens";
import { Button, Eyebrow, Divider } from "./ui";
import { Icon } from "./Icon";

/** Code exercise for the handful of methods with real logic. Exercises that
 * carry a JavaExerciseSpec compile and run for real: the learner's class,
 * the exercise's domain classes, and a generated test main go through the
 * same Java 8 compiler used by Coding Combat
 * and a JVM in the browser. Exercises without one keep the original
 * commit-then-compare flow. Lives in its own file and is lazy-loaded because
 * CodeMirror plus a language grammar are heavy enough that DSA/SD lessons
 * shouldn't pay for them on first load. */
export default function CodeExerciseBlock({
  exercise,
  exerciseId,
  exerciseLabel,
}: {
  exercise: CodeExercise;
  /** Stable id ("<lessonId>:<methodId>") for persistence; omitted = no recording. */
  exerciseId?: string;
  /** Human label for the ledger, e.g. "findAvailableSpot(vehicle) · Design a Parking Lot". */
  exerciseLabel?: string;
}) {
  if (exercise.java) {
    return (
      <RunnableExercise
        exercise={exercise}
        spec={exercise.java}
        exerciseId={exerciseId}
        exerciseLabel={exerciseLabel}
      />
    );
  }
  return <SelfCheckExercise exercise={exercise} />;
}

const STAGE_MESSAGES: Record<JavaRunStage, string> = {
  "loading-runtime": "Starting the Java runtime. The first run downloads about 20 MB; after that it is cached.",
  compiling: "Compiling as Java 8…",
  running: "Running your class on the JVM…",
};

const EDITOR_FRAME = { border: `1px solid ${color.hairline}`, borderRadius: radius.md, overflow: "hidden" } as const;

function RunnableExercise({
  exercise,
  spec,
  exerciseId,
  exerciseLabel,
}: {
  exercise: CodeExercise;
  spec: JavaExerciseSpec;
  exerciseId?: string;
  exerciseLabel?: string;
}) {
  const [code, setCode] = useState(spec.starterFile);
  const [isRunning, setIsRunning] = useState(false);
  const [stage, setStage] = useState<JavaRunStage>();
  const [result, setResult] = useState<JavaExerciseRunResult>();
  const [revealed, setRevealed] = useState(false);
  const disposed = useRef(false);

  useEffect(() => {
    disposed.current = false;
    return () => {
      disposed.current = true;
    };
  }, []);

  const runTests = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStage("loading-runtime");
    const run = await runJavaExercise(code, spec, {
      onStage: (nextStage) => {
        if (!disposed.current) setStage(nextStage);
      },
    });
    if (disposed.current) return;
    setResult(run);
    setIsRunning(false);
    setStage(undefined);
    if (exerciseId) recordExerciseRun(exerciseId, exerciseLabel ?? exerciseId, run.passed);
  };

  const passedCount = result?.results.filter((test) => test.passed).length ?? 0;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Divider />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <Eyebrow tone={color.teal}>Now write it for real · {spec.editClassName}.java</Eyebrow>
        <span style={{ fontSize: 10.5, color: color.textFaint, fontFamily: font.mono }}>
          Java 8 compiler + JVM in your browser · nothing uploaded
        </span>
      </div>
      <div style={EDITOR_FRAME}>
        <CodeMirror
          value={code}
          height="330px"
          theme={vscodeDark}
          extensions={[java()]}
          onChange={(nextCode) => {
            setCode(nextCode);
            setResult(undefined);
          }}
          editable={!isRunning}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
          style={{ fontSize: 13 }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Button icon="play" onClick={() => void runTests()} disabled={isRunning}>
          {isRunning ? "Running…" : `Run ${spec.tests.length} tests`}
        </Button>
        <Button variant="subtle" onClick={() => setRevealed(true)} disabled={revealed}>
          Compare against a reference solution
        </Button>
        <button
          onClick={() => {
            setCode(spec.starterFile);
            setResult(undefined);
          }}
          disabled={isRunning}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: color.textFaint, fontSize: 11, fontFamily: font.mono }}
        >
          Reset starter
        </button>
      </div>

      <div aria-live="polite" style={{ display: "grid", gap: 8 }}>
        {isRunning ? (
          <p style={{ margin: 0, fontSize: 12, color: color.textDim, fontFamily: font.mono }}>
            {stage ? STAGE_MESSAGES[stage] : "Preparing the run…"}
          </p>
        ) : result?.fatalError ? (
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: color.red, lineHeight: 1.5 }}>{result.fatalError}</p>
            {result.compileLog ? (
              <pre
                style={{
                  margin: 0,
                  padding: "10px 12px",
                  maxHeight: 220,
                  overflow: "auto",
                  border: `1px solid ${color.hairline}`,
                  borderRadius: radius.md,
                  background: color.bg,
                  color: color.textDim,
                  font: `500 11px/1.6 ${font.mono}`,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {result.compileLog}
              </pre>
            ) : null}
          </div>
        ) : result ? (
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 11, color: result.passed ? color.green : color.textFaint, fontFamily: font.mono }}>
              {result.passed
                ? `All ${result.results.length} tests passed on the JVM. This is now verified evidence in your progress ledger.`
                : `${passedCount}/${result.results.length} passed`}
            </span>
            {result.results.map((test) => (
              <div
                key={test.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "16px 1fr",
                  gap: 8,
                  alignItems: "start",
                  padding: "8px 10px",
                  border: `1px solid ${test.passed ? "rgba(130,184,114,0.35)" : "rgba(224,108,117,0.35)"}`,
                  borderRadius: radius.md,
                  background: color.bg,
                }}
              >
                <Icon name={test.passed ? "check" : "close"} size={14} color={test.passed ? color.green : color.red} />
                <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                  <strong style={{ fontSize: 12, color: color.text }}>{test.label}</strong>
                  {test.error ? (
                    <code style={{ fontSize: 11, color: color.red, overflowWrap: "anywhere" }}>{test.error}</code>
                  ) : (
                    <span style={{ fontSize: 11, color: color.textFaint, fontFamily: font.mono, overflowWrap: "anywhere" }}>
                      expected {test.expected} · received {test.actual ?? "nothing"}
                    </span>
                  )}
                  {test.stdout && !test.passed ? (
                    <pre style={{ margin: 0, fontSize: 10.5, color: color.textFaint, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      your output: {test.stdout}
                    </pre>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: color.textFaint, lineHeight: 1.5 }}>
            The starter compiles but fails the suite. Run it first to see the failures, then make them pass.
          </p>
        )}
      </div>

      {revealed ? <ReferenceReveal reference={spec.referenceFile} checklist={exercise.checklist} /> : null}
    </div>
  );
}

function ReferenceReveal({ reference, checklist }: { reference: string; checklist: string[] }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <span style={{ fontSize: 11, color: color.textFaint, fontFamily: font.mono }}>Reference solution</span>
      <div style={EDITOR_FRAME}>
        <CodeMirror
          value={reference}
          theme={vscodeDark}
          extensions={[java()]}
          editable={false}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
          style={{ fontSize: 13 }}
        />
      </div>
      <Checklist items={checklist} />
    </div>
  );
}

function SelfCheckExercise({ exercise }: { exercise: CodeExercise }) {
  const [code, setCode] = useState(exercise.starter);
  const [revealed, setRevealed] = useState(false);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Divider />
      <Eyebrow tone={color.teal}>Now write it in {exercise.language}</Eyebrow>
      <div style={EDITOR_FRAME}>
        <CodeMirror
          value={code}
          height="150px"
          theme={vscodeDark}
          extensions={[java()]}
          onChange={setCode}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
          style={{ fontSize: 13 }}
        />
      </div>

      {!revealed ? (
        <div>
          <Button variant="subtle" onClick={() => setRevealed(true)}>
            Compare against a reference solution
          </Button>
        </div>
      ) : (
        <ReferenceReveal reference={exercise.reference} checklist={exercise.checklist} />
      )}
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  return (
    <div style={{ display: "grid", gap: 7 }}>
      <Eyebrow>Does your version handle all of this?</Eyebrow>
      {items.map((item, index) => {
        const isChecked = checked.has(index);
        return (
          <button
            key={index}
            onClick={() =>
              setChecked((current) => {
                const next = new Set(current);
                if (next.has(index)) next.delete(index);
                else next.add(index);
                return next;
              })
            }
            style={{ display: "flex", alignItems: "flex-start", gap: 8, textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <span
              style={{
                width: 15,
                height: 15,
                flexShrink: 0,
                marginTop: 2,
                borderRadius: 4,
                border: `1.5px solid ${isChecked ? color.green : color.panelBorder}`,
                background: isChecked ? "rgba(130,184,114,0.15)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isChecked && <Icon name="check" size={10} color={color.green} strokeWidth={3} />}
            </span>
            <span style={{ fontSize: 12.5, color: isChecked ? color.textFaint : color.textDim, textDecoration: isChecked ? "line-through" : "none", lineHeight: 1.5 }}>
              {item}
            </span>
          </button>
        );
      })}
    </div>
  );
}
