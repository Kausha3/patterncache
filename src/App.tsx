import { NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { LessonPage } from "@/pages/LessonPage";
import { ProgressPage } from "@/pages/ProgressPage";
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
    { to: "/progress", label: "Progress", end: false },
  ];
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(22,24,29,0.82)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${color.panelBorder}`,
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: color.teal, display: "inline-block" }} />
          <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 15, letterSpacing: "-0.2px" }}>
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
