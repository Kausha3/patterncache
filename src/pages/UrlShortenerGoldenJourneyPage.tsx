import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  TRANSFER_LABELS,
  TRANSFER_PART_IDS,
  assessTransferExplanation,
  evaluateUrlShortenerTransfer,
  formatInterviewClock,
  getInterviewRemainingSeconds,
  recommendedJourneyStage,
  type TransferSimulation,
  type UrlShortenerJourneyStage,
} from "@/arena/urlShortenerJourneyEngine";
import { URL_ARCHITECT_PARTS, isUrlArchitectVerified, type UrlArchitectState } from "@/arena/urlShortenerArchitectEngine";
import { UrlArchitectureGraphWorkshop } from "@/components/UrlArchitectureGraphWorkshop";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { loadHldVerificationProgress } from "@/game/hldVerificationProgress";
import { loadUrlArchitectDraft } from "@/game/urlShortenerArchitectProgress";
import {
  completeUrlShortenerExperience,
  completeUrlShortenerTransfer,
  finishUrlShortenerInterview,
  loadUrlShortenerJourneyProgress,
  resetUrlShortenerInterview,
  saveUrlShortenerJourneyProgress,
  saveUrlShortenerTransferDraft,
  startUrlShortenerInterview,
  updateUrlShortenerInterview,
  type UrlShortenerJourneyProgress,
} from "@/game/urlShortenerJourneyProgress";
import { UrlShortenerArchitectPage } from "@/pages/UrlShortenerArchitectPage";
import { color } from "@/theme/tokens";
import "@/theme/url-shortener-journey.css";

const STAGES: { id: UrlShortenerJourneyStage; number: number; short: string; title: string }[] = [
  { id: "experience", number: 1, short: "Experience", title: "Watch the world" },
  { id: "repair", number: 2, short: "Repair", title: "Make it survive" },
  { id: "transfer", number: 3, short: "Transfer", title: "Solve a new world" },
  { id: "interview", number: 4, short: "Interview", title: "Design under time" },
  { id: "debrief", number: 5, short: "Review", title: "Turn gaps into practice" },
];

const INTERVIEW_PART_IDS = URL_ARCHITECT_PARTS.map((part) => part.id);

export function UrlShortenerGoldenJourneyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [progress, setProgress] = useState<UrlShortenerJourneyProgress>(() => loadUrlShortenerJourneyProgress());
  const [architectComplete, setArchitectComplete] = useState(() => {
    const record = loadHldVerificationProgress().records["url-shortener"];
    return Boolean(record && isUrlArchitectVerified(loadUrlArchitectDraft()));
  });
  const completedRecommendation = recommendedJourneyStage({
    experienced: Boolean(progress.experienceCompletedAt),
    repaired: architectComplete,
    transferred: Boolean(progress.transferRecord),
    interviewed: Boolean(progress.interviewRecord),
  });
  const recommended = progress.interviewSession ? "interview" : completedRecommendation;
  const requested = searchParams.get("stage") as UrlShortenerJourneyStage | null;
  const stage = STAGES.some((candidate) => candidate.id === requested) ? requested! : recommended;
  const interviewLive = stage === "interview" && Boolean(progress.interviewSession);
  const style = { "--architect-accent": color.blue } as CSSProperties;

  const persist = (next: UrlShortenerJourneyProgress) => {
    setProgress(next);
    saveUrlShortenerJourneyProgress(next);
  };

  const go = (next: UrlShortenerJourneyStage) => {
    if (progress.interviewSession && next !== "interview") {
      persist(resetUrlShortenerInterview(progress));
    }
    setSearchParams({ stage: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="url-journey url-architect" style={style}>
      <header className="url-journey-hero">
        <div className="url-architect-breadcrumb">
          <Link to="/arena/hld-worlds"><Icon name="arrowLeft" size={14} /> System Design Worlds</Link>
          <span>Golden journey · URL Shortener</span>
        </div>
        <div className="url-journey-hero-copy">
          <div>
            <Eyebrow tone={color.blue}>Learn safely. Prove it when you choose.</Eyebrow>
            <h1>One system, five levels of understanding.</h1>
            <p>First experience the failure. Then repair it, transfer the idea to a new world, and enter a timed interview only when you are ready.</p>
          </div>
          <div className="url-journey-mode"><Icon name={interviewLive ? "gauge" : "shield"} size={20} /><span><small>{interviewLive ? "Interview pressure" : stage === "interview" ? "Interview ready" : "Learning mode"}</small><strong>{interviewLive ? "Timer on · feedback delayed" : stage === "interview" ? "No timer until you press Start" : "No timer · unlimited retries"}</strong></span></div>
        </div>
      </header>

      <nav className="url-journey-rail" aria-label="URL Shortener learning journey">
        {STAGES.map((item) => {
          const complete = stageComplete(item.id, progress, architectComplete);
          const active = item.id === stage;
          const suggested = item.id === recommended;
          return (
            <button key={item.id} type="button" className={`${active ? "active" : ""} ${complete ? "complete" : ""}`} onClick={() => go(item.id)} aria-current={active ? "step" : undefined}>
              <b>{complete ? <Icon name="check" size={13} /> : item.number}</b>
              <span><small>{item.short}{suggested ? " · next" : ""}</small><strong>{item.title}</strong></span>
            </button>
          );
        })}
      </nav>

      {stage === "experience" ? (
        <ExperienceStage
          completed={Boolean(progress.experienceCompletedAt)}
          onComplete={() => {
            persist(completeUrlShortenerExperience(progress));
            go("repair");
          }}
        />
      ) : null}

      {stage === "repair" ? (
        <section className="url-journey-stage">
          <StageIntro eyebrow="Level 2 · causal repair" title="Now make Link City survive" description="Run real traffic against your graph. The simulator exposes only the first broken relationship, and every repair changes what happens next." />
          <UrlShortenerArchitectPage embedded onVerified={() => {
            setArchitectComplete(true);
            go("transfer");
          }} onInvalidated={() => setArchitectComplete(false)} />
        </section>
      ) : null}

      {stage === "transfer" ? <TransferStage progress={progress} onProgress={persist} onContinue={() => go("interview")} /> : null}
      {stage === "interview" ? <InterviewStage progress={progress} onProgress={persist} onFinish={() => go("debrief")} /> : null}
      {stage === "debrief" ? <DebriefStage progress={progress} onProgress={persist} onGo={go} /> : null}

      <footer className="url-journey-footer">
        <span><Icon name="shield" size={14} /> Every level stays open for revisiting. Only the Interview Room adds pressure.</span>
        <button type="button" onClick={() => go(recommended)}>Go to recommended next step <Icon name="arrowRight" size={13} /></button>
      </footer>
    </div>
  );
}

function ExperienceStage({ completed, onComplete }: { completed: boolean; onComplete: () => void }) {
  const [moment, setMoment] = useState<"quiet" | "single" | "surge">("quiet");
  const surge = moment === "surge";
  const activeCount = moment === "quiet" ? 0 : surge ? 50_000 : 1;
  const stations = [
    ["Front door", "Receives the request", "request"],
    ["Redirect worker", "Finds the destination", "compute"],
    ["Permanent link book", surge ? "Reads every request" : "Returns one saved link", "data"],
    ["Visitor", surge ? "Waits while storage overloads" : "Arrives at the destination", "request"],
  ] as const;
  return (
    <section className="url-journey-stage">
      <StageIntro eyebrow="Level 1 · worked example" title="See the system before naming it" description="You are operating Link City, not answering a question. Send normal traffic, then create the incident that forces a design change." />
      <Panel className={`url-journey-world ${surge ? "surge" : ""}`} raised>
        <div className="url-journey-world-head">
          <div><Eyebrow tone={surge ? color.red : color.blue}>Live Link City</Eyebrow><h2>{surge ? "The record room is overwhelmed" : moment === "single" ? "One redirect completes normally" : "The city is waiting for traffic"}</h2></div>
          <div className="url-journey-traffic"><small>Requests entering</small><strong>{activeCount.toLocaleString()}</strong></div>
        </div>
        <div className="url-journey-world-flow">
          {stations.map(([name, detail, kind], index) => (
            <div key={name} className={`${kind} ${moment !== "quiet" ? "active" : ""} ${surge && index >= 2 ? "overloaded" : ""}`}>
              <b>{index + 1}</b><span><strong>{name}</strong><small>{detail}</small></span>
              {index < stations.length - 1 ? <Icon name="arrowRight" size={16} /> : null}
            </div>
          ))}
        </div>
        <div className="url-journey-world-console">
          <div><small>p95 latency</small><strong>{surge ? "620 ms" : moment === "single" ? "88 ms" : "--"}</strong></div>
          <div><small>availability</small><strong>{surge ? "55%" : moment === "single" ? "99.9%" : "--"}</strong></div>
          <div><small>What changed?</small><strong>{surge ? "One popular link repeated the same expensive read" : moment === "single" ? "The full path worked once" : "Nothing has run yet"}</strong></div>
        </div>
        <div className="url-journey-world-action">
          {moment === "quiet" ? <Button data-testid="journey-send-one" icon="play" onClick={() => setMoment("single")}>Send one visitor</Button> : null}
          {moment === "single" ? <Button data-testid="journey-trigger-surge" accent={color.amber} icon="gauge" onClick={() => setMoment("surge")}>Make this link go viral</Button> : null}
          {moment === "surge" ? (
            <div className="url-journey-discovery"><Icon name="insight" size={20} /><span><small>Your first mental model</small><strong>The same correct path can fail when traffic changes.</strong><p>You do not need the solution yet. Enter the workshop and make the repeated read cheaper without losing the durable link.</p></span></div>
          ) : null}
          {moment === "surge" ? <Button data-testid="journey-enter-workshop" iconRight="arrowRight" onClick={onComplete}>{completed ? "Return to the workshop" : "Repair the world yourself"}</Button> : null}
        </div>
      </Panel>
    </section>
  );
}

function TransferStage({ progress, onProgress, onContinue }: { progress: UrlShortenerJourneyProgress; onProgress: (progress: UrlShortenerJourneyProgress) => void; onContinue: () => void }) {
  const [graph, setGraph] = useState(progress.transferDraft);
  const [reasoning, setReasoning] = useState(progress.transferReasoning);
  const [runs, setRuns] = useState(progress.transferRuns);
  const [simulation, setSimulation] = useState<TransferSimulation>();
  const [submitted, setSubmitted] = useState(false);
  const explanation = useMemo(() => assessTransferExplanation(reasoning), [reasoning]);

  const updateGraph = (next: UrlArchitectState) => {
    setGraph(next);
    setSimulation(undefined);
    setSubmitted(false);
    onProgress(saveUrlShortenerTransferDraft(progress, next, reasoning, runs));
  };
  const updateReasoning = (value: string) => {
    setReasoning(value);
    setSubmitted(false);
    onProgress(saveUrlShortenerTransferDraft(progress, graph, value, runs));
  };
  const run = () => {
    const result = evaluateUrlShortenerTransfer(graph);
    const nextRuns = runs + 1;
    setRuns(nextRuns);
    setSimulation(result);
    onProgress(saveUrlShortenerTransferDraft(progress, graph, reasoning, nextRuns));
  };
  const prove = () => {
    setSubmitted(true);
    if (!simulation?.passed || !explanation.ready) return;
    onProgress(completeUrlShortenerTransfer(progress, graph, reasoning, runs));
  };

  return (
    <section className="url-journey-stage">
      <StageIntro eyebrow="Level 3 · independent transfer" title="A different product. The same invisible pressures." description="Profile Pulse was never shown in the lesson. Build a fast celebrity-profile path and keep ranking work away from the viewer response. No component is pre-positioned and no repair hint is available." />
      <div className="url-journey-challenge-bar"><span><small>New-world incident</small><strong>A creator gains 20 million followers while ranking updates slow to four seconds.</strong></span><Button data-testid="journey-run-transfer" icon="play" onClick={run}>{simulation ? "Rerun Profile Pulse" : "Run Profile Pulse"}</Button></div>
      {simulation ? <JourneySimulation result={simulation} /> : null}
      <UrlArchitectureGraphWorkshop
        state={graph}
        onChange={updateGraph}
        allowedPartIds={TRANSFER_PART_IDS}
        labels={TRANSFER_LABELS}
        activePartIds={simulation?.activePartIds}
        accent={color.violet}
        eyebrow="Profile Pulse workshop"
        heading="Build without the URL Shortener labels"
        description="The components use a new product vocabulary. Connect the request and data paths based on the behavior you need."
        testId="transfer-graph"
      />
      <Panel className="url-journey-retrieval">
        <div><Eyebrow tone={color.violet}>Explain the transfer</Eyebrow><h2>Why does this design survive?</h2><p>Describe the fast read boundary, the durable source of truth, and why ranking work belongs outside the response. Use your own words.</p></div>
        <textarea value={reasoning} onChange={(event) => updateReasoning(event.target.value)} placeholder="Explain what would slow down, what must remain durable, and what work can happen later..." />
        <div className="url-journey-retrieval-actions"><span>{reasoning.trim().length}/150 minimum characters</span><Button disabled={!simulation?.passed || reasoning.trim().length < 150} onClick={prove}>Prove transfer</Button></div>
        {submitted && (!simulation?.passed || !explanation.ready) ? <p className="url-journey-feedback retry">Keep working from evidence: {!simulation?.passed ? "the live scenario still fails" : explanation.missing.join("; ")}.</p> : null}
        {progress.transferRecord ? <div className="url-journey-feedback pass"><Icon name="check" size={16} /><span><strong>Transfer proven</strong><small>You rebuilt the behavior in a domain the lesson did not show.</small></span><Button iconRight="arrowRight" onClick={onContinue}>Enter Interview Room</Button></div> : null}
      </Panel>
    </section>
  );
}

function JourneySimulation({ result }: { result: TransferSimulation }) {
  return (
    <Panel className={`url-journey-simulation ${result.passed ? "pass" : "fail"}`}>
      <div className="url-architect-run-head"><Eyebrow tone={result.passed ? color.green : color.red}>Observed result</Eyebrow><strong>{result.passed ? "SURVIVED" : "BROKE"}</strong></div>
      <div className="url-architect-metrics">
        <div><small>p95 latency</small><strong>{result.metrics.latency}</strong></div>
        <div><small>availability</small><strong>{result.metrics.availability}</strong></div>
        <div><small>pressure</small><strong>{result.metrics.pressure}</strong></div>
      </div>
      <div className="url-architect-trace">{result.trace.map((item, index) => <div key={item.id} className={item.passed ? "pass" : index === result.trace.findIndex((candidate) => !candidate.passed) ? "fail" : "waiting"}><b>{item.passed ? "✓" : index + 1}</b><span>{item.label}</span></div>)}</div>
      <p>{result.message}</p>
    </Panel>
  );
}

function InterviewStage({ progress, onProgress, onFinish }: { progress: UrlShortenerJourneyProgress; onProgress: (progress: UrlShortenerJourneyProgress) => void; onFinish: () => void }) {
  const [duration, setDuration] = useState(45);
  const [now, setNow] = useState(Date.now());
  const session = progress.interviewSession;
  const remaining = session ? getInterviewRemainingSeconds(session.startedAt, session.durationSeconds, now) : 0;

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (!session || remaining > 0) return;
    onProgress(finishUrlShortenerInterview(progress));
    onFinish();
  }, [onFinish, onProgress, progress, remaining, session]);

  if (!session) {
    return (
      <section className="url-journey-stage">
        <StageIntro eyebrow="Level 4 · opt-in pressure" title="The Interview Room" description="Learning mode ends only when you press Start. During the simulation there are no hints, correctness signals, or answer reveals. The full debrief appears when you finish." />
        <Panel className="url-journey-interview-setup" raised>
          <div className="url-journey-interview-brief">
            <Icon name="gauge" size={28} />
            <div><Eyebrow tone={color.red}>System-design simulation</Eyebrow><h2>Design a URL shortener</h2><p>Support 100 million stored links, 10,000 redirects per second, link creation, click analytics, and graceful read-replica failure.</p></div>
          </div>
          <div className="url-journey-duration"><span><small>Choose session length</small><strong>This configures pressure. It is not a quiz.</strong></span><div>{[30, 45, 60].map((minutes) => <button key={minutes} type="button" className={duration === minutes ? "active" : ""} onClick={() => setDuration(minutes)}>{minutes} min</button>)}</div></div>
          <div className="url-journey-interview-rules">
            <span><Icon name="check" size={15} /> Requirements stay visible</span>
            <span><Icon name="close" size={15} /> No hints or live grading</span>
            <span><Icon name="shield" size={15} /> Complete debrief afterward</span>
          </div>
          <Button data-testid="journey-start-interview" accent={color.red} icon="play" onClick={() => {
            const next = startUrlShortenerInterview(progress, duration);
            onProgress(next);
            setNow(Date.now());
          }}>Start the timed interview</Button>
        </Panel>
      </section>
    );
  }

  const updateGraph = (graph: UrlArchitectState) => onProgress(updateUrlShortenerInterview(progress, graph, session.reasoning));
  const updateReasoning = (reasoning: string) => onProgress(updateUrlShortenerInterview(progress, session.graph, reasoning));
  const finish = () => {
    onProgress(finishUrlShortenerInterview(progress));
    onFinish();
  };
  return (
    <section className="url-journey-stage interview-live">
      <div className={`url-journey-clock ${remaining <= 600 ? "warning" : ""}`}><span><small>Interview Room · feedback hidden</small><strong>Design a URL shortener for 10,000 redirects per second</strong></span><time dateTime={`PT${remaining}S`}>{formatInterviewClock(remaining)}</time></div>
      <UrlArchitectureGraphWorkshop
        state={session.graph}
        onChange={updateGraph}
        allowedPartIds={INTERVIEW_PART_IDS}
        accent={color.red}
        eyebrow="Independent architecture"
        heading="Build and defend your design"
        description="Use technical component names. Connect the full read, write, analytics, and failure-handling paths. The system will not tell you whether anything is correct yet."
        technicalOnly
        quiet
        testId="interview-graph"
      />
      <Panel className="url-journey-retrieval interview-notes">
        <div><Eyebrow tone={color.red}>Speak while you design</Eyebrow><h2>Capture your interview reasoning</h2><p>Clarify assumptions, workload shape, consistency, failure behavior, and at least one rejected tradeoff.</p></div>
        <textarea value={session.reasoning} onChange={(event) => updateReasoning(event.target.value)} placeholder="I will start by clarifying... The system is read-heavy, so... My main tradeoff is... During an outage..." />
        <div className="url-journey-retrieval-actions"><span>Feedback remains hidden until you finish.</span><Button data-testid="journey-finish-interview" accent={color.red} onClick={finish}>Finish and reveal debrief</Button></div>
      </Panel>
    </section>
  );
}

function DebriefStage({ progress, onProgress, onGo }: { progress: UrlShortenerJourneyProgress; onProgress: (progress: UrlShortenerJourneyProgress) => void; onGo: (stage: UrlShortenerJourneyStage) => void }) {
  const record = progress.interviewRecord;
  if (!record) {
    return <section className="url-journey-stage"><StageIntro eyebrow="Level 5 · evidence" title="Your debrief appears after a simulation" description="Run the Interview Room when you want realistic pressure. Learning worlds remain available without a timer." /><Button iconRight="arrowRight" onClick={() => onGo("interview")}>Open Interview Room</Button></section>;
  }
  const minutes = Math.max(1, Math.ceil(record.elapsedSeconds / 60));
  return (
    <section className="url-journey-stage">
      <StageIntro eyebrow="Level 5 · delayed feedback" title="Turn interview evidence into the next practice session" description="This is not a permanent grade. It is a replay of what your submitted graph and explanation demonstrated under time." />
      <div className="url-journey-debrief-grid">
        <Panel className="url-journey-score" raised><Eyebrow tone={record.assessment.score >= 80 ? color.green : color.amber}>Evidence score</Eyebrow><strong>{record.assessment.score}<small>/100</small></strong><p>{minutes} minute attempt · next spaced review scheduled in one day</p></Panel>
        <Panel className="url-journey-rubric" raised><Eyebrow>Interview evidence</Eyebrow>{record.assessment.rubric.map((item) => <div key={item.id} className={item.passed ? "pass" : "gap"}><Icon name={item.passed ? "check" : "target"} size={15} /><span><strong>{item.label}</strong><small>{item.evidence}</small></span></div>)}</Panel>
      </div>
      <Panel className="url-journey-next-practice">
        <Icon name="insight" size={22} />
        <div><Eyebrow tone={color.amber}>Next practice, without pressure</Eyebrow><h2>{record.assessment.gaps.length ? "Repair the weakest evidence first" : "Repeat later from a blank canvas"}</h2><p>{record.assessment.gaps.length ? record.assessment.gaps.slice(0, 3).join(" · ") : "The one-day review should feel harder because the answer will not be fresh. That difficulty is useful."}</p></div>
        <Button iconRight="arrowRight" onClick={() => onGo(record.assessment.gaps.length ? "transfer" : "experience")}>{record.assessment.gaps.length ? "Practice gaps safely" : "Replay the world"}</Button>
      </Panel>
      <div className="url-journey-debrief-actions"><Button variant="ghost" icon="reset" onClick={() => { onProgress(resetUrlShortenerInterview(progress)); onGo("interview"); }}>Run another timed interview</Button></div>
    </section>
  );
}

function StageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="url-journey-stage-intro"><Eyebrow tone={color.blue}>{eyebrow}</Eyebrow><h2>{title}</h2><p>{description}</p></header>;
}

function stageComplete(stage: UrlShortenerJourneyStage, progress: UrlShortenerJourneyProgress, architectComplete: boolean): boolean {
  if (stage === "experience") return Boolean(progress.experienceCompletedAt);
  if (stage === "repair") return architectComplete;
  if (stage === "transfer") return Boolean(progress.transferRecord);
  if (stage === "interview" || stage === "debrief") return Boolean(progress.interviewRecord);
  return false;
}
