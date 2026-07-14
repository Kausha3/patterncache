import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listDesignPatterns } from "@/content/designPatterns";
import { listPatternSpotScenarios } from "@/content/patternSpotScenarios";
import type { PatternSpotScenario } from "@/types";
import { color, font, radius, motion } from "@/theme/tokens";
import { Panel, Button, Eyebrow, Divider } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * Design Patterns reference. Two modes:
 *  - Learn: a scannable, collapsed-by-default list (not eight fully-expanded
 *    text walls) — click a pattern to expand it in place, see its "confused
 *    with" disambiguating test, and its real examples.
 *  - Practice: "spot the pattern" — a short scenario, pick which pattern
 *    fits from options that deliberately include its confusable sibling,
 *    commit then reveal. Same shape as edge cases everywhere else in the app.
 */
export function PatternsPage() {
  const [mode, setMode] = useState<"learn" | "practice">("learn");

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.5px" }}>Design Patterns in LLD Interviews</h1>
        <p style={{ color: color.textDim, maxWidth: 640 }}>
          Not a textbook list — only patterns that actually show up in a design already built here. Each one links
          to the real class/method it lives in, and names the pattern it's most often mixed up with.
        </p>
      </header>

      <div style={{ display: "flex", gap: 4 }}>
        <ModeTab active={mode === "learn"} onClick={() => setMode("learn")}>
          Learn
        </ModeTab>
        <ModeTab active={mode === "practice"} onClick={() => setMode("practice")}>
          Practice — Spot the Pattern
        </ModeTab>
      </div>

      {mode === "learn" ? <PatternBrowser /> : <PatternSpotGame />}
    </div>
  );
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: font.mono,
        fontSize: 13,
        fontWeight: 700,
        padding: "9px 16px",
        borderRadius: radius.md,
        border: `1px solid ${active ? `${color.violet}66` : "transparent"}`,
        background: active ? "rgba(154,130,212,0.12)" : "transparent",
        color: active ? color.text : color.textDim,
        transition: `all ${motion.fast}`,
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Learn mode — collapsed-by-default accordion, not eight open text walls
// ---------------------------------------------------------------------------

function firstSentence(text: string): string {
  const i = text.indexOf(". ");
  return i === -1 ? text : text.slice(0, i + 1);
}

function PatternBrowser() {
  const navigate = useNavigate();
  const patterns = listDesignPatterns();
  const [openId, setOpenId] = useState<string | null>(patterns[0]?.id ?? null);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {patterns.map((p) => {
        const isOpen = openId === p.id;
        return (
          <Panel key={p.id} style={{ padding: 0, overflow: "hidden" }}>
            <button
              onClick={() => setOpenId(isOpen ? null : p.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 18px",
                textAlign: "left",
                cursor: "pointer",
                background: isOpen ? "rgba(154,130,212,0.06)" : "transparent",
                border: "none",
              }}
              aria-expanded={isOpen}
            >
              <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 15, color: color.violet }}>{p.name}</span>
                {!isOpen && (
                  <span style={{ fontSize: 12.5, color: color.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {firstSentence(p.whenToUse)}
                  </span>
                )}
              </div>
              <Icon
                name="chevronRight"
                size={16}
                color={color.textFaint}
                style={{ flexShrink: 0, transform: isOpen ? "rotate(90deg)" : "none", transition: `transform ${motion.fast}` }}
              />
            </button>

            {isOpen && (
              <div style={{ padding: "0 18px 18px", display: "grid", gap: 14 }}>
                <p style={{ margin: 0, fontSize: 13.5, color: color.textDim, lineHeight: 1.6 }}>{p.whenToUse}</p>

                {p.confusedWith && (
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      background: "rgba(217,169,78,0.07)",
                      border: `1px solid ${color.amber}44`,
                      borderRadius: radius.md,
                      padding: "12px 14px",
                    }}
                  >
                    <Icon name="target" size={15} color={color.amber} style={{ marginTop: 1, flexShrink: 0 }} />
                    <div style={{ display: "grid", gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: color.amber, fontFamily: font.mono }}>
                        Easy to confuse with{" "}
                        {p.confusedWith.patternId ? (
                          <button
                            onClick={() => setOpenId(p.confusedWith!.patternId!)}
                            style={{ color: color.amber, textDecoration: "underline", fontFamily: font.mono, fontWeight: 700, fontSize: 12, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                          >
                            {p.confusedWith.patternName}
                          </button>
                        ) : (
                          p.confusedWith.patternName
                        )}
                      </span>
                      <span style={{ fontSize: 13, color: color.text, lineHeight: 1.55 }}>{p.confusedWith.test}</span>
                    </div>
                  </div>
                )}

                <Divider />

                <div style={{ display: "grid", gap: 8 }}>
                  <Eyebrow>Where it shows up</Eyebrow>
                  {p.examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(ex.isDrill ? `/drill/${ex.refId}` : `/lesson/${ex.refId}`)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 10,
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: radius.md,
                        border: `1px solid ${color.hairline}`,
                        background: "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "grid", gap: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: color.text }}>{ex.title}</span>
                        <span style={{ fontSize: 12.5, color: color.textDim, lineHeight: 1.5 }}>{ex.howItShowsUp}</span>
                      </div>
                      <Icon name="arrowRight" size={14} color={color.textFaint} style={{ marginTop: 2, flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Practice mode — spot the pattern
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function PatternSpotGame() {
  const patterns = listDesignPatterns();
  const nameOf = (id: string) => patterns.find((p) => p.id === id)?.name ?? id;

  const [order, setOrder] = useState<PatternSpotScenario[]>(() => shuffle(listPatternSpotScenarios()));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, seen: 0 });

  const scenario = order[idx];
  const shuffledOptions = useMemo(() => (scenario ? shuffle(scenario.options) : []), [scenario]);

  if (idx >= order.length) {
    return (
      <Panel style={{ display: "grid", gap: 14, textAlign: "center", padding: "36px 20px" }}>
        <Eyebrow tone={color.violet}>Done</Eyebrow>
        <span style={{ fontSize: 20, fontWeight: 700 }}>
          {score.correct} / {score.seen} scenarios matched to the right pattern
        </span>
        <div>
          <Button
            variant="primary"
            accent={color.violet}
            onClick={() => {
              setOrder(shuffle(listPatternSpotScenarios()));
              setIdx(0);
              setPicked(null);
              setRevealed(false);
              setScore({ correct: 0, seen: 0 });
            }}
          >
            Play again — new shuffle
          </Button>
        </div>
      </Panel>
    );
  }

  const pickedOption = shuffledOptions.find((o) => o.patternId === picked);
  const isCorrect = !!pickedOption?.correct;

  return (
    <Panel style={{ display: "grid", gap: 16 }}>
      <Eyebrow tone={color.violet}>
        Scenario {idx + 1} / {order.length}
      </Eyebrow>
      <p style={{ margin: 0, fontSize: 15, color: color.text, lineHeight: 1.6 }}>{scenario.scenario}</p>

      <div style={{ display: "grid", gap: 8 }}>
        {shuffledOptions.map((opt) => {
          const isPicked = picked === opt.patternId;
          const showResult = revealed;
          const isRightAnswer = showResult && opt.correct;
          const isWrongPick = showResult && isPicked && !opt.correct;
          const tone = isRightAnswer ? color.green : isWrongPick ? color.red : isPicked ? color.violet : color.panelBorder;
          return (
            <div key={opt.patternId}>
              <button
                onClick={() => !revealed && setPicked(opt.patternId)}
                disabled={revealed}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: `1.5px solid ${tone}`,
                  borderRadius: radius.md,
                  padding: "11px 13px",
                  background: isRightAnswer ? "rgba(130,184,114,0.09)" : isWrongPick ? "rgba(208,123,110,0.08)" : isPicked ? "rgba(154,130,212,0.1)" : "rgba(255,255,255,0.02)",
                  color: color.text,
                  fontFamily: font.mono,
                  fontSize: 13.5,
                  fontWeight: 600,
                  transition: `all ${motion.fast}`,
                }}
              >
                {nameOf(opt.patternId)}
              </button>
              {showResult && isPicked && (
                <p style={{ margin: "6px 0 0", fontSize: 12.5, color: color.textDim, paddingLeft: 4, lineHeight: 1.5 }}>{opt.feedback}</p>
              )}
            </div>
          );
        })}
      </div>

      {!revealed ? (
        <div>
          <Button
            variant="primary"
            accent={color.violet}
            disabled={!picked}
            onClick={() => {
              setRevealed(true);
              setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), seen: s.seen + 1 }));
            }}
          >
            Reveal
          </Button>
        </div>
      ) : (
        <div>
          <Button
            variant="primary"
            accent={color.violet}
            iconRight="arrowRight"
            onClick={() => {
              setIdx((i) => i + 1);
              setPicked(null);
              setRevealed(false);
            }}
          >
            {idx < order.length - 1 ? "Next scenario" : "See results"}
          </Button>
        </div>
      )}
    </Panel>
  );
}
