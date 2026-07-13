import type { ReactNode } from "react";
import type { DSALesson } from "@/types";
import { color, font, radius } from "@/theme/tokens";
import { Eyebrow, Panel, Divider } from "./ui";
import { Icon } from "./Icon";

/**
 * <ConceptCard /> — the "get oriented" panel. Frames the brute-force cost, the
 * insight that removes it, the payoff, and — crucially for interviews — the
 * recognition trigger: how to spot this pattern in the wild.
 */
export function ConceptCard({ concept }: { concept: DSALesson["concept"] }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Panel style={{ display: "grid", gap: 18 }}>
        <Row eyebrow="Brute force" tone={color.textDim}>
          <p style={{ margin: 0 }}>{concept.bruteForce}</p>
          <ComplexityPill label={concept.bruteForceComplexity} tone={color.red} />
        </Row>
        <Divider />
        <Row eyebrow="The insight" tone={color.amber}>
          <p style={{ margin: 0 }}>{concept.insight}</p>
          <ComplexityPill label={concept.complexity} tone={color.teal} />
        </Row>
      </Panel>

      {/* Recognition trigger — the interview-facing takeaway, visually distinct. */}
      <div
        style={{
          display: "flex",
          gap: 13,
          alignItems: "flex-start",
          background: "rgba(217,169,78,0.06)",
          border: `1px solid ${color.amber}44`,
          borderRadius: radius.lg,
          padding: "16px 18px",
        }}
      >
        <div style={{ color: color.amber, marginTop: 1 }}>
          <Icon name="target" size={18} />
        </div>
        <div style={{ display: "grid", gap: 5 }}>
          <Eyebrow tone={color.amber}>Recognize it when…</Eyebrow>
          <p style={{ margin: 0, color: color.text, lineHeight: 1.6 }}>{concept.recognize}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ eyebrow, tone, children }: { eyebrow: string; tone: string; children: ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <div style={{ color: color.text, lineHeight: 1.65, display: "grid", gap: 10 }}>{children}</div>
    </div>
  );
}

function ComplexityPill({ label, tone }: { label: string; tone: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: color.textFaint }}>time</span>
      <span
        style={{
          fontFamily: font.mono,
          fontSize: 13,
          fontWeight: 700,
          color: tone,
          background: `${tone}1c`,
          border: `1px solid ${tone}55`,
          borderRadius: radius.sm,
          padding: "2px 9px",
        }}
      >
        {label}
      </span>
    </div>
  );
}
