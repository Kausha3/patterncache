import { useNavigate } from "react-router-dom";
import { PathMap } from "@/components/PathMap";
import { Button, Divider } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { PATH, RECOMMENDED_FIRST, getLesson } from "@/content";
import { useProgress } from "@/hooks/useProgress";
import { color, font, radius, trackColor } from "@/theme/tokens";
import type { Track } from "@/types";

/**
 * Landing = the path map, not a wall of text. One line of positioning, a
 * three-line orientation to what the three practice shapes actually are (so
 * a first-time visitor knows what a "trace" or "stage builder" even is
 * before clicking in), and the recommended next node as the obvious first
 * click.
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
          Most prep tools show you a finished answer. This one shows you the reasoning that got there, then
          takes it away and tests whether you actually absorbed it — on the same problem, and on ones
          you've never seen. No account, no video to watch on 2x — just you, driving the design.
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <WhatCard
          icon="play"
          track="dsa"
          title="DSA"
          body="Watch a real algorithm trace line by line, then drive the same problem yourself with the trace hidden."
        />
        <WhatCard
          icon="gauge"
          track="system-design"
          title="System Design"
          body="Watch a system grow stage by stage under real load, then defend the tradeoffs it made."
        />
        <WhatCard
          icon="layers"
          track="lld"
          title="Low-Level Design"
          body="Design real classes and their responsibilities, method by method, then hold the design up under edge cases."
        />
      </div>

      <Divider />

      <PathMap highlightId={recommended} />
    </div>
  );
}

function WhatCard({ icon, track, title, body }: { icon: IconName; track: keyof typeof trackColor; title: string; body: string }) {
  const accent = trackColor[track];
  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        padding: "14px 16px",
        borderRadius: radius.lg,
        border: `1px solid ${color.hairline}`,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name={icon} size={15} color={accent} />
        <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 12.5, letterSpacing: "0.3px", color: accent }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: color.textDim, lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}
