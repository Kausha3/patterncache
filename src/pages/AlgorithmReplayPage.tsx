import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getAlgorithmReplayWorld, type AlgorithmReplayScenario, type AlgorithmReplayWorld } from "@/arena/algorithmReplayWorlds";
import { assessAlgorithmReplayDefense, createAlgorithmReplayState, observeNaiveFailure, recordReplayFrame, replayIsComplete, type AlgorithmReplayState } from "@/arena/algorithmReplayEngine";
import { getCodingCombatMissionRoute } from "@/arena/codingCombatMissions";
import { loadAlgorithmReplayProgress, loadAlgorithmReplayState, recordAlgorithmReplay, resetAlgorithmReplay, saveAlgorithmReplayState } from "@/game/algorithmReplayProgress";
import { useGameProgress } from "@/hooks/useGameProgress";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { color } from "@/theme/tokens";
import "@/theme/algorithm-replay.css";

export function AlgorithmReplayPage() {
  const { replayId } = useParams();
  const world = getAlgorithmReplayWorld(replayId);
  return world ? <PlayableReplay key={world.id} world={world} /> : <Navigate to="/arena/algorithm-worlds" replace />;
}

function PlayableReplay({ world }: { world: AlgorithmReplayWorld }) {
  const navigate = useNavigate();
  const { codingCombatScores } = useGameProgress();
  const javaRecord = codingCombatScores[world.missionId];
  const [state, setState] = useState<AlgorithmReplayState>(() => loadAlgorithmReplayState(world));
  const [mode, setMode] = useState<"canonical" | "variant">("canonical");
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [defense, setDefense] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [record, setRecord] = useState(() => loadAlgorithmReplayProgress().records[world.id]);
  const scenario = mode === "canonical" ? world.canonical : world.variant;
  const replayComplete = replayIsComplete(world, state);
  const grade = useMemo(() => assessAlgorithmReplayDefense(world, defense), [defense, world]);

  const update = (next: AlgorithmReplayState) => {
    setState(next);
    saveAlgorithmReplayState(world.id, next);
  };

  useEffect(() => {
    if (!javaRecord || !state.observedNaiveFailure) return;
    const next = recordReplayFrame(state, mode, cursor, scenario.frames.length);
    if (next !== state) {
      setState(next);
      saveAlgorithmReplayState(world.id, next);
    }
  }, [cursor, javaRecord, mode, scenario.frames.length, state, world.id]);

  useEffect(() => {
    if (!playing) return;
    if (cursor >= scenario.frames.length - 1) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setCursor((value) => value + 1), 520);
    return () => window.clearTimeout(timer);
  }, [cursor, playing, scenario.frames.length]);

  const observe = () => update(observeNaiveFailure(state));
  const selectMode = (next: "canonical" | "variant") => { setMode(next); setCursor(0); setPlaying(false); };
  const submit = () => {
    setSubmitted(true);
    if (!javaRecord || !replayComplete || !grade.ready) return;
    setRecord(recordAlgorithmReplay(world.id, world.missionId, grade.score));
  };
  const reset = () => {
    resetAlgorithmReplay(world.id);
    setState(createAlgorithmReplayState());
    setMode("canonical");
    setCursor(0);
    setPlaying(false);
    setDefense("");
    setSubmitted(false);
  };

  return (
    <div className="algorithm-replay" style={{ "--replay-accent": world.accent } as React.CSSProperties}>
      <header className="algorithm-replay-hero">
        <div><Link to="/arena/algorithm-worlds"><Icon name="arrowLeft" size={14} /> Algorithm Worlds</Link><span>{record ? `Transfer verified · ${record.bestScore}/100` : javaRecord ? "Java clear found" : "Java proof not yet found"}</span></div>
        <Eyebrow tone={world.accent}>{world.family} · code-gated replay</Eyebrow>
        <h1>{world.title}</h1>
        <p>{world.recognitionSignal}</p>
        <div className="algorithm-replay-stages"><Stage number="1" label="Break the brute force" done={state.observedNaiveFailure} active={!state.observedNaiveFailure} /><Stage number="2" label="Prove Java" done={!!javaRecord} active={state.observedNaiveFailure && !javaRecord} /><Stage number="3" label="Replay two inputs" done={replayComplete} active={!!javaRecord && !replayComplete} /><Stage number="4" label="Transfer aloud" done={!!record} active={replayComplete && !record} /></div>
      </header>

      <section className={`algorithm-naive ${state.observedNaiveFailure ? "observed" : ""}`}>
        <Panel style={{ display: "grid", gap: 12 }}><Eyebrow tone={color.red}>First, overload the naive idea</Eyebrow><h2>Correct on small input. Repeated work under load.</h2><p>{world.naiveFailure}</p><div><span><small>Naive work</small><strong>{world.naiveWork}</strong></span><Icon name="arrowRight" size={18} /><span><small>Target work</small><strong>{world.efficientWork}</strong></span></div><Button data-testid="observe-naive" icon={state.observedNaiveFailure ? "check" : "play"} accent={color.red} onClick={observe}>{state.observedNaiveFailure ? "Failure observed" : "Run the naive workload"}</Button></Panel>
      </section>

      {state.observedNaiveFailure ? (
        <section className={`algorithm-code-gate ${javaRecord ? "unlocked" : "locked"}`}>
          <Icon name={javaRecord ? "shield" : "target"} size={22} />
          <div><Eyebrow tone={javaRecord ? color.green : color.amber}>{javaRecord ? "Hidden JVM proof found" : "The picture cannot prove your code"}</Eyebrow><h2>{javaRecord ? `${world.problemName} passed in Java` : `Build ${world.problemName} in Java`}</h2><p>{javaRecord ? `Best recorded run: ${javaRecord.bestScore}/${javaRecord.maxScore}. The replay is now unlocked.` : "The next animation is a deterministic explanation of one valid execution. It unlocks only after your Solution.java passes the mission tests."}</p></div>
          <Button variant={javaRecord ? "ghost" : "primary"} accent={world.accent} icon={javaRecord ? "check" : "code"} onClick={() => navigate(getCodingCombatMissionRoute(world.missionId))}>{javaRecord ? "Reopen Java proof" : "Write and test Solution.java"}</Button>
        </section>
      ) : null}

      {javaRecord && state.observedNaiveFailure ? <ReplayBoard world={world} scenario={scenario} mode={mode} frameIndex={cursor} playing={playing} onMode={selectMode} onCursor={(next) => { setPlaying(false); setCursor(next); }} onPlaying={setPlaying} /> : null}

      {replayComplete ? (
        <section className="algorithm-replay-defense">
          <Eyebrow tone={color.amber}>{record ? "Verified evidence saved" : "Transfer test · no answer choices"}</Eyebrow>
          <h2>Explain what survives a changed constraint</h2>
          <p>{world.transferPrompt}</p>
          <div className="algorithm-invariant"><small>Invariant you proved across both runs</small><strong>{world.invariant}</strong></div>
          <textarea value={defense} disabled={!!record} onChange={(event) => { setDefense(event.target.value); setSubmitted(false); }} placeholder="State the invariant, time and space consequence, one replay edge case, and how the new constraint changes the approach." />
          <div><span>{defense.trim().length} characters · evidence over vocabulary</span><Button disabled={!!record || defense.trim().length < 120} icon={record ? "check" : "microphone"} onClick={submit}>{record ? "Transfer verified" : "Defend the transfer"}</Button></div>
          {submitted ? <div className={`algorithm-defense-grade ${grade.ready ? "pass" : "retry"}`}><strong>{grade.score}/100 · {grade.ready ? "Transfer evidence is concrete" : "Add the missing evidence"}</strong><p>{grade.missing.length ? `Still missing: ${grade.missing.join("; ")}.` : "You connected invariant, cost, edge case, and changed constraint."}</p></div> : null}
        </section>
      ) : null}

      <footer className="algorithm-replay-footer"><button type="button" onClick={reset}><Icon name="reset" size={14} /> Reset this replay</button><span>The animation explains canonical behavior; hidden JVM tests remain the code proof.</span></footer>
    </div>
  );
}

function ReplayBoard({ world, scenario, mode, frameIndex, playing, onMode, onCursor, onPlaying }: { world: AlgorithmReplayWorld; scenario: AlgorithmReplayScenario; mode: "canonical" | "variant"; frameIndex: number; playing: boolean; onMode: (mode: "canonical" | "variant") => void; onCursor: (index: number) => void; onPlaying: (value: boolean) => void }) {
  const frame = scenario.frames[frameIndex];
  return (
    <section className="algorithm-replay-board">
      <header><div><Eyebrow tone={world.accent}>Deterministic execution replay</Eyebrow><h2>{world.problemName}</h2></div><span>Work events: {frame.work}</span></header>
      <div className="algorithm-replay-tabs"><button className={mode === "canonical" ? "active" : ""} onClick={() => onMode("canonical")}>First input</button><button className={mode === "variant" ? "active" : ""} onClick={() => onMode("variant")}>Unseen variant</button></div>
      <div className="algorithm-replay-scenario"><span>{scenario.label}</span><div>{scenario.input.map((value, index) => <b key={`${value}-${index}`} className={frame.activeIndexes.includes(index) ? "active" : ""}><small>{index}</small>{value}</b>)}</div></div>
      <div className="algorithm-replay-state"><div><small>Working memory</small><div>{frame.memory.length ? frame.memory.map((item) => <span key={item}>{item}</span>) : <em>empty</em>}</div></div><div><small>Output so far</small><div>{frame.output.length ? frame.output.map((item, index) => <span key={`${item}-${index}`}>{item}</span>) : <em>none</em>}</div></div></div>
      <div className="algorithm-replay-explanation"><Icon name="insight" size={18} /><span><strong>{frame.title}</strong><small>{frame.explanation}</small></span></div>
      <div className="algorithm-replay-controls"><Button variant="subtle" icon="stepBack" aria-label="Previous frame" disabled={frameIndex === 0} onClick={() => onCursor(frameIndex - 1)} /><Button variant="ghost" icon={playing ? "pause" : "play"} onClick={() => onPlaying(!playing)}>{playing ? "Pause replay" : "Play replay"}</Button><Button variant="subtle" icon="stepForward" aria-label="Next frame" disabled={frameIndex === scenario.frames.length - 1} onClick={() => onCursor(frameIndex + 1)} /><span>{frameIndex + 1}/{scenario.frames.length}</span></div>
    </section>
  );
}

function Stage({ number, label, done, active }: { number: string; label: string; done: boolean; active: boolean }) {
  return <div className={`${done ? "done" : ""} ${active ? "active" : ""}`}><b>{done ? "✓" : number}</b><span>{label}</span></div>;
}
