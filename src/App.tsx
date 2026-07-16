import { lazy, Suspense } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { LessonPage } from "@/pages/LessonPage";
import { ProgressPage } from "@/pages/ProgressPage";
import { CompaniesPage } from "@/pages/CompaniesPage";
import { CompanyPage } from "@/pages/CompanyPage";
import { ColdDrillsPage } from "@/pages/ColdDrillsPage";
import { ColdDrillPage } from "@/pages/ColdDrillPage";
import { PatternsPage } from "@/pages/PatternsPage";
import { GameStatusPill } from "@/components/GameStatusPill";
import { color, font } from "@/theme/tokens";

const CoursePage = lazy(() => import("@/pages/CoursePage").then((module) => ({ default: module.CoursePage })));
const ArenaPage = lazy(() => import("@/pages/ArenaPage").then((module) => ({ default: module.ArenaPage })));
const CodingCombatPage = lazy(() => import("@/pages/CodingCombatPage").then((module) => ({ default: module.CodingCombatPage })));
const LldStudioPage = lazy(() => import("@/pages/LldStudioPage").then((module) => ({ default: module.LldStudioPage })));
const PatternGenomePage = lazy(() => import("@/pages/PatternGenomePage").then((module) => ({ default: module.PatternGenomePage })));
const AmazonSde1PrepPage = lazy(() => import("@/pages/AmazonSde1PrepPage").then((module) => ({ default: module.AmazonSde1PrepPage })));

/** Persistent primary navigation and routed pages. */
export function App() {
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <TopNav />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/course"
            element={
              <Suspense fallback={<PageFallback />}>
                <CoursePage />
              </Suspense>
            }
          />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route
            path="/arena"
            element={
              <Suspense fallback={<PageFallback label="Loading the Arena…" />}>
                <ArenaPage />
              </Suspense>
            }
          />
          <Route
            path="/arena/coding-lab"
            element={
              <Suspense fallback={<PageFallback label="Loading Coding Combat…" />}>
                <CodingCombatPage />
              </Suspense>
            }
          />
          <Route
            path="/arena/lld-studio"
            element={
              <Suspense fallback={<PageFallback label="Loading the LLD Studio…" />}>
                <LldStudioPage />
              </Suspense>
            }
          />
          <Route
            path="/arena/pattern-genome"
            element={
              <Suspense fallback={<PageFallback label="Loading System Forge…" />}>
                <PatternGenomePage />
              </Suspense>
            }
          />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route
            path="/companies/amazon/sde1"
            element={
              <Suspense fallback={<PageFallback label="Loading the Amazon mission…" />}>
                <AmazonSde1PrepPage />
              </Suspense>
            }
          />
          <Route path="/companies/:id" element={<CompanyPage />} />
          <Route path="/drill" element={<ColdDrillsPage />} />
          <Route path="/drill/:id" element={<ColdDrillPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}

function PageFallback({ label = "Loading your course…" }: { label?: string }) {
  return <p style={{ color: color.textDim, fontFamily: font.mono, fontSize: 13 }}>{label}</p>;
}

function TopNav() {
  const items = [
    { to: "/course", label: "Today", end: false },
    { to: "/arena", label: "Arena", end: false },
    { to: "/", label: "Path", end: true },
    { to: "/companies", label: "Companies", end: false },
    { to: "/drill", label: "Drill", end: false },
    { to: "/patterns", label: "Patterns", end: false },
    { to: "/progress", label: "Progress", end: false },
  ];
  return (
    <header
      className="app-header"
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
        className="top-nav-shell"
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "13px 20px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <NavLink to="/" className="top-nav-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${color.teal}, ${color.blue})`,
              display: "inline-block",
            }}
          />
          <span className="top-nav-brand-label" style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>
            PatternCache
          </span>
        </NavLink>
        <GameStatusPill />
        <nav className="top-nav-links" aria-label="Primary navigation" style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className="top-nav-link"
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
