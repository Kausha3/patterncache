import { lazy, Suspense, useEffect } from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { LibraryPage } from "@/pages/LibraryPage";
import { PracticeHubPage } from "@/pages/PracticeHubPage";
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
const SlidingWindowWorldPage = lazy(() => import("@/pages/SlidingWindowWorldPage").then((module) => ({ default: module.SlidingWindowWorldPage })));
const CourseScheduleWorldPage = lazy(() => import("@/pages/CourseScheduleWorldPage").then((module) => ({ default: module.CourseScheduleWorldPage })));
const LldStudioPage = lazy(() => import("@/pages/LldStudioPage").then((module) => ({ default: module.LldStudioPage })));
const PatternGenomePage = lazy(() => import("@/pages/PatternGenomePage").then((module) => ({ default: module.PatternGenomePage })));
const AmazonSde1PrepPage = lazy(() => import("@/pages/AmazonSde1PrepPage").then((module) => ({ default: module.AmazonSde1PrepPage })));
const MockInterviewPage = lazy(() => import("@/pages/MockInterviewPage").then((module) => ({ default: module.MockInterviewPage })));

/** Persistent primary navigation and routed pages. */
export function App() {
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <RouteScrollReset />
      <TopNav />
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<PageFallback />}>
                <CoursePage />
              </Suspense>
            }
          />
          <Route path="/course" element={<Navigate to="/" replace />} />
          <Route path="/practice" element={<PracticeHubPage />} />
          <Route path="/library" element={<LibraryPage />} />
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
            path="/arena/algorithm-world/sliding-window-maximum"
            element={
              <Suspense fallback={<PageFallback label="Starting the Sliding Window world…" />}>
                <SlidingWindowWorldPage />
              </Suspense>
            }
          />
          <Route
            path="/arena/algorithm-world/course-schedule-ii"
            element={
              <Suspense fallback={<PageFallback label="Starting the Dependency Grid…" />}>
                <CourseScheduleWorldPage />
              </Suspense>
            }
          />
          <Route
            path="/interview"
            element={
              <Suspense fallback={<PageFallback label="Loading the mock interview…" />}>
                <MockInterviewPage />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function RouteScrollReset() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);
  return null;
}

function PageFallback({ label = "Loading your course…" }: { label?: string }) {
  return <p style={{ color: color.textDim, fontFamily: font.mono, fontSize: 13 }}>{label}</p>;
}

/**
 * Deep routes highlight the section they belong to: practice modes (arena,
 * drills, patterns) light up Practice; content (lessons, companies) lights
 * up Library. Today owns the root and course flow.
 */
export function activeSection(pathname: string): string {
  if (
    pathname.startsWith("/practice") ||
    pathname.startsWith("/arena") ||
    pathname.startsWith("/drill") ||
    pathname.startsWith("/interview") ||
    pathname.startsWith("/patterns")
  ) {
    return "/practice";
  }
  if (
    pathname.startsWith("/library") ||
    pathname.startsWith("/lesson") ||
    pathname.startsWith("/companies")
  ) {
    return "/library";
  }
  if (pathname.startsWith("/progress")) return "/progress";
  return "/";
}

function TopNav() {
  const { pathname } = useLocation();
  const section = activeSection(pathname);
  const items = [
    { to: "/", label: "Today" },
    { to: "/practice", label: "Practice" },
    { to: "/library", label: "Library" },
    { to: "/progress", label: "Progress" },
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
          {items.map((it) => {
            const isActive = section === it.to;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                className="top-nav-link"
                aria-current={isActive ? "page" : undefined}
                style={{
                  fontFamily: font.mono,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "7px 14px",
                  borderRadius: 8,
                  color: isActive ? color.text : color.textDim,
                  background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                }}
              >
                {it.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
