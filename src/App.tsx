import { NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { LessonPage } from "@/pages/LessonPage";
import { ProgressPage } from "@/pages/ProgressPage";
import { CompaniesPage } from "@/pages/CompaniesPage";
import { CompanyPage } from "@/pages/CompanyPage";
import { ColdDrillsPage } from "@/pages/ColdDrillsPage";
import { ColdDrillPage } from "@/pages/ColdDrillPage";
import { color, font } from "@/theme/tokens";

/** Persistent 3-item top nav (§2) + routed pages. */
export function App() {
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <TopNav />
      <main style={{ flex: 1, width: "100%", maxWidth: 1040, margin: "0 auto", padding: "28px 20px 64px" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyPage />} />
          <Route path="/drill" element={<ColdDrillsPage />} />
          <Route path="/drill/:id" element={<ColdDrillPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}

function TopNav() {
  const items = [
    { to: "/", label: "Path", end: true },
    { to: "/companies", label: "Companies", end: false },
    { to: "/drill", label: "Drill", end: false },
    { to: "/progress", label: "Progress", end: false },
  ];
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(20,21,25,0.78)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${color.hairline}`,
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "13px 20px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${color.teal}, ${color.blue})`,
              display: "inline-block",
            }}
          />
          <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>
            PatternCache
          </span>
        </NavLink>
        <nav style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              style={({ isActive }) => ({
                fontFamily: font.mono,
                fontSize: 13,
                fontWeight: 700,
                padding: "7px 14px",
                borderRadius: 8,
                color: isActive ? color.text : color.textDim,
                background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
              })}
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
