import { useNavigate } from "react-router-dom";
import { listColdDrills } from "@/content/coldDrills";
import { color, font } from "@/theme/tokens";
import { Panel, Button, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * Cold Design Drill picker — the transfer test. Every guided LLD lesson
 * scaffolds you through one pre-written example; this is the opposite: a
 * bare prompt you've never drilled, a blank workspace, and a reference
 * design revealed only after you commit your own attempt. The bank
 * deliberately includes prompts with no full lesson anywhere else in the
 * app — the point is applying the heuristic cold, not recalling an answer.
 */
export function ColdDrillsPage() {
  const navigate = useNavigate();
  const drills = listColdDrills();

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.5px" }}>Cold Design Drill</h1>
        <p style={{ color: color.textDim, maxWidth: 640 }}>
          No hints, no chip-picking, no watching it get built for you. You get a bare prompt and a blank page —
          name the classes, assign the responsibilities, list the edge cases yourself. Then compare against a
          reference design and see what you missed.
        </p>
      </header>

      <Panel style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", border: `1px solid ${color.violet}55`, background: "rgba(154,130,212,0.06)" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <Eyebrow tone={color.violet}>New to low-level design?</Eyebrow>
          <p style={{ margin: 0, fontSize: 13.5, color: color.textDim, maxWidth: 520 }}>
            This mode is deliberately the hardest one — no hints, no walkthrough. If you've never designed a class
            before, start with the guided lessons instead: they watch it get built for you first, then let you try it.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Button variant="ghost" onClick={() => navigate("/lesson/lld-101")}>
            Start with LLD Basics
          </Button>
          <Button variant="primary" accent={color.violet} onClick={() => navigate("/lesson/parking-lot")}>
            Or Parking Lot
          </Button>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {drills.map((d) => (
          <button key={d.id} onClick={() => navigate(`/drill/${d.id}`)} style={{ textAlign: "left", cursor: "pointer" }}>
            <Panel style={{ display: "grid", gap: 10, height: "100%" }} raised>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 16 }}>{d.title}</span>
                <Icon name="arrowRight" size={16} color={color.violet} />
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: color.textDim, lineHeight: 1.55 }}>"{d.prompt}"</p>
            </Panel>
          </button>
        ))}
      </div>

      <Panel>
        <p style={{ margin: 0, fontSize: 13, color: color.textFaint, lineHeight: 1.6 }}>
          Small bank on purpose — each one is real content, not a generated placeholder. More prompts land here
          over time; this list will keep growing.
        </p>
      </Panel>
    </div>
  );
}
