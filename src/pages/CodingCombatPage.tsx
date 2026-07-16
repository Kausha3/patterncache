import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CODING_COMBAT_MISSIONS } from "@/arena/codingCombatMissions";
import { CodingCombatWorkbench } from "@/components/CodingCombatWorkbench";
import { Button, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useGameProgress } from "@/hooks/useGameProgress";
import { color } from "@/theme/tokens";
import type { CodingCombatMissionId } from "@/arena/types";
import "@/theme/coding-combat.css";

export function CodingCombatPage() {
  const navigate = useNavigate();
  const { codingCombatScores, recordCodingCombatRun } = useGameProgress();
  const [activeMissionId, setActiveMissionId] = useState<CodingCombatMissionId>();
  const [runVersion, setRunVersion] = useState(0);
  const mission = CODING_COMBAT_MISSIONS.find((candidate) => candidate.id === activeMissionId);

  if (!mission) {
    const completed = CODING_COMBAT_MISSIONS.filter((candidate) => codingCombatScores[candidate.id]).length;
    return (
      <div className="combat-lobby">
        <header className="combat-lobby-hero">
          <button className="combat-back" onClick={() => navigate("/arena")}>
            <Icon name="arrowLeft" size={14} /> Arena
          </button>
          <div>
            <Eyebrow tone={color.teal}>Engineering prototype · JavaScript runner</Eyebrow>
            <h1>Build it. Then defend it.</h1>
            <p>Write a real solution, survive private edge cases, and answer the invariant, complexity, and counterexample follow-ups.</p>
            <p className="combat-java-note">
              This lab runs JavaScript, so treat it as the testing loop, not Amazon interview practice.
              Your Amazon coding work lives on the SDE I board, in Java. In-browser Java execution with
              compilation errors and hidden tests is the target for this lab.
            </p>
          </div>
          <div className="combat-lobby-stats">
            <div><strong>{completed}/3</strong><span>missions cleared</span></div>
            <div><strong>21</strong><span>total test cases</span></div>
            <div><strong>1.8s</strong><span>execution guard</span></div>
          </div>
        </header>

        <section className="combat-safety-strip" aria-label="Execution guarantees">
          <span><Icon name="shield" size={14} /> Browser-isolated execution</span>
          <span><Icon name="gauge" size={14} /> Infinite loops terminated</span>
          <span><Icon name="insight" size={14} /> Hidden boundary tests</span>
        </section>

        <section className="combat-mission-grid" aria-labelledby="combat-mission-heading">
          <div className="combat-mission-heading">
            <div><Eyebrow>Mission select</Eyebrow><h2 id="combat-mission-heading">Choose the pattern you need to prove.</h2></div>
            <span>JavaScript · zero setup · saved on this device</span>
          </div>
          <div className="combat-mission-cards">
            {CODING_COMBAT_MISSIONS.map((candidate, index) => {
              const record = codingCombatScores[candidate.id];
              return (
                <article className={record ? "combat-mission-card complete" : "combat-mission-card"} key={candidate.id}>
                  <header>
                    <span>0{index + 1}</span>
                    <small>{record ? `BEST ${record.bestScore}/${record.maxScore}` : candidate.difficulty}</small>
                  </header>
                  <div className="combat-mission-icon"><Icon name={index === 0 ? "target" : index === 1 ? "layers" : "gauge"} size={21} /></div>
                  <h3>{candidate.title}</h3>
                  <p>{candidate.prompt}</p>
                  <div className="combat-mission-tags">
                    <span>{candidate.minutes} min</span>
                    <span>{candidate.visibleTests.length + candidate.hiddenTests.length} tests</span>
                    <span>3 defenses</span>
                  </div>
                  <Button
                    icon="code"
                    aria-label={`${record ? "Replay" : "Start"} ${candidate.title}`}
                    onClick={() => setActiveMissionId(candidate.id)}
                  >
                    {record ? "Replay build" : "Start build"}
                  </Button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  const missionIndex = CODING_COMBAT_MISSIONS.findIndex((candidate) => candidate.id === mission.id);
  const nextMission = CODING_COMBAT_MISSIONS[missionIndex + 1];
  const exitToLobby = () => setActiveMissionId(undefined);

  return (
    <CodingCombatWorkbench
      key={`${mission.id}-${runVersion}`}
      mission={mission}
      previousBest={codingCombatScores[mission.id]?.bestScore}
      onComplete={(score, maxScore) => recordCodingCombatRun(mission.id, score, maxScore)}
      onExit={exitToLobby}
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
