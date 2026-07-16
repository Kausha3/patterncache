import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import type { CodingCombatMission } from "@/arena/codingCombatMissions";
import {
  CODING_COMBAT_MAX_SCORE,
  formatCombatValue,
  gradeCodingCombat,
  runCodingCombat,
} from "@/arena/codingCombatEngine";
import type { CodingCombatGrade, CodingCombatRunResult } from "@/arena/codingCombatEngine";
import { Button, Eyebrow, InlineCode } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { color } from "@/theme/tokens";

const EDITOR_EXTENSIONS = [
  javascript(),
  EditorView.contentAttributes.of({
    "aria-label": "Solution editor",
    "aria-describedby": "coding-combat-editor-help",
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

export function CodingCombatWorkbench({
  mission,
  previousBest,
  onComplete,
  onExit,
  onReplay,
  onNext,
  hasNext,
}: {
  mission: CodingCombatMission;
  previousBest?: number;
  onComplete: (score: number, maxScore: number) => void;
  onExit: () => void;
  onReplay: () => void;
  onNext: () => void;
  hasNext: boolean;
}) {
  const [code, setCode] = useState(mission.starterCode);
  const [phase, setPhase] = useState<"code" | "defense" | "complete">("code");
  const [runResult, setRunResult] = useState<CodingCombatRunResult>();
  const [runScope, setRunScope] = useState<"visible" | "complete">("visible");
  const [isRunning, setIsRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [failedSubmissions, setFailedSubmissions] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<CodingCombatGrade>();
  const [baselineBest] = useState(previousBest ?? 0);
  const activeRun = useRef<AbortController>();

  useEffect(() => () => activeRun.current?.abort(), []);

  const runTests = async (includeHidden: boolean) => {
    if (isRunning || phase !== "code") return;
    const controller = new AbortController();
    activeRun.current = controller;
    setIsRunning(true);
    setRunScope(includeHidden ? "complete" : "visible");
    const result = await runCodingCombat(code, mission, includeHidden, { signal: controller.signal });
    if (controller.signal.aborted) return;
    activeRun.current = undefined;
    setRunResult(result);
    setIsRunning(false);
    if (!includeHidden) return;
    if (result.passed) setPhase("defense");
    else setFailedSubmissions((current) => current + 1);
  };

  const updateCode = (nextCode: string) => {
    setCode(nextCode);
    setRunResult(undefined);
  };

  const revealHint = () => {
    setHintsUsed((current) => Math.min(mission.hints.length, current + 1));
  };

  const submitDefense = () => {
    if (grade || mission.defense.some((question) => !answers[question.id])) return;
    const result = gradeCodingCombat({ mission, answers, hintsUsed, failedSubmissions });
    setGrade(result);
    setPhase("complete");
    onComplete(result.score, result.maxScore);
  };

  if (phase === "complete" && grade) {
    return (
      <CodingCombatCompletion
        mission={mission}
        grade={grade}
        hintsUsed={hintsUsed}
        failedSubmissions={failedSubmissions}
        baselineBest={baselineBest}
        onReplay={onReplay}
        onNext={onNext}
        onExit={onExit}
        hasNext={hasNext}
      />
    );
  }

  return (
    <div className="combat-workbench">
      <header className="combat-workbench-header">
        <div>
          <Eyebrow tone={color.blue}>Build phase · JavaScript</Eyebrow>
          <h1>{mission.title}</h1>
          <p>{mission.signal}</p>
        </div>
        <button className="combat-exit" onClick={onExit}>Exit to mission select</button>
      </header>

      <div className="combat-stage-progress" role="list" aria-label="Coding Combat stages">
        <StageState label="Build" active={phase === "code"} complete={phase !== "code"} />
        <span aria-hidden />
        <StageState label="Defend" active={phase === "defense"} complete={false} />
        <span aria-hidden />
        <StageState label="Debrief" active={false} complete={false} />
      </div>

      <div className="combat-workspace-grid">
        <ProblemBrief mission={mission} hintsUsed={hintsUsed} onRevealHint={revealHint} />

        <div className="combat-build-column">
          <section className="combat-editor-shell" aria-labelledby="combat-editor-heading">
            <header className="combat-editor-toolbar">
              <div>
                <Icon name="code" size={15} />
                <strong id="combat-editor-heading">solution.js</strong>
                <span>isolated worker</span>
              </div>
              <button
                onClick={() => updateCode(mission.starterCode)}
                disabled={phase !== "code" || isRunning}
              >
                Reset starter
              </button>
            </header>
            <p id="coding-combat-editor-help" className="sr-only">
              Write the requested JavaScript function. Run visible tests before submitting to hidden tests.
            </p>
            <CodeMirror
              value={code}
              height="390px"
              theme={vscodeDark}
              extensions={EDITOR_EXTENSIONS}
              editable={phase === "code" && !isRunning}
              onChange={updateCode}
              basicSetup={EDITOR_SETUP}
              style={{ fontSize: 13.5 }}
            />
            <footer className="combat-editor-actions">
              <Button
                variant="ghost"
                icon="play"
                disabled={isRunning || phase !== "code"}
                onClick={() => void runTests(false)}
              >
                {isRunning && runScope === "visible" ? "Running…" : `Run ${mission.visibleTests.length} visible tests`}
              </Button>
              <Button
                icon="shield"
                disabled={isRunning || phase !== "code"}
                onClick={() => void runTests(true)}
              >
                {isRunning && runScope === "complete" ? "Judging…" : `Submit · ${mission.hiddenTests.length} hidden tests`}
              </Button>
              <span>{failedSubmissions} failed submission{failedSubmissions === 1 ? "" : "s"}</span>
            </footer>
          </section>

          <TestConsole result={runResult} runScope={runScope} isRunning={isRunning} />

          {phase === "defense" ? (
            <DefensePanel
              mission={mission}
              answers={answers}
              onAnswer={(questionId, optionId) => setAnswers((current) => ({ ...current, [questionId]: optionId }))}
              onSubmit={submitDefense}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProblemBrief({
  mission,
  hintsUsed,
  onRevealHint,
}: {
  mission: CodingCombatMission;
  hintsUsed: number;
  onRevealHint: () => void;
}) {
  return (
    <aside className="combat-problem" aria-labelledby="combat-problem-heading">
      <div className="combat-problem-meta">
        <span>{mission.difficulty}</span>
        <span>{mission.minutes} min target</span>
      </div>
      <h2 id="combat-problem-heading">Mission contract</h2>
      <p>{mission.prompt}</p>
      <InlineCode>{mission.signature}</InlineCode>

      <section>
        <h3>Constraints</h3>
        <ul>
          {mission.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}
        </ul>
      </section>

      <section>
        <h3>Examples</h3>
        {mission.examples.map((example) => (
          <div className="combat-example" key={example.input}>
            <code>{example.input}</code>
            <span>→ {example.output}</span>
            <small>{example.why}</small>
          </div>
        ))}
      </section>

      <section className="combat-hints">
        <div>
          <h3>Progressive hints</h3>
          <span>{hintsUsed}/{mission.hints.length} used</span>
        </div>
        {mission.hints.slice(0, hintsUsed).map((hint, index) => (
          <p key={hint}><b>Hint {index + 1}</b>{hint}</p>
        ))}
        {hintsUsed < mission.hints.length ? (
          <Button variant="subtle" icon="insight" onClick={onRevealHint}>
            Reveal hint · −15 technique points
          </Button>
        ) : null}
      </section>
    </aside>
  );
}

function TestConsole({
  result,
  runScope,
  isRunning,
}: {
  result?: CodingCombatRunResult;
  runScope: "visible" | "complete";
  isRunning: boolean;
}) {
  const passedCount = result?.results.filter((test) => test.passed).length ?? 0;
  return (
    <section className="combat-console" aria-labelledby="combat-console-heading" aria-live="polite">
      <header>
        <div>
          <span className="combat-console-dot" aria-hidden />
          <strong id="combat-console-heading">Test console</strong>
        </div>
        {result ? <span>{passedCount}/{result.results.length} passed · {result.durationMs.toFixed(1)}ms</span> : null}
      </header>
      {isRunning ? (
        <div className="combat-console-empty"><span className="combat-running-dot" aria-hidden />Executing in an isolated worker…</div>
      ) : result?.fatalError ? (
        <div className="combat-console-fatal">
          <Icon name="insight" size={16} />
          <div><strong>{result.timedOut ? "Execution terminated" : "Runner error"}</strong><p>{result.fatalError}</p></div>
        </div>
      ) : result ? (
        <div className="combat-test-list">
          {result.results.map((test) => (
            <article className={test.passed ? "combat-test-pass" : "combat-test-fail"} key={test.id}>
              <Icon name={test.passed ? "check" : "close"} size={14} />
              <div>
                <strong>{test.hidden ? "Hidden assertion" : test.label}</strong>
                {test.error ? <code>{test.error}</code> : test.hidden ? (
                  <small>{test.passed ? "Private edge case held" : "Private edge case failed; inspect your invariant and boundaries"}</small>
                ) : (
                  <small>expected {formatCombatValue(test.expected)} · received {formatCombatValue(test.actual)}</small>
                )}
              </div>
              <span>{test.durationMs.toFixed(1)}ms</span>
            </article>
          ))}
          {runScope === "visible" && result.passed ? (
            <p className="combat-console-callout">Visible tests are green. Hidden tests will probe duplicates, boundaries, and invalid assumptions.</p>
          ) : null}
        </div>
      ) : (
        <div className="combat-console-empty">Run visible tests for fast feedback, then submit when you can defend the invariant.</div>
      )}
    </section>
  );
}

function DefensePanel({
  mission,
  answers,
  onAnswer,
  onSubmit,
}: {
  mission: CodingCombatMission;
  answers: Record<string, string>;
  onAnswer: (questionId: string, optionId: string) => void;
  onSubmit: () => void;
}) {
  const allAnswered = mission.defense.every((question) => answers[question.id]);
  return (
    <section className="combat-defense" aria-labelledby="combat-defense-heading">
      <header>
        <Eyebrow tone={color.amber}>Code accepted · defense phase</Eyebrow>
        <h2 id="combat-defense-heading">Prove it was reasoning, not luck.</h2>
        <p>Answer the follow-ups an interviewer uses to distinguish a memorized solution from a transferable pattern.</p>
      </header>
      <div className="combat-defense-questions">
        {mission.defense.map((question, questionIndex) => (
          <fieldset key={question.id}>
            <legend>
              <span>{question.category}</span>
              <strong>{questionIndex + 1}. {question.prompt}</strong>
            </legend>
            <div>
              {question.options.map((option) => (
                <button
                  key={option.id}
                  aria-pressed={answers[question.id] === option.id}
                  className={answers[question.id] === option.id ? "selected" : ""}
                  onClick={() => onAnswer(question.id, option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <Button icon="shield" disabled={!allAnswered} onClick={onSubmit}>Lock defense and score run</Button>
    </section>
  );
}

function CodingCombatCompletion({
  mission,
  grade,
  hintsUsed,
  failedSubmissions,
  baselineBest,
  onReplay,
  onNext,
  onExit,
  hasNext,
}: {
  mission: CodingCombatMission;
  grade: CodingCombatGrade;
  hintsUsed: number;
  failedSubmissions: number;
  baselineBest: number;
  onReplay: () => void;
  onNext: () => void;
  onExit: () => void;
  hasNext: boolean;
}) {
  const newBest = grade.score > baselineBest;
  const runXp = 200 + Math.round((grade.score / grade.maxScore) * 200);
  const previousXp = baselineBest > 0 ? 200 + Math.round((baselineBest / grade.maxScore) * 200) : 0;
  const newXp = newBest ? Math.max(0, runXp - previousXp) : 0;
  return (
    <section className="combat-complete">
      <div className="combat-complete-orbit" aria-hidden />
      <Eyebrow tone={color.green}>Build accepted · defense scored</Eyebrow>
      <div className="combat-complete-score" role="img" aria-label={`${grade.score} out of ${CODING_COMBAT_MAX_SCORE} points`}>
        <span>SCORE</span>
        <strong>{grade.score}</strong>
        <small>/ {CODING_COMBAT_MAX_SCORE}</small>
      </div>
      <h1>{newBest ? "New best run." : "Pattern defended."}</h1>
      <p>{mission.title} passed every visible and hidden assertion. Your score now reflects whether you could explain why it works.</p>

      <div className="combat-score-breakdown">
        <ScorePart label="correct implementation" value={`+${grade.codePoints}`} />
        <ScorePart label="defense" value={`+${grade.defensePoints}`} />
        <ScorePart label={`technique · ${hintsUsed} hints`} value={`+${grade.techniquePoints}`} />
        <ScorePart label={`${failedSubmissions} failed submissions`} value={grade.submissionPenalty ? `−${grade.submissionPenalty}` : "0"} />
        <ScorePart label="new best-score XP" value={newXp ? `+${newXp}` : "0"} />
      </div>

      <div className="combat-defense-review">
        {grade.defenseResults.map((result, index) => (
          <article className={result.correct ? "correct" : "wrong"} key={result.questionId}>
            <div><Icon name={result.correct ? "check" : "insight"} size={15} /><strong>Defense {index + 1} · {result.correct ? "held" : "missed"}</strong></div>
            <p>{result.feedback}</p>
            {!result.correct ? <small>Defensible answer: {result.correctLabel}</small> : null}
          </article>
        ))}
      </div>

      <div className="combat-complete-actions">
        <Button icon="reset" onClick={onReplay}>Replay this mission</Button>
        {hasNext ? <Button variant="ghost" iconRight="arrowRight" onClick={onNext}>Next mission</Button> : null}
        <Button variant="subtle" onClick={onExit}>Mission select</Button>
      </div>
    </section>
  );
}

function StageState({ label, active, complete }: { label: string; active: boolean; complete: boolean }) {
  return (
    <div role="listitem" aria-current={active ? "step" : undefined} className={active ? "active" : complete ? "complete" : ""}>
      <i>{complete ? <Icon name="check" size={11} /> : null}</i>
      <span>{label}</span>
    </div>
  );
}

function ScorePart({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
