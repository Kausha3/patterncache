import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AMAZON_PREP_SIGNAL_LABELS,
  AMAZON_PREP_TIER_LABELS,
  AMAZON_SDE1_15_DAY_PLAN,
  AMAZON_SDE1_QUESTIONS,
  AMAZON_SDE1_RESEARCH_SOURCES,
  getAmazonPrepQuestion,
  isExternalPrepHref,
  type AmazonPrepQuestion,
  type AmazonPrepTier,
  type AmazonPrepTrack,
} from "@/content/amazonSde1Prep";
import { Icon } from "@/components/Icon";
import { Button, Eyebrow } from "@/components/ui";
import { isReviewDue, useAmazonPrepProgress, type AmazonPrepStatus } from "@/hooks/useAmazonPrepProgress";
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
  const { records, setStatus, logReview, resetAll } = useAmazonPrepProgress();

  const counts = useMemo(() => {
    const must = AMAZON_SDE1_QUESTIONS.filter((question) => question.tier === "must");
    const ready = must.filter((question) => records[question.id]?.status === "ready").length;
    const learning = must.filter((question) => records[question.id]?.status === "learning").length;
    const dsa = must.filter((question) => question.track === "dsa");
    const lld = must.filter((question) => question.track === "lld");
    return {
      must: must.length,
      ready,
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
          <small>{counts.ready} of {counts.must} can be defended</small>
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
        <ProgressMetric label="Must-do DSA" value={`${counts.dsaReady}/${counts.dsaTotal}`} detail="can explain + code" tone="teal" />
        <ProgressMetric label="Must-do LLD" value={`${counts.lldReady}/${counts.lldTotal}`} detail="can model + defend" tone="violet" />
        <ProgressMetric label="In learning" value={String(counts.learning)} detail="started, not stable" tone="amber" />
        <ProgressMetric label="Reviews due" value={String(counts.due)} detail="1 / 3 / 7-day loop" tone={counts.due > 0 ? "red" : "green"} />
      </section>

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
          <span>2–2¼ focused hours / day</span>
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
                status={records[question.id]?.status ?? "not-started"}
                practiceCount={records[question.id]?.practiceCount ?? 0}
                nextReview={records[question.id]?.nextReview}
                reviewDue={isReviewDue(records[question.id])}
                onStatus={(status) => setStatus(question.id, status)}
                onReview={() => logReview(question.id)}
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
  status,
  practiceCount,
  nextReview,
  reviewDue,
  onStatus,
  onReview,
}: {
  question: AmazonPrepQuestion;
  number: number;
  status: AmazonPrepStatus;
  practiceCount: number;
  nextReview?: string;
  reviewDue: boolean;
  onStatus: (status: AmazonPrepStatus) => void;
  onReview: () => void;
}) {
  const action = isExternalPrepHref(question.href) ? (
    <a className="amazon-practice-link" href={question.href} target="_blank" rel="noreferrer">Open problem <Icon name="arrowRight" size={13} /></a>
  ) : (
    <Link className="amazon-practice-link" to={question.href}>Open lesson <Icon name="arrowRight" size={13} /></Link>
  );

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
          {(["not-started", "learning", "ready"] as const).map((value) => (
            <button key={value} aria-pressed={status === value} onClick={() => onStatus(value)}>{STATUS_LABELS[value]}</button>
          ))}
        </div>
      </div>
      {status !== "not-started" ? (
        <div className="amazon-review-row">
          <span>{practiceCount} practice {practiceCount === 1 ? "pass" : "passes"}{nextReview ? ` · next ${humanDate(nextReview)}` : ""}</span>
          <button onClick={onReview}>Log review today</button>
        </div>
      ) : null}
    </article>
  );
}

function ReadinessGate({ counts }: { counts: { ready: number; must: number; dsaReady: number; dsaTotal: number; lldReady: number; lldTotal: number } }) {
  const technicalReady = counts.ready === counts.must;
  return (
    <section className="amazon-readiness-gate" aria-labelledby="readiness-title">
      <div className="amazon-readiness-icon"><Icon name={technicalReady ? "trophy" : "shield"} size={26} /></div>
      <div>
        <Eyebrow tone={technicalReady ? "var(--green)" : "var(--amber)"}>Confidence gate</Eyebrow>
        <h2 id="readiness-title">{technicalReady ? "Core technical set complete" : "Ready means you can defend, not recognize"}</h2>
        <p>Before saying “I prepared well enough,” verify all five:</p>
        <ul>
          <li className={counts.dsaReady === counts.dsaTotal ? "passed" : ""}>Every must-do DSA can be solved cold, tested, and explained in 35–45 minutes.</li>
          <li className={counts.lldReady === counts.lldTotal ? "passed" : ""}>Every must-do LLD can be clarified, modeled, and defended in 45–55 minutes.</li>
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
