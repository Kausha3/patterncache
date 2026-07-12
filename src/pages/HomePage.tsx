import { useNavigate } from "react-router-dom";
import { PathMap } from "@/components/PathMap";
import { Button } from "@/components/ui";
import { PATH, RECOMMENDED_FIRST } from "@/content";
import { useProgress } from "@/hooks/useProgress";
import { getLesson } from "@/content";
import { color, font } from "@/theme/tokens";
import type { Track } from "@/types";

/**
 * Landing = the path map, not a wall of text (§6). One line of positioning,
 * the two tracks, and the recommended next node highlighted as the obvious
 * first click.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { get } = useProgress();

  // Recommended next: first available lesson not yet completed; else the flagship.
  const recommended =
    (Object.keys(PATH) as Track[])
      .flatMap((t) => PATH[t])
      .find((n) => n.status === "available" && get(n.id).status !== "completed")?.id ?? RECOMMENDED_FIRST;

  const recLesson = getLesson(recommended);

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <section style={{ display: "grid", gap: 14 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
          Learn <span style={{ color: color.amber }}>why</span>, not just <span style={{ color: color.textDim }}>what</span>.
        </h1>
        <p style={{ margin: 0, color: color.textDim, maxWidth: 620, fontSize: 15.5 }}>
          Watch a real algorithm execute, then drive it yourself. Watch a system grow stage by stage,
          then explore the tradeoffs. Interview patterns you can recognize — because you saw the reasoning happen.
        </p>
        {recLesson && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Button onClick={() => navigate(`/lesson/${recommended}`)}>
              ▶ Start: {recLesson.title} · {recLesson.estMinutes} min
            </Button>
            <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>
              no account · saved on this device
            </span>
          </div>
        )}
      </section>

      <div style={{ height: 1, background: color.panelBorder }} />

      <section style={{ display: "grid", gap: 16 }}>
        <PathMap highlightId={recommended} />
      </section>
    </div>
  );
}
