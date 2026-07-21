import { useRef, useState, type CSSProperties, type DragEvent } from "react";
import {
  URL_ARCHITECT_PARTS,
  addUrlArchitectPart,
  connectUrlArchitectParts,
  moveUrlArchitectPart,
  removeUrlArchitectEdge,
  removeUrlArchitectPart,
  type UrlArchitectPartId,
  type UrlArchitectState,
} from "@/arena/urlShortenerArchitectEngine";
import { Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;
const NODE_WIDTH = 162;
const NODE_HEIGHT = 102;

const POSITIONS: Record<UrlArchitectPartId, { x: number; y: number }> = {
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

export interface ArchitecturePartLabel {
  primary: string;
  secondary: string;
}

export function UrlArchitectureGraphWorkshop({
  state,
  onChange,
  allowedPartIds,
  labels = {},
  activePartIds = [],
  accent,
  eyebrow,
  heading,
  description,
  technicalOnly = false,
  quiet = false,
  testId = "journey-graph",
}: {
  state: UrlArchitectState;
  onChange: (state: UrlArchitectState) => void;
  allowedPartIds: UrlArchitectPartId[];
  labels?: Partial<Record<UrlArchitectPartId, ArchitecturePartLabel>>;
  activePartIds?: UrlArchitectPartId[];
  accent: string;
  eyebrow: string;
  heading: string;
  description: string;
  technicalOnly?: boolean;
  quiet?: boolean;
  testId?: string;
}) {
  const [connectingFrom, setConnectingFrom] = useState<UrlArchitectPartId>();
  const [showTerms, setShowTerms] = useState(technicalOnly);
  const canvasRef = useRef<HTMLDivElement>(null);
  const allowed = new Set(allowedPartIds);
  const parts = URL_ARCHITECT_PARTS.filter((part) => part.id !== "browser" && allowed.has(part.id));
  const unplacedParts = parts.filter((part) => !state.nodes[part.id]);
  const style = { "--architect-accent": accent } as CSSProperties;

  const displayLabel = (partId: UrlArchitectPartId) => {
    const part = URL_ARCHITECT_PARTS.find((candidate) => candidate.id === partId)!;
    const custom = labels[partId];
    return {
      primary: custom?.primary ?? (showTerms ? part.technicalName : part.beginnerName),
      secondary: custom?.secondary ?? (showTerms ? part.beginnerName : part.technicalName),
    };
  };

  const placePart = (partId: UrlArchitectPartId, x = POSITIONS[partId].x, y = POSITIONS[partId].y) => {
    onChange(addUrlArchitectPart(state, partId, x, y));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const payload = event.dataTransfer.getData("text/plain");
    const x = (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width) - NODE_WIDTH / 2;
    const y = (event.clientY - rect.top) * (CANVAS_HEIGHT / rect.height) - NODE_HEIGHT / 2;
    if (payload.startsWith("part:")) placePart(payload.slice(5) as UrlArchitectPartId, x, y);
    if (payload.startsWith("node:")) onChange(moveUrlArchitectPart(state, payload.slice(5) as UrlArchitectPartId, x, y));
  };

  const connect = (partId: UrlArchitectPartId) => {
    if (!connectingFrom) {
      setConnectingFrom(partId);
      return;
    }
    if (connectingFrom !== partId) onChange(connectUrlArchitectParts(state, connectingFrom, partId));
    setConnectingFrom(undefined);
  };

  return (
    <section className={`url-architect-workshop url-journey-graph-workshop ${quiet ? "quiet" : ""}`} style={style}>
      <header>
        <div>
          <Eyebrow tone={accent}>{eyebrow}</Eyebrow>
          <h2>{heading}</h2>
          <p>{description}</p>
        </div>
        {!technicalOnly ? (
          <button type="button" className="url-architect-terms" onClick={() => setShowTerms((value) => !value)}>
            {showTerms ? "Use plain-language names" : "Show architecture terms"}
          </button>
        ) : null}
      </header>

      <div className="url-architect-palette" aria-label="Available architecture parts">
        <div className="url-architect-palette-label">
          <Icon name="layers" size={17} />
          <span><strong>{quiet ? "Architecture components" : "Parts available in this world"}</strong><small>{quiet ? "No correctness feedback appears until you finish." : "Components are tools. Connections create behavior."}</small></span>
        </div>
        {unplacedParts.length ? unplacedParts.map((part) => {
          const label = displayLabel(part.id);
          return (
            <article key={part.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", `part:${part.id}`)}>
              <span className={`part-kind ${part.category}`}>{part.category}</span>
              <strong>{label.primary}</strong>
              <small>{quiet ? label.secondary : part.description}</small>
              <button type="button" data-testid={`${testId}-place-${part.id}`} onClick={() => placePart(part.id)}><Icon name="plus" size={13} /> Place</button>
            </article>
          );
        }) : <p className="url-architect-palette-empty">Every available component is on the board.</p>}
      </div>

      {connectingFrom ? (
        <div className="url-architect-cable-mode">
          <Icon name="layers" size={16} />
          <span><small>Cable started at</small><strong>{displayLabel(connectingFrom).primary}</strong></span>
          <p>Choose Connect here on the component that should receive the request or data.</p>
          <button type="button" onClick={() => setConnectingFrom(undefined)}>Cancel cable</button>
        </div>
      ) : null}

      <div className="url-architect-canvas-scroll">
        <div
          ref={canvasRef}
          className="url-architect-canvas"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          data-testid={testId}
        >
          <svg className="url-architect-wires" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} aria-hidden>
            <defs><marker id={`${testId}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker></defs>
            {state.edges.map((edge) => {
              const from = state.nodes[edge.from];
              const to = state.nodes[edge.to];
              if (!from || !to) return null;
              const x1 = from.x + NODE_WIDTH;
              const y1 = from.y + NODE_HEIGHT / 2;
              const x2 = to.x;
              const y2 = to.y + NODE_HEIGHT / 2;
              const bend = Math.max(44, Math.abs(x2 - x1) * 0.48);
              const active = activePartIds.includes(edge.from) && activePartIds.includes(edge.to);
              return <path key={edge.id} className={active ? "active" : ""} d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`} markerEnd={`url(#${testId}-arrow)`} />;
            })}
          </svg>

          {Object.values(state.nodes).filter(Boolean).filter((node) => allowed.has(node!.partId)).map((node) => {
            const part = URL_ARCHITECT_PARTS.find((candidate) => candidate.id === node!.partId)!;
            const label = displayLabel(part.id);
            return (
              <article
                key={part.id}
                className={`url-architect-node ${part.category} ${activePartIds.includes(part.id) ? "active" : ""}`}
                style={{ left: node!.x, top: node!.y, width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
                draggable={part.id !== "browser"}
                onDragStart={(event) => event.dataTransfer.setData("text/plain", `node:${part.id}`)}
              >
                <span className="url-architect-node-kind">{part.category}</span>
                <strong>{label.primary}</strong>
                <small>{label.secondary}</small>
                <div>
                  <button type="button" data-testid={`${testId}-connect-${part.id}`} className={connectingFrom ? "receiving" : ""} onClick={() => connect(part.id)}>{connectingFrom === part.id ? "Cancel" : connectingFrom ? "Connect here" : "Start cable"}</button>
                  {part.id !== "browser" ? <button type="button" aria-label={`Remove ${label.primary}`} onClick={() => onChange(removeUrlArchitectPart(state, part.id))}><Icon name="close" size={12} /></button> : null}
                </div>
              </article>
            );
          })}

          {Object.keys(state.nodes).length === 1 ? (
            <div className="url-architect-canvas-empty"><Icon name="layers" size={28} /><strong>Your system starts with one request</strong><p>Place components anywhere. Then connect them in the direction the request or data travels.</p></div>
          ) : null}
        </div>
      </div>

      <div className="url-architect-ledger">
        <span><Icon name="layers" size={16} /><strong>Live connections</strong><small>Click any cable label below to remove it.</small></span>
        <div>{state.edges.length ? state.edges.map((edge) => (
          <button key={edge.id} type="button" onClick={() => onChange(removeUrlArchitectEdge(state, edge.id))} title="Remove this connection">
            <span>{displayLabel(edge.from).primary} <Icon name="arrowRight" size={12} /> {displayLabel(edge.to).primary}</span><Icon name="close" size={12} />
          </button>
        )) : <small>No connections yet.</small>}</div>
      </div>
    </section>
  );
}
