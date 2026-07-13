import { useNavigate } from "react-router-dom";
import { listDesignPatterns } from "@/content/designPatterns";
import { color, font, radius } from "@/theme/tokens";
import { Panel, Eyebrow, Divider } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * Design Patterns reference — cross-cutting, not tied to any one lesson.
 * Only patterns that genuinely show up in an existing LLD lesson or Cold
 * Drill design get an entry; nothing here is force-fit to pad the list.
 * Each example links back to the real design it lives in, so "recognize
 * the pattern" and "see it in a worked example" stay connected.
 */
export function PatternsPage() {
  const navigate = useNavigate();
  const patterns = listDesignPatterns();

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.5px" }}>Design Patterns in LLD Interviews</h1>
        <p style={{ color: color.textDim, maxWidth: 640 }}>
          Not a textbook list — only patterns that actually show up in a design already built here. Each one links
          to the real class/method it lives in, worked out in full elsewhere in this app.
        </p>
      </header>

      <div style={{ display: "grid", gap: 16 }}>
        {patterns.map((p) => (
          <Panel key={p.id} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 17, color: color.violet }}>{p.name}</span>
              <p style={{ margin: 0, fontSize: 13.5, color: color.textDim, lineHeight: 1.6 }}>{p.whenToUse}</p>
            </div>
            <Divider />
            <div style={{ display: "grid", gap: 10 }}>
              <Eyebrow>Where it shows up</Eyebrow>
              {p.examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => navigate(ex.isDrill ? `/drill/${ex.refId}` : `/lesson/${ex.refId}`)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 10,
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: radius.md,
                    border: `1px solid ${color.hairline}`,
                    background: "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "grid", gap: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: color.text }}>{ex.title}</span>
                    <span style={{ fontSize: 12.5, color: color.textDim, lineHeight: 1.5 }}>{ex.howItShowsUp}</span>
                  </div>
                  <Icon name="arrowRight" size={14} color={color.textFaint} style={{ marginTop: 2, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
