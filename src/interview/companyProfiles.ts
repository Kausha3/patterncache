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

// ---------------------------------------------------------------------------
// Google: recent SWE reports repeatedly reward visible reasoning over fast
// recognition. The behavioral pack combines structured problem solving,
// collaboration, learning, and leadership without authority. It never tries
// to infer a hiring decision from these surface signals.
// ---------------------------------------------------------------------------

const GOOGLE: CompanyInterviewProfile = {
  id: "google",
  name: "Google",
  rubricName: "Googleyness and role-related leadership",
  howTheyJudge:
    "Google interview reports consistently reward the reasoning an interviewer can observe: clarify an ambiguous situation, compare options, invite missing context, and change direction without getting defensive. Googleyness and leadership answers need real examples of collaboration, learning, inclusion, and influence without authority. The goal is not to sound clever. It is to make a good decision process easy to inspect.",
  dimensions: [
    {
      id: "structured-reasoning",
      name: "Structured reasoning",
      plain: "You turn an ambiguous situation into clear assumptions, options, trade-offs, and a decision.",
      signals: [
        ["clarified", "asked", "assumption", "what was ambiguous", "missing context", "constraints"],
        ["options", "alternatives", "trade-off", "pros and cons", "compared", "criteria"],
        ["because", "evidence", "data", "tested", "experiment", "validated"],
      ],
      antiSignals: ["i just knew", "there was only one option", "i started coding immediately"],
      probes: ["What was still ambiguous, and which question changed your decision?", "Which alternative did you reject, and on what evidence?"],
    },
    {
      id: "collaboration",
      name: "Collaborative problem solving",
      plain: "You make the group smarter by listening, sharing context, and resolving disagreement without erasing it.",
      signals: [
        ["listened", "their perspective", "asked them", "understood why", "invited", "feedback"],
        ["aligned", "working agreement", "shared context", "documented", "paired", "collaborated"],
        ["disagreed", "conflict", "different view", "changed my mind", "compromise", "resolved"],
      ],
      antiSignals: ["they did not understand", "i went around them", "i won the argument"],
      probes: ["What was the other person's strongest point?", "How did your approach make the next disagreement easier?"],
    },
    {
      id: "leadership",
      name: "Leadership without authority",
      plain: "You create direction, unblock people, and own an outcome even when nobody reports to you.",
      signals: [
        ["i proposed", "i led", "i organized", "i volunteered", "i took ownership", "i initiated"],
        ["unblocked", "brought together", "got alignment", "influenced", "mentored", "helped the team"],
        ["followed through", "shipped", "adopted", "result", "measured", "afterward"],
      ],
      antiSignals: ["i waited for my manager", "not my responsibility", "someone should have"],
      probes: ["Why did anyone follow your lead when you had no authority?", "Who became more effective because of what you did?"],
    },
    {
      id: "learning",
      name: "Learning and intellectual humility",
      plain: "You notice when your model is wrong, learn quickly, and make the learning change future behavior.",
      signals: [
        ["i was wrong", "did not know", "missed", "my assumption failed", "feedback changed", "mistake"],
        ["learned", "studied", "asked for help", "experimented", "read", "practiced"],
        ["since then", "changed how", "now i", "next time", "made a checklist", "shared the learning"],
      ],
      antiSignals: ["i already knew", "it was their mistake", "nothing i would change"],
      probes: ["What belief did you have to update?", "What can you point to that changed after you learned it?"],
    },
    {
      id: "inclusive-impact",
      name: "Inclusive impact",
      plain: "You notice who is missing or blocked and improve the outcome without speaking over them.",
      signals: [
        ["included", "made space", "asked quieter", "accessible", "different background", "left out"],
        ["stood up for", "advocated", "gave credit", "removed a barrier", "supported", "sponsorship"],
        ["team outcome", "participation", "adoption", "feedback", "retention", "result"],
      ],
      antiSignals: ["culture fit", "they needed me to speak for them", "everyone is treated exactly the same"],
      probes: ["How did you know the person wanted your help?", "What changed for the group, not just for you?"],
    },
    {
      id: "technical-depth",
      name: "Role-related technical depth",
      plain: "You understand the mechanisms behind your work and can reason through a new constraint aloud.",
      signals: [
        ["root cause", "mechanism", "traced", "profiled", "debugged", "under the hood"],
        ["latency", "complexity", "memory", "scale", "failure mode", "bottleneck", "trade-off"],
        ["tested", "dry run", "edge case", "monitoring", "metric", "verified"],
      ],
      antiSignals: ["the framework handled it", "i do not remember the details", "it just worked"],
      probes: ["Walk me through the mechanism one layer deeper.", "Which edge case or failure mode changed your design?"],
    },
  ],
  loop: [
    {
      id: "recruiter-screen",
      kind: "hr",
      title: "Recruiter and motivation screen",
      purpose: "Can you connect your experience to the role and explain why this problem space matters to you?",
      dimensionIds: ["structured-reasoning", "technical-depth"],
      questionCount: 3,
    },
    {
      id: "googleyness-leadership",
      kind: "behavioral",
      title: "Googleyness and leadership",
      purpose: "How you handle ambiguity, conflict, learning, inclusion, and influence without authority.",
      dimensionIds: ["structured-reasoning", "collaboration", "leadership", "learning", "inclusive-impact"],
      questionCount: 5,
    },
    {
      id: "technical-story",
      kind: "technical-story",
      title: "Role-related knowledge deep dive",
      purpose: "Can you defend the mechanisms and trade-offs behind work on your own resume?",
      dimensionIds: ["technical-depth", "structured-reasoning", "learning"],
      questionCount: 4,
    },
  ],
  archetypes: [
    { id: "walkthrough", kind: "hr", dimensionIds: ["structured-reasoning"], template: "Walk me through your background, focusing on the two decisions that best explain why this role at Google is the next step.", followUps: ["Why this role instead of another strong engineering role?"] },
    { id: "why-google", kind: "hr", dimensionIds: ["structured-reasoning"], template: "Why Google specifically, and which product or engineering problem would you genuinely want to understand from the inside?", followUps: ["What evidence have you gathered beyond the company name?"] },
    { id: "proudest", kind: "hr", dimensionIds: ["technical-depth", "leadership"], template: "Which piece of work best shows how you think as an engineer, and what was only possible because of your contribution?", followUps: ["What would your closest teammate say you contributed?"] },
    { id: "ambiguous", kind: "behavioral", dimensionIds: ["structured-reasoning", "leadership"], template: "Tell me about a time the goal was ambiguous and nobody could give you a complete specification. How did you create enough clarity to move?", followUps: ["Which assumption turned out to be wrong?"] },
    { id: "conflict", kind: "behavioral", dimensionIds: ["collaboration", "learning"], template: "Tell me about a disagreement where the other person had a genuinely strong argument. How did the decision get made?", followUps: ["What part of their view changed your own?"] },
    { id: "stand-up", kind: "behavioral", dimensionIds: ["inclusive-impact", "leadership"], template: "Tell me about a time you stood up for a teammate or made space for a perspective the group was overlooking.", followUps: ["How did you check that your help was actually wanted?"] },
    { id: "changed-mind", kind: "behavioral", dimensionIds: ["learning", "structured-reasoning"], template: "Tell me about a technical decision where new evidence made you change your mind after you had already argued for the first approach.", followUps: ["How did you communicate the reversal?"] },
    { id: "lead-without-authority", kind: "behavioral", dimensionIds: ["leadership", "collaboration"], template: "Tell me about a result you led without having authority over the people involved.", followUps: ["Why did they choose to follow your direction?"] },
    { id: "failure-learning", kind: "behavioral", dimensionIds: ["learning"], template: "Tell me about a failure that changed a repeatable part of how you work, not just how you felt.", followUps: ["Show me the mechanism you changed afterward."] },
    { id: "hardest-problem", kind: "technical-story", dimensionIds: ["technical-depth", "structured-reasoning"], template: "Take {project}. What was the hardest technical constraint, what alternatives did you compare, and why did your final choice win?", followUps: ["Now change one requirement. Which part breaks first?"] },
    { id: "debugging", kind: "technical-story", dimensionIds: ["technical-depth", "learning"], template: "In {project}, describe a bug or failure where the first theory was wrong. Dry-run the investigation from symptom to root cause.", followUps: ["Which observation killed the first theory?"] },
    { id: "scale-change", kind: "technical-story", dimensionIds: ["technical-depth", "structured-reasoning"], template: "Suppose {project} suddenly had one hundred times the traffic or data. What would fail first, and how would you prove it before redesigning anything?", followUps: ["What is the smallest experiment that tests your bottleneck theory?"] },
    { id: "code-quality", kind: "technical-story", dimensionIds: ["technical-depth", "collaboration"], template: "Tell me about code you made easier for another engineer to understand, test, or extend. What exactly changed?", followUps: ["How did you measure that it became easier to work with?"] },
  ],
};

// ---------------------------------------------------------------------------
// Meta: modeled from Meta's current Software Engineer Full Loop Interview
// Guide. The behavioral dimensions use the five signals the guide names;
// the technical dimension reflects the guide's coding and design criteria.
// ---------------------------------------------------------------------------

const META: CompanyInterviewProfile = {
  id: "meta",
  name: "Meta",
  rubricName: "Meta full-loop signals",
  howTheyJudge:
    "Meta's official guide describes a fast, candidate-driven conversation. Coding is judged on communication, problem solving, executable structure, and verification. Design is judged on problem navigation, solution design, technical excellence, and technical communication. Behavioral evidence is organized around conflict, continuous growth, ambiguity, results, and effective communication. This coach looks for those visible signals; it never predicts a hiring decision.",
  dimensions: [
    {
      id: "conflict",
      name: "Resolving conflict",
      plain: "You can represent the other view fairly, work through disagreement, and preserve the relationship while reaching a decision.",
      signals: [
        ["disagreed", "conflict", "different view", "pushed back", "debated", "tension"],
        ["their perspective", "listened", "empathized", "understood why", "strongest argument", "asked them"],
        ["resolved", "aligned", "working agreement", "decision", "relationship", "followed through"],
      ],
      antiSignals: ["they did not get it", "i went around them", "i won the argument"],
      probes: ["What was the other person's strongest argument?", "What changed in the working relationship after the decision?"],
    },
    {
      id: "growth",
      name: "Growing continuously",
      plain: "You seek feedback, update your model, and make the learning change a repeatable part of your work.",
      signals: [
        ["feedback", "criticism", "mistake", "missed", "i was wrong", "did not know"],
        ["learned", "practiced", "asked for help", "studied", "experimented", "sought"],
        ["since then", "changed how", "next time", "new habit", "checklist", "shared the learning"],
      ],
      antiSignals: ["nothing i would change", "it was their fault", "i already knew"],
      probes: ["Which belief or habit changed?", "What evidence shows the learning lasted beyond that project?"],
    },
    {
      id: "ambiguity",
      name: "Embracing ambiguity",
      plain: "You create enough clarity to act, state assumptions, and pivot when priorities or evidence change.",
      signals: [
        ["ambiguous", "missing information", "unclear", "no specification", "uncertainty", "unknown"],
        ["assumption", "clarified", "asked", "small experiment", "reversible", "milestone"],
        ["pivoted", "priority changed", "adapted", "updated", "new evidence", "changed direction"],
      ],
      antiSignals: ["waited until everything was clear", "could not start", "someone else decided"],
      probes: ["Which assumption let you move first?", "What signal told you it was time to pivot?"],
    },
    {
      id: "results",
      name: "Driving results",
      plain: "You stay self-directed through roadblocks and can prove the outcome with concrete evidence.",
      signals: [
        ["i drove", "i owned", "i delivered", "i shipped", "i unblocked", "i decided"],
        ["roadblock", "constraint", "deadline", "priority", "tradeoff", "risk"],
        ["result", "impact", "%", "users", "latency", "revenue", "adoption", "measured"],
      ],
      antiSignals: ["we kind of", "probably helped", "not my responsibility"],
      probes: ["What was your specific action, separate from the team's?", "Which measurable outcome moved?"],
    },
    {
      id: "communication",
      name: "Communicating effectively",
      plain: "You make reasoning inspectable and adapt detail to teammates, partners, and technical depth.",
      signals: [
        ["context", "the problem was", "goal", "constraints", "first"],
        ["explained", "documented", "diagram", "audience", "cross-functional", "stakeholder"],
        ["tradeoff", "because", "feedback", "confirmed", "aligned", "result"],
      ],
      antiSignals: ["obviously", "they should know", "too technical to explain"],
      probes: ["How did you change the explanation for a different audience?", "What did you ask to confirm the message landed?"],
    },
    {
      id: "technical-excellence",
      name: "Technical excellence and verification",
      plain: "You compare solutions, expose the mechanism and tradeoffs, then verify correctness and failure behavior.",
      signals: [
        ["alternative", "compared", "tradeoff", "constraints", "requirements", "assumption"],
        ["latency", "complexity", "scalability", "availability", "failure mode", "bottleneck", "data model"],
        ["tested", "edge case", "dry run", "verified", "monitoring", "correctness", "debugged"],
      ],
      antiSignals: ["it just worked", "the framework handled it", "no tradeoff"],
      probes: ["Which failure point changed your design?", "How would you gain confidence this component is correct?"],
    },
  ],
  loop: [
    {
      id: "recruiter-screen",
      kind: "hr",
      title: "Recruiter and motivation screen",
      purpose: "Connect your background, interests, level, and role choice to concrete work at Meta.",
      dimensionIds: ["results", "communication"],
      questionCount: 3,
    },
    {
      id: "behavioral",
      kind: "behavioral",
      title: "Behavioral interview",
      purpose: "Evidence that you can thrive in a fast-paced, highly unstructured environment.",
      dimensionIds: ["conflict", "growth", "ambiguity", "results", "communication"],
      questionCount: 5,
    },
    {
      id: "technical-story",
      kind: "technical-story",
      title: "Technical and design deep dive",
      purpose: "Make the requirements, alternatives, mechanism, failure points, and verification behind your own work inspectable.",
      dimensionIds: ["technical-excellence", "communication", "ambiguity", "results"],
      questionCount: 4,
    },
  ],
  archetypes: [
    { id: "walkthrough", kind: "hr", dimensionIds: ["results", "communication"], template: "Walk me through your background in two minutes. Which two results best explain why this Meta role is the next step?", followUps: ["What did you personally drive in the stronger result?"] },
    { id: "why-meta", kind: "hr", dimensionIds: ["results", "communication"], template: "Why Meta, and which product or engineering problem here would you want to understand from the inside?", followUps: ["What evidence have you gathered beyond scale and brand?"] },
    { id: "impact-choice", kind: "hr", dimensionIds: ["results"], template: "Which project best demonstrates the kind of impact you want to repeat in this role?", followUps: ["What number proves the impact?"] },
    { id: "conflict", kind: "behavioral", dimensionIds: ["conflict", "communication"], template: "Tell me about a serious disagreement with a colleague or manager. How did you understand their view and resolve it?", followUps: ["What was their strongest argument?", "What happened to the relationship afterward?"] },
    { id: "feedback", kind: "behavioral", dimensionIds: ["growth"], template: "Tell me about constructive criticism that changed how you work, not only how you felt.", followUps: ["What repeatable behavior changed?"] },
    { id: "ambiguity", kind: "behavioral", dimensionIds: ["ambiguity", "results"], template: "Tell me about a time you had to remain productive with important information missing.", followUps: ["Which assumption let you move?", "How did you limit the cost of being wrong?"] },
    { id: "pivot", kind: "behavioral", dimensionIds: ["ambiguity", "growth"], template: "Tell me about a project whose priority changed quickly. How did you decide what to preserve, stop, and restart?", followUps: ["What evidence triggered the pivot?"] },
    { id: "roadblock", kind: "behavioral", dimensionIds: ["results"], template: "Tell me about a goal you drove through a roadblock that could not simply be escalated away.", followUps: ["What did you personally do?", "Which result moved?"] },
    { id: "audience", kind: "behavioral", dimensionIds: ["communication", "conflict"], template: "Tell me about a technical decision you had to explain differently to engineers and cross-functional partners.", followUps: ["How did you know each audience understood the tradeoff?"] },
    { id: "hardest-system", kind: "technical-story", dimensionIds: ["technical-excellence", "communication"], template: "Take {project}. Start with requirements, then compare the two strongest designs and explain why the chosen one won.", followUps: ["Which failure point did you mitigate first?"] },
    { id: "scale", kind: "technical-story", dimensionIds: ["technical-excellence", "ambiguity"], template: "Suppose {project} receives one hundred times the traffic tomorrow. What fails first, and how would you verify that before rebuilding it?", followUps: ["Which metric or experiment tests the bottleneck theory?"] },
    { id: "bug", kind: "technical-story", dimensionIds: ["technical-excellence", "growth"], template: "In {project}, walk through a bug where your first theory was wrong and show how verification changed the direction.", followUps: ["Which observation disproved the first theory?"] },
    { id: "evolution", kind: "technical-story", dimensionIds: ["technical-excellence", "results"], template: "What requirement change would force the biggest redesign in {project}, and which boundary did you create to contain that change?", followUps: ["What complexity did that boundary cost today?"] },
  ],
};

export const COMPANY_PROFILES: CompanyInterviewProfile[] = [GENERAL, AMAZON, GOOGLE, META];

export function getCompanyProfile(id: string): CompanyInterviewProfile | undefined {
  return COMPANY_PROFILES.find((profile) => profile.id === id);
}
