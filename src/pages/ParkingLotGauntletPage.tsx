import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  GARAGE_INCIDENTS,
  GARAGE_NODES,
  assessGarageDefense,
  garageArchitectureHealth,
  generateGarageJava,
  getGarageIncidentArtifacts,
  type GarageArtifact,
  type GarageNodeId,
  type GarageSimulation,
} from "@/arena/garageRefactorEngine";
import {
  advanceGarageIncident,
  createGarageGauntletState,
  installCurrentGarageArtifact,
  isGarageGauntletArchitectureVerified,
  runCurrentGarageIncident,
  type GarageGauntletState,
} from "@/arena/garageGauntletEngine";
import {
  loadParkingLotGauntletProgress,
  recordParkingLotGauntletCompletion,
  resetParkingLotGauntletDraft,
  saveParkingLotGauntletDraft,
  type ParkingLotGauntletRecord,
} from "@/game/parkingLotGauntletProgress";
import garageMap from "@/assets/system-forge/parking-garage-map.webp";
import { Button, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";
import "@/theme/parking-lot-gauntlet.css";

export function ParkingLotGauntletPage() {
  const initial = useMemo(() => loadParkingLotGauntletProgress(), []);
  const [game, setGame] = useState<GarageGauntletState>(() => initial.draft ?? createGarageGauntletState());
  const [savedRecord, setSavedRecord] = useState<ParkingLotGauntletRecord | undefined>(initial.record);
  const [simulation, setSimulation] = useState<GarageSimulation>();
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>();
  const [showJava, setShowJava] = useState(false);
  const [defense, setDefense] = useState("");
  const [defenseSubmitted, setDefenseSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const incident = GARAGE_INCIDENTS[game.currentIncidentIndex];
  const artifacts = getGarageIncidentArtifacts(incident);
  const observed = game.observedIncidentIds.includes(incident.id);
  const currentCleared = game.clearedIncidentIds.includes(incident.id);
  const finalArchitecture = isGarageGauntletArchitectureVerified(game);
  const health = garageArchitectureHealth(game.placements);
  const defenseGrade = useMemo(() => assessGarageDefense(defense), [defense]);
  const selectedArtifact = artifacts.find((artifact) => artifact.id === selectedArtifactId);

  const updateGame = (next: GarageGauntletState) => {
    setGame(next);
    saveParkingLotGauntletDraft(next);
  };

  const runIncident = () => {
    const next = runCurrentGarageIncident(game);
    updateGame(next.state);
    setSimulation(next.simulation);
    setDefenseSubmitted(false);
    if (!next.simulation.passed && next.simulation.misplacedArtifactIds.length > 0) {
      setSelectedArtifactId((current) => current ?? next.simulation.misplacedArtifactIds[0]);
    }
  };

  const installArtifact = (nodeId: GarageNodeId) => {
    if (!selectedArtifactId || !observed || currentCleared) return;
    const next = installCurrentGarageArtifact(game, selectedArtifactId, nodeId);
    if (next === game) return;
    updateGame(next);
    setSimulation(undefined);
  };

  const advance = () => {
    const next = advanceGarageIncident(game);
    if (next === game) return;
    updateGame(next);
    setSimulation(undefined);
    setSelectedArtifactId(undefined);
    setShowJava(false);
  };

  const submitDefense = () => {
    setDefenseSubmitted(true);
    const result = recordParkingLotGauntletCompletion(game, defense);
    if (!result.completed) return;
    setSavedRecord(result.progress.record);
    setCompleted(true);
  };

  const reset = () => {
    resetParkingLotGauntletDraft();
    setGame(createGarageGauntletState());
    setSimulation(undefined);
    setSelectedArtifactId(undefined);
    setShowJava(false);
    setDefense("");
    setDefenseSubmitted(false);
    setCompleted(false);
  };

  return (
    <div className="parking-gauntlet">
      <header className="parking-gauntlet-hero">
        <div className="parking-gauntlet-breadcrumb">
          <Link to="/companies/amazon/sde1"><Icon name="arrowLeft" size={14} /> Amazon SDE I</Link>
          <span>{savedRecord ? `Previous verified clear · ${savedRecord.bestScore}/100` : "Exact LLD practice · Parking Lot"}</span>
        </div>
        <div className="parking-gauntlet-hero-grid">
          <div>
            <Eyebrow tone="var(--teal)">Parking Lot Design Gauntlet</Eyebrow>
            <h1>Run it. Break it. Rebuild it.</h1>
            <p>
              You do not need to know LLD yet. Operate a badly designed garage, watch one concrete failure,
              then move the information and actions until the same incident survives. Technical names appear only after the idea works.
            </p>
          </div>
          <div className="parking-gauntlet-how" aria-label="How this game works">
            <span><b>1</b>Run one incident</span>
            <span><b>2</b>Move real responsibilities</span>
            <span><b>3</b>Rerun to prove it</span>
          </div>
        </div>
        <div className="parking-gauntlet-progress" aria-label="Six incident campaign">
          {GARAGE_INCIDENTS.map((candidate, index) => {
            const cleared = game.clearedIncidentIds.includes(candidate.id);
            const active = index === game.currentIncidentIndex;
            return (
              <div key={candidate.id} className={`${cleared ? "cleared" : ""}${active ? " active" : ""}${index > game.currentIncidentIndex ? " locked" : ""}`}>
                <b>{cleared ? "✓" : index + 1}</b>
                <span>{candidate.title}</span>
              </div>
            );
          })}
        </div>
      </header>

      <section className="parking-gauntlet-mission" aria-labelledby="parking-mission-title">
        <div className="parking-gauntlet-brief">
          <Eyebrow tone="var(--amber)">Incident {game.currentIncidentIndex + 1} of {GARAGE_INCIDENTS.length}</Eyebrow>
          <h2 id="parking-mission-title">{incident.title}</h2>
          <p>{incident.story}</p>
          <div className="parking-gauntlet-goal">
            <Icon name="target" size={18} />
            <span><small>Your goal</small>{incident.beginnerGoal}</span>
          </div>
          <Button data-testid="parking-run-incident" icon={currentCleared ? "check" : "play"} onClick={runIncident} disabled={completed}>
            {currentCleared ? "Run proof again" : observed ? "Rerun this incident" : incident.dispatchLabel}
          </Button>
          {!observed ? <small className="parking-gauntlet-nudge">Start here. The workshop stays locked until the failure gives you evidence.</small> : null}
        </div>

        <div className={`parking-gauntlet-world${simulation?.passed ? " passed" : simulation ? " failed" : ""}`} style={{ backgroundImage: `linear-gradient(90deg, rgba(9,18,21,.92), rgba(9,18,21,.28)), url(${garageMap})` }}>
          <div className="parking-gauntlet-world-status">
            <span><i /> Live garage</span>
            <strong>{simulation?.passed ? "INCIDENT CONTAINED" : simulation ? "SYSTEM FAILURE" : "WAITING TO RUN"}</strong>
          </div>
          <div className="parking-gauntlet-trace" aria-live="polite">
            {(simulation?.trace ?? incident.trace.map((label) => ({ label, status: "waiting" as const }))).map((step, index) => (
              <div key={step.label} className={step.status}>
                <b>{step.status === "pass" ? "✓" : step.status === "fail" ? "!" : index + 1}</b>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
          {simulation ? (
            <div className={`parking-gauntlet-verdict ${simulation.passed ? "pass" : "fail"}`}>
              <Icon name={simulation.passed ? "check" : "gauge"} size={19} />
              <div><strong>{simulation.passed ? "Your design survived" : "The failure found a design leak"}</strong><p>{simulation.message}</p></div>
            </div>
          ) : null}
        </div>
      </section>

      {observed ? (
        <section className={`parking-gauntlet-workshop${currentCleared ? " cleared" : ""}`} aria-labelledby="parking-workshop-title">
          <header>
            <div>
              <Eyebrow tone="var(--teal)">{currentCleared ? "Repair verified" : "Workshop unlocked by the run"}</Eyebrow>
              <h2 id="parking-workshop-title">{currentCleared ? "See what the idea means in Java" : "Move one responsibility, then rerun"}</h2>
              <p>{currentCleared ? incident.repairLesson : "Pick up a responsibility below. Install it in the object that owns the information it needs or the rule it protects. There is no submit button—the next incident run is the judge."}</p>
            </div>
            <div className="parking-gauntlet-health"><small>Model repaired</small><strong>{health.correct}/{health.total}</strong></div>
          </header>

          <div className="parking-gauntlet-piece-tray" aria-label="Responsibilities in this incident">
            {artifacts.map((artifact) => {
              const selected = selectedArtifactId === artifact.id;
              const misplaced = simulation?.misplacedArtifactIds.includes(artifact.id);
              const owner = GARAGE_NODES.find((node) => node.id === game.placements[artifact.id]);
              return (
                <button
                  key={artifact.id}
                  type="button"
                  data-artifact-id={artifact.id}
                  className={`${selected ? "selected" : ""}${misplaced ? " misplaced" : ""}${currentCleared ? " fixed" : ""}`}
                  onClick={() => setSelectedArtifactId(artifact.id)}
                  aria-pressed={selected}
                >
                  <span className={`parking-gauntlet-kind ${artifact.kind}`}>{artifact.kind === "state" ? "information" : "action"}</span>
                  <strong>{showJava || currentCleared ? artifact.label : artifact.beginnerName}</strong>
                  <small>{artifact.beginnerDescription}</small>
                  <em>Currently in: {showJava || currentCleared ? owner?.label : owner?.beginnerName}</em>
                </button>
              );
            })}
          </div>

          {!currentCleared ? (
            <div className="parking-gauntlet-install">
              <div className="parking-gauntlet-hand">
                <Icon name="layers" size={20} />
                <span>{selectedArtifact ? <>Holding <strong>{selectedArtifact.beginnerName}</strong>. Choose an object below.</> : "Pick up a responsibility above first."}</span>
              </div>
              <div className="parking-gauntlet-class-grid">
                {GARAGE_NODES.map((node) => {
                  const isCurrent = !!selectedArtifact && game.placements[selectedArtifact.id] === node.id;
                  return (
                    <button key={node.id} type="button" data-node-id={node.id} className={isCurrent ? "current" : ""} disabled={!selectedArtifact} onClick={() => installArtifact(node.id)}>
                      <span>{isCurrent ? "Installed here" : "Install here"}</span>
                      <strong>{showJava ? node.label : node.beginnerName}</strong>
                      <p>{node.beginnerDescription}</p>
                    </button>
                  );
                })}
              </div>
              <div className="parking-gauntlet-workshop-help">
                <button type="button" onClick={() => setShowJava((value) => !value)}><Icon name="code" size={14} /> {showJava ? "Use plain-language names" : "Show Java class names"}</button>
                <span>Wrong placements are safe. Rerun the incident and the world will show what still leaks.</span>
              </div>
            </div>
          ) : (
            <Discovery artifacts={artifacts} placements={game.placements} java={generateGarageJava(game.placements)} showJava={showJava} onToggleJava={() => setShowJava((value) => !value)} />
          )}

          {currentCleared && game.currentIncidentIndex < GARAGE_INCIDENTS.length - 1 ? (
            <Button data-testid="parking-open-next" icon="arrowRight" onClick={advance}>Open incident {game.currentIncidentIndex + 2}</Button>
          ) : null}
        </section>
      ) : null}

      {finalArchitecture ? (
        <section className={`parking-gauntlet-defense${completed ? " complete" : ""}`} aria-labelledby="parking-defense-title">
          <Eyebrow tone="var(--amber)">{completed ? "Verified evidence saved" : "Final interview room · no answer choices"}</Eyebrow>
          <h2 id="parking-defense-title">Defend your Parking Lot design</h2>
          <p>
            The model has survived all six incidents. Explain who owns occupancy, pricing, and payment,
            cite one failure you observed, and name the future change your separation contains.
          </p>
          <textarea
            value={defense}
            disabled={completed}
            onChange={(event) => { setDefense(event.target.value); setDefenseSubmitted(false); }}
            aria-label="Parking Lot interview defense"
            placeholder="Example structure—not an answer: [class] owns [responsibility] because... The [incident] proved... I rejected [alternative] because... When [future change] happens..."
          />
          <div className="parking-gauntlet-defense-footer">
            <span>{defense.trim().length} characters · explain the evidence in your own words</span>
            <Button data-testid="parking-submit-defense" icon={completed ? "check" : "microphone"} disabled={completed || defense.trim().length < 80} onClick={submitDefense}>
              {completed ? "Parking Lot verified" : "Defend my design"}
            </Button>
          </div>
          {defenseSubmitted ? (
            <div className={`parking-gauntlet-grade ${defenseGrade.ready ? "pass" : "retry"}`}>
              <strong>{defenseGrade.score}/100 · {defenseGrade.ready ? "Interview-ready evidence" : "Strengthen the explanation"}</strong>
              {defenseGrade.missing.length ? <p>Still missing: {defenseGrade.missing.join("; ")}.</p> : <p>You named owners, protected responsibilities, simulation evidence, contained change, and the rejected alternative.</p>}
            </div>
          ) : null}
        </section>
      ) : null}

      <footer className="parking-gauntlet-footer">
        <button type="button" onClick={reset}><Icon name="reset" size={14} /> Reset this gauntlet</button>
        <span>{game.runs} incident run{game.runs === 1 ? "" : "s"} · progress saved on this device</span>
      </footer>
    </div>
  );
}

function Discovery({ artifacts, placements, java, showJava, onToggleJava }: {
  artifacts: GarageArtifact[];
  placements: GarageGauntletState["placements"];
  java: string;
  showJava: boolean;
  onToggleJava: () => void;
}) {
  return (
    <div className="parking-gauntlet-discovery">
      <div className="parking-gauntlet-mappings">
        {artifacts.map((artifact) => {
          const node = GARAGE_NODES.find((candidate) => candidate.id === placements[artifact.id])!;
          return <div key={artifact.id}><span>{artifact.beginnerName}</span><Icon name="arrowRight" size={14} /><strong>{node.label}.{artifact.label}</strong><p>{artifact.reason}</p></div>;
        })}
      </div>
      <button type="button" className="parking-gauntlet-java-toggle" onClick={onToggleJava}><Icon name="code" size={14} /> {showJava ? "Hide generated Java" : "Reveal the Java your model created"}</button>
      {showJava ? <pre aria-label="Generated Parking Lot Java model"><code>{java}</code></pre> : null}
    </div>
  );
}
