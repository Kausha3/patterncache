import { useMemo, useState, type CSSProperties } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  advanceLldIncident,
  assessLldWorldDefense,
  createLldVerificationState,
  installLldArtifact,
  isLldWorldVerified,
  lldWorldHealth,
  runCurrentLldIncident,
  type LldVerificationState,
  type LldWorldSimulation,
} from "@/arena/lldVerificationEngine";
import {
  getLldVerificationWorld,
  type LldVerificationWorld,
  type LldWorldArtifact,
} from "@/arena/lldVerificationWorlds";
import {
  loadLldVerificationProgress,
  recordLldVerificationCompletion,
  resetLldVerificationDraft,
  saveLldVerificationDraft,
  type LldVerificationRecord,
} from "@/game/lldVerificationProgress";
import { Button, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";
import "@/theme/parking-lot-gauntlet.css";
import "@/theme/lld-verification-world.css";

export function LldVerificationWorldPage() {
  const { worldId } = useParams();
  const world = getLldVerificationWorld(worldId);
  return world ? <PlayableLldWorld key={world.id} world={world} /> : <Navigate to="/practice" replace />;
}

function PlayableLldWorld({ world }: { world: LldVerificationWorld }) {
  const initial = useMemo(() => loadLldVerificationProgress(world), [world]);
  const [game, setGame] = useState<LldVerificationState>(() => initial.draft ?? createLldVerificationState(world));
  const [record, setRecord] = useState<LldVerificationRecord | undefined>(initial.record);
  const [simulation, setSimulation] = useState<LldWorldSimulation>();
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>();
  const [showTechnical, setShowTechnical] = useState(false);
  const [defense, setDefense] = useState("");
  const [defenseSubmitted, setDefenseSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const incident = world.incidents[game.currentIncidentIndex];
  const artifacts = world.artifacts.filter((artifact) => incident.requiredArtifactIds.includes(artifact.id));
  const observed = game.observedIncidentIds.includes(incident.id);
  const cleared = game.clearedIncidentIds.includes(incident.id);
  const verified = isLldWorldVerified(world, game);
  const health = lldWorldHealth(world, game.placements);
  const selectedArtifact = artifacts.find((artifact) => artifact.id === selectedArtifactId);
  const defenseGrade = useMemo(() => assessLldWorldDefense(world, defense), [defense, world]);
  const style = { "--world-accent": world.accent } as CSSProperties;

  const updateGame = (next: LldVerificationState) => {
    setGame(next);
    saveLldVerificationDraft(world, next);
  };

  const runIncident = () => {
    const result = runCurrentLldIncident(world, game);
    updateGame(result.state);
    setSimulation(result.simulation);
    setDefenseSubmitted(false);
    if (!result.simulation.passed && result.simulation.misplacedArtifactIds.length > 0) {
      setSelectedArtifactId((current) => current ?? result.simulation.misplacedArtifactIds[0]);
    }
  };

  const install = (nodeId: string) => {
    if (!selectedArtifactId) return;
    const next = installLldArtifact(world, game, selectedArtifactId, nodeId);
    if (next === game) return;
    updateGame(next);
    setSimulation(undefined);
  };

  const advance = () => {
    const next = advanceLldIncident(world, game);
    if (next === game) return;
    updateGame(next);
    setSimulation(undefined);
    setSelectedArtifactId(undefined);
    setShowTechnical(false);
  };

  const submitDefense = () => {
    setDefenseSubmitted(true);
    const result = recordLldVerificationCompletion(world, game, defense);
    if (!result.completed) return;
    setRecord(result.progress.record);
    setCompleted(true);
  };

  const reset = () => {
    resetLldVerificationDraft(world);
    setGame(createLldVerificationState(world));
    setSimulation(undefined);
    setSelectedArtifactId(undefined);
    setShowTechnical(false);
    setDefense("");
    setDefenseSubmitted(false);
    setCompleted(false);
  };

  return (
    <div className="parking-gauntlet lld-verification-page" style={style}>
      <header className="parking-gauntlet-hero lld-world-hero">
        <div className="parking-gauntlet-breadcrumb">
          <Link to="/companies/amazon/sde1"><Icon name="arrowLeft" size={14} /> Amazon SDE I</Link>
          <span>{record ? `Previous verified clear · ${record.bestScore}/100` : `Exact LLD practice · ${world.systemName}`}</span>
        </div>
        <div className="parking-gauntlet-hero-grid">
          <div>
            <Eyebrow tone={world.accent}>{world.systemName} Verification World</Eyebrow>
            <h1>{world.title}</h1>
            <p>{world.intro} Technical names and principles appear only after the behavior works.</p>
          </div>
          <div className="parking-gauntlet-how" aria-label="How this game works">
            <span><b>1</b>Run the live incident</span>
            <span><b>2</b>Move data, actions, and rules</span>
            <span><b>3</b>Rerun and defend the boundary</span>
          </div>
        </div>
        <p className="lld-world-tagline">{world.tagline}</p>
        <div className="parking-gauntlet-progress" aria-label={`${world.incidents.length} incident campaign`}>
          {world.incidents.map((candidate, index) => {
            const incidentCleared = game.clearedIncidentIds.includes(candidate.id);
            const active = index === game.currentIncidentIndex;
            return (
              <div key={candidate.id} className={`${incidentCleared ? "cleared" : ""}${active ? " active" : ""}${index > game.currentIncidentIndex ? " locked" : ""}`}>
                <b>{incidentCleared ? "✓" : index + 1}</b><span>{candidate.title}</span>
              </div>
            );
          })}
        </div>
      </header>

      <section className="parking-gauntlet-mission" aria-labelledby="lld-world-mission-title">
        <div className="parking-gauntlet-brief">
          <Eyebrow tone="var(--amber)">Incident {game.currentIncidentIndex + 1} of {world.incidents.length}</Eyebrow>
          <h2 id="lld-world-mission-title">{incident.title}</h2>
          <p>{incident.story}</p>
          <div className="parking-gauntlet-goal"><Icon name="target" size={18} /><span><small>Your goal</small>{incident.goal}</span></div>
          <Button data-testid="lld-world-run" icon={cleared ? "check" : "play"} onClick={runIncident} disabled={completed}>
            {cleared ? "Run proof again" : observed ? "Rerun this incident" : incident.dispatchLabel}
          </Button>
          {!observed ? <small className="parking-gauntlet-nudge">Run first. The workshop stays locked until the world gives you evidence.</small> : null}
        </div>

        <div className={`parking-gauntlet-world lld-world-stage${simulation?.passed ? " passed" : simulation ? " failed" : ""}`}>
          <div className="lld-world-schematic" aria-hidden="true">
            {world.nodes.filter((node) => node.id !== world.initialOwnerId).map((node) => <span key={node.id}>{node.beginnerName}</span>)}
          </div>
          <div className="parking-gauntlet-world-status"><span><i /> Live {world.systemName}</span><strong>{simulation?.passed ? "INCIDENT CONTAINED" : simulation ? "SYSTEM FAILURE" : "WAITING TO RUN"}</strong></div>
          <div className="parking-gauntlet-trace" aria-live="polite">
            {(simulation?.trace ?? incident.trace.map((label) => ({ label, status: "waiting" as const }))).map((step, index) => (
              <div key={step.label} className={step.status}><b>{step.status === "pass" ? "✓" : step.status === "fail" ? "!" : index + 1}</b><span>{step.label}</span></div>
            ))}
          </div>
          {simulation ? (
            <div className={`parking-gauntlet-verdict ${simulation.passed ? "pass" : "fail"}`}>
              <Icon name={simulation.passed ? "check" : "gauge"} size={19} />
              <div><strong>{simulation.passed ? "Your design survived" : "The incident found a design leak"}</strong><p>{simulation.message}</p></div>
            </div>
          ) : null}
        </div>
      </section>

      {observed ? (
        <section className={`parking-gauntlet-workshop${cleared ? " cleared" : ""}`} aria-labelledby="lld-world-workshop-title">
          <header>
            <div>
              <Eyebrow tone={world.accent}>{cleared ? "Repair verified" : "Workshop unlocked by evidence"}</Eyebrow>
              <h2 id="lld-world-workshop-title">{cleared ? "Name the design you just proved" : "Move one responsibility, then rerun"}</h2>
              <p>{cleared ? incident.lesson : "Pick up one piece below and install it in the object that owns the information it needs or the rule it protects. The live incident—not a submit button—judges the repair."}</p>
            </div>
            <div className="parking-gauntlet-health"><small>Whole model repaired</small><strong>{health.correct}/{health.total}</strong></div>
          </header>

          <div className="parking-gauntlet-piece-tray" aria-label="Responsibilities in this incident">
            {artifacts.map((artifact) => {
              const owner = world.nodes.find((node) => node.id === game.placements[artifact.id]);
              const selected = selectedArtifactId === artifact.id;
              const misplaced = simulation?.misplacedArtifactIds.includes(artifact.id);
              return (
                <button key={artifact.id} type="button" data-artifact-id={artifact.id} aria-pressed={selected} className={`${selected ? "selected" : ""}${misplaced ? " misplaced" : ""}${cleared ? " fixed" : ""}`} onClick={() => setSelectedArtifactId(artifact.id)}>
                  <span className={`parking-gauntlet-kind ${artifact.kind}`}>{artifactKindLabel(artifact)}</span>
                  <strong>{showTechnical || cleared ? artifact.label : artifact.beginnerName}</strong>
                  <small>{artifact.description}</small>
                  <em>Currently in: {showTechnical || cleared ? owner?.label : owner?.beginnerName}</em>
                </button>
              );
            })}
          </div>

          {!cleared ? (
            <div className="parking-gauntlet-install">
              <div className="parking-gauntlet-hand"><Icon name="layers" size={20} /><span>{selectedArtifact ? <>Holding <strong>{selectedArtifact.beginnerName}</strong>. Choose an object below.</> : "Pick up a responsibility above first."}</span></div>
              <div className="parking-gauntlet-class-grid">
                {world.nodes.map((node) => {
                  const current = !!selectedArtifact && game.placements[selectedArtifact.id] === node.id;
                  return (
                    <button key={node.id} type="button" data-node-id={node.id} className={current ? "current" : ""} disabled={!selectedArtifact} onClick={() => install(node.id)}>
                      <span>{current ? "Installed here" : "Install here"}</span><strong>{showTechnical ? node.label : node.beginnerName}</strong><p>{node.description}</p>
                    </button>
                  );
                })}
              </div>
              <div className="parking-gauntlet-workshop-help">
                <button type="button" onClick={() => setShowTechnical((value) => !value)}><Icon name="code" size={14} /> {showTechnical ? "Use plain-language names" : "Show Java class names"}</button>
                <span>Wrong placements are safe. Rerun and the world will show what still leaks.</span>
              </div>
            </div>
          ) : (
            <WorldDiscovery world={world} artifacts={artifacts} placements={game.placements} showTechnical={showTechnical} onToggle={() => setShowTechnical((value) => !value)} principle={incident.principle} />
          )}

          {cleared && game.currentIncidentIndex < world.incidents.length - 1 ? <Button data-testid="lld-world-next" icon="arrowRight" onClick={advance}>Open incident {game.currentIncidentIndex + 2}</Button> : null}
        </section>
      ) : null}

      {verified ? (
        <section className={`parking-gauntlet-defense${completed ? " complete" : ""}`} aria-labelledby="lld-world-defense-title">
          <Eyebrow tone="var(--amber)">{completed ? "Verified evidence saved" : "Final interview room · no supplied answer"}</Eyebrow>
          <h2 id="lld-world-defense-title">Defend your {world.systemName} design</h2>
          <p>{world.defense.prompt} Cite at least one incident you actually observed and reject one coupled alternative.</p>
          <textarea value={defense} disabled={completed} onChange={(event) => { setDefense(event.target.value); setDefenseSubmitted(false); }} aria-label={`${world.systemName} interview defense`} placeholder="Explain concrete class owners, the invariant they protect, one incident, one future change, and a tradeoff—in your own words." />
          <div className="parking-gauntlet-defense-footer">
            <span>{defense.trim().length} characters · evidence beats terminology</span>
            <Button data-testid="lld-world-defense" icon={completed ? "check" : "microphone"} disabled={completed || defense.trim().length < 100} onClick={submitDefense}>{completed ? `${world.systemName} verified` : "Defend my design"}</Button>
          </div>
          {defenseSubmitted ? <div className={`parking-gauntlet-grade ${defenseGrade.ready ? "pass" : "retry"}`}><strong>{defenseGrade.score}/100 · {defenseGrade.ready ? "Interview-ready evidence" : "Strengthen the explanation"}</strong>{defenseGrade.missing.length ? <p>Still missing: {defenseGrade.missing.join("; ")}.</p> : <p>You named owners, invariant, incident evidence, contained change, and a rejected alternative.</p>}</div> : null}
          {completed ? <Link className="lld-world-return" to="/companies/amazon/sde1">Use this verified clear on the Amazon board <Icon name="arrowRight" size={14} /></Link> : null}
        </section>
      ) : null}

      <footer className="parking-gauntlet-footer"><button type="button" onClick={reset}><Icon name="reset" size={14} /> Reset this world</button><span>{game.runs} incident run{game.runs === 1 ? "" : "s"} · progress saved on this device</span></footer>
    </div>
  );
}

function WorldDiscovery({ world, artifacts, placements, showTechnical, onToggle, principle }: {
  world: LldVerificationWorld;
  artifacts: LldWorldArtifact[];
  placements: Record<string, string>;
  showTechnical: boolean;
  onToggle: () => void;
  principle: string;
}) {
  return (
    <div className="parking-gauntlet-discovery">
      <div className="lld-world-principle"><span>Principle earned after proof</span><strong>{principle}</strong></div>
      <div className="parking-gauntlet-mappings">
        {artifacts.map((artifact) => {
          const node = world.nodes.find((candidate) => candidate.id === placements[artifact.id])!;
          return <div key={artifact.id}><span>{artifact.beginnerName}</span><Icon name="arrowRight" size={14} /><strong>{node.label}.{artifact.label}</strong><p>{artifact.reason}</p></div>;
        })}
      </div>
      <button type="button" className="parking-gauntlet-java-toggle" onClick={onToggle}><Icon name="code" size={14} /> {showTechnical ? "Hide Java blueprint" : "Reveal the Java blueprint"}</button>
      {showTechnical ? <pre aria-label={`${world.systemName} Java blueprint`}><code>{javaBlueprint(world, placements)}</code></pre> : null}
    </div>
  );
}

function artifactKindLabel(artifact: LldWorldArtifact): string {
  if (artifact.kind === "state") return "information";
  if (artifact.kind === "policy") return "rule";
  return "action";
}

function javaBlueprint(world: LldVerificationWorld, placements: Record<string, string>): string {
  return world.nodes
    .filter((node) => node.id !== world.initialOwnerId)
    .map((node) => {
      const artifacts = world.artifacts.filter((artifact) => placements[artifact.id] === node.id);
      const lines = artifacts.length
        ? artifacts.map((artifact) => `    // ${artifact.kind}: ${artifact.label}`)
        : ["    // no responsibility installed"];
      return `class ${node.label} {\n${lines.join("\n")}\n}`;
    })
    .join("\n\n");
}
