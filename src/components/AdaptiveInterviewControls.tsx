import { Divider, Eyebrow, Panel } from "@/components/ui";
import {
  ADAPTIVE_MODEL_OPTIONS,
  type AdaptiveInterviewConfig,
  type AdaptiveInterviewTurn,
} from "@/interview/adaptiveInterviewer";
import { color, font, radius } from "@/theme/tokens";

const FIELD_STYLE = {
  width: "100%",
  border: `1px solid ${color.panelBorder}`,
  borderRadius: radius.md,
  background: color.bg,
  color: color.text,
  fontFamily: font.mono,
  fontSize: 12,
  padding: "9px 11px",
} as const;

export function AdaptiveInterviewSetup({
  config,
  onChange,
}: {
  config: AdaptiveInterviewConfig;
  onChange: (config: AdaptiveInterviewConfig) => void;
}) {
  const ready = config.apiKey.trim().length >= 20 && config.consent;
  const setEnabled = (enabled: boolean) => {
    onChange(enabled ? { ...config, enabled } : { ...config, enabled: false, apiKey: "", consent: false });
  };

  return (
    <Panel style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 5 }}>
          <Eyebrow tone={color.violet}>Optional · adaptive follow-ups</Eyebrow>
          <strong style={{ fontSize: 14 }}>Bring your own OpenAI key</strong>
          <span style={{ color: color.textDim, fontSize: 12.5, lineHeight: 1.5 }}>
            The normal interview works without AI. BYOK adds a limited number of answer-specific follow-up questions.
          </span>
        </div>
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center", color: config.enabled ? color.violet : color.textDim, fontFamily: font.mono, fontSize: 12, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Use adaptive mode
        </label>
      </div>

      {config.enabled ? (
        <>
          <div style={{ borderLeft: `3px solid ${color.amber}`, background: `${color.amberDim}55`, padding: "10px 12px", display: "grid", gap: 5 }}>
            <strong style={{ color: color.amber, fontFamily: font.mono, fontSize: 11.5 }}>Advanced client-side mode</strong>
            <span style={{ color: color.textDim, fontSize: 11.5, lineHeight: 1.55 }}>
              PatternCache never saves or proxies this key, but the request runs from your browser. OpenAI recommends
              keeping API keys out of browser code because scripts or extensions with page access could expose them.
              Use a restricted project key with a small spend limit, then rotate or revoke it after practice.
            </span>
            <span style={{ fontSize: 11.5 }}>
              <a href="https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety" target="_blank" rel="noreferrer" style={{ color: color.amber }}>
                Read OpenAI's key-safety guidance
              </a>
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, color: color.textDim, fontFamily: font.mono, fontSize: 11 }}>
              OpenAI project key · held in this tab only
              <input
                type="password"
                value={config.apiKey}
                onChange={(event) => onChange({ ...config, apiKey: event.target.value })}
                placeholder="Paste a restricted project key"
                autoComplete="off"
                spellCheck={false}
                style={FIELD_STYLE}
                aria-describedby="byok-memory-note"
              />
            </label>
            <label style={{ display: "grid", gap: 6, color: color.textDim, fontFamily: font.mono, fontSize: 11 }}>
              Model
              <select
                value={config.model}
                onChange={(event) => onChange({ ...config, model: event.target.value as AdaptiveInterviewConfig["model"] })}
                style={FIELD_STYLE}
              >
                {ADAPTIVE_MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div id="byok-memory-note" style={{ color: color.textFaint, fontSize: 11.5, lineHeight: 1.5 }}>
            Refreshing, disabling adaptive mode, or leaving this page clears the key. It is never written to session history.
          </div>

          <fieldset style={{ margin: 0, padding: 0, border: 0, display: "grid", gap: 7 }}>
            <legend style={{ color: color.textDim, fontFamily: font.mono, fontSize: 11, marginBottom: 6 }}>Maximum paid requests this interview</legend>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {([1, 3, 5] as const).map((count) => (
                <label key={count} style={{ display: "inline-flex", gap: 6, alignItems: "center", border: `1px solid ${config.maxTurns === count ? color.violet : color.panelBorder}`, borderRadius: radius.md, padding: "7px 10px", color: config.maxTurns === count ? color.text : color.textDim, fontFamily: font.mono, fontSize: 11.5, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="adaptive-request-limit"
                    value={count}
                    checked={config.maxTurns === count}
                    onChange={() => onChange({ ...config, maxTurns: count })}
                  />
                  {count} {count === 1 ? "probe" : "probes"}
                </label>
              ))}
            </div>
          </fieldset>

          <label style={{ display: "flex", gap: 9, alignItems: "flex-start", color: color.textDim, fontSize: 11.5, lineHeight: 1.55, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={config.consent}
              onChange={(event) => onChange({ ...config, consent: event.target.checked })}
              style={{ marginTop: 3 }}
            />
            I understand that the current question, my answer, and deterministic coaching signals will be sent directly
            from this browser to OpenAI. My full resume and job description will not be sent.
          </label>

          <Divider />
          <span role="status" style={{ color: ready ? color.green : color.textFaint, fontFamily: font.mono, fontSize: 11.5 }}>
            {ready ? `Ready · at most ${config.maxTurns} adaptive request${config.maxTurns === 1 ? "" : "s"}` : "Adaptive mode is not ready until a complete key and consent are provided."}
          </span>
        </>
      ) : null}
    </Panel>
  );
}

export function AdaptiveInterviewFeedback({
  turn,
  loading,
  error,
  requestsUsed,
  requestLimit,
  limitReached,
}: {
  turn?: AdaptiveInterviewTurn;
  loading: boolean;
  error?: string;
  requestsUsed: number;
  requestLimit: number;
  limitReached: boolean;
}) {
  if (!loading && !turn && !error && !limitReached) return null;
  return (
    <div aria-live="polite" style={{ display: "grid", gap: 10, border: `1px solid ${turn ? `${color.violet}66` : color.panelBorder}`, borderRadius: radius.md, padding: 14, background: "rgba(154,130,212,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <Eyebrow tone={color.violet}>Adaptive interviewer · AI-generated, never a score</Eyebrow>
        <span style={{ color: color.textFaint, fontFamily: font.mono, fontSize: 10.5 }}>{requestsUsed}/{requestLimit} requests used</span>
      </div>
      {loading ? (
        <span style={{ color: color.textDim, fontSize: 12.5 }}>Reading this answer for the highest-value follow-up… You can continue without waiting.</span>
      ) : null}
      {error ? (
        <span role="alert" style={{ color: color.red, fontSize: 12.5, lineHeight: 1.5 }}>{error}</span>
      ) : null}
      {limitReached && !loading && !turn && !error ? (
        <span style={{ color: color.textDim, fontSize: 12.5 }}>Adaptive request limit reached. The deterministic interview continues locally.</span>
      ) : null}
      {turn ? (
        <>
          <p style={{ margin: 0, color: color.textDim, fontSize: 12.5, lineHeight: 1.55 }}>{turn.observation}</p>
          {turn.strengths.length > 0 ? <SignalList label="Evidence it noticed" values={turn.strengths} tone={color.green} /> : null}
          {turn.gaps.length > 0 ? <SignalList label="What it wants to test" values={turn.gaps} tone={color.amber} /> : null}
          <div style={{ borderLeft: `3px solid ${color.violet}`, paddingLeft: 11, display: "grid", gap: 4 }}>
            <strong style={{ color: color.text, fontSize: 13.5, lineHeight: 1.5 }}>{turn.followUpQuestion}</strong>
            <span style={{ color: color.textFaint, fontSize: 11.5, lineHeight: 1.5 }}>{turn.reason}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SignalList({ label, values, tone }: { label: string; values: string[]; tone: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <span style={{ color: tone, fontFamily: font.mono, fontSize: 10.5 }}>{label}</span>
      {values.map((value) => <span key={value} style={{ color: color.textDim, fontSize: 12, lineHeight: 1.45 }}>· {value}</span>)}
    </div>
  );
}
