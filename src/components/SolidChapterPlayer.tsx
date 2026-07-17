import { useReducer, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowClockwise,
  CheckCircle,
  Lightbulb,
  Play,
  Warning,
  XCircle,
  Wrench,
} from "@phosphor-icons/react";
import {
  assessChapterInterview,
  createChapterState,
  reduceChapter,
  CHAPTER_COMPLETION_THRESHOLD,
} from "@/arena/solidChapterEngine";
import type {
  BenchState,
  ChapterInterviewAssessment,
  SolidChapterMission,
  Workbench,
} from "@/arena/solidChapterEngine";
import { recordChapterCompletion } from "@/game/garageProgress";
import type { ComponentType } from "react";
import { ImpostorSpotWorld } from "./ImpostorSpotWorld";
import { TariffWarsWorld } from "./TariffWarsWorld";
import { OneRemoteWorld } from "./OneRemoteWorld";
import { ExitRushWorld } from "./ExitRushWorld";
import type { ChapterPrincipleId } from "@/arena/solidChapterEngine";

// Every chapter opens with a living incident: watch the world break before
// the workbench names why. Same philosophy as Mission 1's garage floor.
const LIVING_WORLDS: Record<ChapterPrincipleId, ComponentType<{ onWitnessed: () => void }>> = {
  ocp: TariffWarsWorld,
  lsp: ImpostorSpotWorld,
  isp: OneRemoteWorld,
  dip: ExitRushWorld,
};

/**
 * Plays one SOLID campaign chapter through a workbench, not a quiz: the
 * learner arranges the design, runs the world, and reads the computed
 * consequences. Progression requires making the same scenario board pass on
 * a rerun. The only labeled-answer step left is naming the pattern AFTER it
 * has been earned, which is vocabulary, not design.
 */
export function SolidChapterPlayer({
  mission,
  onExit,
  onComplete,
}: {
  mission: SolidChapterMission;
  onExit: () => void;
  onComplete?: () => void;
}) {
  const [state, dispatch] = useReducer(
    (current: ReturnType<typeof createChapterState>, action: Parameters<typeof reduceChapter>[2]) =>
      reduceChapter(mission, current, action),
    mission,
    createChapterState,
  );
  const [answer, setAnswer] = useState("");
  // The computed board appears only after the learner has watched this
  // chapter's living world break.
  const [worldWitnessed, setWorldWitnessed] = useState(false);
  const LivingWorld = LIVING_WORLDS[mission.id];
  const [assessment, setAssessment] = useState<ChapterInterviewAssessment>();
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const submitInterview = () => {
    const next = assessChapterInterview(mission, answer);
    setAssessment(next);
    dispatch({ type: "SUBMIT_INTERVIEW", score: next.score });
    if (next.score >= CHAPTER_COMPLETION_THRESHOLD) {
      recordChapterCompletion(mission.id, next.score, state.interviewAttempts + 1);
      onComplete?.();
    }
  };

  const replay = () => {
    dispatch({ type: "RESET" });
    setAnswer("");
    setAssessment(undefined);
    setShowModelAnswer(false);
  };

  return (
    <main className="chapter" data-stage={state.stage} aria-labelledby="chapter-title">
      <header className="chapter-top">
        <button className="chapter-back" type="button" onClick={onExit}>
          <ArrowLeft size={14} /> Campaign
        </button>
        <div>
          <small>
            Chapter {mission.order} · {mission.principle}
          </small>
          <h1 id="chapter-title">{mission.title}</h1>
        </div>
      </header>

      {state.stage === "briefing" && (
        <section className="chapter-card">
          <h2>{mission.briefing.headline}</h2>
          <p>{mission.briefing.body}</p>
          <div className="chapter-beats">
            {mission.briefing.beats.map((beat, index) => (
              <article key={beat}>
                <span>{index + 1}</span>
                <strong>{beat}</strong>
              </article>
            ))}
          </div>
          <button className="shift-primary" type="button" onClick={() => dispatch({ type: "BEGIN" })}>
            <Play size={18} weight="fill" /> Run the world
          </button>
        </section>
      )}

      {state.stage === "incident" && (
        <section className="chapter-card">
          <LivingWorld onWitnessed={() => setWorldWitnessed(true)} />
          {worldWitnessed ? (
            <>
              <div className="chapter-coach" role="status">
                <Lightbulb size={22} weight="duotone" />
                <p>{state.feedback}</p>
              </div>
              <ResultsBoard bench={mission.repairBench} benchState={state.repair} />
              <button className="shift-primary" type="button" onClick={() => dispatch({ type: "SEE_FAILURE" })}>
                <Wrench size={18} /> Open the workbench
              </button>
            </>
          ) : null}
        </section>
      )}

      {state.stage === "repair" && (
        <WorkbenchView
          bench={mission.repairBench}
          benchState={state.repair}
          banner={mission.incident.failureBanner}
          continueLabel="Take the fix to the next incident"
          onSet={(controlId, optionId) => dispatch({ type: "SET_CONTROL", bench: "repair", controlId, optionId })}
          onRun={() => dispatch({ type: "RUN_BENCH", bench: "repair" })}
          onContinue={() => dispatch({ type: "CONFIRM_RERUN" })}
          rerun={mission.rerun}
        />
      )}

      {state.stage === "transfer" && (
        <WorkbenchView
          bench={mission.transferBench}
          benchState={state.transfer}
          hintsOff
          continueLabel="Continue"
          onSet={(controlId, optionId) => dispatch({ type: "SET_CONTROL", bench: "transfer", controlId, optionId })}
          onRun={() => dispatch({ type: "RUN_BENCH", bench: "transfer" })}
          onContinue={() => dispatch({ type: "CONFIRM_RERUN" })}
        />
      )}

      {state.stage === "pattern" && mission.pattern && (
        <section className="chapter-card">
          <span className="chapter-hints-off is-earned">Pattern earned the honest way</span>
          <div className="chapter-options">
            <h3>{mission.pattern.prompt}</h3>
            {state.activeWrongPatternId && (
              <div className="chapter-coach is-danger" role="status">
                <Warning size={22} weight="fill" />
                <p>{state.feedback}</p>
              </div>
            )}
            {mission.pattern.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={option.id === state.activeWrongPatternId ? "chapter-option is-wrong" : "chapter-option"}
                onClick={() => dispatch({ type: "CHOOSE_PATTERN", optionId: option.id })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {state.stage === "debrief" && (
        <section className="chapter-card chapter-debrief">
          {mission.pattern && (
            <div className="chapter-unlock">
              <CheckCircle size={18} weight="fill" /> Pattern unlocked: <strong>{mission.pattern.unlockedName}</strong>
              <p>
                {mission.pattern.whenToUse} {mission.pattern.whenNotToUse}
              </p>
            </div>
          )}
          <h2>{mission.debrief.headline}</h2>
          <p>{mission.debrief.body}</p>
          <div className="chapter-mappings">
            {mission.debrief.mappings.map((mapping) => (
              <div key={mapping.domain}>
                <span>{mapping.domain}</span>
                <ArrowRight size={14} />
                <strong>{mapping.software}</strong>
              </div>
            ))}
          </div>
          <div className="chapter-columns">
            <article>
              <small>Garage blueprint</small>
              <pre>{mission.debrief.javaSnippet}</pre>
            </article>
            <article className="is-defense">
              <small>Your design defense</small>
              <p>{mission.debrief.defense}</p>
            </article>
          </div>
          <button className="shift-primary" type="button" onClick={() => dispatch({ type: "ENTER_INTERVIEW" })}>
            Enter the interview room <ArrowRight size={18} />
          </button>
        </section>
      )}

      {state.stage === "interview" && (
        <section className="chapter-card">
          <h2>{mission.interview.prompt}</h2>
          <div className="chapter-interview">
            <div>
              <small>Answer in your own words</small>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                rows={7}
                placeholder="I would..."
              />
              <div className="chapter-interview-actions">
                <button className="shift-secondary" type="button" onClick={() => setShowModelAnswer((current) => !current)}>
                  {showModelAnswer ? "Hide the strong answer" : "See a strong answer"}
                </button>
                <button className="shift-primary" type="button" disabled={answer.trim().length < 20} onClick={submitInterview}>
                  Check my reasoning <ArrowRight size={18} />
                </button>
              </div>
              {showModelAnswer && <p className="chapter-model-answer">{mission.interview.modelAnswer}</p>}
              {assessment && assessment.score < CHAPTER_COMPLETION_THRESHOLD && (
                <div className="chapter-coach is-danger" role="status">
                  <Warning size={22} weight="fill" />
                  <p>
                    {assessment.score}% so far. Still missing: {assessment.missing.join("; ")}. Say those ideas in your own
                    words and check again.
                  </p>
                </div>
              )}
            </div>
            <aside>
              <small>Evidence your interviewer needs</small>
              <ul>
                {mission.interview.rubric.map((item) => {
                  const matched = assessment?.matched.includes(item.label);
                  const missed = assessment && !matched;
                  return (
                    <li key={item.id} className={matched ? "is-matched" : missed ? "is-missed" : undefined}>
                      {matched ? <CheckCircle size={16} weight="fill" /> : missed ? <XCircle size={16} /> : <span className="chapter-dot" />}
                      {item.label}
                    </li>
                  );
                })}
              </ul>
              <small className="chapter-rubric-note">You do not need exact wording. Explain the ideas and the consequence.</small>
            </aside>
          </div>
        </section>
      )}

      {state.stage === "complete" && (
        <section className="chapter-card chapter-complete">
          <span className="chapter-complete-icon">
            <CheckCircle size={44} weight="fill" />
          </span>
          <small>Chapter {mission.order} complete</small>
          <h2>{mission.principle}: earned, not memorized.</h2>
          <p>
            You ran the failure, rearranged the design until the same world passed, transferred it with hints off, and
            defended it in interview language.
          </p>
          <div className="chapter-score">
            <strong>{state.interviewScore}%</strong>
            <span>interview evidence</span>
          </div>
          <div className="chapter-complete-actions">
            <button className="shift-primary" type="button" onClick={onExit}>
              Back to the campaign <ArrowRight size={18} />
            </button>
            <button className="shift-secondary" type="button" onClick={replay}>
              <ArrowClockwise size={18} /> Replay this chapter
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function ResultsBoard({ bench, benchState }: { bench: Workbench; benchState: BenchState }) {
  if (!benchState.results) return null;
  const labels = new Map(bench.rows.map((row) => [row.id, row.label]));
  return (
    <div className="chapter-board" aria-label="Scenario suite results">
      {benchState.results.map((row) => (
        <div key={row.rowId} className={row.pass ? "is-passing" : "is-failing"}>
          {row.pass ? <CheckCircle size={17} weight="fill" /> : <XCircle size={17} weight="fill" />}
          <div>
            <strong>{labels.get(row.rowId)}</strong>
            <p>{row.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkbenchView({
  bench,
  benchState,
  banner,
  hintsOff,
  continueLabel,
  rerun,
  onSet,
  onRun,
  onContinue,
}: {
  bench: Workbench;
  benchState: BenchState;
  banner?: string;
  hintsOff?: boolean;
  continueLabel: string;
  rerun?: { before: string; after: string };
  onSet: (controlId: string, optionId: string) => void;
  onRun: () => void;
  onContinue: () => void;
}) {
  const hasStaleConfig = benchState.results === undefined && benchState.runs > 0;
  return (
    <section className="chapter-card">
      {hintsOff ? (
        <span className="chapter-hints-off">Transfer round · hints off</span>
      ) : banner ? (
        <div className="chapter-coach" role="status">
          <Lightbulb size={22} weight="duotone" />
          <p>{banner}</p>
        </div>
      ) : null}

      <div className="chapter-workbench">
        <h3>{bench.intro}</h3>
        {bench.controls.map((control) => (
          <div key={control.id} className="chapter-control">
            <span className="chapter-control-label">{control.label}</span>
            <div className="chapter-control-options" role="group" aria-label={control.label}>
              {control.options.map((option) => {
                const selected = benchState.config[control.id] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    className={selected ? "chapter-pill is-selected" : "chapter-pill"}
                    onClick={() => onSet(control.id, option.id)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="chapter-run-row">
          <button className="shift-primary" type="button" onClick={onRun}>
            <Play size={18} weight="fill" /> Run the world
          </button>
          <span className="chapter-run-count">
            {benchState.runs === 0
              ? "The suite reruns against whatever you arrange."
              : hasStaleConfig
                ? "Configuration changed. Run again to see what the world says now."
                : `${benchState.runs} run${benchState.runs === 1 ? "" : "s"} so far`}
          </span>
        </div>
      </div>

      <ResultsBoard bench={bench} benchState={benchState} />

      {benchState.allPass && (
        <div className="chapter-rerun">
          <div className="chapter-coach" role="status">
            <CheckCircle size={22} weight="fill" />
            <p>{bench.successNote}</p>
          </div>
          {rerun && (
            <div className="chapter-before-after">
              <article>
                <small>Before</small>
                <p>{rerun.before}</p>
              </article>
              <ArrowRight size={20} />
              <article className="is-after">
                <small>After</small>
                <p>{rerun.after}</p>
              </article>
            </div>
          )}
          <button className="shift-primary" type="button" onClick={onContinue}>
            {continueLabel} <ArrowRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}
