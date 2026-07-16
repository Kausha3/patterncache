import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PathMap } from "@/components/PathMap";
import { Button, Divider, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { PATH, RECOMMENDED_FIRST, getLesson } from "@/content";
import { getCompany } from "@/content/companies";
import { useProgress } from "@/hooks/useProgress";
import { color, font, radius, trackColor } from "@/theme/tokens";
import type { Track } from "@/types";

type CompanyFilter = "all" | "amazon";

/**
 * The Library: every lesson, pattern, and reference in one place. Companies
 * are a preparation FILTER here, not a separate destination. Today (/) tells
 * you what to do next; the Library is where you browse when you want to.
 */
export function LibraryPage() {
  const navigate = useNavigate();
  const { get } = useProgress();
  const [company, setCompany] = useState<CompanyFilter>("all");

  const recommended =
    (Object.keys(PATH) as Track[])
      .flatMap((t) => PATH[t])
      .find((n) => n.status === "available" && get(n.id).status !== "completed")?.id ?? RECOMMENDED_FIRST;

  const amazon = getCompany("amazon");
  const amazonAsked = useMemo(() => {
    if (!amazon) return new Map<string, string>();
    const asked = new Map<string, string>();
    for (const q of [...amazon.hld, ...amazon.lld]) {
      if (getLesson(q.lessonId)) asked.set(q.lessonId, q.frequency);
    }
    return asked;
  }, [amazon]);

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.6px" }}>Library</h1>
        <p style={{ color: color.textDim, maxWidth: 660 }}>
          Every lesson and reference, organized by track. Your plan on Today already sequences this for
          you; browse here when you want to jump around or dig into one topic.
        </p>
      </header>

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
          body="Design real classes and their responsibilities, then hold the design up under edge cases."
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: font.mono, fontSize: 11.5, color: color.textFaint, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          Preparing for
        </span>
        <FilterChip active={company === "all"} onClick={() => setCompany("all")}>
          Everything
        </FilterChip>
        <FilterChip active={company === "amazon"} onClick={() => setCompany("amazon")}>
          Amazon
        </FilterChip>
      </div>

      {company === "amazon" && amazon && (
        <Panel style={{ display: "grid", gap: 12, borderColor: `${color.amber}44` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 4 }}>
              <Eyebrow tone={color.amber}>Amazon lens</Eyebrow>
              <span style={{ fontSize: 13.5, color: color.textDim }}>
                {amazonAsked.size} lessons below map to reported Amazon questions. The SDE I board holds
                the exact problem list, evidence tiers, and spaced reviews.
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button accent={color.amber} iconRight="arrowRight" onClick={() => navigate("/companies/amazon/sde1")}>
                SDE I mission board
              </Button>
              <Button variant="ghost" onClick={() => navigate("/companies/amazon")}>
                Question list
              </Button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[...amazonAsked.keys()].map((lessonId) => {
              const lesson = getLesson(lessonId);
              if (!lesson) return null;
              return (
                <button
                  key={lessonId}
                  onClick={() => navigate(`/lesson/${lessonId}`)}
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: color.text,
                    background: "rgba(217,169,78,0.08)",
                    border: `1px solid ${color.amber}44`,
                    borderRadius: radius.pill,
                    padding: "5px 11px",
                    cursor: "pointer",
                  }}
                >
                  {lesson.title}
                </button>
              );
            })}
          </div>
        </Panel>
      )}

      <Divider />

      <PathMap highlightId={recommended} />

      <Panel style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <Eyebrow tone={color.violet}>Design patterns reference</Eyebrow>
          <span style={{ fontSize: 13.5, color: color.textDim, maxWidth: 560 }}>
            Every pattern that shows up in a design built here, with the pattern it's most often confused
            with and a quick-check game.
          </span>
        </div>
        <Button variant="ghost" accent={color.violet} iconRight="arrowRight" onClick={() => navigate("/patterns")}>
          Open patterns
        </Button>
      </Panel>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        fontFamily: font.mono,
        fontSize: 12,
        fontWeight: 700,
        padding: "6px 14px",
        borderRadius: radius.pill,
        border: `1px solid ${active ? color.amber : color.panelBorder}`,
        background: active ? "rgba(217,169,78,0.12)" : "transparent",
        color: active ? color.text : color.textDim,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
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
