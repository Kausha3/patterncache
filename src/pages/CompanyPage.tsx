import { useNavigate, useParams } from "react-router-dom";
import type { CompanyQuestion, FrequencySignal } from "@/types";
import { getCompany } from "@/content/companies";
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

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <BackLink />

      <header style={{ display: "grid", gap: 10 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>{company.name}</h1>
        <p style={{ color: color.textDim, maxWidth: 680, lineHeight: 1.6 }}>{company.blurb}</p>
      </header>

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
                <span style={{ fontSize: 12, color: color.textFaint }}>Most-emphasized principles in the design round. Hover for what each looks like in practice:</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {company.valuesFocus.map((key) => {
                    const def = LEADERSHIP_PRINCIPLES[key];
                    if (!def) return null;
                    return (
                      <span
                        key={key}
                        title={def.plain}
                        style={{
                          fontFamily: font.mono,
                          fontSize: 11,
                          fontWeight: 700,
                          color: color.amber,
                          background: "rgba(217,169,78,0.12)",
                          border: `1px solid ${color.amber}55`,
                          borderRadius: radius.pill,
                          padding: "5px 11px",
                          cursor: "help",
                        }}
                      >
                        {def.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </Panel>
      )}

      <section style={{ display: "grid", gap: 14 }}>
        <SectionHeader eyebrow="System design (HLD)" tone={color.blue} meta={`${hld.length} questions`} />
        <QuestionGrid questions={hld} onOpen={(lessonId) => navigate(`/lesson/${lessonId}`)} />
      </section>

      <section style={{ display: "grid", gap: 14 }}>
        <SectionHeader eyebrow="Low-level design (LLD)" tone={color.violet} meta={`${lld.length} questions`} />
        <QuestionGrid questions={lld} onOpen={(lessonId) => navigate(`/lesson/${lessonId}`)} />
      </section>
    </div>
  );
}

function QuestionGrid({ questions, onOpen }: { questions: CompanyQuestion[]; onOpen: (lessonId: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
      {questions.map((q) => (
        <button key={q.lessonId} onClick={() => onOpen(q.lessonId)} style={{ textAlign: "left" }}>
          <Panel style={{ display: "grid", gap: 10, height: "100%", transition: `border-color ${motion.fast}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <BucketTag bucket={q.bucket} />
              <LevelBadges levels={q.levels} />
            </div>
            <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 14, color: color.text, lineHeight: 1.3 }}>{q.title}</span>
            <p style={{ margin: 0, fontSize: 12.5, color: color.textDim, lineHeight: 1.5, flex: 1 }}>{q.blurb}</p>
            <div style={{ borderTop: `1px solid ${color.hairline}`, paddingTop: 9 }}>
              <FrequencyBadge frequency={q.frequency} note={q.signalNote} />
            </div>
          </Panel>
        </button>
      ))}
    </div>
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
