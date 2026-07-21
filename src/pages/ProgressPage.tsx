import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PathMap } from "@/components/PathMap";
import { Button, Divider, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { getLesson, PATH } from "@/content";
import { listCompanyQuestionIds } from "@/content/companies";
import { useProgress } from "@/hooks/useProgress";
import { useGameProgress } from "@/hooks/useGameProgress";
import { usePatternGenomeProgress } from "@/hooks/usePatternGenomeProgress";
import { useAmazonPrepProgress } from "@/hooks/useAmazonPrepProgress";
import { loadGarageProgress } from "@/game/garageProgress";
import { loadExerciseProgress } from "@/game/exerciseProgress";
import { describeExport, exportProgress, importProgress, parseProgressExport } from "@/game/progressVault";
import { loadMockSessions } from "@/interview/mockSessionStore";
import { loadBeginnerStudyStore, studyMetrics } from "@/validation/beginnerStudy";
import { loadHldVerificationProgress } from "@/game/hldVerificationProgress";
import { loadAlgorithmReplayProgress } from "@/game/algorithmReplayProgress";
import { loadLldVerificationProgress } from "@/game/lldVerificationProgress";
import { loadParkingLotGauntletProgress } from "@/game/parkingLotGauntletProgress";
import { loadUrlShortenerJourneyProgress } from "@/game/urlShortenerJourneyProgress";
import { LLD_VERIFICATION_WORLDS } from "@/arena/lldVerificationWorlds";
import type { ProgressExport } from "@/game/progressVault";
import {
  deriveLedger,
  summarizeLedger,
  EVIDENCE_KIND_META,
  MASTERY_KINDS,
} from "@/game/competencyLedger";
import { color, font, radius } from "@/theme/tokens";
import type { Confidence, Track } from "@/types";

/**
 * Progress = the competency ledger first: what you have actually demonstrated,
 * as evidence (observed a failure, repaired a design, transferred an idea,
 * coded it, explained it). Rank, streak, and XP appear below as decoration
 * derived from the same events; they are never the headline. Quick checks are
 * shown for honesty and never counted as mastery.
 */
export function ProgressPage() {
  const navigate = useNavigate();
  const { get } = useProgress();
  const game = useGameProgress();
  const { progress: forgeProgress } = usePatternGenomeProgress();
  const { records: amazonRecords } = useAmazonPrepProgress();

  const dailyTargetTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    for (const [date, lessonId] of Object.entries(game.dailyTargets)) {
      titles[date] = getLesson(lessonId)?.title ?? lessonId;
    }
    return titles;
  }, [game.dailyTargets]);

  // Read fresh on every render: a memoized-once read goes stale if a garage
  // chapter completes while this page stays mounted. The parse is tiny.
  const garageProgress = loadGarageProgress();
  const exerciseProgress = loadExerciseProgress();
  const mockSessions = loadMockSessions();
  const hldProgress = loadHldVerificationProgress();
  const algorithmReplayProgress = loadAlgorithmReplayProgress();
  const lldWorldRecords = Object.fromEntries(LLD_VERIFICATION_WORLDS.map((world) => [world.id, loadLldVerificationProgress(world).record]));
  const parkingLotRecord = loadParkingLotGauntletProgress().record;
  const urlShortenerJourney = loadUrlShortenerJourneyProgress();
  const ledger = useMemo(
    () =>
      deriveLedger({
        patternGenome: forgeProgress,
        garage: garageProgress,
        codingCombatScores: game.codingCombatScores,
        lldStudioScores: game.lldStudioScores,
        arenaScores: game.arenaScores,
        challengeCheckpoints: game.challengeCheckpoints,
        dailyTargets: dailyTargetTitles,
        amazonPrepRecords: amazonRecords,
        exerciseRecords: exerciseProgress,
        mockSessions,
        hldWorldRecords: hldProgress.records,
        algorithmReplayRecords: algorithmReplayProgress.records,
        lldWorldRecords,
        parkingLotRecord,
        urlShortenerJourney,
      }),
    [forgeProgress, garageProgress, exerciseProgress, mockSessions, hldProgress.records, algorithmReplayProgress.records, lldWorldRecords, parkingLotRecord, urlShortenerJourney, game.codingCombatScores, game.lldStudioScores, game.arenaScores, game.challengeCheckpoints, dailyTargetTitles, amazonRecords],
  );
  const summary = useMemo(() => summarizeLedger(ledger), [ledger]);
  const recent = ledger.slice(0, 8);

  const CONF_RANK: Record<Confidence, number> = { shaky: 0, okay: 1, solid: 2 };
  // Path-spine nodes (DSA + System Design) plus any Companies-only lesson
  // that's actually built.
  const pathNodes = (Object.keys(PATH) as Track[]).flatMap((t) => PATH[t]);
  const pathIds = new Set(pathNodes.map((n) => n.id));
  const extraNodes = listCompanyQuestionIds()
    .filter((id) => !pathIds.has(id) && getLesson(id))
    .map((id) => ({ id, title: getLesson(id)!.title }));
  const allNodes: { id: string; title: string }[] = [...pathNodes, ...extraNodes];
  const revisit = allNodes
    .map((n) => ({ node: n, p: get(n.id) }))
    .filter((x) => x.p.status === "completed" && x.p.confidence && x.p.confidence !== "solid")
    .sort((a, b) => CONF_RANK[a.p.confidence!] - CONF_RANK[b.p.confidence!]);

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.5px" }}>What you've demonstrated</h1>
        <p style={{ color: color.textDim, maxWidth: 680 }}>
          Evidence, not points. Mastery here means you observed a real failure, repaired a design,
          transferred an idea to an unseen prompt, wrote code that passed tests, or explained a design out
          loud. Quick checks help recall but never count.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        {MASTERY_KINDS.map((kind) => {
          const meta = EVIDENCE_KIND_META[kind];
          const counts = summary.mastery[kind];
          const demonstrated = counts.total > 0;
          return (
            <Panel key={kind} style={{ display: "grid", gap: 7, opacity: demonstrated ? 1 : 0.65 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon
                  name={demonstrated ? "check" : "target"}
                  size={14}
                  color={demonstrated ? color.green : color.textFaint}
                />
                <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 700, color: demonstrated ? color.text : color.textDim }}>
                  {meta.label}
                </span>
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 22, fontWeight: 700, color: demonstrated ? color.text : color.textFaint }}>
                {counts.total}
                <span style={{ fontSize: 11.5, fontWeight: 600, color: color.textFaint, marginLeft: 7 }}>
                  {counts.total === 0 ? "not yet" : counts.verified === counts.total ? "all verified" : `${counts.verified} verified`}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: color.textFaint, lineHeight: 1.5 }}>{meta.description}</p>
            </Panel>
          );
        })}
      </section>

      {recent.length > 0 ? (
        <section style={{ display: "grid", gap: 10 }}>
          <Eyebrow tone={color.teal}>Recent evidence</Eyebrow>
          <Panel style={{ display: "grid", gap: 0, padding: 0, overflow: "hidden" }}>
            {recent.map((entry, index) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "11px 16px",
                  borderTop: index > 0 ? `1px solid ${color.hairline}` : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.4px",
                    textTransform: "uppercase",
                    color: entry.verified ? color.green : color.amber,
                    border: `1px solid ${entry.verified ? color.green : color.amber}44`,
                    borderRadius: radius.pill,
                    padding: "2px 8px",
                    flexShrink: 0,
                  }}
                >
                  {entry.verified ? "verified" : "self-attested"}
                </span>
                <span style={{ fontSize: 13, color: color.text, lineHeight: 1.5 }}>{entry.label}</span>
              </div>
            ))}
          </Panel>
        </section>
      ) : (
        <Panel style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, color: color.textDim }}>
            No mastery evidence yet. The fastest way to earn some: run a System Forge mission and repair
            its design, or clear a Coding Combat mission's hidden tests.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button accent={color.violet} iconRight="arrowRight" onClick={() => navigate("/arena/pattern-genome")}>
              Open System Forge
            </Button>
            <Button variant="ghost" onClick={() => navigate("/practice")}>See all practice modes</Button>
          </div>
        </Panel>
      )}

      <BeginnerValidationPanel onOpen={() => navigate("/validation/beginner-study")} />

      <section style={{ display: "grid", gap: 10 }}>
        <Eyebrow tone={color.textDim}>Legacy momentum · frozen; the evidence ledger above is authoritative</Eyebrow>
        <Panel style={{ display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
          <Decoration label="Rank" value={game.summary.rank.name} />
          <Decoration label="XP" value={`${game.summary.xp.toLocaleString()}`} />
          <Decoration label="Streak" value={game.summary.streak === 0 ? "No streak" : `${game.summary.streak} day${game.summary.streak === 1 ? "" : "s"}`} />
        </Panel>
      </section>

      <Divider />

      <section style={{ display: "grid", gap: 10 }}>
        <Eyebrow>Lesson map · colored by your own confidence</Eyebrow>
        <PathMap />
      </section>

      {revisit.length > 0 && (
        <section style={{ display: "grid", gap: 13 }}>
          <Eyebrow tone={color.amber}>Revisit · resurfaced because you marked them shaky or okay</Eyebrow>
          <div style={{ display: "grid", gap: 8 }}>
            {revisit.map(({ node, p }) => {
              const lesson = getLesson(node.id);
              return (
                <div key={node.id} style={{ display: "flex", alignItems: "center", gap: 13, background: color.panel, border: `1px solid ${color.panelBorder}`, borderRadius: 12, padding: "13px 15px" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: p.confidence === "shaky" ? color.amber : color.textDim, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: font.mono, fontWeight: 600, fontSize: 14 }}>{node.title}</div>
                    <div style={{ fontSize: 12.5, color: color.textFaint }}>{lesson?.blurb}</div>
                  </div>
                  <Button variant="ghost" icon="reset" onClick={() => navigate(`/lesson/${node.id}`)}>Run it again</Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Divider />
      <DataPanel />
    </div>
  );
}

function BeginnerValidationPanel({ onOpen }: { onOpen: () => void }) {
  const store = loadBeginnerStudyStore();
  const eligible = store.sessions.filter((session) => session.eligibleFirstTimer && studyMetrics(session).verifiedLearningLoop);
  const latest = store.sessions[store.sessions.length - 1];
  const latestMetrics = latest ? studyMetrics(latest) : undefined;
  return (
    <Panel style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 18, alignItems: "center", borderColor: `${color.blue}55`, background: `linear-gradient(120deg, rgba(106,166,219,0.08), ${color.panel} 55%)` }}>
      <div style={{ display: "grid", gap: 6 }}>
        <Eyebrow tone={color.blue}>Validate the beginner experience</Eyebrow>
        <strong style={{ fontSize: 17 }}>Does the game create transferable understanding?</strong>
        <span style={{ color: color.textDim, fontSize: 12.5, lineHeight: 1.55 }}>
          Run the local baseline, canonical lesson, unseen transfer, and confidence protocol. {eligible.length} eligible first-time session{eligible.length === 1 ? "" : "s"} stored on this device{latestMetrics?.transferScoreChange === undefined ? "." : `; latest transfer change ${latestMetrics.transferScoreChange >= 0 ? "+" : ""}${latestMetrics.transferScoreChange}.`}
        </span>
      </div>
      <Button accent={color.blue} iconRight="arrowRight" onClick={onOpen}>{store.active ? "Continue study" : "Open learning check"}</Button>
    </Panel>
  );
}

/**
 * Export and import for everything on this device. Progress is
 * localStorage-only by design (no accounts), so this is the backup and
 * move-devices story.
 */
function DataPanel() {
  const [pendingImport, setPendingImport] = useState<{ data: ProgressExport; labels: string[] } | null>(null);
  const [importError, setImportError] = useState<string>();
  const [importDone, setImportDone] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const downloadExport = () => {
    const snapshot = exportProgress();
    const stamp = new Date(snapshot.exportedAt).toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `patterncache-progress-${stamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const readFile = (file: File) => {
    setImportError(undefined);
    setPendingImport(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseProgressExport(String(reader.result));
        const labels = describeExport(data);
        if (labels.length === 0) throw new Error("That export holds no progress data.");
        setPendingImport({ data, labels });
      } catch (error) {
        setImportError(error instanceof Error ? error.message : "That file could not be read.");
      }
    };
    reader.onerror = () => setImportError("That file could not be read.");
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    importProgress(pendingImport.data);
    setPendingImport(null);
    setImportDone(true);
    // Every hook reads its store on mount; a reload is the honest way to
    // make the whole app reflect the restored data at once.
    globalThis.setTimeout(() => window.location.reload(), 900);
  };

  return (
    <section style={{ display: "grid", gap: 10 }}>
      <Eyebrow tone={color.textDim}>Your data · saved on this device only</Eyebrow>
      <Panel style={{ display: "grid", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: color.textDim }}>
          Everything lives in this browser. Export a backup before switching devices or clearing the browser, then
          import it on the other side. Importing replaces the progress on this device.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Button icon="download" onClick={downloadExport}>Export my progress</Button>
          <Button variant="ghost" icon="upload" onClick={() => fileInput.current?.click()}>Import a backup</Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            aria-label="Choose a PatternCache progress export file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) readFile(file);
              event.target.value = "";
            }}
          />
        </div>
        {importError ? (
          <p style={{ margin: 0, fontSize: 12.5, color: color.red }}>{importError}</p>
        ) : null}
        {pendingImport ? (
          <div style={{ display: "grid", gap: 8, padding: "12px 14px", border: `1px solid ${color.panelBorder}`, borderRadius: 10 }}>
            <strong style={{ fontSize: 12.5, color: color.text }}>
              This backup holds: {pendingImport.labels.join(", ")}.
            </strong>
            <p style={{ margin: 0, fontSize: 12, color: color.textFaint }}>
              Importing overwrites those areas on this device. There is no undo.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <Button icon="upload" onClick={confirmImport}>Replace my progress with this backup</Button>
              <Button variant="subtle" onClick={() => setPendingImport(null)}>Cancel</Button>
            </div>
          </div>
        ) : null}
        {importDone ? (
          <p style={{ margin: 0, fontSize: 12.5, color: color.green }}>Backup restored. Reloading…</p>
        ) : null}
      </Panel>
    </section>
  );
}

function Decoration({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: "0.6px", textTransform: "uppercase", color: color.textFaint }}>
        {label}
      </span>
      <span style={{ fontFamily: font.mono, fontSize: 16, fontWeight: 700, color: color.text }}>{value}</span>
      {note && <span style={{ fontSize: 11, color: color.textFaint }}>{note}</span>}
    </div>
  );
}
