import { useMemo, useState, type CSSProperties, type DragEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  advanceHldIncident,
  assessHldDefense,
  createHldVerificationState,
  getHldRepairTask,
  hldIncidentHealth,
  installHldModule,
  isHldWorldVerified,
  runCurrentHldIncident,
  type HldRunSimulation,
  type HldVerificationState,
} from "@/arena/hldVerificationEngine";
import { getHldVerificationWorld, type HldVerificationWorld, type HldZone } from "@/arena/hldVerificationWorlds";
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
  const [showHint, setShowHint] = useState(false);
  const [defense, setDefense] = useState("");
  const [defenseSubmitted, setDefenseSubmitted] = useState(false);

  const incident = world.incidents[game.currentIncidentIndex];
  const observed = game.observedIncidentIds.includes(incident.id);
  const cleared = game.clearedIncidentIds.includes(incident.id);
  const verified = isHldWorldVerified(world, game);
  const repairTask = getHldRepairTask(world, game);
  const repairModule = world.modules.find((module) => module.id === repairTask?.moduleId);
  const currentZone = world.zones.find((zone) => zone.id === repairTask?.currentZoneId);
  const targetZone = world.zones.find((zone) => zone.id === repairTask?.targetZoneId);
  const health = hldIncidentHealth(world, game);
  const metricsAreProjected = observed && !simulation && !cleared;
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
  };

  const install = (zoneId: string) => {
    if (!repairTask) return;
    const next = installHldModule(world, game, repairTask.moduleId, zoneId);
    if (next === game) return;
    update(next);
    setSimulation(undefined);
    setShowHint(false);
  };

  const advance = () => {
    const next = advanceHldIncident(world, game);
    if (next === game) return;
    update(next);
    setSimulation(undefined);
    setShowHint(false);
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
    setShowHint(false);
    setDefense("");
    setDefenseSubmitted(false);
  };

  const nextAction = !observed
    ? `1. ${incident.dispatchLabel}`
    : metricsAreProjected
      ? "3. Send the same traffic through your repair"
    : repairTask
      ? world.learningMode === "guided"
        ? `2. Move ${repairModule?.beginnerName} from ${currentZone?.beginnerName} to the glowing socket at ${targetZone?.beginnerName}`
        : `2. Move ${repairModule?.beginnerName} from the red stage to a better owner`
      : cleared
        ? "Proof complete. Read what the architecture is called."
        : "Run the incident again to produce fresh evidence.";

  return (
    <div className="hld-world" style={style}>
      <header className="hld-world-hero">
        <div className="hld-world-breadcrumb"><Link to="/arena/hld-worlds"><Icon name="arrowLeft" size={14} /> System Design Worlds</Link><span>{record ? `Verified · ${record.bestScore}/100` : modeLabel(world)}</span></div>
        <Eyebrow tone={world.accent}>{world.systemName} · traffic lab</Eyebrow>
        <h1>{world.title}</h1>
        <p>{world.intro}</p>
        <div className="hld-world-progress">
          {world.incidents.map((candidate, index) => <div key={candidate.id} className={`${index === game.currentIncidentIndex ? "active" : ""} ${game.clearedIncidentIds.includes(candidate.id) ? "cleared" : ""}`}><b>{game.clearedIncidentIds.includes(candidate.id) ? "✓" : index + 1}</b><span>{candidate.title}</span></div>)}
        </div>
      </header>

      <div className="hld-next-action" aria-live="polite"><Icon name="target" size={18} /><span><small>Do this now</small><strong>{nextAction}</strong></span></div>

      <section className="hld-world-live">
        <Panel style={{ display: "grid", gap: 15 }}>
          <Eyebrow tone={color.amber}>Incident {game.currentIncidentIndex + 1} of {world.incidents.length}</Eyebrow>
          <h2>{incident.title}</h2>
          <p>{incident.story}</p>
          <div className="hld-world-goal"><Icon name="target" size={18} /><span><small>Win condition</small>{incident.goal}</span></div>
          <Button data-testid="hld-run" accent={world.accent} icon="play" onClick={run}>{cleared ? "Run proof again" : observed ? "Send the same traffic again" : incident.dispatchLabel}</Button>
          {!observed ? <small>{startingHelp(world)}</small> : null}
        </Panel>

        <Panel style={{ display: "grid", gap: 15 }}>
          <div className="hld-world-live-head"><span><i /> Live traffic</span><strong>{cleared ? "STABLE" : simulation ? "SYSTEM LEAK" : observed ? "REPAIR UNTESTED" : "WAITING"}</strong></div>
          <div className="hld-world-metrics">
            <MetricBar label={`${metricsAreProjected ? "Projected " : ""}availability`} value={`${health.availability}%`} ratio={health.availability / 100} tone={health.availability >= 95 ? color.green : color.amber} />
            <MetricBar label={`${metricsAreProjected ? "Projected " : ""}p95 latency`} value={`${health.p95Latency} ms`} ratio={Math.max(0.05, 1 - health.p95Latency / 700)} tone={health.p95Latency <= 200 ? color.green : color.red} />
            <MetricBar label={`${metricsAreProjected ? "Projected " : ""}incident leaks`} value={`${health.openFailureModes}`} ratio={health.openFailureModes === 0 ? 1 : 1 / (health.openFailureModes + 1)} tone={health.openFailureModes === 0 ? color.green : color.red} />
          </div>
          <div className="hld-world-trace" aria-live="polite">
            {(simulation?.trace ?? incident.trace.map((label) => ({ label, status: cleared ? "pass" as const : "waiting" as const }))).map((step, index) => <div key={step.label} className={step.status}><b>{step.status === "pass" ? "✓" : step.status === "fail" ? "!" : index + 1}</b><span>{step.label}</span></div>)}
          </div>
          {simulation ? <div className={`hld-world-verdict ${simulation.passed ? "pass" : "fail"}`}><Icon name={simulation.passed ? "check" : "gauge"} size={18} /><span><strong>{simulation.passed ? "Your repair survived the same traffic" : "The request exposed this leak"}</strong><small>{simulation.message}</small></span></div> : null}
        </Panel>
      </section>

      {observed ? (
        <section className="hld-traffic-lab">
          <header>
            <div><Eyebrow tone={world.accent}>{cleared ? "Cause and effect proved" : modeLabel(world)}</Eyebrow><h2>{cleared ? "Now name what you built" : "Repair the live system"}</h2><p>{cleared ? incident.discovery : metricsAreProjected ? "The tool has moved and the projected metrics changed. Projection is not proof: run the same incident again and compare every request step." : repairTask ? repairCopy(world, repairModule?.beginnerName, currentZone?.beginnerName, targetZone?.beginnerName) : "Run the incident again to produce fresh evidence."}</p></div>
            <div className="hld-world-health"><small>This incident repaired</small><strong>{health.correct}/{health.total}</strong></div>
          </header>

          {!cleared && !metricsAreProjected && repairTask && repairModule ? (
            <div className={`hld-repair-kit ${world.learningMode}`}>
              <span><Icon name="layers" size={18} /><small>Tool unlocked by the failure</small></span>
              <div
                className="hld-active-tool"
                draggable
                onDragStart={(event: DragEvent<HTMLDivElement>) => event.dataTransfer.setData("text/plain", repairModule.id)}
              >
                <strong>{repairModule.beginnerName}</strong>
                <small>{repairModule.description}</small>
                <em>Drag onto the map. Keyboard: select a stage below.</em>
              </div>
              {world.learningMode === "coached" ? <button className="hld-hint-button" type="button" onClick={() => setShowHint((value) => !value)}>{showHint ? "Hide the coach clue" : "I need one coach clue"}</button> : null}
              {showHint ? <p className="hld-coach-clue">Follow the failed trace and ask which stage should protect this behavior. {repairModule.reason}</p> : null}
            </div>
          ) : null}

          <SystemTrafficMap world={world} game={game} observed={observed} cleared={cleared} locked={metricsAreProjected} repairTask={repairTask} onInstall={install} />

          {!cleared && metricsAreProjected ? <div className="hld-rerun-ready"><Icon name="play" size={18} /><span><strong>The repair is installed, but it is not proof yet.</strong><small>Send the exact same incident again and watch every request step.</small></span><Button data-testid="hld-rerun-proof" accent={world.accent} icon="play" onClick={run}>Test my repair</Button></div> : null}

          {cleared ? (
            <div className="hld-world-discovery">
              {incident.requiredModuleIds.map((moduleId) => {
                const module = world.modules.find((candidate) => candidate.id === moduleId)!;
                const zone = world.zones.find((candidate) => candidate.id === module.expectedZoneId)!;
                return <div key={module.id}><span>{module.beginnerName}</span><Icon name="arrowRight" size={14} /><strong>{zone.technicalName}: {module.technicalName}</strong><p>{module.reason}</p></div>;
              })}
            </div>
          ) : null}
          {cleared && game.currentIncidentIndex < world.incidents.length - 1 ? <Button data-testid="hld-next" accent={world.accent} iconRight="arrowRight" onClick={advance}>Change the world: incident {game.currentIncidentIndex + 2}</Button> : null}
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

function SystemTrafficMap({ world, game, observed, cleared, locked, repairTask, onInstall }: {
  world: HldVerificationWorld;
  game: HldVerificationState;
  observed: boolean;
  cleared: boolean;
  locked: boolean;
  repairTask: ReturnType<typeof getHldRepairTask>;
  onInstall: (zoneId: string) => void;
}) {
  const visibleModuleIds = new Set(world.incidents.slice(0, game.currentIncidentIndex + 1).flatMap((incident) => incident.requiredModuleIds));
  const primary = ["door", "workshop", "memory"].map((id) => world.zones.find((zone) => zone.id === id)!).filter(Boolean);
  const support = ["crew", "tower"].map((id) => world.zones.find((zone) => zone.id === id)!).filter(Boolean);
  const renderZone = (zone: HldZone) => {
    const modules = world.modules.filter((module) => visibleModuleIds.has(module.id) && game.placements[module.id] === zone.id);
    const leaking = !!repairTask && repairTask.currentZoneId === zone.id;
    const guidedTarget = !!repairTask && repairTask.mode === "guided" && repairTask.targetZoneId === zone.id;
    const canInstall = !locked && !!repairTask && repairTask.allowedZoneIds.includes(zone.id) && repairTask.currentZoneId !== zone.id;
    return (
      <button
        key={zone.id}
        type="button"
        className={`hld-map-node ${leaking ? "leaking" : ""} ${guidedTarget ? "guided-target" : ""} ${canInstall && repairTask?.mode !== "guided" ? "open-drop" : ""}`}
        disabled={!observed || cleared || !canInstall}
        onClick={() => onInstall(zone.id)}
        onDragOver={(event) => { if (canInstall) event.preventDefault(); }}
        onDrop={(event) => { if (canInstall) { event.preventDefault(); onInstall(zone.id); } }}
        aria-label={canInstall ? `Move active repair tool to ${zone.beginnerName}` : zone.beginnerName}
      >
        <span>{zone.beginnerName}</span>
        <small>{zone.description}</small>
        <div>{modules.map((module) => <strong key={module.id}><Icon name="layers" size={13} /> {module.beginnerName}</strong>)}</div>
        {leaking ? <em><Icon name="gauge" size={13} /> Failure pressure starts here</em> : null}
        {guidedTarget ? <em><Icon name="target" size={13} /> Put the unlocked tool here</em> : null}
        {canInstall && repairTask?.mode !== "guided" ? <em><Icon name="plus" size={13} /> Drop or select this stage</em> : null}
      </button>
    );
  };
  return (
    <div className="hld-system-map" aria-label="Live system map">
      <div className="hld-system-map-label"><span><Icon name="play" size={13} /> Requests enter here</span><small>The map is the system. Moving a tool changes the next run.</small></div>
      <div className="hld-map-primary">
        {primary.map((zone, index) => <div className="hld-map-stage" key={zone.id}>{renderZone(zone)}{index < primary.length - 1 ? <Icon name="arrowRight" size={20} /> : null}</div>)}
      </div>
      <div className="hld-map-support">{support.map(renderZone)}</div>
    </div>
  );
}

function modeLabel(world: HldVerificationWorld): string {
  if (world.learningMode === "guided") return "Guided tutorial · the game shows each first move";
  if (world.learningMode === "coached") return "Coached practice · clues are optional";
  return "Independent interview world · no placement hints";
}

function startingHelp(world: HldVerificationWorld): string {
  if (world.learningMode === "guided") return "No architecture knowledge is expected. First, watch where one real request slows or breaks.";
  if (world.learningMode === "coached") return "First, watch the failed request path. A coach clue is available after the failure if you need it.";
  return "This is the interview round. Read the failed request path, repair the map, and use the rerun as your evidence.";
}

function repairCopy(world: HldVerificationWorld, module?: string, current?: string, target?: string): string {
  if (world.learningMode === "guided") return `This walkthrough makes the first relationship visible. The request showed why ${current} is overloaded. Move ${module} to the glowing socket at ${target}, then rerun the same traffic to see why it works.`;
  if (world.learningMode === "coached") return `The red stage shows where ${module} is creating pressure. Drag the tool through the map, rerun the incident, and use one optional clue if the consequence is still unclear.`;
  return `Use the failed request path to decide where ${module} should live. Move it on the system map, then let the rerun prove or reject your topology.`;
}
