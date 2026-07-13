import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { SDStage } from "@/types";
import { getNode } from "@/content/nodes";
import { color, font, radius, motion } from "@/theme/tokens";
import { Panel, Button, MetricBar, Eyebrow, SectionHeader, PromptBanner } from "./ui";
import { Icon } from "./Icon";

/**
 * <StageBuilder /> — walk a system through stages; each fades in the nodes it
 * adds, states problem → fix → tradeoff, and animates metric bars. Two
 * interactions:
 *  - the node explorer (click any visible node), decoupled from progression;
 *  - the load simulator (turn up traffic and watch the current architecture
 *    saturate, then advance a stage and watch it absorb the same load).
 */

const KIND_TINT: Record<string, string> = {
  client: color.textDim,
  edge: color.blue,
  compute: color.teal,
  data: color.amber,
  async: color.violet,
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
}

export function StageBuilder({
  stages,
  prompt,
  onComplete,
  labels = { problem: "Problem", fix: "Fix", tradeoff: "Tradeoff" },
}: {
  stages: SDStage[];
  prompt?: string;
  onComplete?: () => void;
  labels?: { problem: string; fix: string; tradeoff: string };
}) {
  const [s, setS] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadT, setLoadT] = useState(0.42); // slider position 0..1 (log-mapped)

  const stage = stages[s];
  const last = stages.length - 1;
  const maxCapacity = useMemo(() => Math.max(...stages.map((x) => x.metrics.capacity)), [stages]);
  const maxLatency = useMemo(() => Math.max(...stages.map((x) => x.metrics.latencyMs)), [stages]);
  const prevNodes = s > 0 ? stages[s - 1].visibleNodes : [];

  // Load simulation — log-mapped slider so it spans 100 → ~1.6× the biggest stage.
  const minLoad = 100;
  const maxLoad = Math.round(maxCapacity * 1.6);
  const load = Math.round(minLoad * Math.pow(maxLoad / minLoad, loadT));
  const cap = stage.metrics.capacity;
  const u = load / cap;
  const servedRatio = Math.min(1, u);
  const effLatency = Math.round(stage.metrics.latencyMs * (1 + Math.pow(servedRatio, 4) * 9));
  const dropped = Math.max(0, load - cap);
  const dropPct = load > 0 ? dropped / load : 0;
  const saturated = u >= 1;
  const strained = u >= 0.75 && u < 1;
  const health = saturated ? color.red : strained ? color.amber : color.green;

  const goto = (next: number) => {
    const clamped = Math.max(0, Math.min(last, next));
    setS(clamped);
    setSelected(null);
    if (clamped === last) onComplete?.();
  };

  const selectedNode = selected ? getNode(selected) : null;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {prompt && <PromptBanner prompt={prompt} tone={color.blue} />}
      <SectionHeader eyebrow={`Stage ${s + 1} / ${stages.length} · ${stage.title}`} tone={color.blue} meta="click a node to inspect it" />

      <Panel style={{ display: "grid", gap: 20, borderColor: saturated ? color.red : color.panelBorder, transition: `border-color ${motion.step}` }}>
        {/* Diagram */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center", padding: "6px 2px", minHeight: 64 }}>
          {stage.visibleNodes.map((id, idx) => {
            const node = getNode(id);
            const isNew = !prevNodes.includes(id);
            const isSel = selected === id;
            const tint = KIND_TINT[node.kind] ?? color.teal;
            return (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                {idx > 0 && <span style={{ color: color.textFaint }}><Icon name="chevronRight" size={15} /></span>}
                <button
                  onClick={() => setSelected(isSel ? null : id)}
                  aria-pressed={isSel}
                  aria-label={`${node.label}. ${node.what}`}
                  style={{
                    fontFamily: font.mono,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: isSel ? color.text : color.textDim,
                    background: isSel ? `${tint}1e` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSel ? tint : color.panelBorder}`,
                    borderRadius: radius.md,
                    padding: "9px 13px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: `all ${motion.fast}`,
                    animation: isNew ? `pc-enter 300ms ${motion.enter}` : undefined,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: tint, flexShrink: 0 }} />
                  {node.label}
                </button>
              </div>
            );
          })}
        </div>

        {/* Node explorer card */}
        {selectedNode && (
          <div style={{ background: "rgba(106,166,219,0.07)", border: `1px solid ${color.blue}55`, borderRadius: radius.md, padding: "13px 15px", animation: `pc-enter 200ms ${motion.enter}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 13, color: color.blue }}>{selectedNode.label}</span>
              <button onClick={() => setSelected(null)} aria-label="Close" style={{ background: "none", border: "none", color: color.textDim, display: "grid", placeItems: "center" }}>
                <Icon name="close" size={15} />
              </button>
            </div>
            <p style={{ margin: 0, color: color.text }}>{selectedNode.what}</p>
          </div>
        )}

        {/* Problem → Fix → Tradeoff (labels overridable for the primer) */}
        <div style={{ display: "grid", gap: 13 }}>
          <NarrativeRow eyebrow={labels.problem} tone={color.red}>{stage.problem}</NarrativeRow>
          <NarrativeRow eyebrow={labels.fix} tone={color.teal}>{stage.fix}</NarrativeRow>
          <NarrativeRow eyebrow={labels.tradeoff} tone={color.amber}>{stage.tradeoff}</NarrativeRow>
        </div>

        {/* Capacity of the design at this stage */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, borderTop: `1px solid ${color.hairline}`, paddingTop: 18 }}>
          <MetricBar label="Design capacity req/s" value={fmt(cap)} ratio={cap / maxCapacity} tone={color.green} />
          <MetricBar label="Base p50 latency ms" value={`${stage.metrics.latencyMs}`} ratio={1 - stage.metrics.latencyMs / (maxLatency * 1.1)} tone={color.teal} />
        </div>

        {/* Load simulator */}
        <div style={{ display: "grid", gap: 14, borderTop: `1px solid ${color.hairline}`, paddingTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <Eyebrow tone={color.blue}>Load simulator · push traffic through this design</Eyebrow>
            <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textDim }}>
              incoming <b style={{ color: color.text }}>{fmt(load)}</b> req/s
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={loadT}
            onChange={(e) => setLoadT(parseFloat(e.target.value))}
            aria-label="Incoming request load"
            style={{ width: "100%", accentColor: health }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
            <SimStat label="Utilization" value={`${Math.round(u * 100)}%`} tone={health} sub={`${fmt(Math.min(load, cap))} / ${fmt(cap)} served`} />
            <SimStat label="Effective latency" value={saturated ? "timeout" : `${effLatency} ms`} tone={saturated ? color.red : effLatency > stage.metrics.latencyMs * 3 ? color.amber : color.text} sub={saturated ? "queues overflow" : `base ${stage.metrics.latencyMs} ms`} />
            <SimStat label="Requests dropped" value={dropped > 0 ? `${Math.round(dropPct * 100)}%` : "0%"} tone={dropped > 0 ? color.red : color.text} sub={dropped > 0 ? `${fmt(dropped)} req/s shed` : "all served"} />
          </div>

          <div
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: `${health}14`,
              border: `1px solid ${health}55`,
              borderRadius: radius.md,
              padding: "11px 14px",
            }}
          >
            <span style={{ color: health }}><Icon name={saturated ? "close" : strained ? "gauge" : "check"} size={16} /></span>
            <span style={{ color: color.text, fontSize: 13.5 }}>
              {saturated
                ? s < last
                  ? `Saturated — this design tops out at ${fmt(cap)} req/s and is shedding ${Math.round(dropPct * 100)}% of traffic. Advance a stage to add capacity.`
                  : `Saturated even at this final stage — beyond ${fmt(cap)} req/s you'd shard or add regions further.`
                : strained
                  ? "Under strain — latency is climbing as the busiest tier approaches its limit."
                  : "Healthy — comfortable headroom at this load."}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button variant="ghost" icon="arrowLeft" onClick={() => goto(s - 1)} disabled={s === 0}>Prev</Button>
          <Button variant="primary" accent={color.blue} iconRight="arrowRight" onClick={() => goto(s + 1)} disabled={s === last}>Next stage</Button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {stages.map((_, idx) => (
              <button key={idx} aria-label={`Go to stage ${idx + 1}`} onClick={() => goto(idx)} style={{ width: 8, height: 8, borderRadius: 999, border: "none", padding: 0, background: idx <= s ? color.blue : "rgba(255,255,255,0.13)", transition: `background ${motion.fast}` }} />
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function SimStat({ label, value, tone, sub }: { label: string; value: string; tone: string; sub: string }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", color: color.textFaint }}>{label}</span>
      <span style={{ fontFamily: font.mono, fontSize: 20, fontWeight: 700, color: tone, transition: `color ${motion.step}` }}>{value}</span>
      <span style={{ fontSize: 11.5, color: color.textFaint }}>{sub}</span>
    </div>
  );
}

function NarrativeRow({ eyebrow, tone, children }: { eyebrow: string; tone: string; children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: 14, alignItems: "start" }}>
      <div style={{ paddingTop: 2 }}><Eyebrow tone={tone}>{eyebrow}</Eyebrow></div>
      <p style={{ margin: 0, color: color.text, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}
