import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HLD_VERIFICATION_WORLDS, getHldVerificationWorldRoute } from "@/arena/hldVerificationWorlds";
import { loadHldVerificationProgress } from "@/game/hldVerificationProgress";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { color, font } from "@/theme/tokens";
import "@/theme/hld-world.css";

export function HldWorldsPage() {
  const navigate = useNavigate();
  const progress = useMemo(() => loadHldVerificationProgress(), []);
  const completed = HLD_VERIFICATION_WORLDS.filter((world) => progress.records[world.id]).length;

  return (
    <div className="hld-map-page" style={{ display: "grid", gap: 24 }}>
      <header style={{ display: "grid", gap: 10, maxWidth: 800 }}>
        <Eyebrow tone={color.blue}>System Design Worlds · beginner campaign</Eyebrow>
        <h1 style={{ fontSize: 34, letterSpacing: "-0.9px" }}>Learn the system one visible request at a time.</h1>
        <p style={{ color: color.textDim, lineHeight: 1.7 }}>
          Link City starts from a blank canvas: build components, draw the request paths, and let incidents execute only the graph you created. Signal Station keeps optional clues. Checkout removes placement hints and becomes the interview transfer world.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Button accent={color.blue} iconRight="arrowRight" onClick={() => navigate(getHldVerificationWorldRoute("url-shortener"))}>Start with the Link City</Button>
          <span style={{ color: completed === HLD_VERIFICATION_WORLDS.length ? color.green : color.textFaint, font: `700 11px ${font.mono}` }}>{completed}/{HLD_VERIFICATION_WORLDS.length} worlds verified</span>
        </div>
      </header>

      <Panel style={{ display: "grid", gap: 13, background: "linear-gradient(120deg, rgba(106,166,219,0.09), rgba(27,29,35,0.98))" }}>
        <Eyebrow tone={color.blue}>Scaffolding fades as you learn</Eyebrow>
        <div className="hld-map-loop">
          {[
            ["1", "Watch one request", "The trace shows exactly where time, data, or reliability leaks."],
            ["2", "Build the request path", "Link City makes you place components and connect the calls yourself."],
            ["3", "Rerun the same traffic", "Metrics and request steps prove whether the system actually changed."],
            ["4", "Lose the hints", "Coached and independent worlds test transfer before the final defense."],
          ].map(([number, title, text]) => <div key={number}><b>{number}</b><span><strong>{title}</strong><small>{text}</small></span></div>)}
        </div>
      </Panel>

      <section aria-label="System Design verification worlds" className="hld-world-map">
        {HLD_VERIFICATION_WORLDS.map((world, index) => {
          const record = progress.records[world.id];
          return (
            <button key={world.id} type="button" onClick={() => navigate(getHldVerificationWorldRoute(world.id))}>
              <Panel raised style={{ height: "100%", display: "grid", gap: 12, borderColor: record ? color.green : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: world.accent, font: `800 10px ${font.mono}`, letterSpacing: "0.8px", textTransform: "uppercase" }}>World {index + 1} · {world.learningMode} · {world.incidents.length} incidents</span>
                  <Icon name={record ? "check" : "arrowRight"} size={16} color={record ? color.green : world.accent} />
                </div>
                <div><h2 style={{ fontSize: 20 }}>{world.title}</h2><span style={{ color: color.textFaint, font: `700 11px ${font.mono}` }}>{world.systemName}</span></div>
                <p style={{ color: color.textDim, lineHeight: 1.55, fontSize: 13 }}>{world.tagline}</p>
                <span style={{ color: record ? color.green : color.textFaint, font: `700 10px ${font.mono}`, textTransform: "uppercase" }}>{record ? `Verified · ${record.bestScore}/100 defense` : index === 0 ? "Canvas build · graph-driven incidents" : index === 1 ? "Practice · optional clues" : "Transfer · no placement hints"}</span>
              </Panel>
            </button>
          );
        })}
      </section>

      <p style={{ color: color.textFaint, fontSize: 12 }}><Icon name="shield" size={13} /> Verification requires every live incident to pass and a free-form defense with concrete boundaries, observed evidence, a scale consequence, a rejected tradeoff, and change handling.</p>
    </div>
  );
}
