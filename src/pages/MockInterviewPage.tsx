import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Divider, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { COMPANY_PROFILES, getCompanyProfile } from "@/interview/companyProfiles";
import { computeFit, parseJobDescription, parseResume } from "@/interview/resumeParser";
import type { FitReport, ResumeFacts } from "@/interview/resumeParser";
import { generateInterviewPlan } from "@/interview/questionGenerator";
import type { InterviewPlan, PlannedQuestion } from "@/interview/questionGenerator";
import { assessAnswer, debriefSession } from "@/interview/answerJudge";
import type { AnswerAssessment } from "@/interview/answerJudge";
import { saveMockSession } from "@/interview/mockSessionStore";
import { color, font, radius } from "@/theme/tokens";

/**
 * Resume-based mock interview. Everything runs on this device: the resume
 * and job description are parsed in the browser, questions come from the
 * selected company's real evaluation culture, and answers are coached by
 * deterministic heuristics that say exactly what they can and cannot judge.
 */

type Step = "setup" | "review" | "interview" | "debrief";

interface AnsweredQuestion {
  question: PlannedQuestion;
  answer: string;
  assessment: AnswerAssessment;
}

export function MockInterviewPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("setup");
  const [companyId, setCompanyId] = useState("general");
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [facts, setFacts] = useState<ResumeFacts>();
  const [fit, setFit] = useState<FitReport>();
  const [plan, setPlan] = useState<InterviewPlan>();
  const [flatQuestions, setFlatQuestions] = useState<PlannedQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerDraft, setAnswerDraft] = useState("");
  const [currentAssessment, setCurrentAssessment] = useState<AnswerAssessment>();
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
  const [sessionId] = useState(() => `mock-${Date.now().toString(36)}`);

  const profile = getCompanyProfile(companyId)!;

  const runParse = () => {
    const parsedResume = parseResume(resumeText);
    const parsedJd = parseJobDescription(jdText);
    setFacts(parsedResume);
    setFit(computeFit(parsedResume, parsedJd));
    setStep("review");
  };

  const startInterview = () => {
    if (!facts || !fit) return;
    const generated = generateInterviewPlan(profile, facts, fit);
    setPlan(generated);
    setFlatQuestions(generated.rounds.flatMap((round) => round.questions));
    setQuestionIndex(0);
    setAnswered([]);
    setAnswerDraft("");
    setCurrentAssessment(undefined);
    setStep("interview");
  };

  const submitAnswer = () => {
    const question = flatQuestions[questionIndex];
    if (!question) return;
    const assessment = assessAnswer(answerDraft, question, profile);
    setCurrentAssessment(assessment);
    setAnswered((current) => [...current, { question, answer: answerDraft, assessment }]);
  };

  const nextQuestion = () => {
    setAnswerDraft("");
    setCurrentAssessment(undefined);
    if (questionIndex + 1 >= flatQuestions.length) {
      finishSession();
    } else {
      setQuestionIndex((current) => current + 1);
    }
  };

  const debrief = useMemo(
    () => (answered.length > 0 ? debriefSession(answered.map(({ question, assessment }) => ({ question, assessment })), profile) : undefined),
    [answered, profile],
  );

  const finishSession = () => {
    if (plan) {
      saveMockSession({
        id: sessionId,
        companyId: profile.id,
        startedAt: Date.now(),
        completedAt: Date.now(),
        plan,
        answers: answered.map(({ question, answer }) => ({ questionId: question.id, questionText: question.text, answer })),
        weakestDimension: debrief?.weakest?.name,
        answeredCount: answered.length,
      });
    }
    setStep("debrief");
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <Eyebrow tone={color.violet}>Mock interview · resume based · on this device only</Eyebrow>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.5px" }}>
          {step === "debrief" ? "The debrief" : "Interview like they interview"}
        </h1>
        <p style={{ color: color.textDim, maxWidth: 700 }}>
          Paste the job description and the resume you submitted. Your interview is built from what interviewers
          actually mine: your quantified claims, the gaps between the JD and your resume, and the company's own
          evaluation culture. Nothing you paste leaves this browser.
        </p>
      </header>

      {step === "setup" && (
        <SetupStep
          companyId={companyId}
          onCompany={setCompanyId}
          resumeText={resumeText}
          onResume={setResumeText}
          jdText={jdText}
          onJd={setJdText}
          onParse={runParse}
          howTheyJudge={profile.howTheyJudge}
          rubricName={profile.rubricName}
        />
      )}

      {step === "review" && facts && fit && (
        <ReviewStep
          facts={facts}
          fit={fit}
          onFacts={setFacts}
          onBack={() => setStep("setup")}
          onStart={startInterview}
        />
      )}

      {step === "interview" && flatQuestions[questionIndex] && (
        <InterviewStep
          profileName={profile.name}
          rubricName={profile.rubricName}
          plan={plan!}
          question={flatQuestions[questionIndex]}
          index={questionIndex}
          total={flatQuestions.length}
          answer={answerDraft}
          onAnswer={setAnswerDraft}
          assessment={currentAssessment}
          onSubmit={submitAnswer}
          onNext={nextQuestion}
          onFinishEarly={finishSession}
        />
      )}

      {step === "debrief" && (
        <DebriefStep
          answeredCount={answered.length}
          total={flatQuestions.length}
          debrief={debrief}
          onRestart={() => {
            setStep("setup");
            setFacts(undefined);
            setFit(undefined);
            setPlan(undefined);
            setAnswered([]);
            setQuestionIndex(0);
          }}
          onPractice={() => navigate("/practice")}
        />
      )}
    </div>
  );
}

const AREA_STYLE = {
  width: "100%",
  minHeight: 170,
  padding: "12px 14px",
  borderRadius: radius.md,
  border: `1px solid ${color.panelBorder}`,
  background: color.bg,
  color: color.text,
  fontFamily: font.body,
  fontSize: 13,
  lineHeight: 1.55,
  resize: "vertical" as const,
};

function SetupStep({
  companyId,
  onCompany,
  resumeText,
  onResume,
  jdText,
  onJd,
  onParse,
  howTheyJudge,
  rubricName,
}: {
  companyId: string;
  onCompany: (id: string) => void;
  resumeText: string;
  onResume: (text: string) => void;
  jdText: string;
  onJd: (text: string) => void;
  onParse: () => void;
  howTheyJudge: string;
  rubricName: string;
}) {
  const ready = resumeText.trim().length > 80 && jdText.trim().length > 40;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel style={{ display: "grid", gap: 12 }}>
        <Eyebrow>Who is interviewing you?</Eyebrow>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COMPANY_PROFILES.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => onCompany(candidate.id)}
              aria-pressed={companyId === candidate.id}
              style={{
                padding: "9px 16px",
                borderRadius: radius.md,
                border: `1px solid ${companyId === candidate.id ? color.violet : color.panelBorder}`,
                background: companyId === candidate.id ? "rgba(139, 125, 216, 0.12)" : "transparent",
                color: companyId === candidate.id ? color.text : color.textDim,
                fontFamily: font.mono,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {candidate.name}
            </button>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: color.textDim, lineHeight: 1.6 }}>
          <span style={{ color: color.violet, fontWeight: 600 }}>{rubricName}: </span>
          {howTheyJudge}
        </p>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        <div style={{ display: "grid", gap: 7 }}>
          <Eyebrow tone={color.teal}>The resume you submitted</Eyebrow>
          <textarea
            style={AREA_STYLE}
            value={resumeText}
            onChange={(event) => onResume(event.target.value)}
            placeholder={"Paste the resume as plain text. Bullets, sections, everything.\n\nIt is parsed on this device and never uploaded."}
            aria-label="Paste your resume"
          />
        </div>
        <div style={{ display: "grid", gap: 7 }}>
          <Eyebrow tone={color.amber}>The job description</Eyebrow>
          <textarea
            style={AREA_STYLE}
            value={jdText}
            onChange={(event) => onJd(event.target.value)}
            placeholder={"Paste the JD for the role you applied to.\n\nRequirements you do not match become the uncomfortable questions worth practicing."}
            aria-label="Paste the job description"
          />
        </div>
      </div>

      <div>
        <Button icon="arrowRight" disabled={!ready} onClick={onParse}>
          Read my resume against this role
        </Button>
        {!ready ? (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: color.textFaint }}>
            Paste both texts first. The resume needs enough content to mine for questions.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ReviewStep({
  facts,
  fit,
  onFacts,
  onBack,
  onStart,
}: {
  facts: ResumeFacts;
  fit: FitReport;
  onFacts: (facts: ResumeFacts) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const removeProject = (index: number) => {
    onFacts({ ...facts, projects: facts.projects.filter((_, candidate) => candidate !== index) });
  };
  const removeClaim = (projectIndex: number, claimIndex: number) => {
    onFacts({
      ...facts,
      projects: facts.projects.map((project, candidate) =>
        candidate === projectIndex
          ? { ...project, claims: project.claims.filter((_, claimCandidate) => claimCandidate !== claimIndex) }
          : project,
      ),
    });
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel style={{ display: "grid", gap: 8 }}>
        <Eyebrow tone={color.teal}>Check what was read · the parser is honest about being simple</Eyebrow>
        <p style={{ margin: 0, fontSize: 12.5, color: color.textDim, lineHeight: 1.55 }}>
          These facts drive your questions. Remove anything wrong; a bad parse makes a bad interview.
        </p>
      </Panel>

      {facts.projects.length === 0 ? (
        <Panel>
          <p style={{ margin: 0, fontSize: 13, color: color.textDim }}>
            Nothing usable was parsed from the resume. Go back and paste it as plain text with bullet points; the
            interview will fall back to company questions without resume anchoring otherwise.
          </p>
        </Panel>
      ) : (
        facts.projects.map((project, projectIndex) => (
          <Panel key={`${project.title}-${projectIndex}`} style={{ display: "grid", gap: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
              <strong style={{ fontFamily: font.mono, fontSize: 14 }}>{project.title}</strong>
              <button
                onClick={() => removeProject(projectIndex)}
                style={{ background: "none", border: "none", color: color.textFaint, fontSize: 11, cursor: "pointer", fontFamily: font.mono }}
              >
                not mine, remove
              </button>
            </div>
            {project.techs.length > 0 ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {project.techs.map((tech) => (
                  <span key={tech} style={{ fontFamily: font.mono, fontSize: 10.5, color: color.teal, border: `1px solid ${color.teal}44`, borderRadius: radius.pill, padding: "2px 8px" }}>
                    {tech}
                  </span>
                ))}
              </div>
            ) : null}
            <div style={{ display: "grid", gap: 6 }}>
              {project.claims.map((claim, claimIndex) => (
                <div key={claimIndex} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={{ flex: 1, fontSize: 12.5, color: color.textDim, lineHeight: 1.5 }}>
                    {claim.text}
                    {claim.metric ? <span style={{ color: color.amber, fontFamily: font.mono, fontSize: 11 }}> · will be cross-examined: {claim.metric}</span> : null}
                  </span>
                  <button
                    onClick={() => removeClaim(projectIndex, claimIndex)}
                    aria-label={`Remove claim: ${claim.text.slice(0, 40)}`}
                    style={{ background: "none", border: "none", color: color.textFaint, cursor: "pointer", padding: 0 }}
                  >
                    <Icon name="close" size={12} />
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        ))
      )}

      <Panel style={{ display: "grid", gap: 8 }}>
        <Eyebrow tone={color.amber}>Against the JD</Eyebrow>
        <p style={{ margin: 0, fontSize: 12.5, color: color.textDim }}>
          Matched: {fit.matched.length > 0 ? fit.matched.join(", ") : "nothing detected"}
        </p>
        {fit.gaps.length > 0 ? (
          <div style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: 12, color: color.red, fontFamily: font.mono }}>
              Gaps that will become questions:
            </span>
            {fit.gaps.map((gap) => (
              <span key={gap} style={{ fontSize: 12.5, color: color.textDim }}>· {gap}</span>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12.5, color: color.textFaint }}>No obvious JD gaps detected.</p>
        )}
      </Panel>

      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="subtle" icon="arrowLeft" onClick={onBack}>Fix the text</Button>
        <Button icon="play" onClick={onStart}>Start the interview</Button>
      </div>
    </div>
  );
}

function InterviewStep({
  profileName,
  rubricName,
  plan,
  question,
  index,
  total,
  answer,
  onAnswer,
  assessment,
  onSubmit,
  onNext,
  onFinishEarly,
}: {
  profileName: string;
  rubricName: string;
  plan: InterviewPlan;
  question: PlannedQuestion;
  index: number;
  total: number;
  answer: string;
  onAnswer: (text: string) => void;
  assessment?: AnswerAssessment;
  onSubmit: () => void;
  onNext: () => void;
  onFinishEarly: () => void;
}) {
  const round = plan.rounds.find((candidate) => candidate.round.id === question.roundId)!.round;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <Eyebrow tone={color.violet}>{profileName} · {round.title} · question {index + 1} of {total}</Eyebrow>
        <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>{round.purpose}</span>
      </div>

      <Panel style={{ display: "grid", gap: 12 }} raised>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: color.text, fontWeight: 600 }}>{question.text}</p>
        <textarea
          style={{ ...AREA_STYLE, minHeight: 150 }}
          value={answer}
          onChange={(event) => onAnswer(event.target.value)}
          placeholder="Answer the way you would speak it in the room. Say it out loud first if you can, then capture it here."
          aria-label="Your answer"
          disabled={!!assessment}
        />
        {!assessment ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Button icon="check" onClick={onSubmit} disabled={answer.trim().length === 0}>Get coached on this answer</Button>
            <button onClick={onFinishEarly} style={{ background: "none", border: "none", color: color.textFaint, fontSize: 11.5, fontFamily: font.mono, cursor: "pointer" }}>
              End the session here
            </button>
          </div>
        ) : null}
      </Panel>

      {assessment ? (
        <Panel style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StarChip label="Situation" on={assessment.star.situation} />
            <StarChip label="Your actions" on={assessment.star.action} />
            <StarChip label="Result" on={assessment.star.result} />
            <StarChip label="A number" on={assessment.star.metric} />
            <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint, alignSelf: "center" }}>
              {assessment.wordCount} words · {Math.round(assessment.ownershipRatio * 100)}% I-language
            </span>
          </div>
          <Divider />
          <div style={{ display: "grid", gap: 7 }}>
            <Eyebrow tone={color.amber}>Coach notes · heuristic, honest about it</Eyebrow>
            {assessment.coaching.map((note) => (
              <p key={note} style={{ margin: 0, fontSize: 12.5, color: color.textDim, lineHeight: 1.55 }}>· {note}</p>
            ))}
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            <Eyebrow tone={color.textDim}>Only you can judge</Eyebrow>
            {assessment.selfReview.map((item) => (
              <p key={item} style={{ margin: 0, fontSize: 12, color: color.textFaint, lineHeight: 1.5 }}>· {item}</p>
            ))}
          </div>
          {question.followUps.length > 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: color.textFaint }}>
              The follow-up an interviewer would push: <span style={{ color: color.textDim }}>{question.followUps[0]}</span>
            </p>
          ) : null}
          <div>
            <Button icon="arrowRight" onClick={onNext}>
              {index + 1 >= total ? "Finish and see the debrief" : "Next question"}
            </Button>
          </div>
        </Panel>
      ) : null}
      <p style={{ margin: 0, fontSize: 11, color: color.textFaint }}>
        Judged against {rubricName}. The coach reads structure and signals; it cannot judge truth or seniority, so treat it as a mirror, not a verdict.
      </p>
    </div>
  );
}

function StarChip({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: radius.pill,
        border: `1px solid ${on ? color.green : color.red}55`,
        color: on ? color.green : color.red,
        fontFamily: font.mono,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <Icon name={on ? "check" : "close"} size={11} /> {label}
    </span>
  );
}

function DebriefStep({
  answeredCount,
  total,
  debrief,
  onRestart,
  onPractice,
}: {
  answeredCount: number;
  total: number;
  debrief?: ReturnType<typeof debriefSession>;
  onRestart: () => void;
  onPractice: () => void;
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel style={{ display: "grid", gap: 10 }} raised>
        <Eyebrow tone={color.green}>Loop complete · {answeredCount} of {total} answered</Eyebrow>
        {debrief ? (
          <>
            <div style={{ display: "grid", gap: 8 }}>
              {debrief.coverage.map((entry) => (
                <div key={entry.dimensionId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 220, fontFamily: font.mono, fontSize: 12, color: color.textDim, flexShrink: 0 }}>{entry.name}</span>
                  <div style={{ flex: 1, height: 7, borderRadius: 4, background: color.hairline, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${entry.asked === 0 ? 0 : Math.round((entry.evidenced / entry.asked) * 100)}%`,
                        height: "100%",
                        background: entry.evidenced / Math.max(entry.asked, 1) >= 0.5 ? color.green : color.amber,
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint, width: 46, textAlign: "right" }}>
                    {entry.evidenced}/{entry.asked}
                  </span>
                </div>
              ))}
            </div>
            <Divider />
            <p style={{ margin: 0, fontSize: 13, color: color.textDim, lineHeight: 1.6 }}>
              {debrief.weakest ? (
                <>Weakest signal: <strong style={{ color: color.text }}>{debrief.weakest.name}</strong>. Build one true story for it before the real loop, with a number in the ending.</>
              ) : (
                "Answer more questions next run to get a coverage read."
              )}
              {" "}Answers with a metric: {Math.round(debrief.metricAnswerShare * 100)}%. Average length: {debrief.averageWords} words.
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: color.textDim }}>No answers were given this session.</p>
        )}
        <p style={{ margin: 0, fontSize: 11.5, color: color.textFaint }}>
          Recorded in your ledger as self-attested practice. Machine-verified evidence still comes from code and simulations only.
        </p>
      </Panel>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button icon="reset" onClick={onRestart}>New session</Button>
        <Button variant="ghost" iconRight="arrowRight" onClick={onPractice}>Back to Practice</Button>
      </div>
    </div>
  );
}
