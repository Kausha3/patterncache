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
import { Button, Eyebrow, Panel } from "@/components/ui";
import { color, font, trackColor } from "@/theme/tokens";

export function LessonPage() {
  const { id = "" } = useParams();
  const lesson = getLesson(id);
  const node = (Object.keys(PATH) as Track[]).flatMap((t) => PATH[t]).find((n) => n.id === id);

  if (!lesson) return <ComingSoon title={node?.title ?? "This lesson"} />;
  return <LessonShell key={lesson.id} lesson={lesson} />;
}

// ---------------------------------------------------------------------------
// Not-yet-built lesson — a real screen, never a dead end (§1).
// ---------------------------------------------------------------------------

function ComingSoon({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 560 }}>
      <BackLink />
      <Panel style={{ display: "grid", gap: 14 }}>
        <Eyebrow tone={color.amber}>On the roadmap</Eyebrow>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{title}</h1>
        <p style={{ margin: 0, color: color.textDim }}>
          This lesson isn't built yet — every lesson is hand-crafted so the reasoning actually holds up, and we ship
          depth before breadth. In the meantime, here's one that's ready to run.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={() => navigate(`/lesson/${RECOMMENDED_FIRST}`)}>▶ Start Sliding Window</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>See the full path</Button>
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lesson shell — same four/three-step shape every time (§2).
// ---------------------------------------------------------------------------

interface StepDef {
  key: string;
  label: string;
}

function LessonShell({ lesson }: { lesson: Lesson }) {
  const { setStatus } = useProgress();
  const steps: StepDef[] = isDSA(lesson)
    ? [
        { key: "concept", label: "Concept" },
        { key: "trace", label: "Watch it run" },
        { key: "practice", label: "Now you drive" },
        { key: "recap", label: "Recap" },
      ]
    : [
        { key: "overview", label: "Overview" },
        { key: "stages", label: "Build it" },
        { key: "recap", label: "Recap" },
      ];

  const [stepIdx, setStepIdx] = useState(0);
  const accent = trackColor[lesson.track];
  const cur = steps[stepIdx];
  const last = steps.length - 1;

  // Entering a lesson marks it in-progress.
  useEffect(() => {
    setStatus(lesson.id, "in-progress");
  }, [lesson.id, setStatus]);

  const markComplete = () => setStatus(lesson.id, "completed");

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <BackLink />

      <header style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              color: accent,
              border: `1px solid ${accent}`,
              borderRadius: 999,
              padding: "2px 9px",
            }}
          >
            {lesson.track === "dsa" ? "DSA" : "System Design"}
          </span>
          <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>~{lesson.estMinutes} min</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px" }}>{lesson.title}</h1>
      </header>

      {/* Sub-nav — same shape every lesson, always clickable */}
      <div role="tablist" style={{ display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${color.panelBorder}`, paddingBottom: 2 }}>
        {steps.map((s, i) => {
          const active = i === stepIdx;
          return (
            <button
              key={s.key}
              role="tab"
              aria-selected={active}
              onClick={() => setStepIdx(i)}
              style={{
                fontFamily: font.mono,
                fontSize: 13,
                fontWeight: 700,
                padding: "8px 14px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${active ? accent : "transparent"}`,
                color: active ? color.text : color.textDim,
                marginBottom: -3,
              }}
            >
              {i + 1}. {s.label}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div>
        <StepContent lesson={lesson} stepKey={cur.key} onStepComplete={markComplete} />
      </div>

      {/* Footer nav — no dead ends: every step has an obvious next action */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${color.panelBorder}`, paddingTop: 16 }}>
        <Button variant="ghost" onClick={() => setStepIdx((x) => Math.max(0, x - 1))} disabled={stepIdx === 0}>
          ← Back
        </Button>
        {stepIdx < last ? (
          <Button variant="primary" accent={accent} onClick={() => setStepIdx((x) => Math.min(last, x + 1))} style={{ marginLeft: "auto" }}>
            Next: {steps[stepIdx + 1].label} →
          </Button>
        ) : (
          <span style={{ marginLeft: "auto", fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>
            end of lesson
          </span>
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
        return <TraceVisualizer steps={algo.run(lesson.trace.input)} renderStep={algo.renderStep} goal={lesson.trace.goal} />;
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
          <Panel>
            <p style={{ margin: 0, color: color.text, lineHeight: 1.7 }}>{lesson.overview}</p>
          </Panel>
        );
      case "stages":
        return <StageBuilder stages={lesson.stages} onComplete={onStepComplete} />;
      case "recap":
        return <Recap lesson={lesson} />;
    }
  }
  return null;
}

function MissingAlgo({ name }: { name: string }) {
  return (
    <Panel>
      <p style={{ margin: 0, color: color.textDim }}>
        The <code style={{ fontFamily: font.mono, color: color.amber }}>{name}</code> engine isn't wired up yet.
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Recap + confidence check-in (§7)
// ---------------------------------------------------------------------------

function Recap({ lesson }: { lesson: Lesson }) {
  const accent = trackColor[lesson.track];
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ display: "grid", gap: 12 }}>
        <Eyebrow tone={accent}>What to carry into the interview</Eyebrow>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 10 }}>
          {lesson.recap.map((r, i) => (
            <li key={i} style={{ color: color.text, lineHeight: 1.6 }}>{r}</li>
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
        <Eyebrow tone={color.textDim}>How solid does this feel?</Eyebrow>
        <span style={{ fontSize: 13, color: color.textFaint }}>
          Self-assessment, not a grade. "Shaky" lessons resurface first on your Progress page.
        </span>
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
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: 10,
                background: active ? `${o.tone}22` : "transparent",
                border: `1.5px solid ${active ? o.tone : color.panelBorder}`,
                color: active ? color.text : color.textDim,
                transition: "all 160ms ease",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {chosen && (
        <div style={{ display: "grid", gap: 14, borderTop: `1px solid ${color.panelBorder}`, paddingTop: 14 }}>
          <p style={{ margin: 0, color: color.green, fontFamily: font.mono, fontSize: 13 }}>
            ✓ Saved. This lesson is now on your map.
          </p>

          {/* Soft, honest, dismissible sync prompt — only after finishing (§6). */}
          {!dismissedSync && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${color.panelBorder}`,
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <span style={{ fontSize: 13, color: color.textDim, flex: 1 }}>
                Progress is saved on this device. Cross-device sync is coming later — no account needed to keep learning.
              </span>
              <button onClick={() => setDismissedSync(true)} style={{ background: "none", border: "none", color: color.textFaint, fontFamily: font.mono, fontSize: 12 }}>
                dismiss
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {nextRec ? (
              <Button accent={trackColor[lesson.track]} onClick={() => navigate(`/lesson/${nextRec}`)}>
                Next lesson →
              </Button>
            ) : (
              <Button accent={trackColor[lesson.track]} onClick={() => navigate("/progress")}>
                See your progress →
              </Button>
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
      style={{ background: "none", border: "none", color: color.textDim, fontFamily: font.mono, fontSize: 12.5, padding: 0, width: "fit-content" }}
    >
      ← Path
    </button>
  );
}
