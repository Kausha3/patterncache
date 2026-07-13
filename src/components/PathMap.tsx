import { useNavigate } from "react-router-dom";
import type { Confidence, LessonStatus, Track } from "@/types";
import { PATH, TRACK_META, type PathNode } from "@/content";
import { useProgress } from "@/hooks/useProgress";
import { color, font, radius, trackColor, trackWash, motion } from "@/theme/tokens";
import { Eyebrow } from "./ui";
import { Icon } from "./Icon";

/**
 * <PathMap /> — the guided map. Two vertical spines, one per track, colored by
 * status and confidence. Every node is always clickable ("locked" just means
 * dim). Used on Home and, colored by confidence, on Progress.
 */
export function PathMap({ highlightId }: { highlightId?: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
      {(Object.keys(PATH) as Track[]).map((track) => (
        <Spine key={track} track={track} highlightId={highlightId} />
      ))}
    </div>
  );
}

function Spine({ track, highlightId }: { track: Track; highlightId?: string }) {
  const accent = trackColor[track];
  return (
    <section aria-label={TRACK_META[track].label} style={{ display: "grid", gap: 14, alignContent: "start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: accent }} />
        <Eyebrow tone={accent}>{TRACK_META[track].label}</Eyebrow>
      </div>
      <div style={{ display: "grid", gap: 2 }}>
        {PATH[track].map((node, idx) => (
          <NodeRow key={node.id} node={node} accent={accent} track={track} isFirst={idx === 0} isLast={idx === PATH[track].length - 1} highlight={highlightId === node.id} />
        ))}
      </div>
    </section>
  );
}

function NodeRow({
  node,
  accent,
  track,
  isFirst,
  isLast,
  highlight,
}: {
  node: PathNode;
  accent: string;
  track: Track;
  isFirst: boolean;
  isLast: boolean;
  highlight: boolean;
}) {
  const navigate = useNavigate();
  const { get } = useProgress();
  const p = get(node.id);
  const dim = node.status === "coming-soon" && p.status === "not-started";

  return (
    <button
      onClick={() => navigate(`/lesson/${node.id}`)}
      aria-label={`${node.title}${node.status === "coming-soon" ? " (coming soon)" : ""}, ${p.status}`}
      style={{
        display: "grid",
        gridTemplateColumns: "30px 1fr auto",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        background: highlight ? trackWash[track] : "transparent",
        border: `1px solid ${highlight ? `${accent}66` : "transparent"}`,
        borderRadius: radius.md,
        padding: "11px 12px",
        transition: `background ${motion.fast}, border-color ${motion.fast}`,
      }}
    >
      {/* Spine marker + connectors */}
      <div style={{ position: "relative", display: "grid", placeItems: "center", height: "100%" }}>
        {!isFirst && <span style={{ position: "absolute", top: -13, height: 13, width: 1.5, background: color.hairline }} />}
        {!isLast && <span style={{ position: "absolute", bottom: -13, height: 13, width: 1.5, background: color.hairline }} />}
        <Marker status={p.status} confidence={p.confidence} accent={accent} />
      </div>

      <div style={{ display: "grid", gap: 2 }}>
        <span style={{ fontFamily: font.mono, fontSize: 13.5, fontWeight: 600, color: dim ? color.textDim : color.text }}>{node.title}</span>
        {node.status === "coming-soon" && <span style={{ fontSize: 11, color: color.textFaint }}>coming soon</span>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {highlight && <span style={{ fontFamily: font.mono, fontSize: 11, color: accent }}>start here</span>}
        {highlight && <Icon name="arrowRight" size={14} color={accent} />}
        {p.confidence && !highlight && <ConfidenceDot confidence={p.confidence} />}
      </div>
    </button>
  );
}

function Marker({ status, confidence, accent }: { status: LessonStatus; confidence?: Confidence; accent: string }) {
  if (status === "completed") {
    const fill = confidence === "solid" ? color.teal : confidence === "shaky" ? "transparent" : accent;
    const border = confidence === "shaky" ? color.amber : fill;
    const tick = confidence === "shaky" ? color.amber : "#12211F";
    return (
      <span style={{ width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center", background: fill, border: `2px solid ${border}` }}>
        <Icon name="check" size={13} color={tick} strokeWidth={2.4} />
      </span>
    );
  }
  if (status === "in-progress") {
    return <span style={{ width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center", border: `2px solid ${accent}` }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: accent }} />
    </span>;
  }
  return <span style={{ width: 22, height: 22, borderRadius: 999, border: `2px solid ${color.panelBorder}` }} />;
}

function ConfidenceDot({ confidence }: { confidence: Confidence }) {
  const tone = confidence === "solid" ? color.teal : confidence === "shaky" ? color.amber : color.textDim;
  return (
    <span style={{ fontFamily: font.mono, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.6px", color: tone }}>{confidence}</span>
  );
}
