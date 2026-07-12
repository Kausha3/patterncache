import { useCallback, useEffect, useMemo, useState } from "react";
import type { SandboxEngine } from "@/algorithms";
import { color, font } from "@/theme/tokens";
import { Eyebrow, Panel, Button } from "./ui";

/**
 * <SandboxPractice /> — §4.2. The learner drives the algorithm on a *different*
 * input than the trace. Legal actions are buttons; every move (valid or not)
 * is narrated inline — never blocked silently. On finishing, we compare their
 * best to the true optimum without shaming.
 */
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
  const [message, setMessage] = useState<string>("Drive the window with the buttons below. Every move gets explained.");
  const [lastValid, setLastValid] = useState<boolean>(true);
  const [done, setDone] = useState(false);

  const reset = useCallback(() => {
    setState(engine.init(input));
    setMessage("Reset. See if you can find the longest window in fewer moves.");
    setLastValid(true);
    setDone(false);
  }, [engine, input]);

  const act = useCallback(
    (actionId: string) => {
      setState((cur: unknown) => {
        const outcome = engine.apply(cur, actionId);
        setMessage(outcome.message);
        setLastValid(outcome.valid);
        if (outcome.done && !done) {
          setDone(true);
          onComplete?.();
        }
        return outcome.state;
      });
    },
    [engine, done, onComplete],
  );

  // Keyboard shortcuts from the engine's action keys. §9
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const match = engine.actions.find((a) => a.key === e.key);
      if (match) {
        e.preventDefault();
        act(match.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [engine, act]);

  const result = useMemo(() => (done ? engine.score(state) : null), [done, engine, state]);
  const beatIt = result ? result.achieved >= result.optimal : false;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <Eyebrow tone={color.teal}>Now you drive</Eyebrow>
        <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textDim }}>{goal}</span>
      </div>

      <Panel style={{ display: "grid", gap: 16 }}>
        <div>{engine.render(state)}</div>

        {/* Narration — red only when a move was invalid, paired with an icon (§9). */}
        <div
          role="status"
          aria-live="polite"
          style={{
            minHeight: 46,
            background: lastValid ? "rgba(255,255,255,0.02)" : "rgba(201,112,100,0.10)",
            border: `1px solid ${lastValid ? color.panelBorder : color.red}`,
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <span aria-hidden style={{ color: lastValid ? color.teal : color.red, fontWeight: 700 }}>
            {lastValid ? "›" : "✕"}
          </span>
          <p style={{ margin: 0, color: color.text }}>{message}</p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {engine.actions.map((a) => (
            <Button key={a.id} variant="ghost" onClick={() => act(a.id)}>
              {a.label}
            </Button>
          ))}
          <Button variant="chip" onClick={reset} style={{ marginLeft: "auto" }}>
            ⟲ Reset
          </Button>
        </div>

        {/* Completion compare — no shaming. §4.2 */}
        {result && (
          <div
            style={{
              borderTop: `1px solid ${color.panelBorder}`,
              paddingTop: 14,
              display: "grid",
              gap: 6,
            }}
          >
            <Eyebrow tone={beatIt ? color.green : color.amber}>{beatIt ? "Optimal — nice" : "Good run"}</Eyebrow>
            <p style={{ margin: 0, color: color.text }}>
              You found a window of <b>{result.achieved}</b>. The optimum for{" "}
              <code style={{ fontFamily: font.mono, color: color.amber }}>{input}</code> is <b>{result.optimal}</b>.{" "}
              {beatIt ? "You matched it." : "Reset and see if you can reach it."}
            </p>
            <p style={{ margin: 0, color: color.textDim, fontSize: 13 }}>{result.label}</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
