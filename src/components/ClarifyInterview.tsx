import { useEffect, useMemo, useState } from "react";
import type { InterviewSpec, ClarifyQuestion } from "@/types";
import { color, font, radius, motion } from "@/theme/tokens";
import { Panel, SectionHeader, Eyebrow } from "./ui";
import { Icon } from "./Icon";
import { LEADERSHIP_PRINCIPLES } from "@/content/leadershipPrinciples";

/**
 * <ClarifyInterview /> — an interactive clarifying-questions simulator. You're
 * given a vague prompt; you choose what to ask; the interviewer answers;
 * requirements accumulate; and for the pivotal questions you can explore how a
 * *different* answer would change the whole approach. Teaches the meta-skill:
 * turn a vague ask into concrete requirements before drawing a single box.
 */
export function ClarifyInterview({ interview, onComplete }: { interview: InterviewSpec; onComplete?: () => void }) {
  const [asked, setAsked] = useState<string[]>([]);
  const [branchSel, setBranchSel] = useState<Record<string, number>>({});

  const byId = useMemo(() => Object.fromEntries(interview.questions.map((q) => [q.id, q])), [interview]);
  const coreQs = interview.questions.filter((q) => q.category !== "premature");
  const ready = coreQs.every((q) => asked.includes(q.id));
  const remaining = interview.questions.filter((q) => !asked.includes(q.id));
  const requirements = asked.map((id) => byId[id]).filter((q) => q?.establishes).map((q) => q.establishes!) as string[];

  useEffect(() => {
    if (ready) onComplete?.();
  }, [ready, onComplete]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <SectionHeader eyebrow="Clarify first · drive the conversation" tone={color.blue} meta={`${coreQs.filter((q) => asked.includes(q.id)).length} / ${coreQs.length} key questions`} />

      {/* The prompt */}
      <Panel style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
          <Avatar who="interviewer" />
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>Interviewer</span>
            <p style={{ margin: 0, color: color.text, fontSize: 15.5 }}>{interview.opening}</p>
          </div>
        </div>
        <div style={{ marginLeft: 43, fontSize: 13, color: color.textDim, fontStyle: "italic" }}>
          Don't start drawing boxes. Ask what you need to know first — pick a question below.
        </div>
      </Panel>

      {/* Requirements tracker */}
      {requirements.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          <Eyebrow tone={color.teal}>Requirements you've pinned down</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {requirements.map((r) => (
              <span key={r} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: font.mono, fontSize: 12, color: color.text, background: "rgba(91,176,173,0.12)", border: `1px solid ${color.teal}55`, borderRadius: radius.pill, padding: "5px 11px" }}>
                <Icon name="check" size={12} color={color.teal} strokeWidth={2.4} /> {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Transcript of what you asked */}
      {asked.map((id) => {
        const q = byId[id];
        if (!q) return null;
        return <Exchange key={id} q={q} branchSel={branchSel[id]} onBranch={(i) => setBranchSel((m) => ({ ...m, [id]: m[id] === i ? -1 : i }))} />;
      })}

      {/* Question chooser */}
      {remaining.length > 0 && (
        <Panel style={{ display: "grid", gap: 10 }}>
          <Eyebrow>{asked.length === 0 ? "What do you ask first?" : "Ask another"}</Eyebrow>
          <div style={{ display: "grid", gap: 8 }}>
            {remaining.map((q) => (
              <button
                key={q.id}
                onClick={() => setAsked((a) => [...a, q.id])}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${color.panelBorder}`,
                  borderRadius: radius.md,
                  padding: "12px 14px",
                  color: color.text,
                  fontSize: 14,
                  transition: `border-color ${motion.fast}, background ${motion.fast}`,
                }}
              >
                <span style={{ color: color.blue }}><Icon name="chevronRight" size={15} /></span>
                {q.ask}
              </button>
            ))}
          </div>
        </Panel>
      )}

      {/* Ready — the payoff */}
      {ready && (
        <div style={{ background: "rgba(130,184,114,0.08)", border: `1px solid ${color.green}66`, borderRadius: radius.lg, padding: "18px 20px", display: "grid", gap: 10, animation: `pc-enter 260ms ${motion.enter}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="check" size={17} color={color.green} strokeWidth={2.2} />
            <Eyebrow tone={color.green}>You've clarified enough to start designing</Eyebrow>
          </div>
          <p style={{ margin: 0, color: color.text, lineHeight: 1.65 }}>{interview.summary}</p>
        </div>
      )}
    </div>
  );
}

function Exchange({ q, branchSel, onBranch }: { q: ClarifyQuestion; branchSel?: number; onBranch: (i: number) => void }) {
  const premature = q.category === "premature";
  return (
    <Panel style={{ display: "grid", gap: 12, animation: `pc-enter 220ms ${motion.enter}` }}>
      {/* You asked */}
      <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
        <Avatar who="you" />
        <div style={{ display: "grid", gap: 3 }}>
          <span style={{ fontFamily: font.mono, fontSize: 11, color: color.teal }}>You</span>
          <p style={{ margin: 0, color: color.text }}>{q.ask}</p>
        </div>
      </div>

      {/* Interviewer answered */}
      <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
        <Avatar who="interviewer" />
        <div style={{ display: "grid", gap: 3 }}>
          <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>Interviewer</span>
          <p style={{ margin: 0, color: color.text }}>{premature ? q.redirect : q.answer}</p>
        </div>
      </div>

      {/* Coaching */}
      {premature ? (
        <Coach tone={color.amber} icon="target" label="Judgment call">
          Too early to ask — note it and come back once scope and scale are nailed. Interviewers read this as knowing the order of operations.
        </Coach>
      ) : (
        q.why && (
          <Coach tone={color.teal} icon="insight" label="Why this matters" lp={q.lp}>
            {q.why}
          </Coach>
        )
      )}

      {/* Branch explorer — how a different answer changes the approach */}
      {q.branches && q.branches.length > 0 && (
        <div style={{ borderTop: `1px solid ${color.hairline}`, paddingTop: 12, display: "grid", gap: 10 }}>
          <Eyebrow tone={color.blue}>Same question, different answer → different design</Eyebrow>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {q.branches.map((b, i) => {
              const on = branchSel === i;
              return (
                <button
                  key={b.label}
                  onClick={() => onBranch(i)}
                  aria-pressed={on}
                  style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: radius.md, background: on ? "rgba(106,166,219,0.16)" : "transparent", border: `1px solid ${on ? color.blue : color.panelBorder}`, color: on ? color.text : color.textDim, transition: `all ${motion.fast}` }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
          {branchSel !== undefined && branchSel >= 0 && q.branches[branchSel] && (
            <p style={{ margin: 0, color: color.text, fontSize: 13.5, lineHeight: 1.6, background: "rgba(106,166,219,0.06)", border: `1px solid ${color.blue}44`, borderRadius: radius.md, padding: "11px 13px", animation: `pc-fade 160ms ${motion.enter}` }}>
              {q.branches[branchSel].approach}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

function Coach({ tone, icon, label, lp, children }: { tone: string; icon: "insight" | "target"; label: string; lp?: string[]; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: `${tone}12`, border: `1px solid ${tone}44`, borderRadius: radius.md, padding: "11px 13px" }}>
      <span style={{ color: tone, marginTop: 1 }}><Icon name={icon} size={15} /></span>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", color: tone }}>{label}</span>
          {lp?.map((key) => {
            const def = LEADERSHIP_PRINCIPLES[key];
            if (!def) return null;
            return (
              <span
                key={key}
                title={def.plain}
                style={{
                  fontFamily: font.mono,
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: color.amber,
                  background: "rgba(217,169,78,0.14)",
                  border: `1px solid ${color.amber}55`,
                  borderRadius: radius.pill,
                  padding: "2px 8px",
                  cursor: "help",
                }}
              >
                {def.name}
              </span>
            );
          })}
        </div>
        <span style={{ color: color.text, fontSize: 13.5, lineHeight: 1.55 }}>{children}</span>
      </div>
    </div>
  );
}

function Avatar({ who }: { who: "you" | "interviewer" }) {
  const tone = who === "you" ? color.teal : color.textDim;
  return (
    <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 999, display: "grid", placeItems: "center", background: `${tone}20`, border: `1px solid ${tone}66`, fontFamily: font.mono, fontSize: 12, fontWeight: 700, color: tone }}>
      {who === "you" ? "You" : "IV"}
    </span>
  );
}
