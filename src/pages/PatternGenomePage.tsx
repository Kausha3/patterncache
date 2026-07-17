import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Buildings,
  Car,
  CaretDown,
  ChargingStation,
  CheckCircle,
  Circuitry,
  Coins,
  Cube,
  FlowArrow,
  GearSix,
  Lightning,
  LockKey,
  Microphone,
  Package,
  PaperPlaneTilt,
  Pause,
  Play,
  Receipt,
  User,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import {
  assessForgeExplanation,
  evaluateForgeDesign,
  getForgeBeginnerComponents,
  getForgeVerdictLabel,
} from "@/arena/systemForgeEngine";
import type { CoachAssessment, ForgeRunResult } from "@/arena/systemForgeEngine";
import {
  generateLldGameJava,
  getPhaseReadiness,
  LLD_GAME_PHASES,
  scoreLldGame,
} from "@/arena/lldGameEngine";
import type { LldGameAction, LldGamePhase, LldGameState } from "@/arena/lldGameEngine";
import type { LldDomainKind, LldGameMission } from "@/arena/lldGameMissions";
import { SYSTEM_FORGE_MISSIONS } from "@/arena/systemForgeMissions";
import type {
  ForgeComponent,
  ForgeOutcome,
  ForgeRequirement,
  ForgeWorldKind,
  SystemForgeMission,
  SystemForgeMissionId,
} from "@/arena/systemForgeMissions";
import parkingGarageMap from "@/assets/system-forge/parking-garage-map.webp";
import { SolidCampaign } from "@/components/SolidCampaign";
import "@/theme/pattern-genome.css";

type RunState = "idle" | "running" | "complete";

const REQUIREMENT_ICONS: Record<ForgeRequirement["status"], Icon> = {
  healthy: CheckCircle,
  warning: WarningCircle,
  mutation: Lightning,
  unknown: LockKey,
};

export function PatternGenomePage() {
  const navigate = useNavigate();
  const [missionId, setMissionId] = useState<SystemForgeMissionId>(SYSTEM_FORGE_MISSIONS[0].id);
  const mission = useMemo(
    () => SYSTEM_FORGE_MISSIONS.find((candidate) => candidate.id === missionId) ?? SYSTEM_FORGE_MISSIONS[0],
    [missionId],
  );
  const [ownerId, setOwnerId] = useState(mission.responsibility.initialOwnerId);
  const [hasMadeChoice, setHasMadeChoice] = useState(false);
  const [selectedResponsibility, setSelectedResponsibility] = useState(false);
  const [runState, setRunState] = useState<RunState>("idle");
  const [runResult, setRunResult] = useState<ForgeRunResult>();
  const [paused, setPaused] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [assessment, setAssessment] = useState<CoachAssessment>();
  const explanationRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const preview = useMemo(() => evaluateForgeDesign(mission, ownerId), [mission, ownerId]);
  const baseline = useMemo(
    () => evaluateForgeDesign(mission, mission.responsibility.initialOwnerId),
    [mission],
  );
  const worldResult = runResult ?? baseline;
  const ownerLabel = mission.components.find((component) => component.id === ownerId)?.label ?? ownerId;
  const initialOwnerLabel = mission.components.find((component) => component.id === mission.responsibility.initialOwnerId)?.label
    ?? mission.responsibility.initialOwnerId;

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setElapsedSeconds((current) => current + 1), 1_000);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (runState !== "running" || paused) return;
    const timer = window.setTimeout(() => {
      setRunResult(evaluateForgeDesign(mission, ownerId));
      setRunState("complete");
    }, motionEnabled ? 1_250 : 120);
    return () => window.clearTimeout(timer);
  }, [mission, motionEnabled, ownerId, paused, runState]);

  const resetMission = (nextMission = mission) => {
    setOwnerId(nextMission.responsibility.initialOwnerId);
    setHasMadeChoice(false);
    setSelectedResponsibility(false);
    setRunState("idle");
    setRunResult(undefined);
    setPaused(false);
    setElapsedSeconds(0);
    setExplanation("");
    setAssessment(undefined);
  };

  const changeMission = (nextId: SystemForgeMissionId) => {
    const nextMission = SYSTEM_FORGE_MISSIONS.find((candidate) => candidate.id === nextId) ?? SYSTEM_FORGE_MISSIONS[0];
    setMissionId(nextMission.id);
    resetMission(nextMission);
  };

  const assignResponsibility = (nextOwnerId: string) => {
    if (paused || runState === "running") return;
    setOwnerId(nextOwnerId);
    setHasMadeChoice(true);
    setSelectedResponsibility(false);
    setRunState("idle");
    setRunResult(undefined);
    setAssessment(undefined);
  };

  const runMutation = () => {
    if (paused || runState === "running") return;
    setAssessment(undefined);
    setRunResult(undefined);
    setRunState("running");
  };

  const assessExplanation = () => {
    if (!runResult) return;
    setAssessment(assessForgeExplanation(explanation, mission, runResult));
  };

  const chooseAnotherOwner = () => {
    setSelectedResponsibility(true);
    setRunState("idle");
    setRunResult(undefined);
    setAssessment(undefined);
  };

  const practiceExplanation = () => {
    explanationRef.current?.focus();
    explanationRef.current?.scrollIntoView({ behavior: motionEnabled ? "smooth" : "auto", block: "center" });
  };

  if (!showAdvanced) {
    return <div className="living-garage-page"><SolidCampaign /></div>;
  }

  return (
    <div className={`forge-page${motionEnabled ? " forge-motion" : ""}${showAdvanced ? " show-details" : ""}`} data-run-state={runState}>
      <ForgeHeader
        mission={mission}
        missionId={missionId}
        elapsedSeconds={elapsedSeconds}
        paused={paused}
        motionEnabled={motionEnabled}
        beginnerMode={false}
        onBack={() => navigate("/arena")}
        onMissionChange={changeMission}
        onPause={() => setPaused((current) => !current)}
        onToggleMotion={() => setMotionEnabled((current) => !current)}
      />

      <main className="forge-dashboard">
          <>
            <BeginnerGuide
              mission={mission}
              ownerLabel={ownerLabel}
              initialOwnerLabel={initialOwnerLabel}
              selected={selectedResponsibility}
              hasChosen={hasMadeChoice}
              runState={runState}
              runResult={runResult}
              showAdvanced={showAdvanced}
              onStart={() => setSelectedResponsibility(true)}
              onRun={runMutation}
              onChooseAgain={chooseAnotherOwner}
              onPractice={practiceExplanation}
              onToggleAdvanced={() => setShowAdvanced(false)}
            />

            <MissionPanel mission={mission} result={worldResult} runState={runState} />

            <ArchitectureWorkbench
              mission={mission}
              ownerId={ownerId}
              selected={selectedResponsibility}
              beginnerMode={false}
              disabled={paused || runState === "running"}
              onSelectResponsibility={() => setSelectedResponsibility((current) => !current)}
              onAssign={assignResponsibility}
            />

            <WorldPanel mission={mission} result={worldResult} runState={runState} paused={paused} />

            <TraceAndRun
              mission={mission}
              result={worldResult}
              runState={runState}
              paused={paused}
              onRun={runMutation}
              onReset={() => resetMission()}
            />

            <DesignImpact mission={mission} result={preview} runState={runState} />

            <CoachPanel
              mission={mission}
              runResult={runResult}
              explanation={explanation}
              assessment={assessment}
              inputRef={explanationRef}
              onExplanationChange={setExplanation}
              onPracticeAloud={practiceExplanation}
              onAssess={assessExplanation}
            />
          </>
      </main>
    </div>
  );
}

const LLD_STAGE_META: Record<LldGamePhase, { short: string; title: string; lesson: string }> = {
  briefing: {
    short: "Clarify",
    title: "Ask before you design",
    lesson: "Clarification changes the class model. Scope questions come before class names, patterns, or code.",
  },
  domain: {
    short: "Objects",
    title: "Decide what deserves a class",
    lesson: "A class needs identity, state, or behavior. Some nouns are values, external actors, or simply outside the agreed scope.",
  },
  model: {
    short: "Classes",
    title: "Put state and behavior with its owner",
    lesson: "Properties describe what an object must remember. Methods protect or use that state. Ownership matters more than which class can technically call a method.",
  },
  relationships: {
    short: "Connect",
    title: "Build the object graph",
    lesson: "Use composition for has-a ownership, association for references, and inheritance only for a real substitutable is-a relationship.",
  },
  scenarios: {
    short: "Run",
    title: "Make the objects collaborate",
    lesson: "A design is useful only when real flows and invariants work. Scenario failures send you back to repair the model, not to guess another quiz answer.",
  },
  change: {
    short: "Change",
    title: "Survive a new requirement",
    lesson: "SRP asks whether responsibilities change for the same reason. If one requirement edits unrelated classes, a boundary is leaking.",
  },
  patterns: {
    short: "Pattern",
    title: "Earn a pattern from real pressure",
    lesson: "Patterns are tools for recurring design pressure. Strategy handles interchangeable algorithms; Factory creates objects; Singleton controls instance count.",
  },
  interview: {
    short: "Defend",
    title: "Explain the decisions aloud",
    lesson: "A strong answer names responsibility, owned state, the rejected alternative, the contained change, and evidence from a scenario.",
  },
  complete: {
    short: "Debrief",
    title: "Compare reasoning, not memorized diagrams",
    lesson: "The reference is one defensible design. Your goal is to explain boundaries and trade-offs, not reproduce class names mechanically.",
  },
};

const DOMAIN_KIND_OPTIONS: Array<{ value: LldDomainKind; label: string }> = [
  { value: "class", label: "Class" },
  { value: "value", label: "Value" },
  { value: "external", label: "External actor" },
  { value: "out-of-scope", label: "Out of scope" },
];

export function SolidLldTutorial({
  mission,
  state,
  onAction,
  onShowAdvanced,
}: {
  mission: LldGameMission;
  state: LldGameState;
  onAction: (action: LldGameAction) => void;
  onShowAdvanced: () => void;
}) {
  const readiness = getPhaseReadiness(mission, state);
  const score = scoreLldGame(mission, state);
  const currentIndex = LLD_GAME_PHASES.indexOf(state.phase);
  const visiblePhases = LLD_GAME_PHASES.filter((phase) => phase !== "complete");
  const [defenseDraft, setDefenseDraft] = useState(state.defenseAnswer);

  useEffect(() => {
    setDefenseDraft(state.defenseAnswer);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [state.defenseAnswer, state.phase]);

  const selectedClasses = mission.domainCandidates.filter((candidate) => state.domainKinds[candidate.id] === "class");

  return (
    <section className="solid-tutorial" aria-labelledby="solid-tutorial-title">
      <header className="solid-tutorial-hero">
        <div>
          <span>LLD Foundation · SOLID 1 of 5</span>
          <h1 id="solid-tutorial-title">{mission.title}</h1>
          <p>{mission.objective}</p>
        </div>
        <div className="solid-tutorial-hero-actions">
          <small>{state.mode} mode</small>
          <button type="button" onClick={onShowAdvanced}>Open advanced sandbox</button>
        </div>
      </header>

      <nav className="solid-stage-nav" aria-label="LLD mission progress">
        {visiblePhases.map((phase, index) => {
          const phaseIndex = LLD_GAME_PHASES.indexOf(phase);
          const isComplete = currentIndex > phaseIndex || state.phase === "complete";
          const isActive = state.phase === phase;
          const canRevisit = isComplete || isActive;
          return (
            <button
              type="button"
              key={phase}
              className={isActive ? "active" : isComplete ? "complete" : ""}
              disabled={!canRevisit}
              aria-current={isActive ? "step" : undefined}
              onClick={() => onAction({ type: "revisit", phase })}
            >
              <i>{isComplete ? <CheckCircle size={14} weight="fill" /> : index + 1}</i>
              <span>{LLD_STAGE_META[phase].short}</span>
            </button>
          );
        })}
      </nav>

      <div className="solid-stage-shell">
        <aside className="solid-stage-coach">
          <span>What you are learning</span>
          <h2>{LLD_STAGE_META[state.phase].title}</h2>
          <p>{LLD_STAGE_META[state.phase].lesson}</p>
          {state.lastFeedback ? <div className="solid-coach-feedback" role="status"><Circuitry size={18} /><p>{state.lastFeedback}</p></div> : null}
        </aside>

        <div className="solid-stage-content">
          {state.phase === "briefing" ? (
            <BriefingStage mission={mission} state={state} onAction={onAction} readiness={readiness} />
          ) : null}
          {state.phase === "domain" ? (
            <DomainStage mission={mission} state={state} onAction={onAction} readiness={readiness} />
          ) : null}
          {state.phase === "model" ? (
            <ModelStage mission={mission} state={state} selectedClasses={selectedClasses} onAction={onAction} readiness={readiness} />
          ) : null}
          {state.phase === "relationships" ? (
            <RelationshipStage mission={mission} state={state} onAction={onAction} readiness={readiness} />
          ) : null}
          {state.phase === "scenarios" ? (
            <ScenarioStage mission={mission} state={state} onAction={onAction} readiness={readiness} />
          ) : null}
          {state.phase === "change" ? (
            <ChangeStage mission={mission} state={state} onAction={onAction} readiness={readiness} />
          ) : null}
          {state.phase === "patterns" ? (
            <PatternStage mission={mission} state={state} onAction={onAction} readiness={readiness} />
          ) : null}
          {state.phase === "interview" ? (
            <InterviewStage mission={mission} draft={defenseDraft} onDraftChange={setDefenseDraft} onAction={onAction} />
          ) : null}
          {state.phase === "complete" ? (
            <CompletionStage mission={mission} state={state} score={score} onAction={onAction} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function BriefingStage({ mission, state, onAction, readiness }: TutorialStageProps) {
  const requiredQuestions = mission.questions.filter((question) => question.required);
  const askedRequired = requiredQuestions.filter((question) => state.askedQuestionIds.includes(question.id)).length;
  return (
    <section className="solid-stage" aria-labelledby="briefing-title">
      <header>
        <span>Interview briefing</span>
        <h2 id="briefing-title">The interviewer says: “{mission.prompt}”</h2>
        <p>Do not name classes yet. Ask questions that change what the model must contain.</p>
      </header>
      <div className="solid-scope-meter"><strong>{askedRequired}/{requiredQuestions.length} core questions answered</strong><span>Optional questions can expose edge cases.</span></div>
      <div className="solid-question-list">
        {mission.questions.map((question) => {
          const asked = state.askedQuestionIds.includes(question.id);
          return (
            <article className={asked ? "asked" : ""} key={question.id}>
              <button type="button" onClick={() => onAction({ type: "ask-question", questionId: question.id })}>
                <PaperPlaneTilt size={18} />
                <span>{question.prompt}</span>
                {question.required ? <small>core</small> : <small>edge case</small>}
              </button>
              {asked ? (
                <div className="solid-interviewer-answer">
                  <p><strong>Interviewer:</strong> {question.answer}</p>
                  <p><strong>Design consequence:</strong> {question.designImpact}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      <StageAdvance readiness={readiness} label="Lock scope and identify objects" onAdvance={() => onAction({ type: "advance" })} />
    </section>
  );
}

function DomainStage({ mission, state, onAction, readiness }: TutorialStageProps) {
  return (
    <section className="solid-stage" aria-labelledby="domain-title">
      <header>
        <span>Domain scanner</span>
        <h2 id="domain-title">Classify the nouns your requirements revealed</h2>
        <p>For every class you propose, write one focused job. The reference stays hidden until the debrief.</p>
      </header>
      <div className="solid-domain-grid">
        {mission.domainCandidates.map((candidate) => {
          const selectedKind = state.domainKinds[candidate.id];
          return (
            <fieldset key={candidate.id}>
              <legend>{candidate.label}</legend>
              <div className="solid-kind-options">
                {DOMAIN_KIND_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={selectedKind === option.value ? "selected" : ""}
                    aria-pressed={selectedKind === option.value}
                    onClick={() => onAction({ type: "classify-domain", candidateId: candidate.id, kind: option.value })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {selectedKind === "class" ? (
                <label>
                  <span>One responsibility</span>
                  <input
                    value={state.classPurposes[candidate.id] ?? ""}
                    placeholder={`What does ${candidate.label} own?`}
                    onChange={(event) => onAction({ type: "set-class-purpose", classId: candidate.id, purpose: event.target.value })}
                  />
                </label>
              ) : null}
            </fieldset>
          );
        })}
      </div>
      <StageAdvance readiness={readiness} label="Forge properties and methods" onAdvance={() => onAction({ type: "advance" })} />
    </section>
  );
}

function ModelStage({
  mission,
  state,
  selectedClasses,
  onAction,
  readiness,
}: TutorialStageProps & { selectedClasses: LldGameMission["domainCandidates"] }) {
  const ownerOptions = selectedClasses.length ? selectedClasses : mission.domainCandidates.filter((candidate) => candidate.referenceKind === "class");
  return (
    <section className="solid-stage" aria-labelledby="model-title">
      <header>
        <span>Class forge</span>
        <h2 id="model-title">Build the classes from state and behavior</h2>
        <p>Place each property and method with the class that owns the information or invariant it needs.</p>
      </header>
      <div className="solid-model-builders">
        <PlacementBank
          title="Properties · what an object remembers"
          cards={mission.properties}
          owners={ownerOptions}
          placements={state.propertyOwners}
          onPlace={(propertyId, ownerId) => onAction({ type: "place-property", propertyId, ownerId })}
        />
        <PlacementBank
          title="Methods · what an object is responsible for"
          cards={mission.methods}
          owners={ownerOptions}
          placements={state.methodOwners}
          onPlace={(methodId, ownerId) => onAction({ type: "place-method", methodId, ownerId })}
        />
      </div>
      <details className="solid-java-preview" open>
        <summary>Live Java skeleton generated from your model</summary>
        <pre><code>{generateLldGameJava(mission, state) || "// Classify domain objects first."}</code></pre>
      </details>
      <StageAdvance readiness={readiness} label="Connect the object graph" onAdvance={() => onAction({ type: "advance" })} />
    </section>
  );
}

function PlacementBank({
  title,
  cards,
  owners,
  placements,
  onPlace,
}: {
  title: string;
  cards: LldGameMission["properties"];
  owners: LldGameMission["domainCandidates"];
  placements: Record<string, string>;
  onPlace: (cardId: string, ownerId: string) => void;
}) {
  return (
    <section className="solid-placement-bank">
      <h3>{title}</h3>
      {cards.map((card) => (
        <label key={card.id}>
          <span>
            <code>{card.type ? `${card.type} ${card.label}` : card.javaSignature ?? card.label}</code>
            {card.context ? <small>{card.context}</small> : null}
          </span>
          <select value={placements[card.id] ?? ""} onChange={(event) => onPlace(card.id, event.target.value)}>
            <option value="" disabled>Choose owner…</option>
            {owners.map((owner) => <option value={owner.id} key={owner.id}>{owner.label}</option>)}
          </select>
        </label>
      ))}
    </section>
  );
}

function RelationshipStage({ mission, state, onAction, readiness }: TutorialStageProps) {
  return (
    <section className="solid-stage" aria-labelledby="relationship-title">
      <header>
        <span>Relationship board</span>
        <h2 id="relationship-title">Decide which connections belong in the model</h2>
        <p>Include only relationships the domain requires. A possible connection is not automatically a good one.</p>
      </header>
      <div className="solid-relationship-list">
        {mission.relationships.map((relationship) => {
          const decision = state.relationshipDecisions[relationship.id];
          const from = mission.domainCandidates.find((candidate) => candidate.id === relationship.fromId)?.label;
          const to = mission.domainCandidates.find((candidate) => candidate.id === relationship.toId)?.label;
          return (
            <article key={relationship.id}>
              <div><strong>{from}</strong><span>{relationship.kind} · {relationship.cardinality}</span><strong>{to}</strong></div>
              <div>
                <button type="button" className={decision === true ? "selected" : ""} aria-pressed={decision === true} onClick={() => onAction({ type: "decide-relationship", relationshipId: relationship.id, included: true })}>Include</button>
                <button type="button" className={decision === false ? "selected" : ""} aria-pressed={decision === false} onClick={() => onAction({ type: "decide-relationship", relationshipId: relationship.id, included: false })}>Exclude</button>
              </div>
            </article>
          );
        })}
      </div>
      <StageAdvance readiness={readiness} label="Run the object model" onAdvance={() => onAction({ type: "advance" })} />
    </section>
  );
}

function ScenarioStage({ mission, state, onAction, readiness }: TutorialStageProps) {
  const passed = Object.values(state.scenarioRuns).filter((run) => run.passed).length;
  return (
    <section className="solid-stage" aria-labelledby="scenario-title">
      <header>
        <span>Scenario runner</span>
        <h2 id="scenario-title">Does your model survive the garage?</h2>
        <p>Run every flow. A failure identifies a broken ownership boundary and sends you back to repair the class model.</p>
      </header>
      <div className="solid-scenario-layout">
        <figure className="solid-world-figure">
          <img src={parkingGarageMap} alt="Top-down parking garage used to run entry, capacity, compatibility, and assignment scenarios" />
          <figcaption><strong>{passed}/{mission.scenarios.length} scenarios passing</strong><span>The world reacts to your class and relationship decisions.</span></figcaption>
        </figure>
        <div className="solid-scenario-list">
          {mission.scenarios.map((scenario) => {
            const run = state.scenarioRuns[scenario.id];
            return (
              <article className={run ? run.passed ? "passed" : "failed" : ""} key={scenario.id}>
                <div><strong>{scenario.title}</strong><p>{scenario.story}</p></div>
                <button type="button" onClick={() => onAction({ type: "run-scenario", scenarioId: scenario.id })}><Play size={15} weight="fill" /> {run ? "Run again" : "Run scenario"}</button>
                {run ? <small role="status">{run.message}</small> : null}
              </article>
            );
          })}
        </div>
      </div>
      {Object.values(state.scenarioRuns).some((run) => !run.passed) ? (
        <button className="solid-repair-button" type="button" onClick={() => onAction({ type: "revisit", phase: "model" })}>Repair properties or methods</button>
      ) : null}
      <StageAdvance readiness={readiness} label="Inject a SOLID change" onAdvance={() => onAction({ type: "advance" })} />
    </section>
  );
}

function ChangeStage({ mission, state, onAction, readiness }: TutorialStageProps) {
  const change = mission.changeStorms[0];
  const selectedId = state.changeDecisions[change.id];
  const selected = change.options.find((option) => option.id === selectedId);
  return (
    <section className="solid-stage" aria-labelledby="change-title">
      <header>
        <span>Change storm · Single Responsibility Principle</span>
        <h2 id="change-title">{change.title}</h2>
        <p>{change.requirement}</p>
      </header>
      <div className="solid-change-pressure"><Lightning size={22} weight="duotone" /><p><strong>Why the old model is under pressure</strong>{change.pressure}</p></div>
      <div className="solid-change-options">
        {change.options.map((option) => (
          <button type="button" key={option.id} className={selectedId === option.id ? "selected" : ""} aria-pressed={selectedId === option.id} onClick={() => onAction({ type: "choose-change", changeId: change.id, optionId: option.id })}>
            <strong>{option.label}</strong>
            <span>{option.changedClassIds.length} classes or boundaries touched</span>
          </button>
        ))}
      </div>
      {selected ? <div className={selected.correct ? "solid-decision-feedback correct" : "solid-decision-feedback wrong"} role="status"><strong>{selected.correct ? "Change contained" : "Responsibility still leaking"}</strong><p>{selected.feedback}</p></div> : null}
      <StageAdvance readiness={readiness} label="Open the pattern lab" onAdvance={() => onAction({ type: "advance" })} />
    </section>
  );
}

function PatternStage({ mission, state, onAction, readiness }: TutorialStageProps) {
  const selected = mission.patternChallenge.options.find((option) => option.id === state.patternDecisionId);
  return (
    <section className="solid-stage" aria-labelledby="pattern-title">
      <header>
        <span>Pattern lab</span>
        <h2 id="pattern-title">{mission.patternChallenge.prompt}</h2>
        <p>The correct pattern must solve the pressure you just observed. A familiar name is not enough.</p>
      </header>
      <div className="solid-pattern-rules">
        <p><strong>Use it when</strong>{mission.patternChallenge.whenToUse}</p>
        <p><strong>Do not use it when</strong>{mission.patternChallenge.whenNotToUse}</p>
      </div>
      <div className="solid-pattern-options">
        {mission.patternChallenge.options.map((option) => (
          <button type="button" key={option.id} className={state.patternDecisionId === option.id ? "selected" : ""} aria-pressed={state.patternDecisionId === option.id} onClick={() => onAction({ type: "choose-pattern", optionId: option.id })}>
            <GearSix size={19} /><strong>{option.name}</strong>
          </button>
        ))}
      </div>
      {selected ? <div className={selected.correct ? "solid-decision-feedback correct" : "solid-decision-feedback wrong"} role="status"><strong>{selected.correct ? `${selected.name} earned` : `${selected.name} does not solve this pressure`}</strong><p>{selected.feedback}</p></div> : null}
      <StageAdvance readiness={readiness} label="Defend the design" onAdvance={() => onAction({ type: "advance" })} />
    </section>
  );
}

function InterviewStage({
  mission,
  draft,
  onDraftChange,
  onAction,
}: {
  mission: LldGameMission;
  draft: string;
  onDraftChange: (value: string) => void;
  onAction: (action: LldGameAction) => void;
}) {
  return (
    <section className="solid-stage" aria-labelledby="interview-title">
      <header>
        <span>Interview room</span>
        <h2 id="interview-title">Defend the model in your own words</h2>
        <p>{mission.interview.prompt}</p>
      </header>
      <div className="solid-defense-rubric">
        {mission.interview.rubric.map((criterion) => <span key={criterion.id}><CheckCircle size={14} /> {criterion.label}</span>)}
      </div>
      <label className="solid-defense-input">
        <span>Your answer</span>
        <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Explain your design as if the interviewer asked: Why these classes, and why these boundaries?" />
        <small>{draft.trim().length} characters · aim for three to five complete sentences</small>
      </label>
      <button className="solid-primary-action" type="button" disabled={draft.trim().length < 80} onClick={() => onAction({ type: "submit-defense", answer: draft })}>Submit defense and reveal reference</button>
    </section>
  );
}

function CompletionStage({
  mission,
  state,
  score,
  onAction,
}: {
  mission: LldGameMission;
  state: LldGameState;
  score: ReturnType<typeof scoreLldGame>;
  onAction: (action: LldGameAction) => void;
}) {
  return (
    <section className="solid-stage solid-completion" aria-labelledby="complete-title">
      <header>
        <span>SRP mission debrief</span>
        <h2 id="complete-title">You completed the full LLD loop.</h2>
        <p>The score reflects design evidence—not how many buttons you clicked.</p>
      </header>
      <div className="solid-score-card"><strong>{score.total}</strong><span>/ 100</span><p>Clarify {score.clarification} · Classes {score.classModel} · Methods {score.methodOwnership} · Relationships {score.relationships} · Change {score.changeContainment} · Defense {score.interviewDefense}</p></div>
      <section className="solid-reference-answer">
        <span>Complete reference defense</span>
        <p>{mission.interview.referenceAnswer}</p>
      </section>
      <details className="solid-java-preview">
        <summary>Your generated Java skeleton</summary>
        <pre><code>{generateLldGameJava(mission, state)}</code></pre>
      </details>
      <button className="solid-primary-action" type="button" onClick={() => onAction({ type: "reset", mode: "assisted" })}>Replay in assisted mode</button>
    </section>
  );
}

function StageAdvance({ readiness, label, onAdvance }: { readiness: ReturnType<typeof getPhaseReadiness>; label: string; onAdvance: () => void }) {
  return (
    <div className="solid-stage-advance">
      <div>
        <strong>{readiness.ready ? "Phase ready" : "Keep building"}</strong>
        <span>{readiness.ready ? "Your decisions are recorded. Continue when ready." : readiness.missing[0]}</span>
      </div>
      <button type="button" disabled={!readiness.ready} onClick={onAdvance}>{label}<ArrowRight size={17} /></button>
    </div>
  );
}

type TutorialStageProps = {
  mission: LldGameMission;
  state: LldGameState;
  onAction: (action: LldGameAction) => void;
  readiness: ReturnType<typeof getPhaseReadiness>;
};

function BeginnerGuide({
  mission,
  ownerLabel,
  initialOwnerLabel,
  selected,
  hasChosen,
  runState,
  runResult,
  showAdvanced,
  onStart,
  onRun,
  onChooseAgain,
  onPractice,
  onToggleAdvanced,
}: {
  mission: SystemForgeMission;
  ownerLabel: string;
  initialOwnerLabel: string;
  selected: boolean;
  hasChosen: boolean;
  runState: RunState;
  runResult?: ForgeRunResult;
  showAdvanced: boolean;
  onStart: () => void;
  onRun: () => void;
  onChooseAgain: () => void;
  onPractice: () => void;
  onToggleAdvanced: () => void;
}) {
  const step = selected ? 1 : runState === "complete" ? 3 : hasChosen ? 2 : 1;
  const resultTone = runResult?.goalMet ? "is-success" : "is-learning";

  return (
    <section className={`forge-panel forge-guide${runResult?.goalMet ? " has-interview" : ""}`} aria-labelledby="forge-guide-title">
      <div className="forge-guide-intro">
        <span>New to LLD? Start here</span>
        <h1 id="forge-guide-title">One design decision at a time.</h1>
        <p><strong>A class is a named box that owns related data and actions.</strong> Your job is to decide which box should own <code>{mission.responsibility.label}</code>.</p>
      </div>

      <ol className="forge-learning-steps" aria-label={`Step ${step} of 3`}>
        <GuideStep number={1} label="Choose an owner" detail="Who should do this job?" state={step === 1 ? "active" : "done"} />
        <GuideStep number={2} label="Run the change" detail="Watch the system react." state={step === 2 ? "active" : step > 2 ? "done" : "next"} />
        <GuideStep number={3} label="Explain why" detail="Turn it into an interview answer." state={step === 3 ? "active" : "next"} />
      </ol>

      <div className={`forge-next-move${runResult ? ` ${resultTone}` : ""}`} aria-live="polite">
        {runResult ? (
          <>
            <span>{runResult.goalMet ? "LLD principle unlocked" : "This failure is the lesson"}</span>
            <strong>{mission.learning.concept}</strong>
            <p>{runResult.goalMet
              ? `${ownerLabel} kept the change focused: ${runResult.changeRadius} classes touched and ${runResult.testsPassing}/${runResult.testsTotal} tests passing.`
              : `${ownerLabel} spread the change across ${runResult.changeRadius} classes and caused ${runResult.failures} failed flow step${runResult.failures === 1 ? "" : "s"}. Try a class closer to the rule.`}</p>
            <small>{mission.learning.plainEnglish}</small>
            <div className="forge-guide-actions">
              {runResult.goalMet ? (
                <button type="button" className="forge-guide-primary" onClick={onPractice}>Practice the interview answer</button>
              ) : (
                <button type="button" className="forge-guide-primary" onClick={onChooseAgain}>Try another class</button>
              )}
            </div>
          </>
        ) : step === 1 ? (
          <>
            <span>Your mission</span>
            <strong>{mission.mutation}</strong>
            <p>{selected
              ? "Now choose the class that should own this job. You cannot break anything—every choice teaches you something."
              : `${mission.responsibility.label} currently lives in ${initialOwnerLabel}. Move it only if another class is a better owner.`}</p>
            <details>
              <summary>Need a beginner hint?</summary>
              <small>{mission.learning.hint}</small>
            </details>
            {!selected ? <button type="button" className="forge-guide-primary" onClick={onStart}>Start: choose an owner</button> : null}
          </>
        ) : (
          <>
            <span>Ready to test</span>
            <strong>You moved the job to {ownerLabel}.</strong>
            <p>Run the system. The game will show whether one future change stays contained or spreads into unrelated classes.</p>
            <button type="button" className="forge-guide-primary" onClick={onRun} disabled={runState === "running"}>
              <Play size={18} weight="fill" /> {runState === "running" ? "Running the change…" : "Run this design"}
            </button>
          </>
        )}
      </div>

      {runResult?.goalMet ? (
        <div className="forge-interview-frame">
          <span>Say it like this</span>
          <p>{mission.learning.interviewFrame}</p>
        </div>
      ) : null}

      <button type="button" className="forge-details-toggle" onClick={onToggleAdvanced} aria-pressed={showAdvanced}>
        {showAdvanced ? "Hide advanced panels" : "Show advanced panels"}
        <small>{showAdvanced ? "Return to the three-step tutorial" : "Requirements, traces, coupling, cohesion, and test metrics"}</small>
      </button>
    </section>
  );
}

function GuideStep({ number, label, detail, state }: { number: number; label: string; detail: string; state: "active" | "done" | "next" }) {
  return (
    <li className={`is-${state}`}>
      <span>{state === "done" ? <CheckCircle size={18} weight="fill" /> : number}</span>
      <div><strong>{label}</strong><small>{detail}</small></div>
    </li>
  );
}

function ForgeHeader({
  mission,
  missionId,
  elapsedSeconds,
  paused,
  motionEnabled,
  beginnerMode,
  onBack,
  onMissionChange,
  onPause,
  onToggleMotion,
}: {
  mission: SystemForgeMission;
  missionId: SystemForgeMissionId;
  elapsedSeconds: number;
  paused: boolean;
  motionEnabled: boolean;
  beginnerMode: boolean;
  onBack: () => void;
  onMissionChange: (missionId: SystemForgeMissionId) => void;
  onPause: () => void;
  onToggleMotion: () => void;
}) {
  return (
    <header className="forge-command-bar">
      <div className="forge-brand">
        <Circuitry size={25} weight="duotone" />
        <div>
          <strong>System Forge</strong>
          <span>Build the behavior. Watch it live.</span>
        </div>
        <button type="button" onClick={onBack} aria-label="Back to Arena"><ArrowLeft size={15} /> Arena</button>
      </div>

      {beginnerMode ? (
        <div className="forge-system-picker forge-campaign-label">
          <span>Current campaign</span>
          <strong>SOLID Foundations · Parking Lot</strong>
        </div>
      ) : (
        <label className="forge-system-picker">
          <span className="sr-only">Choose a system design mission</span>
          <select value={missionId} onChange={(event) => onMissionChange(event.target.value as SystemForgeMissionId)}>
            {SYSTEM_FORGE_MISSIONS.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>{candidate.systemName} · {candidate.expansionName}</option>
            ))}
          </select>
          <CaretDown size={13} aria-hidden />
        </label>
      )}

      <div className="forge-objective">
        <span>Goal: stable behavior · change radius ≤ {mission.goal.maxChangeRadius}</span>
        <small>Your trade-offs, your design.</small>
      </div>

      <div className="forge-header-controls">
        <div><span>Level</span><strong>{mission.level}</strong></div>
        <div><span>Time</span><strong>{formatTime(elapsedSeconds)}</strong></div>
        <button type="button" onClick={onPause} aria-label={paused ? "Resume simulation" : "Pause simulation"} aria-pressed={paused}>
          {paused ? <Play size={17} weight="fill" /> : <Pause size={17} weight="fill" />}
        </button>
        <button
          type="button"
          className={motionEnabled ? "active" : ""}
          onClick={onToggleMotion}
          aria-label={`${motionEnabled ? "Disable" : "Enable"} world motion`}
          aria-pressed={motionEnabled}
          title={`World motion ${motionEnabled ? "on" : "off"}`}
        >
          <GearSix size={17} />
        </button>
      </div>
    </header>
  );
}

function MissionPanel({ mission, result, runState }: { mission: SystemForgeMission; result: ForgeOutcome; runState: RunState }) {
  return (
    <aside className="forge-panel forge-mission-panel">
      <header className="forge-panel-title">
        <span>Mission · Stakeholders</span>
        <small>{mission.requirements.filter((item) => item.status !== "unknown").length} / {mission.requirements.length} discovered</small>
      </header>

      <div className="forge-requirements">
        {mission.requirements.map((requirement) => {
          const RequirementIcon = REQUIREMENT_ICONS[requirement.status];
          return (
            <div key={requirement.id} className={`forge-requirement is-${requirement.status}`}>
              <RequirementIcon size={18} weight={requirement.status === "mutation" ? "fill" : "regular"} />
              <div>
                <strong>{requirement.label}</strong>
                <span>{requirement.detail}</span>
              </div>
            </div>
          );
        })}
      </div>

      <section className="forge-mutation-brief" aria-label="Incoming requirement">
        <div><Lightning size={17} weight="fill" /><span>Incoming mutation</span></div>
        <strong>{mission.mutation}</strong>
        <p>{mission.mutationDetail}</p>
      </section>

      <section className="forge-pressure">
        <header><span>World pressure</span><small>{runState === "running" ? "Simulating" : "Live"}</small></header>
        {(result.pressure.length ? result.pressure : defaultPressure(mission.world)).map((metric) => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <i className={`trend-${metric.trend}`} aria-hidden />
            <strong className={`trend-${metric.trend}`}>{metric.value}</strong>
          </div>
        ))}
      </section>
    </aside>
  );
}

function WorldPanel({
  mission,
  result,
  runState,
  paused,
}: {
  mission: SystemForgeMission;
  result: ForgeOutcome;
  runState: RunState;
  paused: boolean;
}) {
  const waitingForRun = runState === "idle";
  const sceneVerdict = waitingForRun ? "stable" : result.verdict;
  return (
    <section className="forge-panel forge-world-panel" aria-label={`${mission.systemName} live simulation`}>
      <header className="forge-panel-title">
        <span>Live simulation</span>
        <small className={paused ? "is-paused" : "is-live"}>{paused ? "Paused" : runState === "running" ? "Running" : "Live"}</small>
      </header>
      <div className="forge-world-telemetry">
        <div><span>System</span><strong>{waitingForRun ? "Ready" : `${result.flowStability}%`}</strong></div>
        <div><span>Tests</span><strong>{waitingForRun ? "—" : `${result.testsPassing}/${result.testsTotal}`}</strong></div>
        <div><span>Failures</span><strong className={!waitingForRun && result.failures ? "is-danger" : "is-good"}>{waitingForRun ? "—" : result.failures}</strong></div>
      </div>
      <WorldScene kind={mission.world} verdict={sceneVerdict} runState={runState} paused={paused} />
      <div className={`forge-world-status is-${sceneVerdict}`} aria-live="polite">
        {sceneVerdict === "stable" ? <CheckCircle size={17} /> : <Warning size={17} />}
        <span>{waitingForRun
          ? "Waiting for your design. Choose an owner, then run the new requirement."
          : runState === "running" ? "Injecting requirement into the live system…" : result.consequence}</span>
      </div>
    </section>
  );
}

function WorldScene({ kind, verdict, runState, paused }: { kind: ForgeWorldKind; verdict: ForgeOutcome["verdict"]; runState: RunState; paused: boolean }) {
  if (kind === "elevator") return <ElevatorWorld verdict={verdict} runState={runState} paused={paused} />;
  if (kind === "vending") return <VendingWorld verdict={verdict} runState={runState} paused={paused} />;
  return <ParkingWorld verdict={verdict} runState={runState} paused={paused} />;
}

function ParkingWorld({ verdict, runState, paused }: WorldProps) {
  return (
    <div className={`forge-world forge-parking-world is-${verdict}${paused ? " is-paused" : ""}`}>
      <img className="forge-parking-map" src={parkingGarageMap} alt="Top-down live parking garage with entry, exit, traffic lanes, occupied spaces, and EV charging bays" />
      <div className="forge-world-gate forge-entry"><ArrowDown size={17} /><span>Entry</span></div>
      <div className="forge-world-gate forge-exit"><span>Exit</span>{verdict === "breach" ? <WarningCircle size={17} /> : <ArrowUp size={17} />}</div>
      <div className="forge-ev-pulse pulse-a" aria-label="EV charging active"><ChargingStation size={16} weight="fill" /></div>
      <div className="forge-ev-pulse pulse-b" aria-label="EV charging active"><ChargingStation size={16} weight="fill" /></div>
      <div className="forge-exit-pressure" aria-hidden={verdict === "stable"} />
      <Car className={`forge-moving-actor${runState === "running" ? " is-running" : ""}`} size={28} weight="fill" aria-label="Vehicle moving through the simulation" />
    </div>
  );
}

function ElevatorWorld({ verdict, runState, paused }: WorldProps) {
  const cars = [8, 18, 31, 38];
  return (
    <div className={`forge-world forge-elevator-world is-${verdict}${paused ? " is-paused" : ""}`}>
      <div className="forge-building-label"><Buildings size={20} /><span>40-floor tower · 4 active cars</span></div>
      <div className="forge-elevator-shafts">
        {cars.map((floor, index) => (
          <div key={floor} className="forge-elevator-shaft">
            <span>F40</span>
            <div className={`forge-elevator-car car-${index + 1}${runState === "running" ? " is-running" : ""}`} style={{ "--floor": floor } as CSSProperties}>
              <Buildings size={21} weight="fill" /><b>{floor}</b>
            </div>
            <span>G</span>
          </div>
        ))}
      </div>
      <div className="forge-call-queue">
        <span><User size={15} /> 36 <ArrowDown size={13} /></span>
        <span className="emergency"><User size={15} /> 22 <Lightning size={13} weight="fill" /></span>
        <span><User size={15} /> 8 <ArrowUp size={13} /></span>
      </div>
    </div>
  );
}

function VendingWorld({ verdict, runState, paused }: WorldProps) {
  return (
    <div className={`forge-world forge-vending-world is-${verdict}${paused ? " is-paused" : ""}`}>
      <div className="forge-vending-machine">
        <div className="forge-vending-screen">{verdict === "stable" ? "REFUND COMPLETE" : "DISPENSE FAILED"}</div>
        <div className="forge-product-grid">
          {Array.from({ length: 9 }, (_, index) => <span key={index}><Package size={22} weight="duotone" /></span>)}
        </div>
        <div className="forge-vending-slot"><Package size={28} weight="fill" /></div>
      </div>
      <div className={`forge-transaction-flow${runState === "running" ? " is-running" : ""}`}>
        <span><Coins size={25} /><b>$2.25</b></span>
        <ArrowRight size={20} />
        <span className={verdict === "stable" ? "success" : "failure"}>
          {verdict === "stable" ? <Receipt size={25} /> : <WarningCircle size={25} />}
          <b>{verdict === "stable" ? "Refunded" : "Retrying"}</b>
        </span>
      </div>
    </div>
  );
}

function ArchitectureWorkbench({
  mission,
  ownerId,
  selected,
  beginnerMode,
  disabled,
  onSelectResponsibility,
  onAssign,
}: {
  mission: SystemForgeMission;
  ownerId: string;
  selected: boolean;
  beginnerMode: boolean;
  disabled: boolean;
  onSelectResponsibility: () => void;
  onAssign: (ownerId: string) => void;
}) {
  const components = beginnerMode ? getForgeBeginnerComponents(mission) : mission.components;
  const onDrop = (event: DragEvent<HTMLElement>, componentId: string) => {
    event.preventDefault();
    if (event.dataTransfer.getData("text/system-forge-responsibility") === mission.responsibility.id) onAssign(componentId);
  };

  return (
    <section className="forge-panel forge-workbench">
      <header className="forge-panel-title">
        <span>{beginnerMode ? "Step 1 · Choose who owns this job" : "Architecture workbench"}</span>
        <small>{selected ? "Choose one class below" : beginnerMode ? "Use the green button to move the job" : "Drag or select the highlighted responsibility"}</small>
      </header>
      <div className="forge-workbench-grid">
        <div className="forge-path path-a"><FlowArrow size={24} /></div>
        <div className="forge-path path-b"><FlowArrow size={24} /></div>
        {components.map((component) => (
          <ArchitectureNode
            key={component.id}
            component={component}
            responsibility={component.id === ownerId ? mission.responsibility : undefined}
            selected={selected}
            disabled={disabled}
            onSelectResponsibility={onSelectResponsibility}
            onAssign={() => onAssign(component.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDrop(event, component.id)}
          />
        ))}
      </div>
      <footer>
        <span><Cube size={14} /> {beginnerMode ? "Four relevant classes shown. Try any choice safely." : "Responsibilities move; behavior and change radius react."}</span>
        <strong>{beginnerMode ? "No coding required yet" : "Multiple valid paths"}</strong>
      </footer>
    </section>
  );
}

function ArchitectureNode({
  component,
  responsibility,
  selected,
  disabled,
  onSelectResponsibility,
  onAssign,
  ...handlers
}: {
  component: ForgeComponent;
  responsibility?: SystemForgeMission["responsibility"];
  selected: boolean;
  disabled: boolean;
  onSelectResponsibility: () => void;
  onAssign: () => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}) {
  return (
    <article
      className={`forge-component tone-${component.tone}${responsibility ? " is-owner" : ""}${selected ? " is-targetable" : ""}`}
      style={{ gridColumn: component.gridColumn, gridRow: component.gridRow }}
      {...handlers}
    >
      <header><Circuitry size={15} /><strong>{component.label}</strong></header>
      <div className="forge-methods">
        {component.methods.map((method) => <span key={method}>{method}</span>)}
      </div>
      {responsibility ? (
        <button
          type="button"
          className={`forge-responsibility${selected ? " is-selected" : ""}`}
          draggable={!disabled}
          disabled={disabled}
          aria-pressed={selected}
          onClick={(event) => {
            event.stopPropagation();
            onSelectResponsibility();
          }}
          onDragStart={(event) => {
            event.dataTransfer.setData("text/system-forge-responsibility", responsibility.id);
            event.dataTransfer.effectAllowed = "move";
          }}
        >
          <Lightning size={13} weight="fill" /> {responsibility.label}
        </button>
      ) : null}
      {selected && !responsibility ? (
        <button type="button" className="forge-assign-owner" disabled={disabled} onClick={onAssign}>
          Choose {component.label}
        </button>
      ) : null}
    </article>
  );
}

function TraceAndRun({
  mission,
  result,
  runState,
  paused,
  onRun,
  onReset,
}: {
  mission: SystemForgeMission;
  result: ForgeOutcome;
  runState: RunState;
  paused: boolean;
  onRun: () => void;
  onReset: () => void;
}) {
  return (
    <section className="forge-panel forge-trace-panel">
      <div className="forge-trace-content">
        <header className="forge-panel-title"><span>Scenario trace</span><small>Live events</small></header>
        <div className="forge-trace">
          {mission.trace.map((step, index) => {
            const failed = result.verdict !== "stable" && index >= mission.trace.length - result.failures;
            return (
              <div key={step} className={failed ? "is-failed" : runState === "running" ? "is-running" : "is-complete"}>
                <span>{index + 1}</span><strong>{step}</strong><small>00:{String(index * 7).padStart(2, "0")}</small>
              </div>
            );
          })}
        </div>
        <p className={`forge-consequence is-${result.verdict}`}>
          <span>Consequence</span>{runState === "running" ? "Tracing the changed responsibility through the world…" : result.consequence}
        </p>
      </div>
      <div className="forge-run-controls">
        <button type="button" className="forge-run-button" disabled={paused || runState === "running"} onClick={onRun}>
          {runState === "running" ? <><span className="forge-spinner" /> Simulating</> : <><Play size={25} weight="fill" /> Run mutation</>}
        </button>
        <span>{mission.mutation}</span>
        <button type="button" className="forge-reset" onClick={onReset} disabled={runState === "running"}>
          <ArrowCounterClockwise size={15} /> Reset world
        </button>
      </div>
    </section>
  );
}

function DesignImpact({ mission, result, runState }: { mission: SystemForgeMission; result: ForgeOutcome; runState: RunState }) {
  const metrics = [
    { label: "Change radius", value: String(result.changeRadius), score: Math.max(0, 100 - result.changeRadius * 17), good: result.changeRadius <= mission.goal.maxChangeRadius },
    { label: "Coupling", value: result.coupling.toFixed(1), score: Math.max(0, 110 - result.coupling * 28), good: result.coupling <= 2 },
    { label: "Cohesion", value: `${result.cohesion}%`, score: result.cohesion, good: result.cohesion >= 80 },
    { label: "Tests passing", value: `${result.testsPassing}/${result.testsTotal}`, score: (result.testsPassing / result.testsTotal) * 100, good: result.testsPassing === result.testsTotal },
    { label: "Flow stability", value: `${result.flowStability}%`, score: result.flowStability, good: result.flowStability >= mission.goal.minFlowStability },
  ];

  return (
    <section className="forge-panel forge-impact-panel">
      <header className="forge-panel-title">
        <span>Design impact</span>
        <small>{runState === "idle" ? "Predicted after run" : getForgeVerdictLabel(result.verdict)}</small>
      </header>
      <div className="forge-impact-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className={metric.good ? "is-good" : "is-risk"}>
            <span>{metric.label}</span>
            <i style={{ "--score": `${metric.score * 3.6}deg` } as CSSProperties}><strong>{metric.value}</strong></i>
            <small>{metric.good ? "Healthy" : "At risk"}</small>
          </div>
        ))}
      </div>
      <p className={`forge-impact-summary is-${result.verdict}`}>
        {runState === "running" ? "Measuring behavior, tests, and change propagation…" : result.summary}
      </p>
    </section>
  );
}

function CoachPanel({
  mission,
  runResult,
  explanation,
  assessment,
  inputRef,
  onExplanationChange,
  onPracticeAloud,
  onAssess,
}: {
  mission: SystemForgeMission;
  runResult?: ForgeRunResult;
  explanation: string;
  assessment?: CoachAssessment;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  onExplanationChange: (value: string) => void;
  onPracticeAloud: () => void;
  onAssess: () => void;
}) {
  return (
    <section className={`forge-panel forge-coach${runResult ? " is-ready" : ""}`}>
      <header className="forge-panel-title">
        <span>Coach · Quiet observer</span>
        <small>{runResult ? "Evidence captured from your run" : "Listening after run"}</small>
      </header>
      <div className="forge-coach-body">
        <button type="button" className="forge-mic" onClick={onPracticeAloud} disabled={!runResult} aria-label="Practice explanation aloud">
          <Microphone size={22} />
        </button>
        <div className="forge-coach-prompt">
          <strong>{runResult ? mission.coachPrompt : "Run the mutation, then defend one design decision."}</strong>
          <span>{runResult ? "Explain the responsibility, the rejected alternative, and the behavior you observed." : "I will use your actual moves, failures, and recovery as interview evidence."}</span>
        </div>
        <div className="forge-coach-response">
          <textarea
            ref={inputRef}
            value={explanation}
            disabled={!runResult}
            onChange={(event) => onExplanationChange(event.target.value)}
            placeholder="Defend your design in your own words…"
            aria-label="Design explanation"
          />
          <button type="button" onClick={onAssess} disabled={!runResult || !explanation.trim()}><PaperPlaneTilt size={16} /> Assess reasoning</button>
        </div>
        <div className="forge-coach-evidence" aria-live="polite">
          {assessment ? (
            <>
              <strong className={`level-${assessment.level}`}>{assessment.level}</strong>
              <p>{assessment.feedback}</p>
              <span>{assessment.matchedConcepts.length ? `Evidence: ${assessment.matchedConcepts.join(" · ")}` : "Add one concrete design principle."}</span>
            </>
          ) : (
            <>
              <strong>Evidence, not a script</strong>
              <p>Clarification · responsibility · extensibility · behavior · communication</p>
              <span>Your trade-offs, your design.</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

interface WorldProps {
  verdict: ForgeOutcome["verdict"];
  runState: RunState;
  paused: boolean;
}

function defaultPressure(kind: ForgeWorldKind): ForgeOutcome["pressure"] {
  if (kind === "elevator") {
    return [
      { label: "P95 wait", value: "24s", trend: "good" },
      { label: "Emergency", value: "Unknown", trend: "warning" },
      { label: "Load factor", value: "76%", trend: "good" },
      { label: "Starved calls", value: "0", trend: "good" },
    ];
  }
  if (kind === "vending") {
    return [
      { label: "Refund time", value: "Unknown", trend: "warning" },
      { label: "Duplicate risk", value: "Unknown", trend: "warning" },
      { label: "Stock lock", value: "1", trend: "warning" },
      { label: "Recovery", value: "—", trend: "warning" },
    ];
  }
  return [
    { label: "Entry queue", value: "6", trend: "good" },
    { label: "Exit queue", value: "8", trend: "warning" },
    { label: "Occupancy", value: "78%", trend: "good" },
    { label: "Power load", value: "63%", trend: "good" },
  ];
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}
