import type { DSALesson } from "@/types";
import { color } from "@/theme/tokens";
import { Eyebrow, Panel, InlineCode } from "./ui";

/**
 * <ConceptCard /> — §4.4. The "get oriented" panel at the top of every DSA
 * lesson. Same treatment everywhere so learners instantly recognize it.
 */
export function ConceptCard({ concept }: { concept: DSALesson["concept"] }) {
  return (
    <Panel>
      <div style={{ display: "grid", gap: 18 }}>
        <Row eyebrow="Brute force" tone={color.textDim}>
          {concept.bruteForce}
        </Row>
        <div style={{ height: 1, background: color.panelBorder }} />
        <Row eyebrow="The insight" tone={color.amber}>
          {concept.insight}
        </Row>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Eyebrow tone={color.teal}>Payoff</Eyebrow>
          <InlineCode>{concept.complexity}</InlineCode>
        </div>
      </div>
    </Panel>
  );
}

function Row({ eyebrow, tone, children }: { eyebrow: string; tone: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <p style={{ margin: 0, color: color.text, lineHeight: 1.65 }}>{children}</p>
    </div>
  );
}
