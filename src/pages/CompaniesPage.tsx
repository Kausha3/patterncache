import { useNavigate } from "react-router-dom";
import { listCompanies } from "@/content/companies";
import { color, font, radius } from "@/theme/tokens";
import { Panel, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * Companies landing — the interview-prep lens on top of the DSA/System-Design
 * tracks. Same lessons, filtered and ranked by what a specific company
 * actually asks. Company packs land here without changing the shape of this page.
 */
export function CompaniesPage() {
  const navigate = useNavigate();
  const companies = listCompanies();

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.5px" }}>Companies</h1>
        <p style={{ color: color.textDim, maxWidth: 640 }}>
          Company-specific question lists, backed by real research. Same lessons you already know, just ranked
          by what each company actually asks. Every "signal" tag names the evidence behind it. Nothing here is a guess.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {companies.map((c) => {
          const disabled = c.status === "coming-soon";
          return (
            <button
              key={c.id}
              onClick={() => !disabled && navigate(`/companies/${c.id}`)}
              disabled={disabled}
              style={{ textAlign: "left", cursor: disabled ? "default" : "pointer" }}
            >
              <Panel style={{ display: "grid", gap: 10, opacity: disabled ? 0.55 : 1, height: "100%" }} raised={!disabled}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 16 }}>{c.name}</span>
                  {disabled ? (
                    <span style={{ fontFamily: font.mono, fontSize: 10, color: color.textFaint, border: `1px solid ${color.panelBorder}`, borderRadius: radius.sm, padding: "2px 7px" }}>
                      coming soon
                    </span>
                  ) : (
                    <Icon name="arrowRight" size={16} color={color.teal} />
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: color.textDim, lineHeight: 1.55 }}>{c.blurb}</p>
                {!disabled && (
                  <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
                    <Stat label="HLD" value={c.hld.length} />
                    <Stat label="LLD" value={c.lld.length} />
                  </div>
                )}
              </Panel>
            </button>
          );
        })}
      </div>

      <Panel>
        <Eyebrow tone={color.amber}>A note on the data</Eyebrow>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, color: color.textDim, lineHeight: 1.6 }}>
          Question lists are put together from public, crowd-sourced interview reports and prep vendors. Nobody
          publishes real frequency counts, so "signal" tags are qualitative tiers, not statistics. Hover any of
          them for the evidence behind that tier. See <code style={{ fontFamily: font.mono }}>docs/AMAZON.md</code>,{" "}
          <code style={{ fontFamily: font.mono }}>docs/GOOGLE.md</code>, and <code style={{ fontFamily: font.mono }}>docs/META.md</code> in the repo for full sourcing.
        </p>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textDim }}>
      <b style={{ color: color.text }}>{value}</b> {label}
    </span>
  );
}
