import { useCallback, useEffect, useMemo, useState } from "react";
import type { SandboxEngine } from "@/algorithms";
import { color, font, radius } from "@/theme/tokens";
import { Panel, Button, SectionHeader, Eyebrow, InlineCode } from "./ui";
import { Icon, type IconName } from "./Icon";

/**
 * <SandboxPractice /> — the learner drives the algorithm on a *different* input
 * than the trace. Every move (valid or not) is narrated inline — never blocked
 * silently. On finishing, compares their best to the true optimum, no shaming.
 */

const ACTION_ICON: Record<string, IconName> = { expand: "plus", shrink: "minus" };

export function SandboxPractice({
  engine,
  input,
  goal,
  onComplete,
}: {
  engine: SandboxEngine;
  input: string;
  goal: string;
  onComplete?: () => void;
}) {
  const [state, setState] = useState<unknown>(() => engine.init(input));
  const [message, setMessage] = useState<string>("Drive the window with the controls below. Every move gets explained.");
  const [lastValid, setLastValid] = useState<boolean>(true);
  const [done, setDone] = useState(false);

  const reset = useCallback(() => {
    setState(engine.init(input));
    setMessage("Reset. See if you can reach the longest window in fewer moves.");
    setLastValid(true);
    setDone(false);
  }, [engine, input]);

  const act = useCallback(
    (actionId: string) => {
      setState((cur: unknown) => {
        const outcome = engine.apply(cur, actionId);
        setMessage(outcome.message);
        setLastValid(outcome.valid);
        if (outcome.done && !done) { setDone(true); onComplete?.(); }
        return outcome.state;
      });
    },
    [engine, done, onComplete],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const match = engine.actions.find((a) => a.key === e.key);
      if (match) { e.preventDefault(); act(match.id); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [engine, act]);

  const result = useMemo(() => (done ? engine.score(state) : null), [done, engine, state]);
  const beatIt = result ? result.achieved >= result.optimal : false;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <SectionHeader eyebrow="Now you drive" tone={color.teal} meta={goal} />

      <Panel style={{ display: "grid", gap: 18 }}>
        <div>{engine.render(state)}</div>

        {/* Narration — red only on an invalid move, always paired with an icon. */}
        <div
          role="status"
          aria-live="polite"
          style={{
            minHeight: 50,
            background: lastValid ? "rgba(255,255,255,0.02)" : "rgba(208,123,110,0.09)",
            border: `1px solid ${lastValid ? color.hairline : color.red}`,
            borderRadius: radius.md,
            padding: "13px 15px",
            display: "flex",
            gap: 11,
            alignItems: "flex-start",
          }}
        >
          <span style={{ color: lastValid ? color.teal : color.red, marginTop: 1 }}>
            <Icon name={lastValid ? "chevronRight" : "close"} size={16} />
          </span>
          <p style={{ margin: 0, color: color.text }}>{message}</p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {engine.actions.map((a) => (
            <Button key={a.id} variant="ghost" icon={ACTION_ICON[a.id]} onClick={() => act(a.id)}>
              {a.label}
            </Button>
          ))}
          <Button variant="subtle" icon="reset" onClick={reset} style={{ marginLeft: "auto" }}>
            Reset
          </Button>
        </div>

        {result && (
          <div style={{ borderTop: `1px solid ${color.hairline}`, paddingTop: 16, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: beatIt ? color.green : color.amber }}>
                <Icon name={beatIt ? "check" : "target"} size={16} />
              </span>
              <Eyebrow tone={beatIt ? color.green : color.amber}>{beatIt ? "Optimal — nicely done" : "Good run"}</Eyebrow>
            </div>
            <p style={{ margin: 0, color: color.text }}>
              You found a window of <b>{result.achieved}</b>. The optimum for <InlineCode>{input}</InlineCode> is <b>{result.optimal}</b>.{" "}
              {beatIt ? "You matched it." : "Reset and see if you can reach it."}
            </p>
            <p style={{ margin: 0, color: color.textDim, fontSize: 13, fontFamily: font.mono }}>{result.label}</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
