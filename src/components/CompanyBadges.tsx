import type { FrequencySignal, SdeLevel, QuestionBucket } from "@/types";
import { color, font, radius } from "@/theme/tokens";

/**
 * Small badges for the Companies section. FrequencySignal is deliberately a
 * qualitative tier, not a count — no research source publishes real
 * frequency numbers (see docs/AMAZON.md §0). The badge shows a dot scale +
 * label and always carries a `title` tooltip with the honest signal note so
 * nobody mistakes "very high" for a statistic.
 */

const FREQ_META: Record<FrequencySignal, { label: string; tone: string; dots: number }> = {
  "very-high": { label: "Very high signal", tone: color.teal, dots: 4 },
  high: { label: "High signal", tone: color.blue, dots: 3 },
  medium: { label: "Medium signal", tone: color.textDim, dots: 2 },
  emerging: { label: "Emerging", tone: color.amber, dots: 1 },
};

export function FrequencyBadge({ frequency, note }: { frequency: FrequencySignal; note?: string }) {
  const m = FREQ_META[frequency];
  return (
    <span title={note} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: note ? "help" : undefined }}>
      <span style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: i < m.dots ? m.tone : "rgba(255,255,255,0.12)",
            }}
          />
        ))}
      </span>
      <span style={{ fontFamily: font.mono, fontSize: 10.5, fontWeight: 700, color: m.tone, textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {m.label}
      </span>
    </span>
  );
}

export function LevelBadges({ levels }: { levels: SdeLevel[] }) {
  return (
    <span style={{ display: "flex", gap: 4 }}>
      {levels.map((l) => (
        <span
          key={l}
          style={{
            fontFamily: font.mono,
            fontSize: 10,
            fontWeight: 700,
            color: color.textDim,
            border: `1px solid ${color.panelBorder}`,
            borderRadius: radius.sm,
            padding: "1.5px 5px",
          }}
        >
          {l}
        </span>
      ))}
    </span>
  );
}

export function BucketTag({ bucket }: { bucket: QuestionBucket }) {
  const isHld = bucket === "hld";
  return (
    <span
      style={{
        fontFamily: font.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.5px",
        color: isHld ? color.blue : color.violet,
        border: `1px solid ${isHld ? color.blue : color.violet}55`,
        background: isHld ? "rgba(106,166,219,0.1)" : "rgba(154,130,212,0.1)",
        borderRadius: radius.sm,
        padding: "2px 7px",
      }}
    >
      {isHld ? "SYSTEM DESIGN" : "LOW-LEVEL DESIGN"}
    </span>
  );
}
