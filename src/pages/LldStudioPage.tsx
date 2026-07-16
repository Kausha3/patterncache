import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LLD_STUDIO_MISSIONS } from "@/arena/lldStudioMissions";
import type { LldStudioMissionId } from "@/arena/types";
import { LldStudioWorkbench } from "@/components/LldStudioWorkbench";
import { Button, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useGameProgress } from "@/hooks/useGameProgress";
import { color } from "@/theme/tokens";
import "@/theme/lld-studio.css";

export function LldStudioPage() {
  const navigate = useNavigate();
  const { lldStudioScores, recordLldStudioRun } = useGameProgress();
  const [activeMissionId, setActiveMissionId] = useState<LldStudioMissionId>();
  const [runVersion, setRunVersion] = useState(0);
  const mission = LLD_STUDIO_MISSIONS.find((candidate) => candidate.id === activeMissionId);

  if (!mission) {
    const completed = LLD_STUDIO_MISSIONS.filter((candidate) => lldStudioScores[candidate.id]).length;
    return (
      <div className="studio-lobby">
        <header className="studio-lobby-hero">
          <button className="studio-back" onClick={() => navigate("/arena")}><Icon name="arrowLeft" size={14} /> Arena</button>
          <div>
            <Eyebrow tone={color.violet}>LLD Design Studio · ownership under change</Eyebrow>
            <h1>Model the responsibility. Survive the mutation.</h1>
            <p>Assign behavior to the object that owns the invariant, generate the Java model, then defend it when requirements and failures arrive.</p>
          </div>
          <div className="studio-lobby-stats">
            <div><strong>{completed}/3</strong><span>models defended</span></div>
            <div><strong>18</strong><span>ownership decisions</span></div>
            <div><strong>9</strong><span>mutations</span></div>
          </div>
        </header>

        <section className="studio-principles-strip" aria-label="Studio learning outcomes">
          <span><Icon name="layers" size={14} /> Cohesive responsibility</span>
          <span><Icon name="shield" size={14} /> Protected invariants</span>
          <span><Icon name="insight" size={14} /> Change-resistant boundaries</span>
        </section>

        <section className="studio-mission-select" aria-labelledby="studio-mission-heading">
          <header><div><Eyebrow>Model select</Eyebrow><h2 id="studio-mission-heading">Choose the design you need to defend.</h2></div><span>Java skeleton · deterministic scoring · saved locally</span></header>
          <div>
            {LLD_STUDIO_MISSIONS.map((candidate, index) => {
              const record = lldStudioScores[candidate.id];
              return (
                <article className={record ? "studio-mission-card complete" : "studio-mission-card"} key={candidate.id}>
                  <header><span>0{index + 1}</span><small>{record ? `BEST ${record.bestScore}/${record.maxScore}` : candidate.difficulty}</small></header>
                  <div className="studio-mission-orbit"><Icon name={index === 0 ? "layers" : index === 1 ? "target" : "shield"} size={21} /></div>
                  <h3>{candidate.title}</h3>
                  <p>{candidate.prompt}</p>
                  <div className="studio-mission-tags"><span>{candidate.minutes} min</span><span>6 types</span><span>3 mutations</span></div>
                  <Button
                    icon="layers"
                    aria-label={`${record ? "Replay" : "Start"} ${candidate.title}`}
                    accent={color.violet}
                    onClick={() => setActiveMissionId(candidate.id)}
                  >
                    {record ? "Replay model" : "Start modeling"}
                  </Button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  const missionIndex = LLD_STUDIO_MISSIONS.findIndex((candidate) => candidate.id === mission.id);
  const nextMission = LLD_STUDIO_MISSIONS[missionIndex + 1];
  return (
    <LldStudioWorkbench
      key={`${mission.id}-${runVersion}`}
      mission={mission}
      previousBest={lldStudioScores[mission.id]?.bestScore}
      onComplete={(score, maxScore) => recordLldStudioRun(mission.id, score, maxScore)}
      onExit={() => setActiveMissionId(undefined)}
      onReplay={() => setRunVersion((current) => current + 1)}
      hasNext={!!nextMission}
      onNext={() => {
        if (nextMission) {
          setActiveMissionId(nextMission.id);
          setRunVersion((current) => current + 1);
        }
      }}
    />
  );
}
