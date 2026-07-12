import { useMemo, useState } from "react";
import type { SDStage } from "@/types";
import { getNode } from "@/content/nodes";
import { color, font, radius } from "@/theme/tokens";
import { Eyebrow, Panel, Button, MetricBar } from "./ui";

/**
 * <StageBuilder /> — §4.3. Walk a system through stages; each stage fades in
 * the nodes it adds, states the problem → fix → tradeoff, and animates metric
 * bars. The node explorer is decoupled from stage progression: any visible
 * node is clickable at any stage, so this is exploration, not a slideshow.
 */

const KIND_TINT: Record<string, string> = {
  client: color.textDim,
  edge: color.blue,
  compute: color.teal,
  data: color.amber,
  async: "#9C7BD4",
};

export function StageBuilder({
  stages,
  onComplete,
}: {
  stages: SDStage[];
  onComplete?: () => void;
}) {
  const [s, setS] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const stage = stages[s];
  const last = stages.length - 1;
  const maxCapacity = useMemo(() => Math.max(...stages.map((x) => x.metrics.capacity)), [stages]);
  const maxLatency = useMemo(() => Math.max(...stages.map((x) => x.metrics.latencyMs)), [stages]);
  const prevNodes = s > 0 ? stages[s - 1].visibleNodes : [];

  const goto = (next: number) => {
    const clamped = Math.max(0, Math.min(last, next));
    setS(clamped);
    setSelected(null);
    if (clamped === last) onComplete?.();
  };

  const selectedNode = selected ? getNode(selected) : null;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <Eyebrow tone={color.blue}>
          Stage {s + 1} / {stages.length} — {stage.title}
        </Eyebrow>
        <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textDim }}>click a node to inspect it</span>
      </div>

      <Panel style={{ display: "grid", gap: 18 }}>
        {/* Diagram */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            padding: "8px 4px",
            minHeight: 72,
          }}
        >
          {stage.visibleNodes.map((id, idx) => {
            const node = getNode(id);
            const isNew = !prevNodes.includes(id);
            const isSel = selected === id;
            const tint = KIND_TINT[node.kind] ?? color.teal;
            return (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {idx > 0 && <span aria-hidden style={{ color: color.textFaint }}>→</span>}
                <button
                  onClick={() => setSelected(isSel ? null : id)}
                  aria-pressed={isSel}
                  aria-label={`${node.label}. ${node.what}`}
                  style={{
                    fontFamily: font.mono,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: color.text,
                    background: isSel ? `${tint}22` : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${isSel ? tint : color.panelBorder}`,
                    borderRadius: radius.md,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 200ms ease",
                    animation: isNew ? "pc-node-in 300ms cubic-bezier(0.34,1.56,0.64,1)" : undefined,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: tint, flexShrink: 0 }} />
                  {node.label}
                </button>
              </div>
            );
          })}
        </div>

        {/* Node explorer card — decoupled from stage progression */}
        {selectedNode && (
          <div
            style={{
              background: "rgba(91,155,213,0.08)",
              border: `1px solid ${color.blue}`,
              borderRadius: 10,
              padding: "12px 14px",
              animation: "pc-node-in 220ms ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontFamily: font.mono, fontWeight: 700, color: color.blue }}>{selectedNode.label}</span>
              <button onClick={() => setSelected(null)} aria-label="Close node info" style={{ background: "none", border: "none", color: color.textDim, fontSize: 16 }}>
                ×
              </button>
            </div>
            <p style={{ margin: 0, color: color.text }}>{selectedNode.what}</p>
          </div>
        )}

        {/* Problem → Fix → Tradeoff */}
        <div style={{ display: "grid", gap: 14 }}>
          <NarrativeRow eyebrow="Problem" tone={color.red}>{stage.problem}</NarrativeRow>
          <NarrativeRow eyebrow="Fix" tone={color.teal}>{stage.fix}</NarrativeRow>
          <NarrativeRow eyebrow="Tradeoff" tone={color.amber}>{stage.tradeoff}</NarrativeRow>
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderTop: `1px solid ${color.panelBorder}`, paddingTop: 16 }}>
          <MetricBar
            label="THROUGHPUT (req/s)"
            value={stage.metrics.capacity.toLocaleString()}
            ratio={stage.metrics.capacity / maxCapacity}
            tone={color.green}
          />
          <MetricBar
            label="P50 LATENCY (ms)"
            value={`${stage.metrics.latencyMs}`}
            ratio={1 - stage.metrics.latencyMs / (maxLatency * 1.1)}
            tone={color.teal}
          />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button variant="ghost" onClick={() => goto(s - 1)} disabled={s === 0}>← Prev stage</Button>
          <Button variant="primary" accent={color.blue} onClick={() => goto(s + 1)} disabled={s === last}>
            Next stage →
          </Button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {stages.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to stage ${idx + 1}`}
                onClick={() => goto(idx)}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  border: "none",
                  padding: 0,
                  background: idx <= s ? color.blue : "rgba(255,255,255,0.12)",
                  transition: "background 200ms ease",
                }}
              />
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function NarrativeRow({ eyebrow, tone, children }: { eyebrow: string; tone: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 12, alignItems: "start" }}>
      <div style={{ paddingTop: 2 }}>
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      </div>
      <p style={{ margin: 0, color: color.text, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}
