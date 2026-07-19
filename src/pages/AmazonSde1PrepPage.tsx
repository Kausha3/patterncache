import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AMAZON_PREP_SIGNAL_LABELS,
  AMAZON_PREP_TIER_LABELS,
  AMAZON_SDE1_15_DAY_PLAN,
  AMAZON_SDE1_QUESTIONS,
  AMAZON_SDE1_RESEARCH_SOURCES,
  getAmazonCombatMissionId,
  getAmazonPrepQuestion,
  isExternalPrepHref,
  type AmazonPrepQuestion,
  type AmazonPrepTier,
  type AmazonPrepTrack,
} from "@/content/amazonSde1Prep";
import {
  AMAZON_MUST_DO_COVERAGE,
  AMAZON_MUST_DO_COVERAGE_SUMMARY,
  getAmazonCoverageEntry,
  type AmazonCoverageEntry,
} from "@/content/amazonCoverageAudit";
import { Icon } from "@/components/Icon";
import { AmazonReadinessProof } from "@/components/AmazonReadinessProof";
import { Button, Eyebrow } from "@/components/ui";
import {
  isReviewDue,
  useAmazonPrepProgress,
  type AmazonPrepEvidence,
  type AmazonPrepRecord,
  type AmazonPrepStatus,
  type EditableAmazonPrepStatus,
} from "@/hooks/useAmazonPrepProgress";
import { useGameProgress } from "@/hooks/useGameProgress";
import { getCodingCombatMission, getCodingCombatMissionRoute } from "@/arena/codingCombatMissions";
import { loadParkingLotGauntletProgress } from "@/game/parkingLotGauntletProgress";
import { getLldVerificationWorldByQuestion } from "@/arena/lldVerificationWorlds";
import { loadCompletedLldVerificationWorldIds } from "@/game/lldVerificationProgress";
import "@/theme/amazon-sde1.css";

type TrackFilter = AmazonPrepTrack | "all";

const STATUS_LABELS: Record<AmazonPrepStatus, string> = {
  "not-started": "Not started",
  learning: "Learning",
  ready: "Can defend",
};

const TIER_COPY: Record<AmazonPrepTier, string> = {
  must: "Finish these first. They cover the interview-critical patterns and the strongest recent reported signals.",
  good: "Add these after the must-do set is stable. They improve transfer without diluting the core sprint.",
  stretch: "Use only after the core is interview-ready. These are valuable, but have a lower return inside a short deadline.",
};

export function AmazonSde1PrepPage() {
  const navigate = useNavigate();
  const [tier, setTier] = useState<AmazonPrepTier>("must");
  const [track, setTrack] = useState<TrackFilter>("all");
  const [query, setQuery] = useState("");
  const { records, setStatus, recordProof, logReview, resetAll } = useAmazonPrepProgress();
  const { codingCombatScores } = useGameProgress();
  const parkingLotCompleted = !!loadParkingLotGauntletProgress().record;
  const completedLldWorlds = useMemo(() => loadCompletedLldVerificationWorldIds(), []);

  const counts = useMemo(() => {
    const must = AMAZON_SDE1_QUESTIONS.filter((question) => question.tier === "must");
    const ready = must.filter((question) => records[question.id]?.status === "ready").length;
    const verified = must.filter((question) => records[question.id]?.evidence?.verified === true).length;
    const learning = must.filter((question) => records[question.id]?.status === "learning").length;
    const dsa = must.filter((question) => question.track === "dsa");
    const lld = must.filter((question) => question.track === "lld");
    return {
      must: must.length,
      ready,
      verified,
      learning,
      dsaReady: dsa.filter((question) => records[question.id]?.status === "ready").length,
      dsaTotal: dsa.length,
      lldReady: lld.filter((question) => records[question.id]?.status === "ready").length,
      lldTotal: lld.length,
      due: AMAZON_SDE1_QUESTIONS.filter((question) => isReviewDue(records[question.id])).length,
    };
  }, [records]);

  const displayedQuestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return AMAZON_SDE1_QUESTIONS.filter((question) => {
      if (question.tier !== tier || (track !== "all" && question.track !== track)) return false;
      if (!normalized) return true;
      return `${question.title} ${question.pattern} ${question.recallCue}`.toLowerCase().includes(normalized);
    });
  }, [query, tier, track]);

  const completion = counts.must === 0 ? 0 : Math.round((counts.ready / counts.must) * 100);

  return (
    <div className="amazon-prep-page">
      <button className="amazon-prep-back" onClick={() => navigate("/companies/amazon")}>
        <Icon name="arrowLeft" size={14} /> Amazon overview
      </button>

      <header className="amazon-prep-hero">
        <div className="amazon-prep-hero-copy">
          <Eyebrow tone="var(--amber)">Amazon SDE I · entry level</Eyebrow>
          <h1>Your 15-day technical mission</h1>
          <p>
            A coverage-first DSA and LLD board built from Amazon’s official expectations and recent candidate reports.
            Master the must-do set, then unlock the next tier only when time remains.
          </p>
          <div className="amazon-prep-hero-actions">
            <Button onClick={() => document.getElementById("amazon-must-board")?.scrollIntoView({ behavior: "smooth" })} icon="target">
              Start must-dos
            </Button>
            <Button variant="ghost" onClick={() => document.getElementById("amazon-sprint")?.scrollIntoView({ behavior: "smooth" })}>
              See the 15-day sprint
            </Button>
          </div>
        </div>
        <div className="amazon-prep-rank" aria-label={`${completion}% of must-do questions ready`}>
          <span>CORE READINESS</span>
          <strong>{completion}%</strong>
          <div className="amazon-prep-rank-bar"><span style={{ width: `${completion}%` }} /></div>
          <small>{counts.ready} of {counts.must} have proof · {counts.verified} machine-verified</small>
        </div>
      </header>

      <section className="amazon-level-note" aria-label="Amazon level clarification">
        <Icon name="insight" size={18} />
        <div>
          <strong>Level calibration:</strong> Amazon normally labels the entry-level full-time role <b>SDE I / L4</b>.
          “L3” is commonly intern or location-specific. Prepare to this SDE-I bar, but always follow the level in your recruiter email or job ID.
        </div>
      </section>

      <section className="amazon-prep-metrics" aria-label="Preparation progress">
        <ProgressMetric label="Must-do DSA" value={`${counts.dsaReady}/${counts.dsaTotal}`} detail="readiness proof recorded" tone="teal" />
        <ProgressMetric label="Must-do LLD" value={`${counts.lldReady}/${counts.lldTotal}`} detail="design defense recorded" tone="violet" />
        <ProgressMetric label="In learning" value={String(counts.learning)} detail="started, not stable" tone="amber" />
        <ProgressMetric label="Reviews due" value={String(counts.due)} detail="1 / 3 / 7-day loop" tone={counts.due > 0 ? "red" : "green"} />
      </section>

      <CoverageAudit />

      <section className="amazon-memory-loop" aria-labelledby="memory-loop-title">
        <div>
          <Eyebrow tone="var(--teal)">Retention protocol</Eyebrow>
          <h2 id="memory-loop-title">Make every solution survive the interview</h2>
        </div>
        <ol>
          <li><span>1</span><div><strong>Recognize</strong><small>Say the trigger and choose the pattern.</small></div></li>
          <li><span>2</span><div><strong>Prove</strong><small>State the invariant before syntax.</small></div></li>
          <li><span>3</span><div><strong>Build</strong><small>Code, test, and give complexity.</small></div></li>
          <li><span>4</span><div><strong>Twist</strong><small>Handle one follow-up variation.</small></div></li>
          <li><span>5</span><div><strong>Revisit</strong><small>Review after 1, 3, and 7 days.</small></div></li>
        </ol>
      </section>

      <section id="amazon-sprint" className="amazon-sprint-section" aria-labelledby="amazon-sprint-title">
        <div className="amazon-section-heading">
          <div>
            <Eyebrow tone="var(--blue)">Starting tomorrow</Eyebrow>
            <h2 id="amazon-sprint-title">15-day DSA + LLD sprint</h2>
          </div>
          <span>2 to 2¼ focused hours / day</span>
        </div>
        <div className="amazon-sprint-grid">
          {AMAZON_SDE1_15_DAY_PLAN.map((day) => {
            const ready = day.questionIds.filter((id) => records[id]?.status === "ready").length;
            return (
              <details key={day.day} className="amazon-day-card" open={day.day === 1}>
                <summary>
                  <span className="amazon-day-number">D{String(day.day).padStart(2, "0")}</span>
                  <span className="amazon-day-title"><strong>{day.title}</strong><small>{scheduleDate(day.day)} · {day.minutes} min</small></span>
                  <span className="amazon-day-progress">{day.questionIds.length > 0 ? `${ready}/${day.questionIds.length}` : "MOCK"}</span>
                </summary>
                <div className="amazon-day-body">
                  <p>{day.focus}</p>
                  {day.questionIds.length > 0 ? (
                    <ul>
                      {day.questionIds.map((id) => {
                        const question = getAmazonPrepQuestion(id);
                        if (!question) return null;
                        return <li key={id}><span className={records[id]?.status === "ready" ? "is-ready" : ""}>{question.title}</span></li>;
                      })}
                    </ul>
                  ) : null}
                  <div className="amazon-day-checkpoint"><Icon name="shield" size={15} /><span>{day.checkpoint}</span></div>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section id="amazon-must-board" className="amazon-question-section" aria-labelledby="amazon-board-title">
        <div className="amazon-section-heading amazon-board-heading">
          <div>
            <Eyebrow tone="var(--violet)">Priority board</Eyebrow>
            <h2 id="amazon-board-title">Know what to do next</h2>
          </div>
          <span>{displayedQuestions.length} questions shown</span>
        </div>

        <div className="amazon-tier-tabs" role="tablist" aria-label="Question priority">
          {(["must", "good", "stretch"] as const).map((value) => {
            const total = AMAZON_SDE1_QUESTIONS.filter((question) => question.tier === value).length;
            return (
              <button key={value} role="tab" aria-selected={tier === value} className={tier === value ? "is-active" : ""} onClick={() => setTier(value)}>
                <span>{AMAZON_PREP_TIER_LABELS[value]}</span><small>{total}</small>
              </button>
            );
          })}
        </div>
        <p className="amazon-tier-copy">{TIER_COPY[tier]}</p>

        <div className="amazon-board-tools">
          <div className="amazon-track-filter" aria-label="Filter by track">
            {(["all", "dsa", "lld"] as const).map((value) => (
              <button key={value} aria-pressed={track === value} onClick={() => setTrack(value)}>{value === "all" ? "All" : value.toUpperCase()}</button>
            ))}
          </div>
          <label className="amazon-search">
            <span className="sr-only">Search questions</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or pattern…" />
          </label>
        </div>

        {displayedQuestions.length > 0 ? (
          <div className="amazon-question-grid">
            {displayedQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                number={index + 1}
                record={records[question.id]}
                reviewDue={isReviewDue(records[question.id])}
                onStatus={(status) => setStatus(question.id, status)}
                onProof={(evidence) => recordProof(question.id, evidence)}
                onReview={() => logReview(question.id)}
                combatCompleted={(() => {
                  const missionId = getAmazonCombatMissionId(question.id);
                  return !!(missionId && codingCombatScores[missionId]);
                })()}
                verifiedLldCompleted={question.id === "lld-parking-lot" ? parkingLotCompleted : (() => {
                  const world = getLldVerificationWorldByQuestion(question.id);
                  return !!world && completedLldWorlds.has(world.id);
                })()}
              />
            ))}
          </div>
        ) : (
          <div className="amazon-empty-state">No questions match this search. Clear the text or switch tracks.</div>
        )}
      </section>

      <ReadinessGate counts={counts} />

      <section className="amazon-sources">
        <details>
          <summary>Research basis and honesty note</summary>
          <div>
            <p>
              Official Amazon material defines the capabilities and assessment format. Candidate reports supply directional examples only;
              they do not provide reliable global frequency counts. Location, team, and interviewer can change the loop.
            </p>
            <ul>
              {AMAZON_SDE1_RESEARCH_SOURCES.map((source) => (
                <li key={source.id}><a href={source.href} target="_blank" rel="noreferrer">{source.label}</a><span>{source.kind === "official" ? "OFFICIAL" : "REPORT"}</span></li>
              ))}
            </ul>
          </div>
        </details>
      </section>

      <div className="amazon-reset-row">
        <button onClick={() => window.confirm("Reset every Amazon SDE-I question status and review date?") && resetAll()}>Reset this board</button>
      </div>
    </div>
  );
}

function ProgressMetric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <div className={`amazon-progress-metric tone-${tone}`}>
      <span>{label}</span><strong>{value}</strong><small>{detail}</small>
    </div>
  );
}

function QuestionCard({
  question,
  number,
  record,
  reviewDue,
  onStatus,
  onProof,
  onReview,
  combatCompleted,
  verifiedLldCompleted,
}: {
  question: AmazonPrepQuestion;
  number: number;
  record?: AmazonPrepRecord;
  reviewDue: boolean;
  onStatus: (status: EditableAmazonPrepStatus) => void;
  onProof: (evidence: AmazonPrepEvidence) => void;
  onReview: () => void;
  combatCompleted: boolean;
  verifiedLldCompleted: boolean;
}) {
  const [proofOpen, setProofOpen] = useState(false);
  const status = record?.status ?? "not-started";
  const practiceCount = record?.practiceCount ?? 0;
  const nextReview = record?.nextReview;
  const combatMissionId = getAmazonCombatMissionId(question.id);
  const combatMission = combatMissionId ? getCodingCombatMission(combatMissionId) : undefined;
  const coverage = question.tier === "must" ? getAmazonCoverageEntry(question.id) : undefined;
  const lldWorld = getLldVerificationWorldByQuestion(question.id);
  const verifiedPractice = combatMissionId ? {
    refId: combatMissionId,
    label: combatMission?.worldRoute ? "the code-driven Algorithm World" : "the hidden-JVM Coding Combat mission",
    completed: combatCompleted,
    summary: `Passed visible and hidden JVM tests for ${question.title}, then completed the defense round.`,
  } : question.id === "lld-parking-lot" ? {
    refId: "parking-lot-gauntlet",
    label: "the six-incident Parking Lot Design Gauntlet",
    completed: verifiedLldCompleted,
    summary: "Repaired and reran all six Parking Lot incidents: entry, compatibility, concurrency, tickets, pricing, and payment. Then passed the free-form design defense.",
  } : lldWorld ? {
    refId: `lld-world-${lldWorld.id}`,
    label: `the ${lldWorld.incidents.length}-incident ${lldWorld.systemName} Verification World`,
    completed: verifiedLldCompleted,
    summary: lldWorld.defense.verifiedSummary,
  } : undefined;
  const originalAction = isExternalPrepHref(question.href) ? (
    <a className="amazon-practice-link" href={question.href} target="_blank" rel="noreferrer">Open problem <Icon name="arrowRight" size={13} /></a>
  ) : (
    <Link className="amazon-practice-link" to={question.href}>Open lesson <Icon name="arrowRight" size={13} /></Link>
  );
  const action = combatMissionId ? (
    <div className="amazon-practice-links">
      <Link className="amazon-practice-link" to={getCodingCombatMissionRoute(combatMissionId)}>
        {combatMission?.worldRoute ? "Enter Algorithm World" : "Solve in Java"} <Icon name="code" size={13} />
      </Link>
      {isExternalPrepHref(question.href) ? (
        <a className="amazon-reference-link" href={question.href} target="_blank" rel="noreferrer">Original statement</a>
      ) : null}
    </div>
  ) : question.track === "lld" && coverage?.level === "machine-verified" && coverage.route ? (
    <div className="amazon-practice-links">
      <Link className="amazon-practice-link" to={coverage.route}>Enter LLD World <Icon name="layers" size={13} /></Link>
      <Link className="amazon-reference-link" to={question.href}>Open guided lesson</Link>
    </div>
  ) : originalAction;

  return (
    <article id={`prep-${question.id}`} className={`amazon-question-card track-${question.track} status-${status}`}>
      <div className="amazon-question-topline">
        <span className="amazon-question-number">{String(number).padStart(2, "0")}</span>
        <span className="amazon-question-track">{question.track.toUpperCase()}</span>
        <span className="amazon-question-difficulty">{question.difficulty} · {question.minutes}m</span>
      </div>
      <h3>{question.title}</h3>
      <div className="amazon-question-badges">
        <span>{question.pattern}</span>
        <span className={`signal-${question.signal}`}>{AMAZON_PREP_SIGNAL_LABELS[question.signal]}</span>
        {reviewDue ? <span className="review-due">Review due</span> : null}
        {coverage ? <CoverageBadge entry={coverage} /> : null}
      </div>
      <p className="amazon-question-why">{question.why}</p>
      <div className="amazon-recall-cue">
        <Eyebrow tone="var(--amber)">Recognition cue</Eyebrow>
        <p>{question.recallCue}</p>
      </div>
      <details className="amazon-memory-test">
        <summary>Memory test and follow-ups</summary>
        <div>
          <strong>Prove it</strong>
          <p>{question.proof}</p>
          <strong>Interview twists</strong>
          <ul>{question.variations.map((variation) => <li key={variation}>{variation}</li>)}</ul>
        </div>
      </details>
      <div className="amazon-question-actions">
        {action}
        <div className="amazon-status-control" aria-label={`Confidence for ${question.title}`}>
          {(["not-started", "learning"] as const).map((value) => (
            <button key={value} aria-pressed={status === value} onClick={() => onStatus(value)}>{STATUS_LABELS[value]}</button>
          ))}
          <button
            className="amazon-prove-button"
            aria-pressed={status === "ready"}
            aria-expanded={proofOpen}
            onClick={() => setProofOpen((current) => !current)}
          >
            {status === "ready" ? (record?.evidence?.verified ? "Verified clear" : "Proof recorded") : "Prove readiness"}
          </button>
        </div>
      </div>
      {proofOpen ? (
        <AmazonReadinessProof
          questionTitle={question.title}
          track={question.track}
          verifiedPractice={verifiedPractice}
          evidence={record?.evidence}
          onProof={(evidence) => {
            onProof(evidence);
            setProofOpen(true);
          }}
        />
      ) : null}
      {status !== "not-started" ? (
        <div className="amazon-review-row">
          <span>{practiceCount} practice {practiceCount === 1 ? "pass" : "passes"}{nextReview ? ` · next ${humanDate(nextReview)}` : ""}</span>
          <button onClick={onReview}>Log completed review</button>
        </div>
      ) : null}
    </article>
  );
}

function CoverageAudit() {
  const summary = AMAZON_MUST_DO_COVERAGE_SUMMARY;
  const missingDsa = AMAZON_MUST_DO_COVERAGE.filter((entry) => entry.track === "dsa" && entry.level === "uncovered");
  const guidedLld = AMAZON_MUST_DO_COVERAGE.filter((entry) => entry.track === "lld" && entry.level === "guided-only");
  return (
    <section className="amazon-coverage-audit" aria-labelledby="amazon-coverage-title">
      <header>
        <div>
          <Eyebrow tone="var(--green)">Machine-checked product coverage</Eyebrow>
          <h2 id="amazon-coverage-title">What this app can actually verify today</h2>
        </div>
        <span>Board presence never counts as mastery</span>
      </header>
      <div className="amazon-coverage-tracks">
        <article>
          <div><span>DSA must-dos</span><strong>{summary.dsa.machineVerified}/{summary.dsa.total}</strong></div>
          <div className="amazon-coverage-meter"><span style={{ width: `${(summary.dsa.machineVerified / summary.dsa.total) * 100}%` }} /></div>
          <p><b>{summary.dsa.machineVerified} exact Java missions</b> with visible and hidden JVM tests. {summary.dsa.uncovered} still rely on an external problem.</p>
          <details>
            <summary>Show the {summary.dsa.uncovered} executable DSA gaps</summary>
            <ul>{missingDsa.map((entry) => <li key={entry.questionId}>{entry.title}</li>)}</ul>
          </details>
        </article>
        <article>
          <div><span>LLD must-dos</span><strong>{summary.lld.machineVerified}/{summary.lld.total}</strong></div>
          <div className="amazon-coverage-meter lld"><span style={{ width: `${(summary.lld.machineVerified / summary.lld.total) * 100}%` }} /></div>
          <p><b>{summary.lld.machineVerified} exact verification worlds</b> with persistent incidents, live responsibility moves, complete-model reruns, and free-form defenses. Reading a lesson alone never counts as mastery.</p>
          {guidedLld.length > 0 ? (
            <details>
              <summary>Why {guidedLld.length} guided LLD prompt{guidedLld.length === 1 ? " is" : "s are"} not marked verified</summary>
              <ul>{guidedLld.map((entry) => <li key={entry.questionId}><b>{entry.title}</b>: {entry.practiceLabel}</li>)}</ul>
            </details>
          ) : <span className="amazon-coverage-complete">All six exact Amazon LLD must-dos now have runnable proof.</span>}
        </article>
      </div>
      <p className="amazon-coverage-honesty"><Icon name="shield" size={15} /> This measures the product’s coverage, not your personal readiness. Your proof and review records remain separate above.</p>
    </section>
  );
}

function CoverageBadge({ entry }: { entry: AmazonCoverageEntry }) {
  const copy = entry.level === "machine-verified" ? "Executable" : entry.level === "guided-only" ? "Guided only" : "Coverage gap";
  return <span className={`coverage-${entry.level}`} title={entry.reason}>{copy}</span>;
}

function ReadinessGate({ counts }: { counts: { ready: number; verified: number; must: number; dsaReady: number; dsaTotal: number; lldReady: number; lldTotal: number } }) {
  const technicalReady = counts.ready === counts.must;
  return (
    <section className="amazon-readiness-gate" aria-labelledby="readiness-title">
      <div className="amazon-readiness-icon"><Icon name={technicalReady ? "trophy" : "shield"} size={26} /></div>
      <div>
        <Eyebrow tone={technicalReady ? "var(--green)" : "var(--amber)"}>Confidence gate</Eyebrow>
        <h2 id="readiness-title">{technicalReady ? "Every core question has evidence" : "Ready means you can defend, not recognize"}</h2>
        <p>{counts.verified} of {counts.ready} recorded proofs are machine-verified executable clears. The rest are explicitly marked structured self-review.</p>
        <p>Before saying “I prepared well enough,” verify all five:</p>
        <ul>
          <li className={counts.dsaReady === counts.dsaTotal ? "passed" : ""}>Every must-do DSA can be solved cold, tested, and explained in 35-45 minutes.</li>
          <li className={counts.lldReady === counts.lldTotal ? "passed" : ""}>Every must-do LLD can be clarified, modeled, and defended in 45-55 minutes.</li>
          <li>Two 70-minute coding mocks finish with working code and edge-case tests.</li>
          <li>Two unseen LLD mocks survive one changed requirement without a rewrite.</li>
          <li>Six metric-backed Leadership Principle stories are ready. Technical prep does not replace Amazon behavioral prep.</li>
        </ul>
      </div>
    </section>
  );
}

function scheduleDate(day: number): string {
  const date = new Date();
  date.setDate(date.getDate() + day);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function humanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}
