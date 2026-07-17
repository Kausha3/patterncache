import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CompanyQuestion, FrequencySignal, SdeLevel } from "@/types";
import { getCompany } from "@/content/companies";
import { getLesson } from "@/content";
import { LEADERSHIP_PRINCIPLES } from "@/content/leadershipPrinciples";
import { color, font, radius, motion } from "@/theme/tokens";
import { Panel, Eyebrow, Button, SectionHeader, Divider } from "@/components/ui";
import { FrequencyBadge, LevelBadges, BucketTag } from "@/components/CompanyBadges";
import { Icon } from "@/components/Icon";

const RANK: Record<FrequencySignal, number> = { "very-high": 4, high: 3, medium: 2, emerging: 1 };

export function CompanyPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const company = getCompany(id);
  const [availability, setAvailability] = useState<"playable" | "all">("playable");
  const [level, setLevel] = useState<SdeLevel | "all">("all");
  const [activeValue, setActiveValue] = useState<string | null>(null);

  if (!company) {
    return (
      <div style={{ display: "grid", gap: 18, maxWidth: 520 }}>
        <BackLink />
        <Panel style={{ display: "grid", gap: 14 }}>
          <p style={{ margin: 0, color: color.textDim }}>No data for this company yet.</p>
          <Button onClick={() => navigate("/companies")} style={{ width: "fit-content" }}>See all companies</Button>
        </Panel>
      </div>
    );
  }

  const hld = [...company.hld].sort((a, b) => RANK[b.frequency] - RANK[a.frequency]);
  const lld = [...company.lld].sort((a, b) => RANK[b.frequency] - RANK[a.frequency]);
  const matchesFilters = (question: CompanyQuestion) =>
    (availability === "all" || !!getLesson(question.lessonId)) &&
    (level === "all" || question.levels.includes(level));
  const visibleHld = hld.filter(matchesFilters);
  const visibleLld = lld.filter(matchesFilters);
  const playableHld = hld.filter((question) => !!getLesson(question.lessonId)).length;
  const playableLld = lld.filter((question) => !!getLesson(question.lessonId)).length;
  const activePrinciple = activeValue ? LEADERSHIP_PRINCIPLES[activeValue] : undefined;

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <BackLink />

      <header style={{ display: "grid", gap: 10 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>{company.name}</h1>
        <p style={{ color: color.textDim, maxWidth: 680, lineHeight: 1.6 }}>{company.blurb}</p>
      </header>

      {company.id === "amazon" && (
        <Panel
          raised
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            alignItems: "center",
            borderColor: `${color.amber}55`,
            background: `linear-gradient(120deg, rgba(217,169,78,0.10), ${color.panel} 42%)`,
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <Eyebrow tone={color.amber}>SDE I · start tomorrow</Eyebrow>
            <strong style={{ fontSize: 18, letterSpacing: "-0.25px" }}>15-day DSA + LLD priority mission</strong>
            <span style={{ color: color.textDim, fontSize: 12.5, lineHeight: 1.55 }}>
              Research-backed must-dos, memory cues, follow-up twists, spaced reviews, and a confidence gate.
            </span>
          </div>
          <Button accent={color.amber} iconRight="arrowRight" style={{ width: "fit-content", justifySelf: "start" }} onClick={() => navigate("/companies/amazon/sde1")}>
            Open mission
          </Button>
        </Panel>
      )}

      {(company.loopNotes?.length || company.valuesFocus?.length) && (
        <Panel style={{ display: "grid", gap: 14 }}>
          <Eyebrow tone={color.blue}>How {company.name} interviews</Eyebrow>
          {company.loopNotes && (
            <ul style={{ margin: 0, paddingLeft: 4, display: "grid", gap: 10, listStyle: "none" }}>
              {company.loopNotes.map((note, i) => (
                <li key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 9, color: color.text, fontSize: 13.5, lineHeight: 1.6 }}>
                  <span style={{ color: color.blue, marginTop: 3 }}><Icon name="chevronRight" size={13} /></span>
                  {note}
                </li>
              ))}
            </ul>
          )}
          {company.valuesFocus && company.valuesFocus.length > 0 && (
            <>
              <Divider />
              <div style={{ display: "grid", gap: 8 }}>
                <span style={{ fontSize: 12, color: color.textFaint }}>Most-emphasized principles in the design round. Select one to see how it appears in practice:</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {company.valuesFocus.map((key) => {
                    const def = LEADERSHIP_PRINCIPLES[key];
                    if (!def) return null;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveValue((current) => current === key ? null : key)}
                        aria-expanded={activeValue === key}
                        style={{
                          fontFamily: font.mono,
                          fontSize: 11,
                          fontWeight: 700,
                          color: color.amber,
                          background: "rgba(217,169,78,0.12)",
                          border: `1px solid ${color.amber}55`,
                          borderRadius: radius.pill,
                          padding: "5px 11px",
                          cursor: "pointer",
                        }}
                      >
                        {def.name}
                      </button>
                    );
                  })}
                </div>
                {activePrinciple && (
                  <div
                    role="status"
                    style={{
                      color: color.text,
                      fontSize: 13,
                      lineHeight: 1.55,
                      background: "rgba(217,169,78,0.07)",
                      border: `1px solid ${color.amber}44`,
                      borderRadius: radius.md,
                      padding: "10px 12px",
                    }}
                  >
                    {activePrinciple.plain}
                  </div>
                )}
              </div>
            </>
          )}
        </Panel>
      )}

      <FilterBar
        availability={availability}
        level={level}
        onAvailability={setAvailability}
        onLevel={setLevel}
      />

      <section style={{ display: "grid", gap: 14 }}>
        <SectionHeader eyebrow="System design (HLD)" tone={color.blue} meta={`${visibleHld.length} shown · ${playableHld} / ${hld.length} playable`} />
        {company.bucketNotes?.hld && <BucketNote>{company.bucketNotes.hld}</BucketNote>}
        <QuestionGrid questions={visibleHld} onOpen={(lessonId) => navigate(`/lesson/${lessonId}`)} />
      </section>

      <section style={{ display: "grid", gap: 14 }}>
        <SectionHeader eyebrow="Low-level design (LLD)" tone={color.violet} meta={`${visibleLld.length} shown · ${playableLld} / ${lld.length} playable`} />
        {company.bucketNotes?.lld && <BucketNote>{company.bucketNotes.lld}</BucketNote>}
        {lld.length > 0 && <QuestionGrid questions={visibleLld} onOpen={(lessonId) => navigate(`/lesson/${lessonId}`)} />}
      </section>
    </div>
  );
}

function QuestionGrid({ questions, onOpen }: { questions: CompanyQuestion[]; onOpen: (lessonId: string) => void }) {
  if (questions.length === 0) {
    return (
      <Panel>
        <p style={{ margin: 0, color: color.textDim }}>No questions match these filters. Try another level or include roadmap content.</p>
      </Panel>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
      {questions.map((q) => {
        const playable = !!getLesson(q.lessonId);
        return (
          <button key={q.lessonId} onClick={() => onOpen(q.lessonId)} style={{ textAlign: "left", width: "100%", border: "none", padding: 0, background: "transparent" }}>
            <Panel style={{ display: "grid", gap: 10, height: "100%", transition: `border-color ${motion.fast}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <BucketTag bucket={q.bucket} />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {!playable && (
                    <span style={{ fontFamily: font.mono, fontSize: 9.5, fontWeight: 700, color: color.amber, border: `1px solid ${color.amber}55`, borderRadius: radius.sm, padding: "2px 6px" }}>
                      ROADMAP
                    </span>
                  )}
                  <LevelBadges levels={q.levels} />
                </div>
              </div>
              <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 14, color: color.text, lineHeight: 1.3 }}>{q.title}</span>
              <p style={{ margin: 0, fontSize: 12.5, color: color.textDim, lineHeight: 1.5, flex: 1 }}>{q.blurb}</p>
              <div style={{ borderTop: `1px solid ${color.hairline}`, paddingTop: 9 }}>
                <FrequencyBadge frequency={q.frequency} note={q.signalNote} />
              </div>
            </Panel>
          </button>
        );
      })}
    </div>
  );
}

function FilterBar({
  availability,
  level,
  onAvailability,
  onLevel,
}: {
  availability: "playable" | "all";
  level: SdeLevel | "all";
  onAvailability: (value: "playable" | "all") => void;
  onLevel: (value: SdeLevel | "all") => void;
}) {
  return (
    <Panel style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Eyebrow>Availability</Eyebrow>
        {(["playable", "all"] as const).map((value) => (
          <FilterButton key={value} active={availability === value} onClick={() => onAvailability(value)}>
            {value === "playable" ? "Playable only" : "Include roadmap"}
          </FilterButton>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Eyebrow>Level</Eyebrow>
        {(["all", "L3", "L4", "L5", "L6"] as const).map((value) => (
          <FilterButton key={value} active={level === value} onClick={() => onLevel(value)}>
            {value === "all" ? "All" : value}
          </FilterButton>
        ))}
      </div>
    </Panel>
  );
}

function BucketNote({ children }: { children: string }) {
  return (
    <p style={{ margin: 0, maxWidth: 820, color: color.textDim, fontSize: 12.5, lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        fontFamily: font.mono,
        fontSize: 11.5,
        fontWeight: 650,
        padding: "6px 10px",
        borderRadius: radius.pill,
        border: `1px solid ${active ? color.blue : color.panelBorder}`,
        background: active ? "rgba(106,166,219,0.12)" : "transparent",
        color: active ? color.text : color.textDim,
      }}
    >
      {children}
    </button>
  );
}

function BackLink() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/companies")}
      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: color.textDim, fontFamily: font.mono, fontSize: 12.5, padding: 0, width: "fit-content" }}
    >
      <Icon name="arrowLeft" size={14} /> Companies
    </button>
  );
}
