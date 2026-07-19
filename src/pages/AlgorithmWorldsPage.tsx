import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ALGORITHM_REPLAY_WORLDS, getAlgorithmReplayRoute } from "@/arena/algorithmReplayWorlds";
import { getCodingCombatMissionRoute } from "@/arena/codingCombatMissions";
import { loadAlgorithmReplayProgress } from "@/game/algorithmReplayProgress";
import { useGameProgress } from "@/hooks/useGameProgress";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { color, font } from "@/theme/tokens";
import "@/theme/algorithm-replay.css";

const CODE_DRIVEN = [
  { id: "sliding-window", title: "Sliding Window Control Room", family: "Monotonic deque", problem: "Sliding Window Maximum", route: "/arena/algorithm-world/sliding-window-maximum", accent: color.teal },
  { id: "topological-sort", title: "Dependency Grid", family: "Topological ordering", problem: "Course Schedule II", route: "/arena/algorithm-world/course-schedule-ii", accent: color.violet },
];

export function AlgorithmWorldsPage() {
  const navigate = useNavigate();
  const { codingCombatScores } = useGameProgress();
  const progress = useMemo(() => loadAlgorithmReplayProgress(), []);
  const replayClears = ALGORITHM_REPLAY_WORLDS.filter((world) => progress.records[world.id]).length;

  return (
    <div className="algorithm-map">
      <header>
        <Eyebrow tone={color.amber}>Algorithm Worlds · Java first, pictures second</Eyebrow>
        <h1>See the invariant your code is protecting.</h1>
        <p>
          These are not strategy pickers. Two worlds instrument actual Java operations. Six more unlock their deterministic replay only after the matching Java mission clears hidden tests, then make you transfer the invariant to a variant and explain it without choices.
        </p>
        <div><Button accent={color.teal} icon="code" onClick={() => navigate("/arena/coding-lab")}>Open Java mission map</Button><span>{replayClears}/{ALGORITHM_REPLAY_WORLDS.length} replay transfers verified</span></div>
      </header>

      <section>
        <Eyebrow tone={color.teal}>Your Java emits the world</Eyebrow>
        <div className="algorithm-map-grid">
          {CODE_DRIVEN.map((world) => <button key={world.id} type="button" onClick={() => navigate(world.route)}><Panel raised style={{ display: "grid", gap: 10, height: "100%" }}><span style={{ color: world.accent, font: `800 10px ${font.mono}`, textTransform: "uppercase" }}>Instrumented Java world</span><h2>{world.title}</h2><p>{world.problem}</p><small>{world.family}</small><Icon name="arrowRight" color={world.accent} size={16} /></Panel></button>)}
        </div>
      </section>

      <section>
        <Eyebrow tone={color.amber}>Code-gated invariant replays</Eyebrow>
        <div className="algorithm-map-grid">
          {ALGORITHM_REPLAY_WORLDS.map((world) => {
            const codeCleared = !!codingCombatScores[world.missionId];
            const record = progress.records[world.id];
            return <button key={world.id} type="button" onClick={() => navigate(getAlgorithmReplayRoute(world.id))}><Panel raised style={{ display: "grid", gap: 10, height: "100%", borderColor: record ? color.green : undefined }}><div className="algorithm-card-head"><span style={{ color: world.accent }}>{world.family}</span><Icon name={record ? "check" : codeCleared ? "play" : "target"} size={15} color={record ? color.green : world.accent} /></div><h2>{world.title}</h2><p>{world.problemName}</p><small>{record ? `Transfer verified · ${record.bestScore}/100` : codeCleared ? "Java clear detected · replay unlocked" : "Observe the failure now · Java replay locked"}</small></Panel></button>;
          })}
        </div>
      </section>

      <Panel style={{ display: "grid", gap: 8 }}><Eyebrow>Why the gate exists</Eyebrow><p style={{ color: color.textDim }}>A prepared animation can explain a correct execution, but it cannot prove what your code did internally. Hidden JVM tests prove the solution. Replays make the invariant visible afterward and explicitly say they are deterministic explanations, not runtime instrumentation.</p><Button variant="ghost" iconRight="arrowRight" onClick={() => navigate(getCodingCombatMissionRoute("product-except-self"))}>Try the first paired Java mission</Button></Panel>
    </div>
  );
}
