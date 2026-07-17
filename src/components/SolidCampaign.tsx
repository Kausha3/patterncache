import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Lock, Play } from "@phosphor-icons/react";
import { SolidGarageGame } from "./SolidGarageGame";
import { SolidChapterPlayer } from "./SolidChapterPlayer";
import { SOLID_CHAPTER_MISSIONS } from "@/arena/solidChapterMissions";
import { isCampaignComplete, loadGarageProgress } from "@/game/garageProgress";
import type { GarageChapterId, GarageProgress } from "@/game/garageProgress";

type CampaignView = "map" | "first-shift" | GarageChapterId;

/**
 * The SOLID campaign: five chapters in one garage. Mission 1 (the first
 * shift, SRP) unlocks the rest; each later chapter unlocks the next. Every
 * completion is recorded and feeds the competency ledger.
 */
export function SolidCampaign() {
  const [view, setView] = useState<CampaignView>("map");
  const [progress, setProgress] = useState<GarageProgress>(() => loadGarageProgress());

  const refresh = () => setProgress(loadGarageProgress());

  const goTo = (next: CampaignView) => {
    refresh();
    setView(next);
  };

  if (view === "first-shift") {
    return <SolidGarageGame onContinue={() => goTo("ocp")} />;
  }

  if (view !== "map") {
    const mission = SOLID_CHAPTER_MISSIONS.find((candidate) => candidate.id === view);
    if (mission) {
      return <SolidChapterPlayer mission={mission} onExit={() => goTo("map")} onComplete={refresh} />;
    }
  }

  return <CampaignMap progress={progress} onOpen={goTo} />;
}

function CampaignMap({ progress, onOpen }: { progress: GarageProgress; onOpen: (view: CampaignView) => void }) {
  const chapters = useMemo(() => {
    const srpDone = !!progress.firstShift;
    const rows: {
      view: CampaignView;
      order: number;
      principle: string;
      title: string;
      hook: string;
      score?: number;
      unlocked: boolean;
    }[] = [
      {
        view: "first-shift",
        order: 1,
        principle: "Single Responsibility",
        title: "Your First Shift",
        hook: "Feel a manual process break, then put behavior beside the data it reads.",
        score: progress.firstShift?.bestScore,
        unlocked: true,
      },
    ];
    let previousDone = srpDone;
    for (const mission of SOLID_CHAPTER_MISSIONS) {
      const record = progress.chapters?.[mission.id];
      rows.push({
        view: mission.id,
        order: mission.order,
        principle: mission.principle,
        title: mission.title,
        hook: mission.hook,
        score: record?.bestScore,
        unlocked: previousDone,
      });
      previousDone = !!record;
    }
    return rows;
  }, [progress]);

  const completed = chapters.filter((chapter) => chapter.score !== undefined).length;

  return (
    <main className="campaign" aria-labelledby="campaign-title">
      <header className="campaign-header">
        <small>System Forge · SOLID campaign</small>
        <h1 id="campaign-title">One garage. Five principles.</h1>
        <p>
          Every chapter runs the same honest loop: operate the garage into a real failure, repair the design, transfer
          the fix with hints off, then defend it the way you would in the room. {completed} / 5 complete.
        </p>
      </header>
      <div className="campaign-grid">
        {chapters.map((chapter) => {
          const done = chapter.score !== undefined;
          return (
            <button
              key={chapter.view}
              type="button"
              className={done ? "campaign-card is-done" : chapter.unlocked ? "campaign-card" : "campaign-card is-locked"}
              disabled={!chapter.unlocked}
              onClick={() => onOpen(chapter.view)}
            >
              <header>
                <span className="campaign-order">{chapter.order}</span>
                <small>{chapter.principle}</small>
                {done ? (
                  <span className="campaign-state is-done">
                    <CheckCircle size={16} weight="fill" /> {chapter.score}%
                  </span>
                ) : chapter.unlocked ? (
                  <span className="campaign-state">
                    <Play size={14} weight="fill" /> Play
                  </span>
                ) : (
                  <span className="campaign-state is-locked">
                    <Lock size={14} weight="fill" /> Finish chapter {chapter.order - 1}
                  </span>
                )}
              </header>
              <strong>{chapter.title}</strong>
              <p>{chapter.hook}</p>
              {chapter.unlocked && !done && (
                <span className="campaign-cta">
                  Start <ArrowRight size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {isCampaignComplete(progress) ? <CampaignBridge /> : null}
    </main>
  );
}

/**
 * Shown once all five chapters are complete. The campaign taught the
 * principles inside one garage; the bridge points at where the same skills
 * get exercised on prompts the learner has never seen.
 */
function CampaignBridge() {
  const navigate = useNavigate();
  const nextSteps = [
    {
      title: "Cold Design Drills",
      body: "Bare prompts you have never seen, no hints. This is where the garage skills prove they transfer.",
      cta: "Open the drill bank",
      route: "/drill",
    },
    {
      title: "Guided LLD lessons",
      body: "Parking Lot, Locker, Elevator and more, each with Java exercises that compile and run in your browser.",
      cta: "Open the library",
      route: "/library",
    },
    {
      title: "Back to your plan",
      body: "Your daily schedule already mixes these reps with coding and mock days. Let it drive from here.",
      cta: "Open Today",
      route: "/",
    },
  ];
  return (
    <section className="campaign-bridge" aria-labelledby="campaign-bridge-title">
      <header>
        <CheckCircle size={20} weight="fill" aria-hidden />
        <div>
          <h2 id="campaign-bridge-title">Campaign complete. The garage has taught you all five.</h2>
          <p>
            You watched every failure, repaired every design, and defended each principle in interview language. From
            here the reps come from prompts you have not seen before.
          </p>
        </div>
      </header>
      <div className="campaign-bridge-grid">
        {nextSteps.map((step) => (
          <button key={step.route} type="button" className="campaign-bridge-card" onClick={() => navigate(step.route)}>
            <strong>{step.title}</strong>
            <p>{step.body}</p>
            <span>
              {step.cta} <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
