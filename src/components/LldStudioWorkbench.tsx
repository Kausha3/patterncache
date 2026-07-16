import { useMemo, useState } from "react";
import type { LldStudioMission } from "@/arena/lldStudioMissions";
import {
  generateJavaSkeleton,
  generateReferenceAssignments,
  getLldMetricBand,
  gradeLldStudio,
} from "@/arena/lldStudioEngine";
import type {
  LldPlacementResult,
  LldStudioAssignments,
  LldStudioGrade,
} from "@/arena/lldStudioEngine";
import { Button, Eyebrow } from "@/components/ui";
import { CodeBlock } from "@/components/CodeBlock";
import { Icon } from "@/components/Icon";
import { color } from "@/theme/tokens";

export function LldStudioWorkbench({
  mission,
  previousBest,
  onComplete,
  onExit,
  onReplay,
  onNext,
  hasNext,
}: {
  mission: LldStudioMission;
  previousBest?: number;
  onComplete: (score: number, maxScore: number) => void;
  onExit: () => void;
  onReplay: () => void;
  onNext: () => void;
  hasNext: boolean;
}) {
  const [phase, setPhase] = useState<"model" | "mutate" | "complete">("model");
  const [assignments, setAssignments] = useState<LldStudioAssignments>({});
  const [modelLocked, setModelLocked] = useState(false);
  const [mutationAnswers, setMutationAnswers] = useState<Record<string, string>>({});
  const [defenseAnswer, setDefenseAnswer] = useState<string>();
  const [grade, setGrade] = useState<LldStudioGrade>();
  const [baselineBest] = useState(previousBest ?? 0);
  const skeleton = useMemo(() => generateJavaSkeleton(mission, assignments), [mission, assignments]);
  const assignedCount = mission.responsibilities.filter((responsibility) => assignments[responsibility.id]).length;
  const allAssigned = assignedCount === mission.responsibilities.length;
  const preliminaryGrade = useMemo(
    () => modelLocked ? gradeLldStudio({ mission, assignments, mutationAnswers: {}, defenseAnswer: undefined }) : undefined,
    [modelLocked, mission, assignments],
  );

  const assignOwner = (responsibilityId: string, ownerId: string) => {
    if (modelLocked) return;
    setAssignments((current) => ({ ...current, [responsibilityId]: ownerId }));
  };

  const submitDecisions = () => {
    if (
      grade ||
      mission.mutations.some((mutation) => !mutationAnswers[mutation.id]) ||
      !defenseAnswer
    ) return;
    const result = gradeLldStudio({ mission, assignments, mutationAnswers, defenseAnswer });
    setGrade(result);
    setPhase("complete");
    onComplete(result.score, result.maxScore);
  };

  if (phase === "complete" && grade) {
    return (
      <LldStudioCompletion
        mission={mission}
        assignments={assignments}
        grade={grade}
        baselineBest={baselineBest}
        onReplay={onReplay}
        onNext={onNext}
        onExit={onExit}
        hasNext={hasNext}
      />
    );
  }

  return (
    <div className="studio-workbench">
      <header className="studio-workbench-header">
        <div>
          <Eyebrow tone={color.violet}>LLD Design Studio · Java model</Eyebrow>
          <h1>{mission.title}</h1>
          <p>{mission.domain}</p>
        </div>
        <button className="studio-exit" onClick={onExit}>Exit to mission select</button>
      </header>

      <StudioStageProgress phase={phase} modelLocked={modelLocked} />

      <section className="studio-prompt" aria-labelledby="studio-prompt-heading">
        <div>
          <Eyebrow tone={color.amber}>Interview prompt</Eyebrow>
          <h2 id="studio-prompt-heading">{mission.prompt}</h2>
        </div>
        <p><b>Design objective</b>{mission.objective}</p>
      </section>

      {phase === "model" ? (
        <>
          <div className="studio-model-layout">
            <ResponsibilityBoard
              mission={mission}
              assignments={assignments}
              locked={modelLocked}
              results={preliminaryGrade?.placementResults}
              onAssign={assignOwner}
            />
            <div className="studio-model-column">
              <LiveClassDiagram
                mission={mission}
                assignments={assignments}
                locked={modelLocked}
                results={preliminaryGrade?.placementResults}
              />
              <section className="studio-skeleton" aria-labelledby="studio-skeleton-heading">
                <header>
                  <div><Eyebrow tone={color.teal}>Generated artifact</Eyebrow><h2 id="studio-skeleton-heading">Your Java skeleton</h2></div>
                  <span>{assignedCount}/{mission.responsibilities.length} responsibilities placed</span>
                </header>
                <CodeBlock code={skeleton} label="learner-model.java" />
              </section>
            </div>
          </div>

          {!modelLocked ? (
            <div className="studio-lock-bar">
              <div><strong>{assignedCount}/{mission.responsibilities.length} placed</strong><span>Every responsibility needs an explicit owner.</span></div>
              <Button icon="shield" disabled={!allAssigned} onClick={() => setModelLocked(true)}>Lock responsibility model</Button>
            </div>
          ) : preliminaryGrade ? (
            <ModelReview
              mission={mission}
              grade={preliminaryGrade}
              onContinue={() => setPhase("mutate")}
            />
          ) : null}
        </>
      ) : (
        <MutationLab
          mission={mission}
          mutationAnswers={mutationAnswers}
          defenseAnswer={defenseAnswer}
          onMutationAnswer={(mutationId, optionId) =>
            setMutationAnswers((current) => ({ ...current, [mutationId]: optionId }))
          }
          onDefenseAnswer={setDefenseAnswer}
          onSubmit={submitDecisions}
        />
      )}
    </div>
  );
}

function ResponsibilityBoard({
  mission,
  assignments,
  locked,
  results,
  onAssign,
}: {
  mission: LldStudioMission;
  assignments: LldStudioAssignments;
  locked: boolean;
  results?: LldPlacementResult[];
  onAssign: (responsibilityId: string, ownerId: string) => void;
}) {
  return (
    <section className="studio-responsibility-board" aria-labelledby="studio-responsibility-heading">
      <header>
        <Eyebrow>Responsibility bank</Eyebrow>
        <h2 id="studio-responsibility-heading">Who owns the behavior?</h2>
        <p>Assign by the data and invariant each method protects, not by which class can technically call it.</p>
      </header>
      <div>
        {mission.responsibilities.map((responsibility, index) => {
          const result = results?.find((candidate) => candidate.responsibilityId === responsibility.id);
          return (
            <fieldset
              className={result ? result.correct ? "studio-responsibility correct" : "studio-responsibility wrong" : "studio-responsibility"}
              key={responsibility.id}
            >
              <legend>
                <span>R{index + 1}</span>
                <strong>{responsibility.label}</strong>
                <code>{responsibility.signature}</code>
              </legend>
              <div className="studio-owner-options">
                {mission.types.map((type) => (
                  <button
                    key={type.id}
                    aria-label={`Assign ${responsibility.label} to ${type.name}`}
                    aria-pressed={assignments[responsibility.id] === type.id}
                    className={assignments[responsibility.id] === type.id ? "selected" : ""}
                    disabled={locked}
                    onClick={() => onAssign(responsibility.id, type.id)}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
              {result ? (
                <div className="studio-placement-feedback" role="status">
                  <Icon name={result.correct ? "check" : "insight"} size={14} />
                  <p>
                    <strong>{result.correct ? "Boundary held." : `Correct owner: ${mission.types.find((type) => type.id === result.correctOwnerId)?.name}.`}</strong>
                    {result.correct ? result.why : result.riskIfMisplaced}
                  </p>
                </div>
              ) : null}
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}

function LiveClassDiagram({
  mission,
  assignments,
  locked,
  results,
}: {
  mission: LldStudioMission;
  assignments: LldStudioAssignments;
  locked: boolean;
  results?: LldPlacementResult[];
}) {
  return (
    <section className="studio-diagram" aria-labelledby="studio-diagram-heading">
      <header>
        <div><Eyebrow tone={color.violet}>Live class model</Eyebrow><h2 id="studio-diagram-heading">Responsibility map</h2></div>
        <span>{locked ? "MODEL LOCKED" : "LIVE"}</span>
      </header>
      <div className="studio-type-grid" role="list" aria-label="Class and interface model">
        {mission.types.map((type) => {
          const owned = mission.responsibilities.filter((responsibility) => assignments[responsibility.id] === type.id);
          const hasWrong = results?.some((result) => result.selectedOwnerId === type.id && !result.correct);
          return (
            <article className={`studio-type-card${type.kind === "interface" ? " interface" : ""}${hasWrong ? " has-risk" : ""}`} key={type.id} role="listitem">
              <header><Icon name={type.kind === "interface" ? "shield" : "layers"} size={13} /><div><small>{type.kind}</small><strong>{type.name}</strong></div></header>
              <p>{type.role}</p>
              <div className="studio-type-fields">
                {type.fields.length ? type.fields.map((field) => <code key={field}>{field}</code>) : <i>contract only</i>}
              </div>
              <div className="studio-type-methods">
                {owned.length ? owned.map((responsibility) => {
                  const result = results?.find((candidate) => candidate.responsibilityId === responsibility.id);
                  return <code className={result ? result.correct ? "correct" : "wrong" : ""} key={responsibility.id}>{responsibility.signature}</code>;
                }) : <i>drop responsibility here</i>}
              </div>
            </article>
          );
        })}
      </div>
      <div className="studio-relationships" role="list" aria-label="Model relationships">
        {mission.relationships.map((relationship) => (
          <span key={relationship.id} role="listitem">
            <b>{mission.types.find((type) => type.id === relationship.fromId)?.name}</b>
            <Icon name="arrowRight" size={12} />
            <em>{relationship.label}</em>
            <b>{mission.types.find((type) => type.id === relationship.toId)?.name}</b>
          </span>
        ))}
      </div>
    </section>
  );
}

function ModelReview({
  mission,
  grade,
  onContinue,
}: {
  mission: LldStudioMission;
  grade: LldStudioGrade;
  onContinue: () => void;
}) {
  return (
    <section className="studio-model-review" aria-labelledby="studio-review-heading">
      <div>
        <Eyebrow tone={grade.correctPlacements === mission.responsibilities.length ? color.green : color.amber}>Model checkpoint</Eyebrow>
        <h2 id="studio-review-heading">{grade.correctPlacements}/{mission.responsibilities.length} ownership boundaries held.</h2>
        <p>The model is now frozen. Next, requirements will mutate without giving you permission to rewrite stable classes casually.</p>
      </div>
      <MetricPreview metrics={grade.metrics} hideExtensibility />
      <Button iconRight="arrowRight" onClick={onContinue}>Inject requirement mutations</Button>
    </section>
  );
}

function MutationLab({
  mission,
  mutationAnswers,
  defenseAnswer,
  onMutationAnswer,
  onDefenseAnswer,
  onSubmit,
}: {
  mission: LldStudioMission;
  mutationAnswers: Record<string, string>;
  defenseAnswer?: string;
  onMutationAnswer: (mutationId: string, optionId: string) => void;
  onDefenseAnswer: (optionId: string) => void;
  onSubmit: () => void;
}) {
  const allAnswered = mission.mutations.every((mutation) => mutationAnswers[mutation.id]) && !!defenseAnswer;
  return (
    <section className="studio-mutation-lab" aria-labelledby="studio-mutation-heading">
      <header>
        <div><Eyebrow tone={color.red}>Requirement mutation lab</Eyebrow><h2 id="studio-mutation-heading">Your model just met production.</h2></div>
        <p>Choose the smallest change that preserves existing boundaries. Every tempting shortcut increases coupling somewhere.</p>
      </header>
      <div className="studio-mutation-list">
        {mission.mutations.map((mutation, index) => (
          <fieldset key={mutation.id}>
            <legend>
              <span>{mutation.pressure}</span>
              <strong>{index + 1}. {mutation.title}</strong>
              <p>{mutation.scenario}</p>
            </legend>
            <div>
              {mutation.options.map((option) => (
                <button
                  key={option.id}
                  aria-pressed={mutationAnswers[mutation.id] === option.id}
                  className={mutationAnswers[mutation.id] === option.id ? "selected" : ""}
                  onClick={() => onMutationAnswer(mutation.id, option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <fieldset className="studio-defense-question">
        <legend><span>design defense</span><strong>{mission.defense.prompt}</strong></legend>
        <div>
          {mission.defense.options.map((option) => (
            <button
              key={option.id}
              aria-pressed={defenseAnswer === option.id}
              className={defenseAnswer === option.id ? "selected" : ""}
              onClick={() => onDefenseAnswer(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <Button icon="shield" disabled={!allAnswered} onClick={onSubmit}>Lock mutations and score design</Button>
    </section>
  );
}

function LldStudioCompletion({
  mission,
  assignments,
  grade,
  baselineBest,
  onReplay,
  onNext,
  onExit,
  hasNext,
}: {
  mission: LldStudioMission;
  assignments: LldStudioAssignments;
  grade: LldStudioGrade;
  baselineBest: number;
  onReplay: () => void;
  onNext: () => void;
  onExit: () => void;
  hasNext: boolean;
}) {
  const newBest = grade.score > baselineBest;
  const runXp = 250 + Math.round((grade.score / grade.maxScore) * 200);
  const previousXp = baselineBest > 0 ? 250 + Math.round((baselineBest / grade.maxScore) * 200) : 0;
  const newXp = newBest ? Math.max(0, runXp - previousXp) : 0;
  const referenceSkeleton = generateJavaSkeleton(mission, generateReferenceAssignments(mission));

  return (
    <section className="studio-complete">
      <div className="studio-complete-glow" aria-hidden />
      <Eyebrow tone={color.green}>Design review complete</Eyebrow>
      <div className="studio-complete-score" role="img" aria-label={`${grade.score} out of ${grade.maxScore} points`}>
        <span>SCORE</span><strong>{grade.score}</strong><small>/ {grade.maxScore}</small>
      </div>
      <h1>{newBest ? "New model benchmark." : "Model defended."}</h1>
      <p>{grade.correctPlacements}/6 responsibilities and {grade.correctMutations}/3 requirement mutations held. The debrief shows where responsibility leaked and why.</p>

      <MetricPreview metrics={grade.metrics} />

      <div className="studio-score-breakdown">
        <ScorePart label="responsibility ownership" value={`+${grade.placementPoints}`} />
        <ScorePart label="requirement mutations" value={`+${grade.mutationPoints}`} />
        <ScorePart label="design defense" value={`+${grade.defensePoints}`} />
        <ScorePart label="new best-score XP" value={newXp ? `+${newXp}` : "0"} />
      </div>

      <section className="studio-debrief" aria-labelledby="studio-debrief-heading">
        <header><Eyebrow>Boundary debrief</Eyebrow><h2 id="studio-debrief-heading">What the model says about your instincts</h2></header>
        <div className="studio-debrief-grid">
          {grade.placementResults.map((result) => {
            const responsibility = mission.responsibilities.find((candidate) => candidate.id === result.responsibilityId)!;
            return (
              <article className={result.correct ? "correct" : "wrong"} key={result.responsibilityId}>
                <div><Icon name={result.correct ? "check" : "insight"} size={14} /><strong>{responsibility.signature}</strong></div>
                <p>{result.correct ? result.why : result.riskIfMisplaced}</p>
                {!result.correct ? <small>Defensible owner: {mission.types.find((type) => type.id === result.correctOwnerId)?.name}</small> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="studio-decision-review" aria-labelledby="studio-decisions-heading">
        <header><Eyebrow>Change review</Eyebrow><h2 id="studio-decisions-heading">Mutation and defense decisions</h2></header>
        {[...grade.mutationResults, grade.defenseResult].map((result, index) => (
          <article className={result.correct ? "correct" : "wrong"} key={result.id}>
            <div><Icon name={result.correct ? "check" : "insight"} size={14} /><strong>{index < grade.mutationResults.length ? `Mutation ${index + 1}` : "Design defense"} · {result.correct ? "held" : "missed"}</strong></div>
            <p>{result.feedback}</p>
            {!result.correct ? <small>Defensible decision: {result.correctLabel}</small> : null}
          </article>
        ))}
      </section>

      <details className="studio-code-compare">
        <summary>Compare generated Java models</summary>
        <div>
          <CodeBlock code={generateJavaSkeleton(mission, assignments)} label="your-model.java" />
          <CodeBlock code={referenceSkeleton} label="reference-model.java" />
        </div>
      </details>

      <div className="studio-complete-actions">
        <Button icon="reset" onClick={onReplay}>Replay this model</Button>
        {hasNext ? <Button variant="ghost" iconRight="arrowRight" onClick={onNext}>Next model</Button> : null}
        <Button variant="subtle" onClick={onExit}>Mission select</Button>
      </div>
    </section>
  );
}

function StudioStageProgress({ phase, modelLocked }: { phase: "model" | "mutate" | "complete"; modelLocked: boolean }) {
  return (
    <ol className="studio-stage-progress" aria-label="LLD Studio stages">
      <StageItem label="Model" active={phase === "model"} complete={modelLocked} />
      <StageItem label="Mutate" active={phase === "mutate"} complete={phase === "complete"} />
      <StageItem label="Debrief" active={phase === "complete"} complete={false} />
    </ol>
  );
}

function StageItem({ label, active, complete }: { label: string; active: boolean; complete: boolean }) {
  return <li className={complete ? "complete" : active ? "active" : ""} aria-current={active ? "step" : undefined}><i>{complete ? <Icon name="check" size={10} /> : null}</i><span>{label}</span></li>;
}

function MetricPreview({ metrics, hideExtensibility = false }: { metrics: LldStudioGrade["metrics"]; hideExtensibility?: boolean }) {
  const items = [
    { id: "cohesion", label: "cohesion", value: metrics.cohesion },
    { id: "coupling", label: "coupling control", value: metrics.couplingControl },
    ...(!hideExtensibility ? [{ id: "extensibility", label: "extensibility", value: metrics.extensibility }] : []),
  ];
  return (
    <div className="studio-metrics">
      {items.map((item) => {
        const band = getLldMetricBand(item.value);
        return (
          <div className={`studio-metric ${band.tone}`} key={item.id}>
            <div><span>{item.label}</span><strong>{item.value}</strong></div>
            <div
              className="studio-metric-track"
              role="progressbar"
              aria-label={item.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={item.value}
            >
              <span style={{ width: `${item.value}%` }} />
            </div>
            <small>{band.label}</small>
          </div>
        );
      })}
    </div>
  );
}

function ScorePart({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
