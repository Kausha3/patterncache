import { useNavigate } from "react-router-dom";
import { PathMap } from "@/components/PathMap";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { getLesson, PATH } from "@/content";
import { useProgress } from "@/hooks/useProgress";
import { color, font } from "@/theme/tokens";
import type { Confidence, Track } from "@/types";

/**
 * Progress (§7): the path map colored by confidence, plus a Revisit list.
 * No streaks, no XP, no stats theater — the reward is understanding.
 * "Shaky" lessons resurface first — spaced repetition on lessons, not trivia.
 */
export function ProgressPage() {
  const navigate = useNavigate();
  const { get } = useProgress();

  const CONF_RANK: Record<Confidence, number> = { shaky: 0, okay: 1, solid: 2 };

  const revisit = (Object.keys(PATH) as Track[])
    .flatMap((t) => PATH[t])
    .map((n) => ({ node: n, p: get(n.id) }))
    .filter((x) => x.p.status === "completed" && x.p.confidence && x.p.confidence !== "solid")
    .sort((a, b) => CONF_RANK[a.p.confidence!] - CONF_RANK[b.p.confidence!]);

  const anyProgress = (Object.keys(PATH) as Track[])
    .flatMap((t) => PATH[t])
    .some((n) => get(n.id).status !== "not-started");

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px" }}>Your map</h1>
        <p style={{ margin: 0, color: color.textDim, fontSize: 14.5 }}>
          Colored by how solid each lesson feels. <span style={{ color: color.amber }}>Amber</span> = shaky,{" "}
          <span style={{ color: color.teal }}>teal</span> = solid.
        </p>
      </header>

      {!anyProgress && (
        <Panel>
          <p style={{ margin: 0, color: color.textDim }}>
            Nothing on the map yet.{" "}
            <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: color.teal, fontFamily: font.mono, fontWeight: 700, padding: 0 }}>
              Start your first lesson →
            </button>
          </p>
        </Panel>
      )}

      <PathMap />

      {revisit.length > 0 && (
        <section style={{ display: "grid", gap: 12 }}>
          <Eyebrow tone={color.amber}>Revisit — resurfaced because you marked them shaky/okay</Eyebrow>
          <div style={{ display: "grid", gap: 8 }}>
            {revisit.map(({ node, p }) => {
              const lesson = getLesson(node.id);
              return (
                <div
                  key={node.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: color.panel,
                    border: `1px solid ${color.panelBorder}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: p.confidence === "shaky" ? color.amber : color.textDim,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 14 }}>{node.title}</div>
                    <div style={{ fontSize: 12.5, color: color.textFaint }}>{lesson?.blurb}</div>
                  </div>
                  <Button variant="ghost" onClick={() => navigate(`/lesson/${node.id}`)}>
                    ↻ Run it again
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
