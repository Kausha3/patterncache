import { useMemo, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { Link } from "react-router-dom";
import {
  URL_ARCHITECT_INCIDENTS,
  URL_ARCHITECT_PARTS,
  addUrlArchitectPart,
  advanceUrlArchitectIncident,
  assessUrlArchitectDefense,
  connectUrlArchitectParts,
  createUrlArchitectState,
  isUrlArchitectVerified,
  moveUrlArchitectPart,
  removeUrlArchitectEdge,
  removeUrlArchitectPart,
  runUrlArchitectIncident,
  type UrlArchitectPartId,
  type UrlArchitectRule,
  type UrlArchitectSimulation,
  type UrlArchitectState,
} from "@/arena/urlShortenerArchitectEngine";
import { getHldVerificationWorld } from "@/arena/hldVerificationWorlds";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { loadHldVerificationProgress, recordHldWorldScore } from "@/game/hldVerificationProgress";
import { loadUrlArchitectDraft, resetUrlArchitectDraft, saveUrlArchitectDraft } from "@/game/urlShortenerArchitectProgress";
import { color } from "@/theme/tokens";
import "@/theme/url-shortener-architect.css";

const world = getHldVerificationWorld("url-shortener")!;
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;
const NODE_WIDTH = 162;
const NODE_HEIGHT = 102;

const SUGGESTED_POSITIONS: Record<UrlArchitectPartId, { x: number; y: number }> = {
  browser: { x: 34, y: 258 },
  edge: { x: 220, y: 258 },
  redirect: { x: 405, y: 135 },
  creator: { x: 405, y: 382 },
  cache: { x: 590, y: 90 },
  "id-allocator": { x: 590, y: 470 },
  "link-store": { x: 780, y: 260 },
  queue: { x: 590, y: 325 },
  analytics: { x: 780, y: 430 },
  replicas: { x: 780, y: 75 },
  monitor: { x: 590, y: 10 },
};

export function UrlShortenerArchitectPage({ embedded = false, onVerified, onInvalidated }: { embedded?: boolean; onVerified?: () => void; onInvalidated?: () => void } = {}) {
  const initial = useMemo(() => ({ draft: loadUrlArchitectDraft(), record: loadHldVerificationProgress().records[world.id] }), []);
  const [game, setGame] = useState<UrlArchitectState>(initial.draft);
  const [record, setRecord] = useState(initial.record);
  const [simulation, setSimulation] = useState<UrlArchitectSimulation>();
  const [lastFailure, setLastFailure] = useState<string>();
  const [connectingFrom, setConnectingFrom] = useState<UrlArchitectPartId>();
  const [showCoachHint, setShowCoachHint] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [pinnedPartIds, setPinnedPartIds] = useState<UrlArchitectPartId[]>([]);
  const [defense, setDefense] = useState("");
  const [defenseSubmitted, setDefenseSubmitted] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const incident = URL_ARCHITECT_INCIDENTS[game.currentIncidentIndex];
  const observed = game.observedIncidentIds.includes(incident.id);
  const cleared = game.clearedIncidentIds.includes(incident.id);
  const verified = isUrlArchitectVerified(game);
  const grade = useMemo(() => assessUrlArchitectDefense(game, pinnedPartIds, defense), [defense, game, pinnedPartIds]);
  const failedRule = simulation?.ruleResults.find((result) => !result.passed);
  const availableParts = URL_ARCHITECT_PARTS.filter((part) => part.id !== "browser" && part.unlockAtIncident <= game.currentIncidentIndex);
  const unplacedParts = availableParts.filter((part) => !game.nodes[part.id]);
  const style = { "--architect-accent": world.accent } as CSSProperties;

  const updateGraph = (next: UrlArchitectState) => {
    if (next === game) return;
    if (isUrlArchitectVerified(game) && !isUrlArchitectVerified(next)) onInvalidated?.();
    setGame(next);
    saveUrlArchitectDraft(next);
    setSimulation(undefined);
    setShowCoachHint(false);
    setDefenseSubmitted(false);
  };

  const run = () => {
    const result = runUrlArchitectIncident(game);
    setGame(result.state);
    saveUrlArchitectDraft(result.state);
    setSimulation(result.simulation);
    setLastFailure(result.simulation.passed ? undefined : result.simulation.message);
    setShowCoachHint(false);
    setDefenseSubmitted(false);
  };

  const placePart = (partId: UrlArchitectPartId, x = SUGGESTED_POSITIONS[partId].x, y = SUGGESTED_POSITIONS[partId].y) => {
    updateGraph(addUrlArchitectPart(game, partId, x, y));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const payload = event.dataTransfer.getData("text/plain");
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX - NODE_WIDTH / 2;
    const y = (event.clientY - rect.top) * scaleY - NODE_HEIGHT / 2;
    if (payload.startsWith("part:")) placePart(payload.slice(5) as UrlArchitectPartId, x, y);
    if (payload.startsWith("node:")) updateGraph(moveUrlArchitectPart(game, payload.slice(5) as UrlArchitectPartId, x, y));
  };

  const connect = (to: UrlArchitectPartId) => {
    if (!connectingFrom) {
      setConnectingFrom(to);
      return;
    }
    if (connectingFrom === to) {
      setConnectingFrom(undefined);
      return;
    }
    updateGraph(connectUrlArchitectParts(game, connectingFrom, to));
    setConnectingFrom(undefined);
  };

  const advance = () => {
    const next = advanceUrlArchitectIncident(game);
    if (next === game) return;
    setGame(next);
    saveUrlArchitectDraft(next);
    setSimulation(undefined);
    setLastFailure(undefined);
    setConnectingFrom(undefined);
    setShowCoachHint(false);
  };

  const reset = () => {
    resetUrlArchitectDraft();
    onInvalidated?.();
    setGame(createUrlArchitectState());
    setSimulation(undefined);
    setLastFailure(undefined);
    setConnectingFrom(undefined);
    setShowCoachHint(false);
    setPinnedPartIds([]);
    setDefense("");
    setDefenseSubmitted(false);
  };

  const togglePin = (partId: UrlArchitectPartId) => {
    setPinnedPartIds((current) => current.includes(partId) ? current.filter((id) => id !== partId) : current.length >= 3 ? current : [...current, partId]);
    setDefenseSubmitted(false);
  };

  const submitDefense = () => {
    setDefenseSubmitted(true);
    if (!grade.ready) return;
    setRecord(recordHldWorldScore(world, game.runs, grade.score));
    onVerified?.();
  };

  const nextAction = !observed
    ? "Run the incident against whatever you have built. Failure is the first clue."
    : cleared
      ? game.currentIncidentIndex < URL_ARCHITECT_INCIDENTS.length - 1
        ? "Read the architecture reveal, then unlock the next incident."
        : "Pin evidence from your graph and defend it like an interview."
      : simulation
        ? "Repair the first failed request step on your canvas, then rerun."
        : "Your graph changed. Rerun the exact same traffic to prove it.";

  return (
    <div className="url-architect" style={style}>
      {!embedded ? <header className="url-architect-hero">
        <div className="url-architect-breadcrumb">
          <Link to="/arena/hld-worlds"><Icon name="arrowLeft" size={14} /> System Design Worlds</Link>
          <span>{record ? `Previously verified · ${record.bestScore}/100` : "Beginner world · build from a blank canvas"}</span>
        </div>
        <Eyebrow tone={world.accent}>URL Shortener · architecture game</Eyebrow>
        <h1>Build the Link City yourself.</h1>
        <p>You are not placing labeled answers into hidden correct boxes. Drag parts onto a blank system, connect the actual request paths, and let live incidents prove or reject your design.</p>
        <div className="url-architect-loop" aria-label="Learning loop">
          {[["1", "Build"], ["2", "Run traffic"], ["3", "Watch it break"], ["4", "Repair"], ["5", "Explain"]].map(([number, label], index) => (
            <div key={number} className={index < game.currentIncidentIndex + (observed ? 1 : 0) ? "reached" : ""}><b>{number}</b><span>{label}</span></div>
          ))}
        </div>
      </header> : null}

      <div className="url-architect-next" aria-live="polite"><Icon name="target" size={18} /><span><small>Do this now</small><strong>{nextAction}</strong></span></div>

      <section className="url-architect-incident-grid">
        <Panel className="url-architect-incident-card">
          <Eyebrow tone={color.amber}>Incident {game.currentIncidentIndex + 1} of {URL_ARCHITECT_INCIDENTS.length}</Eyebrow>
          <h2>{incident.title}</h2>
          <p>{incident.story}</p>
          <div className="url-architect-goal"><Icon name="target" size={18} /><span><small>Win condition</small><strong>{incident.goal}</strong></span></div>
          <Button data-testid="url-architect-run" accent={world.accent} icon="play" onClick={run}>{observed ? "Rerun the same traffic" : incident.dispatchLabel}</Button>
          <small className="url-architect-safe-copy">Wrong designs are safe. The simulator reveals one broken relationship at a time.</small>
        </Panel>

        <Panel className={`url-architect-run-card ${simulation ? (simulation.passed ? "pass" : "fail") : "idle"}`}>
          <div className="url-architect-run-head"><Eyebrow tone={simulation?.passed ? color.green : simulation ? color.red : color.textFaint}>Live request</Eyebrow><strong>{simulation?.passed ? "SURVIVED" : simulation ? "BROKE" : "NOT RUN"}</strong></div>
          {simulation ? (
            <>
              <div className="url-architect-metrics">
                <div><small>p95 latency</small><strong>{simulation.metrics.latency}</strong></div>
                <div><small>availability</small><strong>{simulation.metrics.availability}</strong></div>
                <div><small>system pressure</small><strong>{simulation.metrics.pressure}</strong></div>
              </div>
              <div className="url-architect-trace">
                {simulation.trace.map((step, index) => <div key={step.label} className={step.status}><b>{step.status === "pass" ? "✓" : step.status === "fail" ? "!" : index + 1}</b><span>{step.label}</span></div>)}
              </div>
              <div className="url-architect-verdict"><Icon name={simulation.passed ? "check" : "gauge"} size={18} /><span><strong>{simulation.passed ? "The graph survived" : "The graph exposed a break"}</strong><small>{simulation.message}</small></span></div>
            </>
          ) : (
            <div className="url-architect-run-empty"><Icon name="play" size={24} /><strong>No preview of the answer</strong><p>Run your current graph. The request will travel only through connections you actually built.</p></div>
          )}
        </Panel>
      </section>

      <section className="url-architect-workshop">
        <header>
          <div><Eyebrow tone={world.accent}>Architecture workshop</Eyebrow><h2>Build the running system</h2><p>Drag a part onto the board or use Place. Then start a cable on one component and finish it on another. Direction matters.</p></div>
          <button type="button" className="url-architect-terms" onClick={() => setShowTerms((value) => !value)}>{showTerms ? "Use plain-language names" : "Show architecture terms"}</button>
        </header>

        <div className="url-architect-palette" aria-label="Available architecture parts">
          <div className="url-architect-palette-label"><Icon name="layers" size={17} /><span><strong>Parts unlocked by the requirements</strong><small>These are tools, not answers. Your graph decides what they do.</small></span></div>
          {unplacedParts.length ? unplacedParts.map((part) => (
            <article key={part.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", `part:${part.id}`)}>
              <span className={`part-kind ${part.category}`}>{part.category}</span>
              <strong>{showTerms ? part.technicalName : part.beginnerName}</strong>
              <small>{part.description}</small>
              <button type="button" onClick={() => placePart(part.id)}><Icon name="plus" size={13} /> Place</button>
            </article>
          )) : <p className="url-architect-palette-empty">Every unlocked part is on the board. You can remove and replace anything safely.</p>}
        </div>

        {connectingFrom ? (
          <div className="url-architect-cable-mode"><Icon name="layers" size={16} /><span><small>Cable started at</small><strong>{partLabel(connectingFrom, showTerms)}</strong></span><p>Choose Connect here on the component that should receive the request or data.</p><button type="button" onClick={() => setConnectingFrom(undefined)}>Cancel cable</button></div>
        ) : null}

        <div className="url-architect-canvas-scroll">
          <div
            ref={canvasRef}
            className="url-architect-canvas"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            data-testid="url-architect-canvas"
          >
            <svg className="url-architect-wires" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} aria-hidden>
              <defs><marker id="architect-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker></defs>
              {game.edges.map((edge) => {
                const from = game.nodes[edge.from]!;
                const to = game.nodes[edge.to]!;
                const x1 = from.x + NODE_WIDTH;
                const y1 = from.y + NODE_HEIGHT / 2;
                const x2 = to.x;
                const y2 = to.y + NODE_HEIGHT / 2;
                const bend = Math.max(44, Math.abs(x2 - x1) * 0.48);
                return <path key={edge.id} className={simulation?.activePartIds.includes(edge.from) && simulation.activePartIds.includes(edge.to) ? "active" : ""} d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`} markerEnd="url(#architect-arrow)" />;
              })}
            </svg>
            {Object.values(game.nodes).filter(Boolean).map((node) => {
              const part = URL_ARCHITECT_PARTS.find((candidate) => candidate.id === node!.partId)!;
              const active = simulation?.activePartIds.includes(part.id);
              const pinned = pinnedPartIds.includes(part.id);
              return (
                <article
                  key={part.id}
                  className={`url-architect-node ${part.category} ${active ? "active" : ""} ${pinned ? "pinned" : ""}`}
                  style={{ left: node!.x, top: node!.y, width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
                  draggable={part.id !== "browser"}
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", `node:${part.id}`)}
                >
                  <span className="url-architect-node-kind">{part.category}</span>
                  <strong>{showTerms ? part.technicalName : part.beginnerName}</strong>
                  <small>{showTerms ? part.beginnerName : part.technicalName}</small>
                  <div>
                    <button type="button" className={connectingFrom ? "receiving" : ""} onClick={() => connect(part.id)}>{connectingFrom === part.id ? "Cancel" : connectingFrom ? "Connect here" : "Start cable"}</button>
                    {verified && part.id !== "browser" ? <button type="button" onClick={() => togglePin(part.id)}>{pinned ? "Pinned" : "Pin"}</button> : null}
                    {part.id !== "browser" ? <button type="button" aria-label={`Remove ${part.beginnerName}`} onClick={() => updateGraph(removeUrlArchitectPart(game, part.id))}><Icon name="close" size={12} /></button> : null}
                  </div>
                </article>
              );
            })}
            {Object.keys(game.nodes).length === 1 ? <div className="url-architect-canvas-empty"><Icon name="layers" size={28} /><strong>Your system starts here</strong><p>Drag the front door onto the board, then connect the Visitor to it.</p></div> : null}
          </div>
        </div>

        <ConnectionLedger game={game} showTerms={showTerms} onRemove={(id) => updateGraph(removeUrlArchitectEdge(game, id))} />

        {observed && !cleared ? (
          <div className="url-architect-repair">
            <Icon name="gauge" size={20} />
            <span><small>First broken relationship</small><strong>{simulation?.message ?? lastFailure ?? "Your graph changed. Rerun to test the repair."}</strong></span>
            {failedRule ? <button type="button" onClick={() => setShowCoachHint((value) => !value)}>{showCoachHint ? "Hide concrete hint" : "I need a concrete hint"}</button> : null}
            {showCoachHint && failedRule ? <p>{coachHint(incident.rules.find((rule) => rule.id === failedRule.id)!, showTerms)}</p> : null}
          </div>
        ) : null}

        {cleared ? (
          <div className="url-architect-discovery">
            <div><Icon name="insight" size={22} /><span><small>Architecture unlocked after proof</small><h3>{incident.discoveryTitle}</h3><p>{incident.discovery}</p></span></div>
            {game.currentIncidentIndex < URL_ARCHITECT_INCIDENTS.length - 1 ? <Button data-testid="url-architect-next" accent={world.accent} iconRight="arrowRight" onClick={advance}>Unlock incident {game.currentIncidentIndex + 2}</Button> : null}
          </div>
        ) : null}
      </section>

      {verified ? (
        <section className="url-architect-defense">
          <Eyebrow tone={color.amber}>{record ? "Previous score saved" : "Interview transfer room"}</Eyebrow>
          <h2>Defend the graph you actually built</h2>
          <p>A product manager asks for links that expire after one hour. Pin two or three components on your canvas, then explain which boundary changes, which stays stable, what incident proves your choice, and one tradeoff you rejected.</p>
          <div className="url-architect-evidence"><span><strong>{pinnedPartIds.length}/3 components pinned</strong><small>Use the Pin action on your own canvas nodes. This evidence comes from your design, not a supplied answer.</small></span>{pinnedPartIds.map((id) => <b key={id}>{partLabel(id, true)}</b>)}</div>
          <textarea value={defense} onChange={(event) => { setDefense(event.target.value); setDefenseSubmitted(false); }} placeholder="Example structure: The celebrity surge proved... I kept Cache separate from Primary Link Store because... I rejected... For one-hour expiry, I would change..." />
          <div className="url-architect-defense-actions"><span>{defense.trim().length}/220 minimum characters</span><Button icon="microphone" disabled={pinnedPartIds.length < 2 || defense.trim().length < 220} onClick={submitDefense}>Defend this architecture</Button></div>
          {defenseSubmitted ? <div className={`url-architect-grade ${grade.ready ? "pass" : "retry"}`}><strong>{grade.score}/100 · {grade.ready ? "Evidence accepted" : "Keep strengthening the defense"}</strong><p>{grade.missing.length ? `Still missing: ${grade.missing.join("; ")}.` : "Your explanation names your own boundaries and connects them to observed traffic, tradeoff, and change."}</p></div> : null}
        </section>
      ) : null}

      <footer className="url-architect-footer"><button type="button" onClick={reset}><Icon name="reset" size={14} /> Reset the canvas</button><span>{game.runs} incident run{game.runs === 1 ? "" : "s"} · graph saved on this device</span></footer>
    </div>
  );
}

function ConnectionLedger({ game, showTerms, onRemove }: { game: UrlArchitectState; showTerms: boolean; onRemove: (id: string) => void }) {
  return (
    <div className="url-architect-ledger">
      <span><Icon name="layers" size={16} /><strong>Live connections</strong><small>These cables are the behavior the incident will execute.</small></span>
      <div>{game.edges.length ? game.edges.map((edge) => <button key={edge.id} type="button" onClick={() => onRemove(edge.id)} title="Remove this connection"><span>{partLabel(edge.from, showTerms)} <Icon name="arrowRight" size={12} /> {partLabel(edge.to, showTerms)}</span><Icon name="close" size={12} /></button>) : <small>No connections yet.</small>}</div>
    </div>
  );
}

function partLabel(partId: UrlArchitectPartId, technical: boolean): string {
  const part = URL_ARCHITECT_PARTS.find((candidate) => candidate.id === partId)!;
  return technical ? part.technicalName : part.beginnerName;
}

function coachHint(rule: UrlArchitectRule, technical: boolean): string {
  if (rule.kind === "node") return `Place ${partLabel(rule.partId, technical)} on the board, then decide what should call it.`;
  if (rule.kind === "forbidden-edge") return `Remove the direct cable from ${partLabel(rule.from, technical)} to ${partLabel(rule.to, technical)}. Slow analytics must leave the user path.`;
  return `Create a directed cable from ${partLabel(rule.from, technical)} to ${partLabel(rule.to, technical)}. Read it as: ${partLabel(rule.from, technical)} calls ${partLabel(rule.to, technical)}.`;
}
