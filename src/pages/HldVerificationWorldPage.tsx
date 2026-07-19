import { useMemo, useState, type CSSProperties } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  advanceHldIncident,
  assessHldDefense,
  createHldVerificationState,
  hldWorldHealth,
  installHldModule,
  isHldWorldVerified,
  runCurrentHldIncident,
  type HldRunSimulation,
  type HldVerificationState,
} from "@/arena/hldVerificationEngine";
import { getHldVerificationWorld, type HldVerificationWorld } from "@/arena/hldVerificationWorlds";
import {
  loadHldWorldProgress,
  recordHldWorldCompletion,
  resetHldWorldDraft,
  saveHldWorldDraft,
} from "@/game/hldVerificationProgress";
import { Button, Eyebrow, MetricBar, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { color } from "@/theme/tokens";
import "@/theme/hld-world.css";

export function HldVerificationWorldPage() {
  const { worldId } = useParams();
  const world = getHldVerificationWorld(worldId);
  return world ? <PlayableHldWorld key={world.id} world={world} /> : <Navigate to="/arena/hld-worlds" replace />;
}

function PlayableHldWorld({ world }: { world: HldVerificationWorld }) {
  const initial = useMemo(() => loadHldWorldProgress(world), [world]);
  const [game, setGame] = useState<HldVerificationState>(initial.draft);
  const [record, setRecord] = useState(initial.record);
  const [simulation, setSimulation] = useState<HldRunSimulation>();
  const [selectedModuleId, setSelectedModuleId] = useState<string>();
  const [showTechnical, setShowTechnical] = useState(false);
  const [defense, setDefense] = useState("");
  const [defenseSubmitted, setDefenseSubmitted] = useState(false);

  const incident = world.incidents[game.currentIncidentIndex];
  const observed = game.observedIncidentIds.includes(incident.id);
  const cleared = game.clearedIncidentIds.includes(incident.id);
  const verified = isHldWorldVerified(world, game);
  const modules = world.modules.filter((module) => incident.requiredModuleIds.includes(module.id));
  const selected = world.modules.find((module) => module.id === selectedModuleId);
  const health = hldWorldHealth(world, game.placements);
  const grade = useMemo(() => assessHldDefense(world, defense), [defense, world]);
  const style = { "--hld-accent": world.accent } as CSSProperties;

  const update = (next: HldVerificationState) => {
    setGame(next);
    saveHldWorldDraft(world, next);
  };

  const run = () => {
    const result = runCurrentHldIncident(world, game);
    update(result.state);
    setSimulation(result.simulation);
    setDefenseSubmitted(false);
    if (!result.simulation.passed) setSelectedModuleId((current) => current ?? result.simulation.misplacedModuleIds[0]);
  };

  const install = (zoneId: string) => {
    if (!selectedModuleId) return;
    const next = installHldModule(world, game, selectedModuleId, zoneId);
    if (next === game) return;
    update(next);
    setSimulation(undefined);
  };

  const advance = () => {
    const next = advanceHldIncident(world, game);
    if (next === game) return;
    update(next);
    setSimulation(undefined);
    setSelectedModuleId(undefined);
    setShowTechnical(false);
  };

  const submitDefense = () => {
    setDefenseSubmitted(true);
    if (!grade.ready || !verified) return;
    setRecord(recordHldWorldCompletion(world, game, grade.score));
  };

  const reset = () => {
    resetHldWorldDraft(world);
    setGame(createHldVerificationState(world));
    setSimulation(undefined);
    setSelectedModuleId(undefined);
    setShowTechnical(false);
    setDefense("");
    setDefenseSubmitted(false);
  };

  return (
    <div className="hld-world" style={style}>
      <header className="hld-world-hero">
        <div className="hld-world-breadcrumb"><Link to="/arena/hld-worlds"><Icon name="arrowLeft" size={14} /> System Design Worlds</Link><span>{record ? `Verified · ${record.bestScore}/100` : `Beginner world · ${world.systemName}`}</span></div>
        <Eyebrow tone={world.accent}>{world.systemName} · incident simulator</Eyebrow>
        <h1>{world.title}</h1>
        <p>{world.intro}</p>
        <div className="hld-world-progress">
          {world.incidents.map((candidate, index) => <div key={candidate.id} className={`${index === game.currentIncidentIndex ? "active" : ""} ${game.clearedIncidentIds.includes(candidate.id) ? "cleared" : ""}`}><b>{game.clearedIncidentIds.includes(candidate.id) ? "✓" : index + 1}</b><span>{candidate.title}</span></div>)}
        </div>
      </header>

      <section className="hld-world-live">
        <Panel style={{ display: "grid", gap: 15 }}>
          <Eyebrow tone={color.amber}>Incident {game.currentIncidentIndex + 1} of {world.incidents.length}</Eyebrow>
          <h2>{incident.title}</h2>
          <p>{incident.story}</p>
          <div className="hld-world-goal"><Icon name="target" size={18} /><span><small>Your goal</small>{incident.goal}</span></div>
          <Button data-testid="hld-run" accent={world.accent} icon="play" onClick={run}>{cleared ? "Run proof again" : observed ? "Rerun this incident" : incident.dispatchLabel}</Button>
          {!observed ? <small>Release the incident first. Repair controls unlock only after the system gives you evidence.</small> : null}
        </Panel>

        <Panel style={{ display: "grid", gap: 15 }}>
          <div className="hld-world-live-head"><span><i /> Live traffic</span><strong>{simulation?.passed ? "STABLE" : simulation ? "SYSTEM LEAK" : "WAITING"}</strong></div>
          <div className="hld-world-metrics">
            <MetricBar label="Availability" value={`${health.availability}%`} ratio={health.availability / 100} tone={health.availability >= 95 ? color.green : color.amber} />
            <MetricBar label="p95 latency" value={`${health.p95Latency} ms`} ratio={Math.max(0.05, 1 - health.p95Latency / 700)} tone={health.p95Latency <= 200 ? color.green : color.red} />
            <MetricBar label="Open failure modes" value={`${health.openFailureModes}`} ratio={health.openFailureModes === 0 ? 1 : 1 / (health.openFailureModes + 1)} tone={health.openFailureModes === 0 ? color.green : color.red} />
          </div>
          <div className="hld-world-trace" aria-live="polite">
            {(simulation?.trace ?? incident.trace.map((label) => ({ label, status: "waiting" as const }))).map((step, index) => <div key={step.label} className={step.status}><b>{step.status === "pass" ? "✓" : step.status === "fail" ? "!" : index + 1}</b><span>{step.label}</span></div>)}
          </div>
          {simulation ? <div className={`hld-world-verdict ${simulation.passed ? "pass" : "fail"}`}><Icon name={simulation.passed ? "check" : "gauge"} size={18} /><span><strong>{simulation.passed ? "Architecture survived" : "The incident found a leak"}</strong><small>{simulation.message}</small></span></div> : null}
        </Panel>
      </section>

      {observed ? (
        <section className="hld-world-workshop">
          <header><div><Eyebrow tone={world.accent}>{cleared ? "Repair proved by rerun" : "Topology workshop unlocked"}</Eyebrow><h2>{cleared ? "Name the architecture you just earned" : "Relocate one capability, then rerun"}</h2><p>{cleared ? incident.discovery : "Pick up a capability. Install it where it can protect the information, traffic, or failure it owns. Wrong moves are safe."}</p></div><div className="hld-world-health"><small>Whole design aligned</small><strong>{health.correct}/{health.total}</strong></div></header>
          <div className="hld-world-modules">
            {modules.map((module) => {
              const zone = world.zones.find((candidate) => candidate.id === game.placements[module.id]);
              const isSelected = selectedModuleId === module.id;
              return <button key={module.id} type="button" className={`${isSelected ? "selected" : ""} ${simulation?.misplacedModuleIds.includes(module.id) ? "misplaced" : ""}`} onClick={() => setSelectedModuleId(module.id)}><span>{module.kind}</span><strong>{showTechnical || cleared ? module.technicalName : module.beginnerName}</strong><small>{module.description}</small><em>Now in: {showTechnical || cleared ? zone?.technicalName : zone?.beginnerName}</em></button>;
            })}
          </div>

          {!cleared ? (
            <div className="hld-world-install">
              <div className="hld-world-hand"><Icon name="layers" size={18} /><span>{selected ? <>Holding <strong>{selected.beginnerName}</strong>. Choose a zone.</> : "Pick up a capability above first."}</span></div>
              <div className="hld-world-zones">
                {world.zones.map((zone) => <button key={zone.id} type="button" disabled={!selected} className={selected && game.placements[selected.id] === zone.id ? "current" : ""} onClick={() => install(zone.id)}><span>{selected && game.placements[selected.id] === zone.id ? "Installed here" : "Install here"}</span><strong>{showTechnical ? zone.technicalName : zone.beginnerName}</strong><small>{zone.description}</small></button>)}
              </div>
              <button className="hld-world-terms" type="button" onClick={() => setShowTechnical((value) => !value)}><Icon name="code" size={14} /> {showTechnical ? "Use plain names" : "Show architecture terms"}</button>
            </div>
          ) : (
            <div className="hld-world-discovery">
              {modules.map((module) => {
                const zone = world.zones.find((candidate) => candidate.id === module.expectedZoneId)!;
                return <div key={module.id}><span>{module.beginnerName}</span><Icon name="arrowRight" size={14} /><strong>{zone.technicalName}: {module.technicalName}</strong><p>{module.reason}</p></div>;
              })}
            </div>
          )}
          {cleared && game.currentIncidentIndex < world.incidents.length - 1 ? <Button data-testid="hld-next" accent={world.accent} iconRight="arrowRight" onClick={advance}>Release incident {game.currentIncidentIndex + 2}</Button> : null}
        </section>
      ) : null}

      {verified ? (
        <section className="hld-world-defense">
          <Eyebrow tone={color.amber}>{record ? "Verified evidence saved" : "Final transfer and interview room"}</Eyebrow>
          <h2>Defend the system under one new change</h2>
          <p>{world.transferPrompt} Use a boundary you built, evidence from an incident, a scale consequence, and one alternative you rejected.</p>
          <textarea value={defense} disabled={!!record} onChange={(event) => { setDefense(event.target.value); setDefenseSubmitted(false); }} placeholder="Explain your concrete components, the incident that justified them, the tradeoff, and what changes next." />
          <div><span>{defense.trim().length} characters · no supplied answer</span><Button icon={record ? "check" : "microphone"} disabled={!!record || defense.trim().length < 140} onClick={submitDefense}>{record ? `${world.systemName} verified` : "Defend this architecture"}</Button></div>
          {defenseSubmitted ? <div className={`hld-world-grade ${grade.ready ? "pass" : "retry"}`}><strong>{grade.score}/100 · {grade.ready ? "Interview-ready evidence" : "Strengthen the explanation"}</strong>{grade.missing.length ? <p>Still missing: {grade.missing.join("; ")}.</p> : <p>Your answer connects concrete boundaries to observed failure, scale, tradeoff, and change.</p>}</div> : null}
        </section>
      ) : null}

      <footer className="hld-world-footer"><button type="button" onClick={reset}><Icon name="reset" size={14} /> Reset this world</button><span>{game.runs} live run{game.runs === 1 ? "" : "s"} · saved on this device</span></footer>
    </div>
  );
}
