import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadGarageProgress } from "@/game/garageProgress";
import {
  clearActiveBeginnerStudy,
  exportBeginnerStudyData,
  finishBeginnerStudy,
  loadBeginnerStudyStore,
  markMissionOpened,
  reconcileMissionEvidence,
  saveBeginnerStudySession,
  selfAttestMissionReview,
  startBeginnerStudy,
  studyMetrics,
  type BeginnerStudySession,
} from "@/validation/beginnerStudy";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { color } from "@/theme/tokens";
import "@/theme/beginner-study.css";

const TRANSFER_PROMPT = "A library has a Catalog and many Shelf objects. Each Shelf remembers its own books. Today, Catalog loops through every Shelf's internal book list to find an available copy. If a shelf changes how it stores books, Catalog must change too. Where should findAvailableBook() live, what should Catalog do, and why?";

export function BeginnerStudyPage() {
  const navigate = useNavigate();
  const existingGarage = loadGarageProgress();
  const [session, setSession] = useState<BeginnerStudySession | undefined>(() => loadBeginnerStudyStore().active);
  const [preConfidence, setPreConfidence] = useState(1);
  const [preAnswer, setPreAnswer] = useState("");
  const [consented, setConsented] = useState(false);
  const [postConfidence, setPostConfidence] = useState(1);
  const [postAnswer, setPostAnswer] = useState("");
  const [notes, setNotes] = useState("");
  const [store, setStore] = useState(() => loadBeginnerStudyStore());
  const firstTimer = !existingGarage.firstShift;

  const persist = (next: BeginnerStudySession) => {
    setSession(next);
    setStore(saveBeginnerStudySession(next));
  };

  const begin = () => {
    if (!consented || preAnswer.trim().length < 40) return;
    persist(startBeginnerStudy({ eligibleFirstTimer: firstTimer, consented, preConfidence, preAnswer }));
  };

  const openMission = () => {
    if (!session) return;
    persist(markMissionOpened(session));
    navigate("/arena/pattern-genome?study=beginner");
  };

  const refreshEvidence = () => {
    if (!session) return;
    persist(reconcileMissionEvidence(session, loadGarageProgress().firstShift?.completedAt));
  };

  const finish = () => {
    if (!session || postAnswer.trim().length < 80) return;
    const current = reconcileMissionEvidence(session, loadGarageProgress().firstShift?.completedAt);
    persist(finishBeginnerStudy(current, { postConfidence, postAnswer, notes }));
  };

  const download = () => {
    const blob = new Blob([exportBeginnerStudyData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `patterncache-beginner-study-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetActive = () => {
    setStore(clearActiveBeginnerStudy());
    setSession(undefined);
    setPreAnswer("");
    setPostAnswer("");
    setNotes("");
  };

  if (!session) {
    return (
      <div className="beginner-study">
        <StudyHeader sessionCount={store.sessions.length} />
        <Panel style={{ display: "grid", gap: 15 }}>
          <Eyebrow tone={color.blue}>Before the lesson · no answer is revealed</Eyebrow>
          <h2>Capture a genuine baseline</h2>
          <p>{TRANSFER_PROMPT}</p>
          <label><span>Your current reasoning</span><textarea value={preAnswer} onChange={(event) => setPreAnswer(event.target.value)} placeholder="Write what you would say before learning the concept. An unsure answer is useful data." /></label>
          <Confidence value={preConfidence} onChange={setPreConfidence} label="How confident are you right now?" />
          <label className="beginner-study-consent"><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} /><span>I understand this study stores answers and timings only on this device. It asks for no name, email, resume, or employer. I can export or delete the record.</span></label>
          {!firstTimer ? <div className="beginner-study-warning"><Icon name="gauge" size={17} /><span>This device already has System Forge evidence. You can test the protocol, but this session will be labeled an ineligible pilot and will not count as first-time learner evidence.</span></div> : null}
          <Button iconRight="arrowRight" disabled={!consented || preAnswer.trim().length < 40} onClick={begin}>Save baseline and begin</Button>
        </Panel>
      </div>
    );
  }

  const reconciled = reconcileMissionEvidence(session, loadGarageProgress().firstShift?.completedAt);
  const missionDone = reconciled.missionEvidence !== "not-completed";
  const completed = !!session.completedAt;

  return (
    <div className="beginner-study">
      <StudyHeader sessionCount={store.sessions.length} />
      <div className="beginner-study-progress"><Stage number="1" label="Baseline saved" done /><Stage number="2" label="Learn through play" done={missionDone} active={!missionDone} /><Stage number="3" label="Unseen transfer" done={completed} active={missionDone && !completed} /><Stage number="4" label="Export evidence" done={completed} active={completed} /></div>

      {!missionDone ? (
        <Panel style={{ display: "grid", gap: 14 }}>
          <Eyebrow tone={color.violet}>Learning task · System Forge chapter 1</Eyebrow>
          <h2>Run the garage, repair it, and explain the decision</h2>
          <p>Use the mission normally. The study does not tell you the answer and does not change the game. Complete the first shift, then return here. A completion timestamp after this study began becomes verified learning-loop evidence.</p>
          <div className="beginner-study-actions"><Button accent={color.violet} iconRight="arrowRight" onClick={openMission}>{session.missionOpenedAt ? "Return to the first shift" : "Open the first shift"}</Button><Button variant="ghost" icon="reset" onClick={refreshEvidence}>Check for completion</Button></div>
          {session.missionOpenedAt ? <small>Mission opened after {Math.round((session.missionOpenedAt - session.startedAt) / 1000)} seconds. Finish it and come back to this page.</small> : null}
          {!session.eligibleFirstTimer ? <button className="beginner-study-pilot" type="button" onClick={() => persist(selfAttestMissionReview(session))}>I reviewed the mission using prior progress. Continue as an ineligible pilot.</button> : null}
        </Panel>
      ) : !completed ? (
        <Panel style={{ display: "grid", gap: 15 }}>
          <Eyebrow tone={reconciled.missionEvidence === "verified-after-start" ? color.green : color.amber}>{reconciled.missionEvidence === "verified-after-start" ? "Learning loop verified on this device" : "Pilot transfer · prior or self-attested lesson evidence"}</Eyebrow>
          <h2>Now solve the same design smell in an unseen world</h2>
          <p>{TRANSFER_PROMPT}</p>
          <label><span>Your reasoning after the mission</span><textarea value={postAnswer} onChange={(event) => setPostAnswer(event.target.value)} placeholder="Explain the owner, the information it needs, the coordinator's job, and what future change stays contained." /></label>
          <Confidence value={postConfidence} onChange={setPostConfidence} label="How confident are you now?" />
          <label><span>What was confusing or surprisingly clear? Optional</span><textarea className="short" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="This is the most useful input for improving the product." /></label>
          <Button icon="shield" disabled={postAnswer.trim().length < 80} onClick={finish}>Finish and compare evidence</Button>
        </Panel>
      ) : (
        <StudyResult session={reconciled} onDownload={download} />
      )}

      <footer className="beginner-study-footer"><button type="button" onClick={resetActive}><Icon name="reset" size={14} /> {completed ? "Start another local session" : "Delete active session"}</button><span>Local-only protocol · no product claim until real first-time learners complete it</span></footer>
    </div>
  );
}

function StudyHeader({ sessionCount }: { sessionCount: number }) {
  return <header className="beginner-study-hero"><Eyebrow tone={color.blue}>Beginner learning check · product validation</Eyebrow><h1>Does the game teach a transferable idea?</h1><p>This 20-minute local protocol measures a baseline answer, time to find and finish the canonical lesson, an unseen transfer answer, and confidence change. It does not collect identity and it does not turn self-report into verified mastery.</p><span>{sessionCount} completed session{sessionCount === 1 ? "" : "s"} stored on this device</span></header>;
}

function Confidence({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return <fieldset className="beginner-study-confidence"><legend>{label}</legend>{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" aria-pressed={value === score} onClick={() => onChange(score)}><b>{score}</b><span>{score === 1 ? "No idea" : score === 3 ? "Can reason" : score === 5 ? "Can explain" : ""}</span></button>)}</fieldset>;
}

function Stage({ number, label, done, active = false }: { number: string; label: string; done: boolean; active?: boolean }) {
  return <div className={`${done ? "done" : ""} ${active ? "active" : ""}`}><b>{done ? "✓" : number}</b><span>{label}</span></div>;
}

function StudyResult({ session, onDownload }: { session: BeginnerStudySession; onDownload: () => void }) {
  const metrics = studyMetrics(session);
  return <Panel style={{ display: "grid", gap: 16, borderColor: session.eligibleFirstTimer && metrics.verifiedLearningLoop ? color.green : color.amber }}><Eyebrow tone={session.eligibleFirstTimer && metrics.verifiedLearningLoop ? color.green : color.amber}>{session.eligibleFirstTimer && metrics.verifiedLearningLoop ? "Eligible first-time session completed" : "Pilot session completed · excluded from first-time evidence"}</Eyebrow><h2>Learning evidence, not a hiring score</h2><div className="beginner-study-results"><Result label="Baseline transfer" value={`${session.preGrade.score}/100`} /><Result label="Post transfer" value={`${session.postGrade?.score ?? 0}/100`} /><Result label="Transfer change" value={metrics.transferScoreChange === undefined ? "Not measured" : `${metrics.transferScoreChange >= 0 ? "+" : ""}${metrics.transferScoreChange}`} /><Result label="Confidence change" value={metrics.confidenceChange === undefined ? "Not measured" : `${metrics.confidenceChange >= 0 ? "+" : ""}${metrics.confidenceChange}`} /><Result label="Time to start" value={metrics.timeToStartSeconds === undefined ? "Not measured" : `${metrics.timeToStartSeconds}s`} /><Result label="Total time" value={metrics.completionMinutes === undefined ? "Not measured" : `${metrics.completionMinutes} min`} /></div><div className="beginner-study-result-note"><strong>What this session can say</strong><p>{metrics.verifiedLearningLoop ? "The device verified that the learner completed the mission after the baseline, then produced the recorded transfer answer." : "This was a product-flow pilot. It can expose UX problems, but it cannot support a first-time learning claim."}</p></div><Button variant="ghost" icon="download" onClick={onDownload}>Export anonymized study JSON</Button></Panel>;
}

function Result({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
