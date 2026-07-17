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
  ChapterInterviewAssessment,
  ChapterOption,
  SolidChapterMission,
} from "@/arena/solidChapterEngine";
import { recordChapterCompletion } from "@/game/garageProgress";

/**
 * Plays one SOLID campaign chapter (OCP, LSP, ISP, DIP) through the loop the
 * first shift proved: incident -> consequence-driven repair -> rerun ->
 * hints-off transfer -> (earned pattern) -> debrief -> rubric-graded
 * interview. Wrong choices show world consequences and keep the learner in
 * the stage; the rerun of the same board gates progression.
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
    undefined,
    createChapterState,
  );
  const [answer, setAnswer] = useState("");
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
            <Play size={18} weight="fill" /> Start the incident
          </button>
        </section>
      )}

      {(state.stage === "incident" || state.stage === "repair" || state.stage === "rerun") && (
        <section className="chapter-card">
          <div className="chapter-coach" role="status">
            {state.stage === "repair" && state.activeWrongRepairId ? <Warning size={22} weight="fill" /> : <Lightbulb size={22} weight="duotone" />}
            <p>{state.feedback}</p>
          </div>

          <ScenarioBoard mission={mission} repaired={state.stage === "rerun"} />

          {state.stage === "incident" && (
            <button className="shift-primary" type="button" onClick={() => dispatch({ type: "SEE_FAILURE" })}>
              <Wrench size={18} /> Diagnose the failure
            </button>
          )}

          {state.stage === "repair" && (
            <OptionList
              prompt={mission.repair.prompt}
              options={mission.repair.options}
              activeWrongId={state.activeWrongRepairId}
              onChoose={(optionId) => dispatch({ type: "CHOOSE_REPAIR", optionId })}
            />
          )}

          {state.stage === "rerun" && (
            <div className="chapter-rerun">
              <div className="chapter-before-after">
                <article>
                  <small>Before</small>
                  <p>{mission.rerun.before}</p>
                </article>
                <ArrowRight size={20} />
                <article className="is-after">
                  <small>After</small>
                  <p>{mission.rerun.after}</p>
                </article>
              </div>
              <button className="shift-primary" type="button" onClick={() => dispatch({ type: "CONFIRM_RERUN" })}>
                {mission.rerun.summary} <ArrowRight size={18} />
              </button>
            </div>
          )}
        </section>
      )}

      {state.stage === "transfer" && (
        <section className="chapter-card">
          <span className="chapter-hints-off">Transfer round · hints off</span>
          <OptionList
            prompt={mission.transfer.prompt}
            options={mission.transfer.options}
            activeWrongId={state.activeWrongTransferId}
            onChoose={(optionId) => dispatch({ type: "CHOOSE_TRANSFER", optionId })}
            feedback={state.activeWrongTransferId ? state.feedback : undefined}
          />
        </section>
      )}

      {state.stage === "pattern" && mission.pattern && (
        <section className="chapter-card">
          <span className="chapter-hints-off is-earned">Pattern earned the honest way</span>
          <OptionList
            prompt={mission.pattern.prompt}
            options={mission.pattern.options}
            activeWrongId={state.activeWrongPatternId}
            onChoose={(optionId) => dispatch({ type: "CHOOSE_PATTERN", optionId })}
            feedback={state.activeWrongPatternId ? state.feedback : undefined}
          />
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
            You watched the failure, repaired the design, transferred it with hints off, and defended it in interview
            language.
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

function ScenarioBoard({ mission, repaired }: { mission: SolidChapterMission; repaired: boolean }) {
  return (
    <div className="chapter-board" aria-label="Scenario suite results">
      {mission.incident.board.map((row) => {
        const failing = !repaired && row.before === "fail";
        return (
          <div key={row.id} className={failing ? "is-failing" : "is-passing"}>
            {failing ? <XCircle size={17} weight="fill" /> : <CheckCircle size={17} weight="fill" />}
            <div>
              <strong>{row.label}</strong>
              <p>{repaired && row.before === "fail" ? "Passing after the repair." : row.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OptionList({
  prompt,
  options,
  activeWrongId,
  onChoose,
  feedback,
}: {
  prompt: string;
  options: ChapterOption[];
  activeWrongId?: string;
  onChoose: (optionId: string) => void;
  feedback?: string;
}) {
  return (
    <div className="chapter-options">
      <h3>{prompt}</h3>
      {feedback && (
        <div className="chapter-coach is-danger" role="status">
          <Warning size={22} weight="fill" />
          <p>{feedback}</p>
        </div>
      )}
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={option.id === activeWrongId ? "chapter-option is-wrong" : "chapter-option"}
          onClick={() => onChoose(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
