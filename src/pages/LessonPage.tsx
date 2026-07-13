import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLesson, PATH, RECOMMENDED_FIRST } from "@/content";
import { getAlgorithm } from "@/algorithms";
import { isDSA } from "@/types";
import type { Confidence, Lesson, Track } from "@/types";
import { useProgress } from "@/hooks/useProgress";
import { ConceptCard } from "@/components/ConceptCard";
import { TraceVisualizer } from "@/components/TraceVisualizer";
import { SandboxPractice } from "@/components/SandboxPractice";
import { StageBuilder } from "@/components/StageBuilder";
import { ClarifyInterview } from "@/components/ClarifyInterview";
import { Glossary } from "@/components/Glossary";
import { Button, Eyebrow, Panel, InlineCode } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { color, font, radius, trackColor, motion } from "@/theme/tokens";

export function LessonPage() {
  const { id = "" } = useParams();
  const lesson = getLesson(id);
  const node = (Object.keys(PATH) as Track[]).flatMap((t) => PATH[t]).find((n) => n.id === id);

  if (!lesson) return <ComingSoon title={node?.title ?? "This lesson"} />;
  return <LessonShell key={lesson.id} lesson={lesson} />;
}

// ---------------------------------------------------------------------------
// Not-yet-built lesson — a real screen, never a dead end.
// ---------------------------------------------------------------------------

function ComingSoon({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 580 }}>
      <BackLink />
      <Panel style={{ display: "grid", gap: 14 }}>
        <Eyebrow tone={color.amber}>On the roadmap</Eyebrow>
        <h1 style={{ fontSize: 25, fontWeight: 700, letterSpacing: "-0.5px" }}>{title}</h1>
        <p style={{ color: color.textDim }}>
          This lesson isn't built yet — every lesson is hand-crafted so the reasoning holds up, and we ship depth before
          breadth. In the meantime, here's one that's ready to run.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button icon="play" onClick={() => navigate(`/lesson/${RECOMMENDED_FIRST}`)}>Start Sliding Window</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>See the full path</Button>
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lesson shell — same four/three-step shape every time.
// ---------------------------------------------------------------------------

function LessonShell({ lesson }: { lesson: Lesson }) {
  const { setStatus } = useProgress();
  const steps = isDSA(lesson)
    ? [
        { key: "concept", label: "Concept" },
        { key: "trace", label: "Watch it run" },
        { key: "practice", label: "Now you drive" },
        { key: "recap", label: "Recap" },
      ]
    : [
        { key: "overview", label: "Overview" },
        ...(lesson.interview ? [{ key: "clarify", label: "Clarify" }] : []),
        ...(lesson.stages?.length ? [{ key: "stages", label: "Build it" }] : []),
        { key: "recap", label: "Recap" },
      ];

  const [stepIdx, setStepIdx] = useState(0);
  const accent = trackColor[lesson.track];
  const cur = steps[stepIdx];
  const last = steps.length - 1;

  useEffect(() => { setStatus(lesson.id, "in-progress"); }, [lesson.id, setStatus]);
  const markComplete = () => setStatus(lesson.id, "completed");

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <BackLink />

      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: accent,
              border: `1px solid ${accent}66`,
              background: `${accent}14`,
              borderRadius: radius.sm,
              padding: "3px 9px",
            }}
          >
            {lesson.track === "dsa" ? "DSA" : "System Design"}
          </span>
          <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>~{lesson.estMinutes} min</span>
        </div>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.5px" }}>{lesson.title}</h1>
      </header>

      {/* Sub-nav — same shape every lesson, always clickable */}
      <div role="tablist" style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: `1px solid ${color.hairline}` }}>
        {steps.map((st, i) => {
          const active = i === stepIdx;
          return (
            <button
              key={st.key}
              role="tab"
              aria-selected={active}
              onClick={() => setStepIdx(i)}
              style={{
                fontFamily: font.mono,
                fontSize: 12.5,
                fontWeight: 600,
                padding: "9px 13px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${active ? accent : "transparent"}`,
                color: active ? color.text : color.textDim,
                marginBottom: -1,
                transition: `color ${motion.fast}, border-color ${motion.fast}`,
              }}
            >
              <span style={{ color: active ? accent : color.textFaint, marginRight: 6 }}>{i + 1}</span>
              {st.label}
            </button>
          );
        })}
      </div>

      <div><StepContent lesson={lesson} stepKey={cur.key} onStepComplete={markComplete} /></div>

      {/* Footer nav — every step has an obvious next action */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${color.hairline}`, paddingTop: 18 }}>
        <Button variant="subtle" icon="arrowLeft" onClick={() => setStepIdx((x) => Math.max(0, x - 1))} disabled={stepIdx === 0}>Back</Button>
        {stepIdx < last ? (
          <Button variant="primary" accent={accent} iconRight="arrowRight" onClick={() => setStepIdx((x) => Math.min(last, x + 1))} style={{ marginLeft: "auto" }}>
            {steps[stepIdx + 1].label}
          </Button>
        ) : (
          <span style={{ marginLeft: "auto", fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>end of lesson</span>
        )}
      </div>
    </div>
  );
}

function StepContent({ lesson, stepKey, onStepComplete }: { lesson: Lesson; stepKey: string; onStepComplete: () => void }) {
  if (isDSA(lesson)) {
    const algo = getAlgorithm(lesson.trace.algorithm);
    switch (stepKey) {
      case "concept":
        return <ConceptCard concept={lesson.concept} />;
      case "trace":
        if (!algo) return <MissingAlgo name={lesson.trace.algorithm} />;
        return <TraceVisualizer steps={algo.run(lesson.trace.input)} renderStep={algo.renderStep} pseudocode={algo.pseudocode} goal={lesson.trace.goal} />;
      case "practice":
        if (!algo) return <MissingAlgo name={lesson.trace.algorithm} />;
        return <SandboxPractice engine={algo.sandbox} input={lesson.practice.input} goal={lesson.practice.goal} onComplete={onStepComplete} />;
      case "recap":
        return <Recap lesson={lesson} />;
    }
  } else {
    switch (stepKey) {
      case "overview":
        return (
          <div style={{ display: "grid", gap: 14 }}>
            <Panel><p style={{ margin: 0, color: color.text, lineHeight: 1.7 }}>{lesson.overview}</p></Panel>
            <Glossary terms={lesson.terms} />
          </div>
        );
      case "clarify":
        return lesson.interview ? <ClarifyInterview interview={lesson.interview} onComplete={onStepComplete} /> : null;
      case "stages":
        return lesson.stages?.length ? <StageBuilder stages={lesson.stages} onComplete={onStepComplete} labels={lesson.stageLabels} /> : null;
      case "recap":
        return <Recap lesson={lesson} />;
    }
  }
  return null;
}

function MissingAlgo({ name }: { name: string }) {
  return <Panel><p style={{ margin: 0, color: color.textDim }}>The <InlineCode>{name}</InlineCode> engine isn't wired up yet.</p></Panel>;
}

// ---------------------------------------------------------------------------
// Recap + confidence check-in
// ---------------------------------------------------------------------------

function Recap({ lesson }: { lesson: Lesson }) {
  const accent = trackColor[lesson.track];
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ display: "grid", gap: 13 }}>
        <Eyebrow tone={accent}>What to carry into the interview</Eyebrow>
        <ul style={{ margin: 0, paddingLeft: 4, display: "grid", gap: 11, listStyle: "none" }}>
          {lesson.recap.map((r, i) => (
            <li key={i} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 10, color: color.text, lineHeight: 1.6 }}>
              <span style={{ color: accent, marginTop: 3 }}><Icon name="check" size={14} strokeWidth={2.2} /></span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <ConfidenceCheckin lesson={lesson} />
    </div>
  );
}

function ConfidenceCheckin({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate();
  const { get, setConfidence } = useProgress();
  const [dismissedSync, setDismissedSync] = useState(false);
  const chosen = get(lesson.id).confidence;

  const nextRec =
    (Object.keys(PATH) as Track[])
      .flatMap((t) => PATH[t])
      .find((n) => n.status === "available" && get(n.id).status !== "completed" && n.id !== lesson.id)?.id;

  const options: { c: Confidence; label: string; tone: string }[] = [
    { c: "shaky", label: "Shaky", tone: color.amber },
    { c: "okay", label: "Okay", tone: color.textDim },
    { c: "solid", label: "Solid", tone: color.teal },
  ];

  return (
    <Panel style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <Eyebrow>How solid does this feel?</Eyebrow>
        <span style={{ fontSize: 13, color: color.textFaint }}>Self-assessment, not a grade. “Shaky” lessons resurface first on your Progress page.</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map((o) => {
          const active = chosen === o.c;
          return (
            <button
              key={o.c}
              onClick={() => setConfidence(lesson.id, o.c)}
              aria-pressed={active}
              style={{
                fontFamily: font.mono,
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: radius.md,
                background: active ? `${o.tone}1e` : "transparent",
                border: `1px solid ${active ? o.tone : color.panelBorder}`,
                color: active ? color.text : color.textDim,
                transition: `all ${motion.fast}`,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {chosen && (
        <div style={{ display: "grid", gap: 14, borderTop: `1px solid ${color.hairline}`, paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: color.green, fontFamily: font.mono, fontSize: 13 }}>
            <Icon name="check" size={15} strokeWidth={2.2} /> Saved. This lesson is now on your map.
          </div>

          {!dismissedSync && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${color.hairline}`, borderRadius: radius.md, padding: "11px 14px" }}>
              <span style={{ fontSize: 13, color: color.textDim, flex: 1 }}>Progress is saved on this device. Cross-device sync is coming later — no account needed to keep learning.</span>
              <button onClick={() => setDismissedSync(true)} style={{ background: "none", border: "none", color: color.textFaint, fontFamily: font.mono, fontSize: 12 }}>dismiss</button>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {nextRec ? (
              <Button accent={trackColor[lesson.track]} iconRight="arrowRight" onClick={() => navigate(`/lesson/${nextRec}`)}>Next lesson</Button>
            ) : (
              <Button accent={trackColor[lesson.track]} iconRight="arrowRight" onClick={() => navigate("/progress")}>See your progress</Button>
            )}
            <Button variant="ghost" onClick={() => navigate("/")}>Back to path</Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function BackLink() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/")}
      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: color.textDim, fontFamily: font.mono, fontSize: 12.5, padding: 0, width: "fit-content" }}
    >
      <Icon name="arrowLeft" size={14} /> Path
    </button>
  );
}
