import { useNavigate } from "react-router-dom";
import type { Confidence, LessonStatus, Track } from "@/types";
import { PATH, TRACK_META, type PathNode } from "@/content";
import { useProgress } from "@/hooks/useProgress";
import { color, font, radius, trackColor } from "@/theme/tokens";
import { Eyebrow } from "./ui";

/**
 * <PathMap /> — the guided map (§2). Two vertical spines, one per track,
 * colored by status and confidence. Every node is always clickable ("locked"
 * just means dim). Used on Home and, colored by confidence, on Progress.
 */
export function PathMap({ highlightId }: { highlightId?: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 22,
      }}
    >
      {(Object.keys(PATH) as Track[]).map((track) => (
        <Spine key={track} track={track} highlightId={highlightId} />
      ))}
    </div>
  );
}

function Spine({ track, highlightId }: { track: Track; highlightId?: string }) {
  const accent = trackColor[track];
  return (
    <section aria-label={TRACK_META[track].label} style={{ display: "grid", gap: 12, alignContent: "start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: accent }} />
        <Eyebrow tone={accent}>{TRACK_META[track].label}</Eyebrow>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {PATH[track].map((node, idx) => (
          <NodeRow
            key={node.id}
            node={node}
            accent={accent}
            isFirst={idx === 0}
            isLast={idx === PATH[track].length - 1}
            highlight={highlightId === node.id}
          />
        ))}
      </div>
    </section>
  );
}

function marker(status: LessonStatus, confidence: Confidence | undefined, accent: string) {
  if (status === "completed") {
    const fill = confidence === "solid" ? color.teal : confidence === "shaky" ? "transparent" : accent;
    const border = confidence === "shaky" ? color.amber : fill;
    return { glyph: "✓", fill, border, textColor: "#10221F" };
  }
  if (status === "in-progress") {
    return { glyph: "◐", fill: "transparent", border: accent, textColor: accent };
  }
  return { glyph: "", fill: "transparent", border: color.panelBorder, textColor: color.textFaint };
}

function NodeRow({
  node,
  accent,
  isFirst,
  isLast,
  highlight,
}: {
  node: PathNode;
  accent: string;
  isFirst: boolean;
  isLast: boolean;
  highlight: boolean;
}) {
  const navigate = useNavigate();
  const { get } = useProgress();
  const p = get(node.id);
  const m = marker(p.status, p.confidence, accent);
  const dim = node.status === "coming-soon" && p.status === "not-started";

  return (
    <button
      onClick={() => navigate(`/lesson/${node.id}`)}
      aria-label={`${node.title}${node.status === "coming-soon" ? " (coming soon)" : ""}, ${p.status}`}
      style={{
        display: "grid",
        gridTemplateColumns: "26px 1fr auto",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        background: highlight ? `${accent}14` : "transparent",
        border: `1px solid ${highlight ? accent : "transparent"}`,
        borderRadius: radius.md,
        padding: "10px 12px",
        transition: "background 160ms ease, border-color 160ms ease",
      }}
    >
      {/* Spine marker + connector */}
      <div style={{ position: "relative", display: "grid", placeItems: "center", height: "100%" }}>
        {!isFirst && <span style={{ position: "absolute", top: -14, height: 14, width: 2, background: color.panelBorder }} />}
        {!isLast && <span style={{ position: "absolute", bottom: -14, height: 14, width: 2, background: color.panelBorder }} />}
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            background: m.fill,
            border: `2px solid ${m.border}`,
            color: m.textColor,
            fontFamily: font.mono,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {m.glyph}
        </span>
      </div>

      {/* Title */}
      <div style={{ display: "grid", gap: 2 }}>
        <span style={{ fontFamily: font.mono, fontSize: 14, fontWeight: 700, color: dim ? color.textDim : color.text }}>
          {node.title}
        </span>
        {node.status === "coming-soon" && (
          <span style={{ fontSize: 11, color: color.textFaint }}>coming soon</span>
        )}
      </div>

      {/* Right rail: "you are here" / confidence tag */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {highlight && <span style={{ fontFamily: font.mono, fontSize: 11, color: accent }}>← start here</span>}
        {p.confidence && (
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: p.confidence === "solid" ? color.teal : p.confidence === "shaky" ? color.amber : color.textDim,
            }}
          >
            {p.confidence}
          </span>
        )}
      </div>
    </button>
  );
}
