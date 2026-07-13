import { useNavigate } from "react-router-dom";
import { PathMap } from "@/components/PathMap";
import { Button, Divider } from "@/components/ui";
import { PATH, RECOMMENDED_FIRST, getLesson } from "@/content";
import { useProgress } from "@/hooks/useProgress";
import { color, font } from "@/theme/tokens";
import type { Track } from "@/types";

/**
 * Landing = the path map, not a wall of text. One line of positioning, the two
 * tracks, and the recommended next node highlighted as the obvious first click.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { get } = useProgress();

  const recommended =
    (Object.keys(PATH) as Track[])
      .flatMap((t) => PATH[t])
      .find((n) => n.status === "available" && get(n.id).status !== "completed")?.id ?? RECOMMENDED_FIRST;

  const recLesson = getLesson(recommended);

  return (
    <div style={{ display: "grid", gap: 30 }}>
      <section style={{ display: "grid", gap: 16, maxWidth: 640, paddingTop: 8 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.9px", lineHeight: 1.08 }}>
          Learn <span style={{ color: color.amber }}>why</span>, not just what.
        </h1>
        <p style={{ color: color.textDim, fontSize: 16, lineHeight: 1.6 }}>
          Watch a real algorithm execute line by line, then drive it yourself. Watch a system grow stage
          by stage, then explore the tradeoffs. Patterns you can recognize in an interview — because you
          saw the reasoning happen, not a label.
        </p>
        {recLesson && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 2 }}>
            <Button icon="play" onClick={() => navigate(`/lesson/${recommended}`)}>
              Start: {recLesson.title} · {recLesson.estMinutes} min
            </Button>
            <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>no account · saved on this device</span>
          </div>
        )}
      </section>

      <Divider />

      <PathMap highlightId={recommended} />
    </div>
  );
}
