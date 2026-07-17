import { useEffect, useReducer, useState } from "react";
import type { CSSProperties, Dispatch } from "react";
import {
  ArrowClockwise,
  ArrowRight,
  Buildings,
  Car,
  CheckCircle,
  Code,
  Gauge,
  Lightbulb,
  MagnifyingGlass,
  MapPin,
  Play,
  Scan,
  Sparkle,
  Stack,
  Warning,
  Wrench,
  XCircle,
} from "@phosphor-icons/react";
import {
  assessFirstShiftInterview,
  canParkShiftSpot,
  createFirstShiftState,
  firstShiftReducer,
  getShiftSpotState,
  SHIFT_SPOTS,
} from "@/arena/firstShiftEngine";
import { recordFirstShiftCompletion } from "@/game/garageProgress";
import type {
  FirstShiftInterviewAssessment,
  FirstShiftStage,
  FirstShiftState,
  ShiftFloor,
  ShiftSpotId,
} from "@/arena/firstShiftEngine";
import garageWorld from "@/assets/living-garage/garage-world.webp";
import playerCar from "@/assets/living-garage/player-car.webp";
import floorScanner from "@/assets/living-garage/search-module.webp";

const STRONG_SHIFT_ANSWER = "Each Level owns the parking spaces on that floor, so findSpot(vehicle) belongs inside Level because it searches the spots Level already remembers. ParkingLot should coordinate across floors instead of searching every individual space. That keeps both classes focused and contains future changes to floor-search behavior.";

export function SolidGarageGame({ onContinue }: { onContinue?: () => void } = {}) {
  const [game, dispatch] = useReducer(firstShiftReducer, undefined, createFirstShiftState);
  const [answer, setAnswer] = useState("");
  const [assessment, setAssessment] = useState<FirstShiftInterviewAssessment>();
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  useEffect(() => {
    if (game.stage !== "floor1-running" && game.stage !== "floor2-running") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => dispatch({ type: "SCANNER_FINISH" }),
      reducedMotion ? 220 : 2_100,
    );
    return () => window.clearTimeout(timer);
  }, [game.stage]);

  const submitInterview = () => {
    const nextAssessment = assessFirstShiftInterview(answer);
    setAssessment(nextAssessment);
    dispatch({ type: "SUBMIT_INTERVIEW", score: nextAssessment.score });
    if (nextAssessment.score >= 75) {
      recordFirstShiftCompletion(nextAssessment.score, game.attempts + 1);
    }
  };

  const replay = () => {
    dispatch({ type: "RESET" });
    setAnswer("");
    setAssessment(undefined);
    setShowModelAnswer(false);
  };

  const isDebrief = game.stage === "reveal" || game.stage === "interview" || game.stage === "complete";

  return (
    <main className="shift" data-stage={game.stage} aria-labelledby="shift-title">
      <img className="shift-world" src={garageWorld} alt="A cinematic parking garage with headquarters, two floors, an entry gate, and parking spaces" />
      <div className="shift-world-shade" aria-hidden />

      {game.stage === "intro" ? <ShiftIntro onStart={() => dispatch({ type: "START_SHIFT" })} /> : null}

      {game.stage !== "intro" && !isDebrief ? (
        <>
          <ShiftHud game={game} />
          <ShiftWorld
            game={game}
            onInspect={(spotId) => dispatch({ type: "INSPECT_SPOT", spotId })}
            onPark={(spotId) => dispatch({ type: "PARK_SPOT", spotId })}
            onPickScanner={() => dispatch({ type: "PICK_SCANNER" })}
            onInstall={(floor) => dispatch({ type: "INSTALL_SCANNER", floor })}
          />
          <ShiftCoach game={game} dispatch={dispatch} />
        </>
      ) : null}

      {game.stage === "reveal" ? <ShiftReveal onContinue={() => dispatch({ type: "ENTER_INTERVIEW" })} /> : null}
      {game.stage === "interview" ? (
        <ShiftInterview
          answer={answer}
          assessment={assessment}
          showModelAnswer={showModelAnswer}
          onAnswerChange={setAnswer}
          onToggleModel={() => setShowModelAnswer((current) => !current)}
          onSubmit={submitInterview}
        />
      ) : null}
      {game.stage === "complete" ? <ShiftComplete score={game.interviewScore ?? 0} attempts={game.attempts} onReplay={replay} onContinue={onContinue} /> : null}
    </main>
  );
}

function ShiftIntro({ onStart }: { onStart: () => void }) {
  return (
    <section className="shift-intro" aria-labelledby="shift-title">
      <span><Sparkle size={19} weight="fill" /> Mission 1 · Your First Shift</span>
      <h1 id="shift-title">Keep the garage moving.</h1>
      <p>You are the new parking operator. Drivers are arriving, but the garage still searches for spaces by hand. Learn the job by doing it. Software terms come later.</p>
      <div className="shift-intro-goals">
        <article><Car size={25} weight="duotone" /><strong>Park drivers</strong><small>Inspect the real garage yourself.</small></article>
        <article><Gauge size={25} weight="duotone" /><strong>Survive rush hour</strong><small>Feel why the manual process breaks.</small></article>
        <article><Scan size={25} weight="duotone" /><strong>Upgrade the floor</strong><small>Use the fix in a new place.</small></article>
      </div>
      <button className="shift-primary" type="button" onClick={onStart}>Clock in for your first shift <ArrowRight size={22} /></button>
      <small>No class diagrams. No hidden terminology. Operate the world first.</small>
    </section>
  );
}

function ShiftHud({ game }: { game: FirstShiftState }) {
  return (
    <header className="shift-hud">
      <span className="shift-hud-icon"><Buildings size={23} weight="duotone" /></span>
      <div><small>Mission 1 · Your First Shift</small><h1 id="shift-title">{shiftObjective(game.stage)}</h1></div>
      <div className="shift-hud-stats">
        <span><CheckCircle size={16} weight="fill" /><b>{game.carsParked}</b> parked</span>
        <span className={game.queue >= 3 ? "is-danger" : ""}><Car size={16} weight="fill" /><b>{game.queue}</b> waiting</span>
      </div>
    </header>
  );
}

function ShiftWorld({
  game,
  onInspect,
  onPark,
  onPickScanner,
  onInstall,
}: {
  game: FirstShiftState;
  onInspect: (spotId: ShiftSpotId) => void;
  onPark: (spotId: ShiftSpotId) => void;
  onPickScanner: () => void;
  onInstall: (floor: ShiftFloor) => void;
}) {
  const showSpots = game.stage === "manual-one" || game.stage === "manual-two" || game.stage === "rush-search" || game.stage === "bottleneck";
  const scannerVisibleAtHq = game.stage === "demo" || game.stage === "transfer";
  const scannerHeld = game.stage === "carrying-demo" || game.stage === "carrying-transfer";
  const scannerRunning = game.stage === "floor1-running" || game.stage === "floor2-running";
  return (
    <div className="shift-playfield" aria-label="Live garage simulation">
      <img className="shift-active-car" src={playerCar} alt="The driver you are currently helping" />

      {game.queue > 1 ? (
        <div className="shift-queue" aria-label={`${game.queue} drivers waiting`}>
          {Array.from({ length: game.queue }).map((_, index) => <img key={index} src={playerCar} alt="" style={{ "--queue-index": index } as CSSProperties} />)}
          <span><Warning size={17} weight="fill" /> Queue × {game.queue}</span>
        </div>
      ) : null}

      {showSpots ? (
        <div className="shift-spots" aria-label="Floor 1 parking spaces">
          {SHIFT_SPOTS.map((spotId) => (
            <ShiftSpot
              key={spotId}
              game={game}
              spotId={spotId}
              onInspect={() => onInspect(spotId)}
              onPark={() => onPark(spotId)}
            />
          ))}
        </div>
      ) : null}

      {scannerVisibleAtHq ? (
        <button className="shift-scanner at-hq" type="button" onClick={onPickScanner} aria-label="Pick up the floor scanner">
          <img src={floorScanner} alt="" />
          <span><Wrench size={15} /> Pick up scanner</span>
        </button>
      ) : null}

      {scannerHeld ? <img className="shift-scanner-held" src={floorScanner} alt="You are carrying the floor scanner" /> : null}

      {game.stage === "carrying-demo" ? (
        <button className="shift-floor-target floor-one is-guided" type="button" onClick={() => onInstall(1)}>
          <Scan size={28} weight="duotone" /><span>Install on Floor 1</span><small>Its six spaces live here</small>
        </button>
      ) : null}

      {game.stage === "carrying-transfer" ? (
        <div className="shift-transfer-targets" aria-label="Possible scanner locations">
          <button className="shift-floor-target floor-one" type="button" onClick={() => onInstall(1)}><Scan size={25} /><span>Floor 1</span><small>Queue already cleared</small></button>
          <button className="shift-floor-target floor-two" type="button" onClick={() => onInstall(2)}><Scan size={25} /><span>Floor 2</span><small>Three drivers waiting</small></button>
        </div>
      ) : null}

      {game.floor1ScannerInstalled ? <img className={`shift-installed-scanner floor-one${scannerRunning && game.stage === "floor1-running" ? " is-running" : ""}`} src={floorScanner} alt="Scanner installed on Floor 1" /> : null}
      {game.floor2ScannerInstalled ? <img className={`shift-installed-scanner floor-two${scannerRunning && game.stage === "floor2-running" ? " is-running" : ""}`} src={floorScanner} alt="Scanner installed on Floor 2" /> : null}

      {scannerRunning ? (
        <div className={`shift-scan-results ${game.stage === "floor1-running" ? "floor-one" : "floor-two"}`} aria-label="The floor scanner is reading every parking space">
          {SHIFT_SPOTS.map((spotId, index) => <span key={spotId} style={{ "--scan-index": index } as CSSProperties}><MagnifyingGlass size={14} /><b>{spotId}</b></span>)}
        </div>
      ) : null}

      {game.stage === "bottleneck" ? (
        <div className="shift-bottleneck"><Warning size={24} weight="fill" /><span><strong>Manual search stalled</strong>Two checks made while three drivers waited</span></div>
      ) : null}

      {game.stage === "floor1-success" ? (
        <div className="shift-comparison" aria-label="Manual search compared with the floor scanner">
          <div><small>Before</small><strong>{game.manualChecks} checks</strong><span>one space at a time</span></div>
          <ArrowRight size={22} />
          <div className="is-fast"><small>After</small><strong>1 scan</strong><span>the floor checks its spaces</span></div>
        </div>
      ) : null}
    </div>
  );
}

function ShiftSpot({
  game,
  spotId,
  onInspect,
  onPark,
}: {
  game: FirstShiftState;
  spotId: ShiftSpotId;
  onInspect: () => void;
  onPark: () => void;
}) {
  const spotState = getShiftSpotState(game, spotId);
  const canPark = canParkShiftSpot(game, spotId);
  return (
    <button
      className={`shift-spot spot-${spotId.toLowerCase()} is-${spotState}`}
      type="button"
      onClick={canPark ? onPark : onInspect}
      disabled={spotState === "occupied" || game.stage === "bottleneck"}
      aria-label={canPark ? `Park car in space ${spotId}` : spotState === "occupied" ? `Space ${spotId} is occupied` : `Inspect space ${spotId}`}
    >
      {spotState === "unknown" ? <MagnifyingGlass size={19} /> : spotState === "occupied" ? <XCircle size={20} weight="fill" /> : <CheckCircle size={20} weight="fill" />}
      <span>{spotId}</span>
      <small>{spotState === "unknown" ? "Check" : spotState === "occupied" ? "Occupied" : "Park here"}</small>
    </button>
  );
}

function ShiftCoach({ game, dispatch }: { game: FirstShiftState; dispatch: Dispatch<Parameters<typeof firstShiftReducer>[1]> }) {
  const action = shiftCoachAction(game.stage, dispatch);
  return (
    <section className={`shift-coach${game.stage === "bottleneck" ? " is-danger" : ""}`} aria-live="polite" aria-atomic="true">
      <div className="shift-coach-copy">
        {game.stage === "bottleneck" ? <Warning size={25} weight="fill" /> : <Lightbulb size={25} weight="duotone" />}
        <div><small>{shiftCoachEyebrow(game.stage)}</small><p>{game.feedback ?? shiftCoachMessage(game.stage)}</p></div>
      </div>
      {action}
    </section>
  );
}

function shiftCoachAction(stage: FirstShiftStage, dispatch: Dispatch<Parameters<typeof firstShiftReducer>[1]>) {
  if (stage === "arrival-one") return <button className="shift-primary" type="button" onClick={() => dispatch({ type: "OPEN_GATE" })}>Open the entry gate <ArrowRight size={20} /></button>;
  if (stage === "between-cars") return <button className="shift-primary" type="button" onClick={() => dispatch({ type: "NEXT_CAR" })}>Bring in the second driver <ArrowRight size={20} /></button>;
  if (stage === "rush-intro") return <button className="shift-primary" type="button" onClick={() => dispatch({ type: "START_RUSH" })}><Play size={20} weight="fill" /> Start rush hour</button>;
  if (stage === "bottleneck") return <button className="shift-primary" type="button" onClick={() => dispatch({ type: "ASK_MENTOR" })}><Wrench size={20} /> Show me a faster way</button>;
  if (stage === "floor1-installed") return <button className="shift-primary" type="button" onClick={() => dispatch({ type: "RUN_SCANNER" })}><Scan size={20} /> Run the Floor 1 scanner</button>;
  if (stage === "floor1-running" || stage === "floor2-running") return <button className="shift-primary" type="button" disabled><Scan size={20} /> Scanning every space…</button>;
  if (stage === "floor1-success") return <button className="shift-primary" type="button" onClick={() => dispatch({ type: "START_TRANSFER" })}>Send rush hour to Floor 2 <ArrowRight size={20} /></button>;
  if (stage === "floor2-installed") return <button className="shift-primary" type="button" onClick={() => dispatch({ type: "RUN_SCANNER" })}><Play size={20} weight="fill" /> Run without hints</button>;
  return null;
}

function ShiftReveal({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="shift-reveal" aria-labelledby="shift-title">
      <header><span><Sparkle size={19} weight="fill" /> Shift debrief · incident cleared</span><h1 id="shift-title">Rush hour is under control.</h1><p>Your upgrade worked because each floor can now search the parking spaces it already manages.</p></header>
      <div className="shift-replay-strip">
        <article><small>Before the upgrade</small><strong>One space at a time</strong><span>Every driver waited for a manual check.</span></article>
        <ArrowRight size={21} />
        <article><small>The upgrade</small><strong>Floor 1 searched its own spaces</strong><span>One scan cleared the queue.</span></article>
        <ArrowRight size={21} />
        <article><small>Stress test</small><strong>Floor 2 worked on the first run</strong><span>The same structure handled a new floor.</span></article>
      </div>
      <div className="shift-concept-map">
        <div><span>Floor 1</span><ArrowRight size={18} /><strong>one <code>Level</code> object</strong></div>
        <div><span>All six spaces</span><ArrowRight size={18} /><strong>a <code>spots</code> property</strong></div>
        <div><span>The scanner action</span><ArrowRight size={18} /><strong>a <code>findSpot(vehicle)</code> method</strong></div>
        <div><span>One focused floor job</span><ArrowRight size={18} /><strong>Single Responsibility</strong></div>
      </div>
      <div className="shift-code-reveal">
        <div><small>Garage blueprint</small><pre><code>{SHIFT_JAVA}</code></pre></div>
        <blockquote><small>Your design defense</small>“<code>Level</code> owns its parking spaces, so it should also own the method that searches those spaces. <code>ParkingLot</code> coordinates floors instead of inspecting every space itself.”</blockquote>
      </div>
      <button className="shift-primary" type="button" onClick={onContinue}>Enter the interview room <ArrowRight size={20} /></button>
    </section>
  );
}

function ShiftInterview({
  answer,
  assessment,
  showModelAnswer,
  onAnswerChange,
  onToggleModel,
  onSubmit,
}: {
  answer: string;
  assessment?: FirstShiftInterviewAssessment;
  showModelAnswer: boolean;
  onAnswerChange: (answer: string) => void;
  onToggleModel: () => void;
  onSubmit: () => void;
}) {
  const evidence = [
    "The floor owns its parking spaces",
    "findSpot searches those spaces",
    "ParkingLot coordinates floors",
    "Focused ownership contains future change",
  ];
  return (
    <section className="shift-interview" aria-labelledby="shift-title">
      <header><span><Code size={19} /> Interview checkpoint</span><h1 id="shift-title">Why does the scanner belong on the floor?</h1><p>Explain why <code>findSpot(vehicle)</code> belongs in <code>Level</code> instead of <code>ParkingLot</code>. Use the garage you just operated.</p></header>
      <div className="shift-interview-grid">
        <div className="shift-answer-panel">
          <label htmlFor="shift-answer">Answer in your own words</label>
          <textarea id="shift-answer" value={answer} onChange={(event) => onAnswerChange(event.target.value)} placeholder="I would put findSpot inside Level because…" />
          <div><button className="shift-secondary" type="button" onClick={onToggleModel}>{showModelAnswer ? "Hide strong answer" : "See a strong answer"}</button><button className="shift-primary" type="button" onClick={onSubmit} disabled={answer.trim().length < 40}>Check my reasoning <ArrowRight size={18} /></button></div>
          {showModelAnswer ? <blockquote><small>Strong answer</small>{STRONG_SHIFT_ANSWER}</blockquote> : null}
        </div>
        <aside className="shift-evidence">
          <small>Evidence your interviewer needs</small>
          <h2>{assessment ? `${assessment.score}% supported` : "Four connected ideas"}</h2>
          <ul>{evidence.map((item) => {
            const matched = assessment?.matched.includes(item);
            const missing = assessment?.missing.includes(item);
            return <li key={item} className={matched ? "is-matched" : missing ? "is-missing" : ""}>{matched ? <CheckCircle size={18} weight="fill" /> : <span />}{item}</li>;
          })}</ul>
          <p>{assessment && assessment.score < 75 ? "Reconnect the red ideas to what happened during rush hour, then try again." : "You do not need exact wording. Explain the ownership and the consequence."}</p>
        </aside>
      </div>
    </section>
  );
}

function ShiftComplete({ score, attempts, onReplay, onContinue }: { score: number; attempts: number; onReplay: () => void; onContinue?: () => void }) {
  return (
    <section className="shift-complete" aria-labelledby="shift-title">
      <span className="shift-complete-icon"><CheckCircle size={44} weight="fill" /></span>
      <small>Mission 1 complete</small>
      <h1 id="shift-title">You can reason about responsibility.</h1>
      <p>You experienced the slow design, installed the focused behavior, transferred it to another floor, and explained why the method belongs there.</p>
      <div className="shift-earned">
        <span><Stack size={19} /><b>Level</b><small>class</small></span>
        <span><MapPin size={19} /><b>spots</b><small>property</small></span>
        <span><Scan size={19} /><b>findSpot()</b><small>method</small></span>
        <span><Wrench size={19} /><b>SRP</b><small>principle</small></span>
      </div>
      <div className="shift-score"><strong>{score}%</strong><span>interview evidence</span><i>{attempts === 0 ? "Transferred without a wrong installation" : `${attempts} useful ${attempts === 1 ? "retry" : "retries"}`}</i></div>
      <div className="shift-complete-actions">
        {onContinue ? (
          <button className="shift-primary" type="button" onClick={onContinue}>Next chapter: Open/Closed <ArrowRight size={20} /></button>
        ) : null}
        <button className={onContinue ? "shift-secondary" : "shift-primary"} type="button" onClick={onReplay}><ArrowClockwise size={20} /> Replay the shift from memory</button>
      </div>
    </section>
  );
}

function shiftObjective(stage: FirstShiftStage): string {
  if (stage === "arrival-one" || stage === "manual-one") return "Park your first driver";
  if (stage === "between-cars" || stage === "manual-two") return "Handle the next arrival";
  if (stage === "rush-intro" || stage === "rush-search" || stage === "bottleneck") return "Keep rush hour moving";
  if (stage === "demo" || stage === "carrying-demo" || stage === "floor1-installed" || stage === "floor1-running") return "Upgrade Floor 1";
  if (stage === "floor1-success") return "See why the upgrade worked";
  return "Fix Floor 2 without a hint";
}

function shiftCoachEyebrow(stage: FirstShiftStage): string {
  if (stage === "bottleneck") return "Rush-hour failure";
  if (stage === "demo" || stage === "carrying-demo") return "Guided upgrade";
  if (stage === "transfer" || stage === "carrying-transfer" || stage === "floor2-installed" || stage === "floor2-running") return "Transfer round · hints off";
  if (stage === "floor1-success") return "Visible improvement";
  return "Shift mentor";
}

function shiftCoachMessage(stage: FirstShiftStage): string {
  if (stage === "manual-one") return "Click the parking spaces on Floor 1 until you discover a free one, then guide the car there.";
  if (stage === "manual-two") return "Do the same job again for the next driver. Notice how many individual checks the job requires.";
  if (stage === "rush-search") return "Keep checking spaces while three drivers wait at the entrance.";
  if (stage === "demo") return "Pick up the new floor scanner. It can read all of one floor's spaces at once.";
  if (stage === "carrying-demo") return "Install it on the floor that owns the spaces being searched.";
  if (stage === "floor1-installed") return "The scanner is beside Floor 1's spaces. Run it and compare the result with manual search.";
  if (stage === "floor1-running") return "Floor 1 is checking every space it owns in one action.";
  if (stage === "floor1-success") return "The same floor data is being searched, but the search now lives beside that data.";
  if (stage === "transfer") return "A second scanner is waiting at HQ. Rush hour has moved to Floor 2.";
  if (stage === "carrying-transfer") return "Use the visible queue to decide where the scanner is needed. There is no teaching glow this time.";
  if (stage === "floor2-installed") return "You chose Floor 2. Run the scanner and prove the idea transfers.";
  return "Follow the visible problem in the garage.";
}

const SHIFT_JAVA = `class Level {
  private List<ParkingSpot> spots;

  ParkingSpot findSpot(Vehicle vehicle) {
    return spots.stream()
      .filter(spot -> spot.canFit(vehicle))
      .findFirst()
      .orElseThrow();
  }
}`;
