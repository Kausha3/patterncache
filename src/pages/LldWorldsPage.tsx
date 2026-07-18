import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LLD_VERIFICATION_WORLDS, getLldVerificationWorldRoute } from "@/arena/lldVerificationWorlds";
import { Icon } from "@/components/Icon";
import { Eyebrow, Panel } from "@/components/ui";
import { loadCompletedLldVerificationWorldIds } from "@/game/lldVerificationProgress";
import { loadParkingLotGauntletProgress } from "@/game/parkingLotGauntletProgress";
import { color, font } from "@/theme/tokens";

const PARKING_WORLD = {
  id: "parking-lot",
  title: "Parking Lot Design Gauntlet",
  systemName: "Parking Lot",
  route: "/arena/lld-world/parking-lot",
  incidents: 6,
  accent: color.teal,
  tagline: "Allocation, concurrency, tickets, pricing, and payment survive one coherent object model.",
};

/** One map for exact interview verification; System Forge remains the beginner curriculum. */
export function LldWorldsPage() {
  const navigate = useNavigate();
  const completed = useMemo(() => loadCompletedLldVerificationWorldIds(), []);
  const parkingCompleted = useMemo(() => !!loadParkingLotGauntletProgress().record, []);
  const worlds = [
    { ...PARKING_WORLD, completed: parkingCompleted },
    ...LLD_VERIFICATION_WORLDS.map((world) => ({
      id: world.id,
      title: world.title,
      systemName: world.systemName,
      route: getLldVerificationWorldRoute(world.id),
      incidents: world.incidents.length,
      accent: world.accent,
      tagline: world.tagline,
      completed: completed.has(world.id),
    })),
  ];
  const cleared = worlds.filter((world) => world.completed).length;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <header style={{ display: "grid", gap: 10, maxWidth: 780 }}>
        <Eyebrow tone={color.teal}>Exact Amazon LLD practice · 6 worlds</Eyebrow>
        <h1 style={{ fontSize: 32, letterSpacing: "-0.8px" }}>Learn the idea first. Then prove the design.</h1>
        <p style={{ color: color.textDim, lineHeight: 1.7 }}>
          New to LLD? Begin with System Forge, which teaches one responsibility at a time. Use these worlds afterward as interview simulations: run a broken system, use its failure as evidence, move real state or behavior, rerun it, and defend the finished model without supplied answers.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <button type="button" onClick={() => navigate("/arena/pattern-genome")} style={secondaryActionStyle}>Learn from chapter 1</button>
          <span style={{ color: cleared === worlds.length ? color.green : color.amber, fontFamily: font.mono, fontSize: 12, fontWeight: 750 }}>{cleared}/{worlds.length} exact worlds verified</span>
        </div>
      </header>

      <section aria-label="Amazon LLD verification worlds" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 14 }}>
        {worlds.map((world, index) => (
          <button key={world.id} type="button" data-testid={`lld-world-card-${world.id}`} onClick={() => navigate(world.route)} style={{ cursor: "pointer", textAlign: "left" }}>
            <Panel raised style={{ display: "grid", gap: 12, height: "100%", borderColor: world.completed ? color.green : undefined }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: world.accent, font: `800 11px ${font.mono}`, letterSpacing: "0.8px", textTransform: "uppercase" }}>World {index + 1} · {world.incidents} incidents</span>
                <Icon name={world.completed ? "check" : "arrowRight"} size={16} color={world.completed ? color.green : world.accent} />
              </div>
              <div>
                <h2 style={{ fontSize: 19, marginBottom: 5 }}>{world.systemName}</h2>
                <span style={{ color: color.textFaint, font: `700 11px ${font.mono}` }}>{world.title}</span>
              </div>
              <p style={{ color: color.textDim, lineHeight: 1.55, fontSize: 13 }}>{world.tagline}</p>
              <span style={{ color: world.completed ? color.green : color.textFaint, font: `750 10px ${font.mono}`, textTransform: "uppercase", letterSpacing: "0.7px" }}>{world.completed ? "Verified on this device" : "Run → observe → repair → defend"}</span>
            </Panel>
          </button>
        ))}
      </section>

      <p style={{ color: color.textFaint, fontSize: 12 }}><Icon name="shield" size={13} /> A completion is saved only after every live incident passes against the whole model and the free-form defense names concrete owners, evidence, change boundaries, and a rejected alternative.</p>
    </div>
  );
}

const secondaryActionStyle = {
  width: "fit-content",
  border: `1px solid ${color.violet}`,
  borderRadius: 8,
  padding: "10px 14px",
  color: color.text,
  background: "rgba(154,130,212,0.11)",
  fontFamily: font.mono,
  fontSize: 12,
  fontWeight: 750,
  cursor: "pointer",
} as const;
