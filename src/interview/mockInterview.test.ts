import { describe, expect, it } from "vitest";
import { COMPANY_PROFILES, getCompanyProfile } from "./companyProfiles";
import { computeFit, parseJobDescription, parseResume } from "./resumeParser";
import { generateInterviewPlan } from "./questionGenerator";
import { assessAnswer, debriefSession } from "./answerJudge";

const SAMPLE_RESUME = `Jordan Rivera
San Jose, CA | jordan@example.com

EXPERIENCE

Software Engineer, Cartwheel Logistics
- Built a Java order-routing service on AWS handling 40k requests per day
- Reduced p99 checkout latency by 38% by profiling and fixing an N+1 query in the Postgres layer
- Led migration of 3 services from EC2 to Kubernetes with zero downtime

Backend Intern, Fresh Grocer
- Wrote a Python reconciliation job that saved 12 hours of manual work per week
- Implemented REST endpoints in Django for the inventory dashboard

PROJECTS

Parking Garage Simulator
- Designed an object-oriented parking lot in Java with size-matched spot allocation

SKILLS
Java, Python, AWS, Kubernetes, Postgres, Django, REST, Git

EDUCATION
B.S. Computer Science, San Jose State University
`;

const SAMPLE_JD = `Software Development Engineer

We are looking for an SDE to join our fulfillment team.

Requirements:
- 2+ years of experience with Java or Kotlin
- Experience with AWS services (Lambda, DynamoDB, SQS)
- Strong knowledge of data structures and algorithms
- Experience with Kafka or other streaming systems
- Ability to own services end to end, including on-call

Preferred:
- Familiarity with Kubernetes and Docker
`;

describe("company profiles", () => {
  it("ships General first, followed by the researched Amazon, Google, and Meta packs", () => {
    expect(COMPANY_PROFILES.map((profile) => profile.id)).toEqual(["general", "amazon", "google", "meta"]);
  });

  it("gives every dimension signals, a probe, and archetype coverage for every round kind", () => {
    for (const profile of COMPANY_PROFILES) {
      for (const dimension of profile.dimensions) {
        expect(dimension.signals.length, `${profile.id}:${dimension.id} needs signal groups`).toBeGreaterThanOrEqual(2);
        expect(dimension.probes.length, `${profile.id}:${dimension.id} needs probes`).toBeGreaterThan(0);
      }
      for (const round of profile.loop) {
        const archetypesForKind = profile.archetypes.filter((archetype) => archetype.kind === round.kind);
        expect(archetypesForKind.length, `${profile.id}:${round.id} has no archetypes of kind ${round.kind}`).toBeGreaterThan(0);
        for (const dimensionId of round.dimensionIds) {
          expect(
            profile.dimensions.some((dimension) => dimension.id === dimensionId),
            `${profile.id}:${round.id} references unknown dimension ${dimensionId}`,
          ).toBe(true);
        }
      }
      for (const archetype of profile.archetypes) {
        for (const dimensionId of archetype.dimensionIds) {
          expect(profile.dimensions.some((dimension) => dimension.id === dimensionId)).toBe(true);
        }
      }
    }
  });

  it("keeps every user-facing string free of em-dashes", () => {
    expect(JSON.stringify(COMPANY_PROFILES).includes("—")).toBe(false);
  });

  it("covers all sixteen Amazon Leadership Principles across four interview rounds", () => {
    const amazon = getCompanyProfile("amazon")!;
    expect(amazon.dimensions).toHaveLength(16);
    expect(amazon.loop).toHaveLength(4);
    expect(amazon.loop.every((round) => round.questionCount === 3)).toBe(true);
  });

  it("models Google as visible reasoning, collaboration, leadership, and technical depth", () => {
    const google = getCompanyProfile("google")!;
    expect(google.rubricName).toContain("Googleyness");
    expect(google.dimensions.map((dimension) => dimension.id)).toEqual(expect.arrayContaining([
      "structured-reasoning",
      "collaboration",
      "leadership",
      "learning",
      "inclusive-impact",
      "technical-depth",
    ]));
    expect(google.archetypes.some((question) => question.id === "stand-up")).toBe(true);
    expect(google.archetypes.some((question) => question.id === "ambiguous")).toBe(true);
  });

  it("models Meta from the five official behavioral signals plus technical excellence", () => {
    const meta = getCompanyProfile("meta")!;
    expect(meta.rubricName).toContain("Meta");
    expect(meta.dimensions.map((dimension) => dimension.id)).toEqual(expect.arrayContaining([
      "conflict",
      "growth",
      "ambiguity",
      "results",
      "communication",
      "technical-excellence",
    ]));
    expect(meta.archetypes.some((question) => question.id === "pivot")).toBe(true);
  });
});

describe("resume parser", () => {
  const resume = parseResume(SAMPLE_RESUME);

  it("finds the roles and projects with their claims", () => {
    const titles = resume.projects.map((project) => project.title);
    expect(titles).toContain("Software Engineer, Cartwheel Logistics");
    expect(titles).toContain("Parking Garage Simulator");
    const cartwheel = resume.projects.find((project) => project.title.includes("Cartwheel"))!;
    expect(cartwheel.claims.length).toBe(3);
  });

  it("extracts metrics from quantified claims", () => {
    const cartwheel = resume.projects.find((project) => project.title.includes("Cartwheel"))!;
    const latencyClaim = cartwheel.claims.find((claim) => claim.text.includes("p99"))!;
    expect(latencyClaim.metric).toMatch(/38\s*%/);
  });

  it("collects skills from bullets and the skills section", () => {
    expect(resume.skills).toEqual(expect.arrayContaining(["java", "python", "aws", "kubernetes", "postgres"]));
  });

  it("ignores education and contact noise", () => {
    expect(resume.projects.some((project) => /education|san jose state/i.test(project.title))).toBe(false);
  });
});

describe("job description parser and fit", () => {
  const job = parseJobDescription(SAMPLE_JD);
  const resume = parseResume(SAMPLE_RESUME);
  const fit = computeFit(resume, job);

  it("extracts requirement lines and technologies", () => {
    expect(job.requirements.some((requirement) => requirement.includes("Java or Kotlin"))).toBe(true);
    expect(job.techs).toEqual(expect.arrayContaining(["java", "aws", "kafka", "kubernetes"]));
  });

  it("matches resume evidence and reports honest gaps", () => {
    expect(fit.matched).toEqual(expect.arrayContaining(["java", "aws", "kubernetes"]));
    expect(fit.gaps.some((gap) => gap.toLowerCase().includes("kafka"))).toBe(true);
    expect(fit.gaps.some((gap) => gap.toLowerCase().includes("java or kotlin"))).toBe(false);
  });
});

describe("question generator", () => {
  const resume = parseResume(SAMPLE_RESUME);
  const job = parseJobDescription(SAMPLE_JD);
  const fit = computeFit(resume, job);
  const amazon = getCompanyProfile("amazon")!;
  const plan = generateInterviewPlan(amazon, resume, fit);

  it("fills every Google round without changing the interview engine", () => {
    const google = getCompanyProfile("google")!;
    const googlePlan = generateInterviewPlan(google, resume, fit);
    expect(googlePlan.companyId).toBe("google");
    for (const planned of googlePlan.rounds) {
      expect(planned.questions, planned.round.id).toHaveLength(planned.round.questionCount);
    }
  });

  it("fills every Meta round without changing the interview engine", () => {
    const meta = getCompanyProfile("meta")!;
    const metaPlan = generateInterviewPlan(meta, resume, fit);
    expect(metaPlan.companyId).toBe("meta");
    for (const planned of metaPlan.rounds) {
      expect(planned.questions, planned.round.id).toHaveLength(planned.round.questionCount);
    }
  });

  it("plans every round at its declared question count", () => {
    expect(plan.rounds.map((planned) => planned.round.id)).toEqual(amazon.loop.map((round) => round.id));
    for (const planned of plan.rounds) {
      expect(planned.questions.length, planned.round.id).toBe(planned.round.questionCount);
    }
  });

  it("cross-examines a quantified resume claim in the technical round", () => {
    const technical = plan.rounds.find((planned) => planned.round.kind === "technical-story")!;
    const claimQuestion = technical.questions.find((question) => question.source === "claim");
    expect(claimQuestion).toBeDefined();
    expect(claimQuestion!.text).toContain("How was it measured");
  });

  it("probes a JD gap the resume is silent on", () => {
    const allQuestions = plan.rounds.flatMap((planned) => planned.questions);
    const gapQuestion = allQuestions.find((question) => question.source === "gap");
    expect(gapQuestion).toBeDefined();
    expect(gapQuestion!.text.toLowerCase()).toContain("kafka");
  });

  it("fills archetype slots from real resume projects and leaves no raw braces", () => {
    const allQuestions = plan.rounds.flatMap((planned) => planned.questions);
    for (const question of allQuestions) {
      expect(question.text.includes("{"), question.text).toBe(false);
      expect(question.dimensionIds.length).toBeGreaterThan(0);
    }
    expect(allQuestions.some((question) => question.text.includes("Cartwheel") || question.text.includes("Parking Garage"))).toBe(true);
  });

  it("is deterministic for the same inputs", () => {
    const again = generateInterviewPlan(amazon, resume, fit);
    expect(JSON.stringify(again)).toBe(JSON.stringify(plan));
  });

  it("works with an empty resume: archetypes without slots still fill the loop", () => {
    const emptyPlan = generateInterviewPlan(getCompanyProfile("general")!, { projects: [], skills: [] }, { matched: [], gaps: [] });
    const questions = emptyPlan.rounds.flatMap((planned) => planned.questions);
    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) expect(question.text.includes("{")).toBe(false);
  });
});

describe("answer judge", () => {
  const amazon = getCompanyProfile("amazon")!;
  const resume = parseResume(SAMPLE_RESUME);
  const job = parseJobDescription(SAMPLE_JD);
  const plan = generateInterviewPlan(amazon, resume, computeFit(resume, job));
  const ownershipQuestion = plan.rounds
    .flatMap((planned) => planned.questions)
    .find((question) => question.dimensionIds.includes("ownership"))!;

  const STRONG_ANSWER =
    "The situation was that our checkout service kept timing out during the holiday sale and the on-call rotation was drowning. " +
    "Nobody asked me to, but I owned it: first I profiled the endpoint and traced the root cause to an N+1 query, " +
    "then I decided to rewrite the data access layer and I wrote a regression test to hold it. " +
    "As a result, p99 latency dropped 38% and pages went from twelve a week to one. I followed up a month later to make sure it held.";

  const WEAK_ANSWER = "We kind of worked on some performance stuff as a team and it basically got better, you know.";

  it("recognizes a structurally strong answer", () => {
    const assessment = assessAnswer(STRONG_ANSWER, ownershipQuestion, amazon);
    expect(assessment.star).toEqual({ situation: true, task: true, action: true, result: true, metric: true });
    expect(assessment.ownershipRatio).toBeGreaterThan(0.6);
    const ownership = assessment.dimensionScores.find((score) => score.dimensionId === "ownership")!;
    expect(ownership.hits).toBeGreaterThanOrEqual(2);
  });

  it("coaches a weak answer on every real failure", () => {
    const assessment = assessAnswer(WEAK_ANSWER, ownershipQuestion, amazon);
    expect(assessment.star.metric).toBe(false);
    const coachingText = assessment.coaching.join(" ");
    expect(coachingText).toContain("Too thin");
    expect(coachingText).toContain("No number");
    expect(assessment.fillerCount).toBeGreaterThanOrEqual(3);
  });

  it("flags mostly-we language as an ownership problem", () => {
    const weAnswer =
      "The situation was our team had a big outage. We looked at the logs and we decided to fix the query and we shipped it and we reduced errors by 20% as a result. We then did a retro and we agreed we would monitor it.";
    const assessment = assessAnswer(weAnswer, ownershipQuestion, amazon);
    expect(assessment.ownershipRatio).toBeLessThan(0.4);
    expect(assessment.coaching.join(" ")).toContain("we/our");
  });

  it("never returns empty coaching and always offers self-review", () => {
    const assessment = assessAnswer(STRONG_ANSWER, ownershipQuestion, amazon);
    expect(assessment.coaching.length).toBeGreaterThan(0);
    expect(assessment.selfReview.length).toBe(3);
  });

  it("debriefs a session with coverage and the weakest dimension", () => {
    const questions = plan.rounds.flatMap((planned) => planned.questions).slice(0, 4);
    const assessments = questions.map((question) => ({
      question,
      assessment: assessAnswer(question.dimensionIds.includes("ownership") ? STRONG_ANSWER : WEAK_ANSWER, question, amazon),
    }));
    const debrief = debriefSession(assessments, amazon);
    expect(debrief.coverage.length).toBeGreaterThan(0);
    expect(debrief.weakest).toBeDefined();
    expect(debrief.averageWords).toBeGreaterThan(0);
  });
});
