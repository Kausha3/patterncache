import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { TraceStep } from "@/types";
import { color, font, radius, motion } from "@/theme/tokens";
import { Panel, Button, SectionHeader } from "./ui";

/**
 * <TraceVisualizer /> — generic step player. Shows the algorithm-specific
 * visualization *and* the pseudocode, with the executing line highlighted in
 * lockstep, so learners connect the state change to the exact line of logic.
 */
export function TraceVisualizer({
  steps,
  renderStep,
  pseudocode,
  goal,
  onComplete,
  eyebrow = "Watch it run",
  accent = color.teal,
}: {
  steps: TraceStep[];
  renderStep: (step: TraceStep) => ReactNode;
  /** Omit for traces with no literal code to sync to (e.g. an OOD reasoning trace) — the side panel just won't render. */
  pseudocode?: string[];
  goal: string;
  onComplete?: () => void;
  /** Header label + accent color — DSA defaults to "Watch it run" / teal; other lesson types can relabel. */
  eyebrow?: string;
  accent?: string;
}) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reachedEnd = useRef(false);

  const last = steps.length - 1;
  const atEnd = i >= last;
  const step = steps[i];

  const go = useCallback((next: number) => setI(Math.max(0, Math.min(last, next))), [last]);

  useEffect(() => {
    if (!playing) return;
    if (atEnd) { setPlaying(false); return; }
    // Scale dwell time to how much there is to read — a one-word DSA tag and a
    // full LLD reasoning sentence shouldn't advance at the same fixed pace.
    const duration = Math.min(4500, Math.max(1200, 600 + step.explanation.length * 20));
    const t = setTimeout(() => setI((x) => Math.min(last, x + 1)), duration);
    return () => clearTimeout(t);
  }, [playing, atEnd, i, last, step.explanation]);

  useEffect(() => {
    if (atEnd && !reachedEnd.current) { reachedEnd.current = true; onComplete?.(); }
  }, [atEnd, onComplete]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setPlaying(false); go(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setPlaying(false); go(i - 1); }
    else if (e.key === " ") { e.preventDefault(); if (!atEnd) setPlaying((p) => !p); }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={onKey}
      aria-label="Algorithm trace. Left/right arrows step, space plays."
      style={{ display: "grid", gap: 14, outline: "none" }}
    >
      <SectionHeader eyebrow={eyebrow} tone={accent} meta={goal} />

      <Panel style={{ display: "grid", gap: 18 }}>
        {/* Visualization + synced pseudocode (pseudocode panel omitted if not provided) */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 300px", minWidth: 0 }}>{renderStep(step)}</div>
          {pseudocode && <Pseudocode lines={pseudocode} active={step.line} accent={accent} />}
        </div>

        {/* Explanation — the "why" for this step */}
        <div
          style={{
            minHeight: 54,
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${color.hairline}`,
            borderRadius: radius.md,
            padding: "13px 15px",
            display: "flex",
            gap: 11,
            alignItems: "flex-start",
          }}
        >
          {step.tag && <StepTag tag={step.tag} milestone={step.milestone} accent={accent} />}
          <p style={{ margin: 0, color: color.text }}>{step.explanation}</p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Button variant="subtle" icon="reset" onClick={() => { setPlaying(false); setI(0); }} disabled={i === 0}>
            Reset
          </Button>
          <Button variant="ghost" icon="stepBack" onClick={() => { setPlaying(false); go(i - 1); }} disabled={i === 0} aria-label="Step back" />
          <Button
            variant="primary"
            accent={accent}
            icon={playing ? "pause" : "play"}
            onClick={() => { if (atEnd) { setI(0); setPlaying(true); } else setPlaying((p) => !p); }}
          >
            {playing ? "Pause" : atEnd ? "Replay" : "Play"}
          </Button>
          <Button variant="ghost" iconRight="stepForward" onClick={() => { setPlaying(false); go(i + 1); }} disabled={atEnd} aria-label="Step forward" />
          <div style={{ marginLeft: "auto", fontFamily: font.mono, fontSize: 12, color: color.textDim }}>
            step {String(i + 1).padStart(2, "0")} / {steps.length}
          </div>
        </div>

        <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: radius.pill }}>
          <div style={{ width: `${((i + 1) / steps.length) * 100}%`, height: "100%", background: accent, borderRadius: radius.pill, transition: `width ${motion.step}` }} />
        </div>
      </Panel>
    </div>
  );
}

function StepTag({ tag, milestone, accent }: { tag: string; milestone?: boolean; accent: string }) {
  const tone = milestone ? color.amber : accent;
  return (
    <span
      style={{
        fontFamily: font.mono,
        fontSize: 9.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        color: tone,
        background: milestone ? "rgba(217,169,78,0.1)" : "rgba(91,176,173,0.1)",
        border: `1px solid ${tone}`,
        borderRadius: radius.sm,
        padding: "3px 7px",
        whiteSpace: "nowrap",
        marginTop: 1,
      }}
    >
      {tag}
    </span>
  );
}

function Pseudocode({ lines, active, accent }: { lines: string[]; active?: number; accent: string }) {
  return (
    <div
      role="img"
      aria-label="Pseudocode with the current line highlighted"
      style={{
        flex: "1 1 320px",
        minWidth: 280,
        background: "#15171C",
        border: `1px solid ${color.hairline}`,
        borderRadius: radius.md,
        padding: "12px 4px",
        overflowX: "auto",
      }}
    >
      {lines.map((ln, idx) => {
        const on = idx === active;
        return (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "30px 1fr",
              alignItems: "baseline",
              padding: "2px 12px 2px 0",
              borderLeft: `2px solid ${on ? accent : "transparent"}`,
              background: on ? `${accent}18` : "transparent",
              transition: `background ${motion.step}, border-color ${motion.step}`,
            }}
          >
            <span style={{ fontFamily: font.mono, fontSize: 11, color: on ? accent : color.textFaint, textAlign: "right", paddingRight: 10, userSelect: "none" }}>
              {idx + 1}
            </span>
            <code
              style={{
                fontFamily: font.mono,
                fontSize: 12.5,
                lineHeight: 1.5,
                whiteSpace: "pre",
                color: on ? color.text : color.textDim,
                fontWeight: on ? 600 : 400,
              }}
            >
              {ln}
            </code>
          </div>
        );
      })}
    </div>
  );
}
