/**
 * Company interview profiles: everything company-specific about a mock
 * interview lives here as data, so adding a company never touches the
 * engine. The General profile is the default and works with any job
 * description; named companies layer their real evaluation culture on top
 * (Amazon judges through Leadership Principles, so its pack encodes what
 * bar raisers actually listen for).
 */

export interface InterviewDimension {
  id: string;
  name: string;
  /** One plain sentence: what this dimension means to this company. */
  plain: string;
  /**
   * Signal groups the judge listens for in an answer. Each group is a list
   * of interchangeable phrasings; a group counts as hit when any phrase
   * appears. More hit groups = stronger evidence for this dimension.
   */
  signals: string[][];
  /** Phrases that actively hurt an answer on this dimension. */
  antiSignals: string[];
  /** Follow-up probes an interviewer would push with. Shown as coaching. */
  probes: string[];
}

export type RoundKind = "hr" | "behavioral" | "technical-story";

export interface RoundSpec {
  id: string;
  kind: RoundKind;
  title: string;
  /** What this round is establishing, in interviewer language. */
  purpose: string;
  /** Dimensions this round is scored against. */
  dimensionIds: string[];
  questionCount: number;
}

export interface QuestionArchetype {
  id: string;
  kind: RoundKind;
  dimensionIds: string[];
  /**
   * Template with optional slots filled from the parsed resume and JD:
   * {company} {project} {tech} {claim} {requirement} {role}
   * Archetypes without slots are asked as written.
   */
  template: string;
  followUps: string[];
}

export interface CompanyInterviewProfile {
  id: string;
  name: string;
  /** What the company calls its bar, e.g. "Leadership Principles". */
  rubricName: string;
  /** How this company judges, in one honest paragraph shown before the loop. */
  howTheyJudge: string;
  dimensions: InterviewDimension[];
  loop: RoundSpec[];
  archetypes: QuestionArchetype[];
}

// ---------------------------------------------------------------------------
// General profile: any company, any startup. Judges the fundamentals every
// interviewer scores whether or not they name them.
// ---------------------------------------------------------------------------

const GENERAL: CompanyInterviewProfile = {
  id: "general",
  name: "Any company",
  rubricName: "Interview fundamentals",
  howTheyJudge:
    "Most interviewers, at startups especially, score four things whatever they call them: did you own real outcomes, can you prove impact with numbers, can you work through conflict, and can you explain your work clearly. Answers get judged on evidence, not adjectives.",
  dimensions: [
    {
      id: "impact",
      name: "Impact with evidence",
      plain: "You moved a real number and you can say which number and by how much.",
      signals: [
        ["reduced", "increased", "improved", "cut", "saved", "grew", "shipped"],
        ["%", "percent", "ms", "seconds", "hours", "users", "revenue", "cost", "x faster", "times"],
        ["measured", "metric", "baseline", "before and after", "dashboard", "tracked"],
      ],
      antiSignals: ["i think it helped", "probably improved", "hard to say"],
      probes: ["Which number moved, and from what to what?", "How did you know it was your change that moved it?"],
    },
    {
      id: "ownership",
      name: "Ownership",
      plain: "You did the work and you say so; the story has your decisions in it.",
      signals: [
        ["i built", "i designed", "i decided", "i wrote", "i led", "i proposed", "i fixed", "i took"],
        ["my responsibility", "my call", "i was on the hook", "i owned"],
        ["mistake", "missed", "failed", "wrong", "learned"],
      ],
      antiSignals: ["we all kind of", "the team handled it", "it was not really my area"],
      probes: ["What was YOUR specific contribution, separate from the team's?", "What would you do differently now?"],
    },
    {
      id: "collaboration",
      name: "Collaboration and conflict",
      plain: "You can disagree, hear pushback, and still land the work with the relationship intact.",
      signals: [
        ["disagreed", "pushed back", "convinced", "aligned", "compromise", "escalated"],
        ["their perspective", "listened", "understood why", "data changed my mind", "i was wrong"],
        ["stakeholder", "product manager", "designer", "teammate", "reviewer", "manager"],
      ],
      antiSignals: ["they just did not get it", "i went around them", "i gave up"],
      probes: ["What was the other person's strongest argument?", "How did the relationship end up afterward?"],
    },
    {
      id: "clarity",
      name: "Clear communication",
      plain: "A stranger can follow the story: context first, then what you did, then how it ended.",
      signals: [
        ["the situation was", "context", "at the time", "the problem was", "we had"],
        ["so i", "my approach", "first i", "then i", "the tradeoff"],
        ["the result", "in the end", "outcome", "it shipped", "as a result"],
      ],
      antiSignals: [],
      probes: ["Could you retell that in half the words?", "What is the one-sentence version of that story?"],
    },
  ],
  loop: [
    {
      id: "hr-screen",
      kind: "hr",
      title: "Recruiter screen",
      purpose: "Can you tell your own story, and does it fit this role?",
      dimensionIds: ["clarity", "impact"],
      questionCount: 3,
    },
    {
      id: "behavioral",
      kind: "behavioral",
      title: "Behavioral round",
      purpose: "Evidence of ownership and how you work with people.",
      dimensionIds: ["ownership", "collaboration", "impact"],
      questionCount: 4,
    },
    {
      id: "technical-story",
      kind: "technical-story",
      title: "Technical deep dive",
      purpose: "Do you actually understand the work on your own resume?",
      dimensionIds: ["ownership", "impact", "clarity"],
      questionCount: 3,
    },
  ],
  archetypes: [
    { id: "walkthrough", kind: "hr", dimensionIds: ["clarity"], template: "Walk me through your background in about two minutes, ending with why this role.", followUps: ["What should I remember about you after this call?"] },
    { id: "why-us", kind: "hr", dimensionIds: ["clarity"], template: "Why do you want to work at {company}, specifically?", followUps: ["What would make you turn down an offer from us?"] },
    { id: "proudest", kind: "hr", dimensionIds: ["impact", "clarity"], template: "What piece of work are you proudest of, and what was your part in it?", followUps: ["What did it change for the people who used it?"] },
    { id: "hardest-bug", kind: "technical-story", dimensionIds: ["ownership", "clarity"], template: "Tell me about the hardest technical problem in {project}. Walk me through how you worked it.", followUps: ["What did you try that did not work?"] },
    { id: "design-decision", kind: "technical-story", dimensionIds: ["ownership", "clarity"], template: "In {project} you used {tech}. What was the alternative, and why did you choose this?", followUps: ["What would make you revisit that decision?"] },
    { id: "conflict", kind: "behavioral", dimensionIds: ["collaboration"], template: "Tell me about a time you strongly disagreed with a teammate or manager. What happened?", followUps: ["What was their best argument?", "How did it end for the relationship?"] },
    { id: "failure", kind: "behavioral", dimensionIds: ["ownership"], template: "Tell me about a time you failed or shipped something wrong. What did you do next?", followUps: ["What changed in how you work because of it?"] },
    { id: "deadline", kind: "behavioral", dimensionIds: ["ownership", "impact"], template: "Tell me about a time you had to deliver under a deadline that felt impossible.", followUps: ["What did you cut, and how did you decide?"] },
  ],
};

// ---------------------------------------------------------------------------
// Amazon: judged through Leadership Principles. Signals reflect what
// bar-raiser style interviewers actually listen for: I-ownership, data,
// customer named, mechanisms, and honest failure stories.
// ---------------------------------------------------------------------------

const AMAZON: CompanyInterviewProfile = {
  id: "amazon",
  name: "Amazon",
  rubricName: "Leadership Principles",
  howTheyJudge:
    "Amazon scores every answer against Leadership Principles, and interviewers write down evidence, not impressions. They want STAR stories where YOU did the work, the result has a number, the customer appears by name, and a failure story you own without flinching. Saying a principle's name earns nothing; showing it does.",
  dimensions: [
    {
      id: "customer-obsession",
      name: "Customer Obsession",
      plain: "The story starts from a customer problem, not a technology.",
      signals: [
        ["customer", "user", "client", "caller", "the team using", "internal team"],
        ["their problem", "pain", "complained", "asked for", "needed", "on their behalf"],
        ["went back to", "talked to", "watched them", "feedback", "ticket"],
      ],
      antiSignals: ["the tech was interesting", "i wanted to try", "management asked so i did"],
      probes: ["Who exactly was the customer, and how did you know this hurt them?", "What did they say after you shipped?"],
    },
    {
      id: "ownership",
      name: "Ownership",
      plain: "You act like it is your company: no 'that was not my job' anywhere in the story.",
      signals: [
        ["i owned", "i took", "my responsibility", "i was on call", "i stayed", "i volunteered"],
        ["beyond my", "not my job but", "nobody asked", "long term", "next team", "left it better"],
        ["followed up", "made sure", "until it was done", "root cause"],
      ],
      antiSignals: ["not my responsibility", "someone else's problem", "i escalated and moved on"],
      probes: ["Where did your responsibility officially end, and where did you actually stop?", "What happened after you handed it off?"],
    },
    {
      id: "dive-deep",
      name: "Dive Deep",
      plain: "You can go from the summary to the mechanism without hand-waving.",
      signals: [
        ["root cause", "dug into", "traced", "profiled", "read the code", "logs", "metric by metric"],
        ["turned out", "actually because", "the real reason", "surprised"],
        ["ms", "%", "p99", "queries", "rows", "requests", "specific number"],
      ],
      antiSignals: ["the details were handled by", "i did not need to know", "roughly"],
      probes: ["What did you find at the bottom that the summary hid?", "Which metric told you where to look?"],
    },
    {
      id: "deliver-results",
      name: "Deliver Results",
      plain: "It shipped, on a date, and moved a number despite obstacles.",
      signals: [
        ["shipped", "launched", "delivered", "in production", "released", "on time"],
        ["deadline", "cut scope", "prioritized", "descoped", "milestones"],
        ["%", "reduced", "increased", "revenue", "latency", "cost", "adoption"],
      ],
      antiSignals: ["it eventually", "we never quite", "it was deprioritized"],
      probes: ["What did you cut to make the date, and how did you choose?", "What number proves it landed?"],
    },
    {
      id: "earn-trust",
      name: "Earn Trust",
      plain: "You say the uncomfortable true thing, including about your own mistakes.",
      signals: [
        ["i was wrong", "my mistake", "i missed", "i broke", "i told them", "admitted"],
        ["listened", "their feedback", "criticized", "hard conversation", "transparent"],
        ["apologized", "fixed it", "postmortem", "wrote it up"],
      ],
      antiSignals: ["technically not my fault", "nobody noticed", "i kept it quiet"],
      probes: ["What is a piece of critical feedback you received and what did you do with it?", "Who found out about the mistake, and how?"],
    },
    {
      id: "disagree-commit",
      name: "Have Backbone; Disagree and Commit",
      plain: "You challenged the decision with data, lost or won, and then committed fully.",
      signals: [
        ["disagreed", "pushed back", "challenged", "argued", "raised it"],
        ["data", "evidence", "numbers", "prototype", "showed them"],
        ["committed", "once decided", "got behind", "supported it fully", "moved on"],
      ],
      antiSignals: ["went along quietly", "kept relitigating", "told them later i was right"],
      probes: ["What did committing look like after you lost the argument?", "What data did you bring, not just opinions?"],
    },
    {
      id: "invent-simplify",
      name: "Invent and Simplify",
      plain: "You made something simpler or newer than the obvious path, and the simplification stuck.",
      signals: [
        ["simplified", "removed", "deleted", "one instead of", "replaced", "automated"],
        ["new way", "instead of the usual", "rethought", "from scratch", "invented"],
        ["fewer steps", "less code", "cut the process", "no longer needed"],
      ],
      antiSignals: ["we added another layer", "more configuration", "a bigger process"],
      probes: ["What got DELETED because of your change?", "What was the obvious solution, and why was yours simpler?"],
    },
    {
      id: "learn-curious",
      name: "Learn and Be Curious",
      plain: "You learned something real, recently, because you went after it.",
      signals: [
        ["learned", "studied", "read", "took apart", "course", "side project", "taught myself"],
        ["did not know", "new to me", "outside my", "first time"],
        ["applied it", "used it to", "now i", "since then"],
      ],
      antiSignals: ["i already knew", "no time to learn"],
      probes: ["What did you learn in the last six months that changed how you work?", "How did you apply it?"],
    },
  ],
  loop: [
    {
      id: "hr-screen",
      kind: "hr",
      title: "Recruiter screen",
      purpose: "Story, motivation, and whether your experience matches the role.",
      dimensionIds: ["deliver-results", "customer-obsession"],
      questionCount: 3,
    },
    {
      id: "behavioral-1",
      kind: "behavioral",
      title: "Behavioral round 1",
      purpose: "Ownership and Dive Deep, the two most-tested engineer principles.",
      dimensionIds: ["ownership", "dive-deep"],
      questionCount: 3,
    },
    {
      id: "behavioral-2",
      kind: "behavioral",
      title: "Behavioral round 2",
      purpose: "Trust, backbone, and how you handle being wrong.",
      dimensionIds: ["earn-trust", "disagree-commit"],
      questionCount: 3,
    },
    {
      id: "technical-story",
      kind: "technical-story",
      title: "Technical deep dive",
      purpose: "Your resume's claims, cross-examined the way a bar raiser would.",
      dimensionIds: ["dive-deep", "invent-simplify", "deliver-results"],
      questionCount: 3,
    },
  ],
  archetypes: [
    { id: "walkthrough", kind: "hr", dimensionIds: ["deliver-results"], template: "Walk me through your background in about two minutes, ending with why Amazon and why this role.", followUps: ["Which of your projects is most like the work here?"] },
    { id: "why-amazon", kind: "hr", dimensionIds: ["customer-obsession"], template: "Why Amazon? And what about the pace here worries you, honestly?", followUps: ["What have you heard about working here that you want to pressure-test?"] },
    { id: "customer-story", kind: "hr", dimensionIds: ["customer-obsession", "deliver-results"], template: "Tell me about a time you went out of your way for a customer or a team that depended on you.", followUps: ["How did you know it mattered to them?"] },
    { id: "beyond-role", kind: "behavioral", dimensionIds: ["ownership"], template: "Tell me about a time you took on something well outside your job description because it needed doing.", followUps: ["Where did your official responsibility end?"] },
    { id: "root-cause", kind: "behavioral", dimensionIds: ["dive-deep", "ownership"], template: "Tell me about a problem where the first explanation everyone believed turned out to be wrong.", followUps: ["Which metric or log line broke the wrong theory?"] },
    { id: "mistake", kind: "behavioral", dimensionIds: ["earn-trust"], template: "Tell me about a significant mistake you made. What did you do in the first hour after finding out?", followUps: ["Who did you tell, and when?"] },
    { id: "disagree", kind: "behavioral", dimensionIds: ["disagree-commit"], template: "Tell me about a time you strongly disagreed with a technical or product decision. What did you do when it went the other way?", followUps: ["What did commitment look like the week after?"] },
    { id: "simplify", kind: "behavioral", dimensionIds: ["invent-simplify"], template: "Tell me about a time you made something dramatically simpler instead of adding to it.", followUps: ["What got deleted?"] },
    { id: "learned", kind: "behavioral", dimensionIds: ["learn-curious"], template: "What is something substantial you taught yourself recently, and what did you do with it?", followUps: ["What made you go after it?"] },
    { id: "hardest-bug", kind: "technical-story", dimensionIds: ["dive-deep"], template: "Take {project} from your resume. Walk me through the gnarliest technical problem in it, all the way to the mechanism.", followUps: ["What did you find at the bottom?"] },
    { id: "design-decision", kind: "technical-story", dimensionIds: ["invent-simplify", "dive-deep"], template: "In {project} you chose {tech}. A bar raiser would ask: what was the simpler alternative, and why is yours not over-built?", followUps: ["What would make you rip it out?"] },
  ],
};

export const COMPANY_PROFILES: CompanyInterviewProfile[] = [GENERAL, AMAZON];

export function getCompanyProfile(id: string): CompanyInterviewProfile | undefined {
  return COMPANY_PROFILES.find((profile) => profile.id === id);
}
