import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ARENA_CHALLENGES, ARENA_MODE_META } from "@/arena/arenaChallenges";
import { getArenaPerformance, scoreArenaAnswer } from "@/arena/arenaSession";
import type { ArenaAnswerOutcome } from "@/arena/arenaSession";
import type { ArenaChallenge, ArenaMode, ArenaScores } from "@/arena/types";
import { ArenaWorld } from "@/components/ArenaWorld";
import { Button, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useGameProgress } from "@/hooks/useGameProgress";
import { color } from "@/theme/tokens";
import "@/theme/arena.css";

type SessionStatus = "briefing" | "active" | "complete";

const MODES: ArenaMode[] = ["coding", "hld", "lld"];
const MAX_POINTS_PER_ENCOUNTER = 150;

export function ArenaPage() {
  const navigate = useNavigate();
  const { arenaScores, recordArenaRun } = useGameProgress();
  const [mode, setMode] = useState<ArenaMode>("coding");
  const [status, setStatus] = useState<SessionStatus>("briefing");
  const [encounterIndex, setEncounterIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [outcome, setOutcome] = useState<ArenaAnswerOutcome>();
  const [secondsLeft, setSecondsLeft] = useState(ARENA_CHALLENGES.coding[0].seconds);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const challenges = ARENA_CHALLENGES[mode];
  const challenge = challenges[encounterIndex];
  const maxScore = challenges.length * MAX_POINTS_PER_ENCOUNTER;
  const progressPercent = ((encounterIndex + (submitted ? 1 : 0)) / challenges.length) * 100;

  useEffect(() => {
    if (status !== "active" || submitted) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [status, submitted, encounterIndex]);

  useEffect(() => {
    if (status !== "active" || submitted || secondsLeft > 0) return;
    const timedOut = scoreArenaAnswer(challenge, undefined, 0);
    setOutcome(timedOut);
    setSubmitted(true);
    setHealth((current) => clampHealth(current + timedOut.healthDelta));
    setCombo(0);
  }, [challenge, secondsLeft, status, submitted]);

  const startMission = () => {
    const firstChallenge = ARENA_CHALLENGES[mode][0];
    setEncounterIndex(0);
    setSelectedChoiceId(undefined);
    setSubmitted(false);
    setOutcome(undefined);
    setSecondsLeft(firstChallenge.seconds);
    setScore(0);
    setHealth(100);
    setCombo(0);
    setBestCombo(0);
    setCorrectAnswers(0);
    setStatus("active");
  };

  const submitAnswer = () => {
    if (!selectedChoiceId || submitted) return;
    const result = scoreArenaAnswer(challenge, selectedChoiceId, secondsLeft);
    const nextCombo = result.correct ? combo + 1 : 0;
    setOutcome(result);
    setSubmitted(true);
    setScore((current) => current + result.points);
    setHealth((current) => clampHealth(current + result.healthDelta));
    setCombo(nextCombo);
    setBestCombo((current) => Math.max(current, nextCombo));
    if (result.correct) setCorrectAnswers((current) => current + 1);
  };

  const advanceMission = () => {
    if (encounterIndex === challenges.length - 1) {
      recordArenaRun(mode, score, maxScore);
      setStatus("complete");
      return;
    }
    const nextIndex = encounterIndex + 1;
    setEncounterIndex(nextIndex);
    setSelectedChoiceId(undefined);
    setSubmitted(false);
    setOutcome(undefined);
    setSecondsLeft(challenges[nextIndex].seconds);
  };

  if (status === "briefing") {
    return (
      <ArenaBriefing
        mode={mode}
        arenaScores={arenaScores}
        onModeChange={setMode}
        onStart={startMission}
        onOpenCodingLab={() => navigate("/arena/coding-lab")}
        onOpenLldStudio={() => navigate("/arena/lld-studio")}
        onOpenPatternGenome={() => navigate("/arena/pattern-genome")}
      />
    );
  }

  if (status === "complete") {
    const performance = getArenaPerformance(score, maxScore);
    const bankedXp = 150 + Math.round((score / maxScore) * 200);
    return (
      <section className="arena-complete">
        <div className="arena-complete-glow" aria-hidden />
        <Eyebrow tone={color.green}>Simulation complete</Eyebrow>
        <div className="arena-score-core" role="img" aria-label={`${score} out of ${maxScore} points`}>
          <span>SCORE</span>
          <strong>{score}</strong>
          <small>/ {maxScore}</small>
        </div>
        <h1>{performance.label}</h1>
        <p>{performance.message}</p>
        <div className="arena-complete-stats">
          <CompleteMetric label="decisions held" value={`${correctAnswers}/${challenges.length}`} />
          <CompleteMetric label="system integrity" value={`${health}%`} />
          <CompleteMetric label="best combo" value={`${bestCombo}x`} />
          <CompleteMetric label="best-run XP bank" value={`+${bankedXp}`} />
        </div>
        <div className="arena-complete-actions">
          <Button icon="reset" onClick={startMission}>Run this simulation again</Button>
          <Button variant="ghost" onClick={() => setStatus("briefing")}>Choose another mode</Button>
          <Button variant="subtle" onClick={() => navigate("/course")}>Return to campaign</Button>
        </div>
      </section>
    );
  }

  return (
    <div className="arena-active">
      <header className="arena-active-header">
        <div>
          <Eyebrow tone={color.red}>{ARENA_MODE_META[mode].kicker}</Eyebrow>
          <h1>{ARENA_MODE_META[mode].label}</h1>
        </div>
        <button className="arena-abort" onClick={() => setStatus("briefing")}>Abort simulation</button>
      </header>

      <div
        className="arena-mission-progress"
        role="progressbar"
        aria-label="Mission progress"
        aria-valuemin={0}
        aria-valuemax={challenges.length}
        aria-valuenow={encounterIndex + (submitted ? 1 : 0)}
        aria-valuetext={`Encounter ${encounterIndex + 1} of ${challenges.length}`}
      >
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="arena-session-layout">
        <div className="arena-main-console">
          <ArenaWorld challenge={challenge} mode={mode} health={health} />
          <EncounterPanel
            challenge={challenge}
            selectedChoiceId={selectedChoiceId}
            submitted={submitted}
            outcome={outcome}
            onSelect={setSelectedChoiceId}
            onSubmit={submitAnswer}
            onAdvance={advanceMission}
            finalEncounter={encounterIndex === challenges.length - 1}
          />
        </div>

        <ArenaTelemetry
          challenge={challenge}
          encounterIndex={encounterIndex}
          encounterCount={challenges.length}
          secondsLeft={secondsLeft}
          score={score}
          health={health}
          combo={combo}
          submitted={submitted}
        />
      </div>
    </div>
  );
}

function ArenaBriefing({
  mode,
  arenaScores,
  onModeChange,
  onStart,
  onOpenCodingLab,
  onOpenLldStudio,
  onOpenPatternGenome,
}: {
  mode: ArenaMode;
  arenaScores: ArenaScores;
  onModeChange: (mode: ArenaMode) => void;
  onStart: () => void;
  onOpenCodingLab: () => void;
  onOpenLldStudio: () => void;
  onOpenPatternGenome: () => void;
}) {
  const selectedMeta = ARENA_MODE_META[mode];
  const best = arenaScores[mode];

  return (
    <div className="arena-briefing">
      <header className="arena-hero">
        <div>
          <Eyebrow tone={color.red}>Interactive interview simulator</Eyebrow>
          <h1>Enter the Arena.</h1>
          <p>Three decisions. One clock. Every rejected answer explains the engineering signal an interviewer was looking for.</p>
        </div>
        <div className="arena-hero-orbit" aria-hidden>
          <span><Icon name="target" size={27} /></span>
        </div>
      </header>

      <div className="arena-mode-grid" role="group" aria-label="Arena mode">
        {MODES.map((candidate) => {
          const meta = ARENA_MODE_META[candidate];
          const active = candidate === mode;
          const score = arenaScores[candidate];
          return (
            <button
              key={candidate}
              className={`arena-mode-card${active ? " arena-mode-card-active" : ""}`}
              aria-pressed={active}
              onClick={() => onModeChange(candidate)}
            >
              <span>{meta.kicker}</span>
              <strong>{meta.label}</strong>
              <p>{meta.description}</p>
              <small>{score ? `BEST ${score.bestScore} / ${score.maxScore}` : "UNPLAYED"}</small>
            </button>
          );
        })}
      </div>

      <section className="arena-briefing-panel">
        <div>
          <Eyebrow tone={color.amber}>Mission briefing</Eyebrow>
          <h2>{selectedMeta.label}</h2>
          <p>{selectedMeta.description}</p>
          <div className="arena-skill-chips">
            {selectedMeta.skills.map((skill) => <span key={skill}>{skill}</span>)}
          </div>
        </div>
        <div className="arena-briefing-facts">
          <BriefingFact label="encounters" value="3" />
          <BriefingFact label="clock" value="40–50s" />
          <BriefingFact label="best score" value={best ? `${best.bestScore}` : "—"} />
        </div>
        <div className="arena-briefing-actions">
          <Button icon="play" onClick={onStart}>Start {selectedMeta.label}</Button>
          <Button variant="ghost" icon="insight" onClick={onOpenPatternGenome}>Enter System Forge</Button>
          {mode === "coding" ? (
            <Button variant="ghost" icon="code" onClick={onOpenCodingLab}>Open Build &amp; Defend Lab</Button>
          ) : null}
          {mode === "lld" ? (
            <Button variant="ghost" icon="layers" onClick={onOpenLldStudio}>Open LLD Design Studio</Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function EncounterPanel({
  challenge,
  selectedChoiceId,
  submitted,
  outcome,
  onSelect,
  onSubmit,
  onAdvance,
  finalEncounter,
}: {
  challenge: ArenaChallenge;
  selectedChoiceId?: string;
  submitted: boolean;
  outcome?: ArenaAnswerOutcome;
  onSelect: (choiceId: string) => void;
  onSubmit: () => void;
  onAdvance: () => void;
  finalEncounter: boolean;
}) {
  return (
    <section className="arena-encounter">
      <header>
        <Eyebrow tone={color.blue}>{challenge.title}</Eyebrow>
        <p>{challenge.context}</p>
        <h2>{challenge.prompt}</h2>
      </header>

      <div className="arena-choice-list" role="group" aria-label="Response options">
        {challenge.choices.map((choice, index) => {
          const selected = choice.id === selectedChoiceId;
          const revealCorrect = submitted && choice.correct;
          const revealWrong = submitted && selected && !choice.correct;
          const className = [
            "arena-choice",
            selected ? "arena-choice-selected" : "",
            revealCorrect ? "arena-choice-correct" : "",
            revealWrong ? "arena-choice-wrong" : "",
          ].filter(Boolean).join(" ");
          return (
            <button
              key={choice.id}
              className={className}
              aria-pressed={selected}
              disabled={submitted}
              onClick={() => onSelect(choice.id)}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              <strong>{choice.label}</strong>
              {submitted && choice.correct && <Icon name="check" size={15} />}
            </button>
          );
        })}
      </div>

      {submitted && outcome ? (
        <div className={`arena-feedback${outcome.correct ? " arena-feedback-correct" : " arena-feedback-wrong"}`} aria-live="polite">
          <div>
            <Icon name={outcome.correct ? "check" : "insight"} size={17} />
            <strong>{outcome.correct ? `Decision held · +${outcome.points} points` : "Decision breached"}</strong>
          </div>
          <p>{outcome.feedback}</p>
          <span><b>Carry forward:</b> {challenge.takeaway}</span>
        </div>
      ) : null}

      <div className="arena-encounter-actions">
        {!submitted ? (
          <Button icon="target" onClick={onSubmit} disabled={!selectedChoiceId}>Lock answer</Button>
        ) : (
          <Button iconRight="arrowRight" onClick={onAdvance}>{finalEncounter ? "Finish simulation" : "Next encounter"}</Button>
        )}
      </div>
    </section>
  );
}

function ArenaTelemetry({
  challenge,
  encounterIndex,
  encounterCount,
  secondsLeft,
  score,
  health,
  combo,
  submitted,
}: {
  challenge: ArenaChallenge;
  encounterIndex: number;
  encounterCount: number;
  secondsLeft: number;
  score: number;
  health: number;
  combo: number;
  submitted: boolean;
}) {
  const timeRatio = secondsLeft / challenge.seconds;
  const timerTone = secondsLeft <= 10 ? color.red : secondsLeft <= 20 ? color.amber : color.teal;

  return (
    <aside className="arena-telemetry" aria-label="Mission telemetry">
      <Eyebrow>Mission telemetry</Eyebrow>
      <div
        className="arena-timer"
        role="timer"
        aria-label={`${secondsLeft} seconds remaining`}
        style={{ background: `conic-gradient(${timerTone} ${timeRatio * 360}deg, rgba(255,255,255,0.055) 0deg)` }}
      >
        <div>
          <strong>{secondsLeft}</strong>
          <span>seconds</span>
        </div>
      </div>
      <div className="arena-telemetry-metrics">
        <TelemetryMetric label="score" value={`${score}`} tone={color.teal} />
        <TelemetryMetric label="integrity" value={`${health}%`} tone={health <= 30 ? color.red : color.blue} />
        <TelemetryMetric label="combo" value={`${combo}x`} tone={color.amber} />
      </div>
      <div className="arena-encounter-map">
        <span>encounter map</span>
        <div>
          {Array.from({ length: encounterCount }, (_, index) => (
            <i
              key={`encounter-${index + 1}`}
              className={index < encounterIndex || (index === encounterIndex && submitted) ? "complete" : index === encounterIndex ? "active" : ""}
            >
              {index + 1}
            </i>
          ))}
        </div>
      </div>
      <p className="arena-telemetry-note">Speed adds up to 50 bonus points. Explanation quality matters more than guessing quickly.</p>
    </aside>
  );
}

function TelemetryMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong style={{ color: tone }}>{value}</strong>
    </div>
  );
}

function CompleteMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BriefingFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function clampHealth(value: number): number {
  return Math.max(0, Math.min(100, value));
}
