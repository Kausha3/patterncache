import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { TraceStep } from "@/types";
import { color, font } from "@/theme/tokens";
import { Eyebrow, Panel, Button } from "./ui";

/**
 * <TraceVisualizer /> — §4.1. Generic step player. It knows nothing about the
 * algorithm: it takes a steps[] array and a renderStep(step) function (both
 * resolved from the ALGORITHMS registry) and provides Reset / Back / Forward /
 * Play-Pause. Every DSA lesson reuses this exact shell.
 */
export function TraceVisualizer({
  steps,
  renderStep,
  goal,
  onComplete,
}: {
  steps: TraceStep[];
  renderStep: (step: TraceStep) => ReactNode;
  goal: string;
  onComplete?: () => void;
}) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reachedEnd = useRef(false);

  const last = steps.length - 1;
  const atEnd = i >= last;
  const step = steps[i];

  const go = useCallback(
    (next: number) => setI(Math.max(0, Math.min(last, next))),
    [last],
  );

  // Autoplay
  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setI((x) => Math.min(last, x + 1)), 900);
    return () => clearTimeout(t);
  }, [playing, atEnd, i, last]);

  // Fire completion once the learner has seen the whole trace.
  useEffect(() => {
    if (atEnd && !reachedEnd.current) {
      reachedEnd.current = true;
      onComplete?.();
    }
  }, [atEnd, onComplete]);

  // Keyboard: ← → to step, space to play/pause. §9
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setPlaying(false); go(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setPlaying(false); go(i - 1); }
    else if (e.key === " ") { e.preventDefault(); if (!atEnd) setPlaying((p) => !p); }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={onKey}
      aria-label="Algorithm trace. Use left and right arrow keys to step, space to play."
      style={{ display: "grid", gap: 14, outline: "none" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <Eyebrow tone={color.teal}>Watch it run</Eyebrow>
        <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textDim }}>{goal}</span>
      </div>

      <Panel style={{ display: "grid", gap: 16 }}>
        {/* Visual snapshot — algorithm-specific renderer */}
        <div>{renderStep(step)}</div>

        {/* Explanation — the "why" */}
        <div
          style={{
            minHeight: 52,
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${color.panelBorder}`,
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          {step.tag && (
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: step.milestone ? color.amber : color.teal,
                border: `1px solid ${step.milestone ? color.amber : color.teal}`,
                borderRadius: 999,
                padding: "2px 8px",
                whiteSpace: "nowrap",
                marginTop: 1,
              }}
            >
              {step.tag}
            </span>
          )}
          <p style={{ margin: 0, color: color.text }}>{step.explanation}</p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Button variant="ghost" onClick={() => { setPlaying(false); setI(0); }} disabled={i === 0} aria-label="Reset to start">
            ⟲ Reset
          </Button>
          <Button variant="ghost" onClick={() => { setPlaying(false); go(i - 1); }} disabled={i === 0} aria-label="Step back">
            ← Back
          </Button>
          <Button
            variant="primary"
            onClick={() => { if (atEnd) { setI(0); setPlaying(true); } else setPlaying((p) => !p); }}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "❚❚ Pause" : atEnd ? "↻ Replay" : "▶ Play"}
          </Button>
          <Button variant="ghost" onClick={() => { setPlaying(false); go(i + 1); }} disabled={atEnd} aria-label="Step forward">
            Forward →
          </Button>
          <div style={{ marginLeft: "auto", fontFamily: font.mono, fontSize: 12, color: color.textDim }}>
            step {i + 1} / {steps.length}
          </div>
        </div>

        {/* Progress rail */}
        <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999 }}>
          <div
            style={{
              width: `${((i + 1) / steps.length) * 100}%`,
              height: "100%",
              background: color.teal,
              borderRadius: 999,
              transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
      </Panel>
    </div>
  );
}
