export type AmazonLeadershipPrincipleId =
  | "customer-obsession"
  | "ownership"
  | "invent-and-simplify"
  | "are-right-a-lot"
  | "learn-and-be-curious"
  | "hire-and-develop-the-best"
  | "highest-standards"
  | "think-big"
  | "bias-for-action"
  | "frugality"
  | "earn-trust"
  | "dive-deep"
  | "disagree-and-commit"
  | "deliver-results"
  | "best-employer"
  | "success-and-scale";

export interface AmazonLeadershipPrinciplePrep {
  id: AmazonLeadershipPrincipleId;
  name: string;
  plain: string;
}

export interface AmazonBehavioralMission {
  id: string;
  day: number;
  title: string;
  principleIds: AmazonLeadershipPrincipleId[];
  prompt: string;
  resumeMiningCue: string;
  proof: string[];
  followUps: string[];
}

export interface AmazonTechnicalConceptCheck {
  id: string;
  day: number;
  title: string;
  area: string;
  why: string;
  prompts: [string, string];
}

export const AMAZON_NEW_GRAD_INTERVIEW_FORMAT = {
  jobId: "3177934",
  role: "Software Development Engineer - 2026 US New Grad",
  rounds: 4,
  minutesPerRound: 60,
  sections: ["Introduction", "Technical Q&A and live coding", "Behavioral questions", "Your questions for the interviewer"],
  systemDesignRequired: false,
  recommendedStoryCount: { min: 8, max: 10 },
  storyRecencyYears: 5,
} as const;

export const AMAZON_CODING_INTERVIEW_PROTOCOL = [
  { phase: "Before coding", actions: ["Ask clarifying questions", "State assumptions", "Request or create examples", "Validate the planned approach on an example"] },
  { phase: "During coding", actions: ["Explain decisions aloud", "Describe the code as you write it", "Write real syntactically correct Java", "Use consistent names and keep the code testable"] },
  { phase: "After coding", actions: ["Dry-run normal and edge cases", "State time and space complexity", "Discuss optimizations and trade-offs", "Repair any issue you discover aloud"] },
] as const;

export const AMAZON_INTERVIEW_DAY_RULES = [
  "Use one specific recent event per STAR answer instead of combining several examples.",
  "Keep 8 to 10 reusable stories from the last five years and map each story to multiple principles.",
  "Use first-person language for your contribution while giving collaborators accurate credit.",
  "Do not use generative AI during the interview unless the interviewer explicitly permits it.",
  "Prepare at least two thoughtful questions for each interviewer.",
] as const;

export const AMAZON_PROFILE_DIMENSION_BY_PRINCIPLE: Record<AmazonLeadershipPrincipleId, string> = {
  "customer-obsession": "customer-obsession",
  ownership: "ownership",
  "invent-and-simplify": "invent-simplify",
  "are-right-a-lot": "are-right-a-lot",
  "learn-and-be-curious": "learn-curious",
  "hire-and-develop-the-best": "hire-develop-best",
  "highest-standards": "highest-standards",
  "think-big": "think-big",
  "bias-for-action": "bias-for-action",
  frugality: "frugality",
  "earn-trust": "earn-trust",
  "dive-deep": "dive-deep",
  "disagree-and-commit": "disagree-commit",
  "deliver-results": "deliver-results",
  "best-employer": "best-employer",
  "success-and-scale": "success-scale",
};

export const AMAZON_LEADERSHIP_PRINCIPLES: AmazonLeadershipPrinciplePrep[] = [
  { id: "customer-obsession", name: "Customer Obsession", plain: "Start with a real customer problem, verify it, and work backward to the solution." },
  { id: "ownership", name: "Ownership", plain: "Take responsibility beyond your assigned boundary and protect the long-term outcome." },
  { id: "invent-and-simplify", name: "Invent and Simplify", plain: "Find a new or substantially simpler path and explain what complexity disappeared." },
  { id: "are-right-a-lot", name: "Are Right, A Lot", plain: "Use judgment, seek contrary evidence, and update your decision when the facts change." },
  { id: "learn-and-be-curious", name: "Learn and Be Curious", plain: "Learn something unfamiliar, apply it, and show how it changed later work." },
  { id: "hire-and-develop-the-best", name: "Hire and Develop the Best", plain: "Raise another person's capability through specific feedback, mentoring, or opportunity." },
  { id: "highest-standards", name: "Insist on the Highest Standards", plain: "Prevent defects from moving downstream and create a mechanism that keeps quality high." },
  { id: "think-big", name: "Think Big", plain: "Expand a local improvement into a direction that creates meaningfully larger value." },
  { id: "bias-for-action", name: "Bias for Action", plain: "Move quickly on a reversible decision while naming the risk and the safety check." },
  { id: "frugality", name: "Frugality", plain: "Use constraints to produce a simpler result without hiding a quality or reliability cost." },
  { id: "earn-trust", name: "Earn Trust", plain: "Listen, speak candidly, own mistakes, and repair both the outcome and the relationship." },
  { id: "dive-deep", name: "Dive Deep", plain: "Follow data and mechanisms beneath the first explanation until the real cause is proven." },
  { id: "disagree-and-commit", name: "Have Backbone; Disagree and Commit", plain: "Challenge respectfully with evidence, then support the final decision completely." },
  { id: "deliver-results", name: "Deliver Results", plain: "Prioritize the essential inputs, overcome setbacks, and finish with measurable impact." },
  { id: "best-employer", name: "Strive to be Earth's Best Employer", plain: "Improve safety, inclusion, growth, or effectiveness for the people around you." },
  { id: "success-and-scale", name: "Success and Scale Bring Broad Responsibility", plain: "Consider second-order effects and leave customers, communities, or systems better." },
];

export const AMAZON_STAR_BLUEPRINT = [
  { id: "situation", label: "Situation", target: "2 to 3 sentences", coach: "Name the setting, customer, constraint, and stakes. Remove background that does not affect the decision." },
  { id: "task", label: "Task", target: "1 to 2 sentences", coach: "State your responsibility, the goal, and what made success difficult." },
  { id: "action", label: "Action", target: "About 60% of the answer", coach: "Use first-person language. Explain your decisions, alternatives, mechanisms, and how you handled people or risk." },
  { id: "result", label: "Result and learning", target: "3 to 4 sentences", coach: "Give before-and-after evidence, the customer outcome, what you learned, and what you would improve." },
] as const;

export const AMAZON_RESUME_DEFENSE_CHECKLIST = [
  "Defend every number: baseline, measurement source, timeframe, and your contribution.",
  "Explain every major technology choice, the alternative you rejected, and when you would reverse the decision.",
  "Go one layer beneath each project summary into data flow, failure modes, tests, and operational ownership.",
  "Separate the team's work from your actions without erasing collaborators.",
  "Prepare one honest failure, one disagreement, one customer impact, and one difficult technical investigation.",
  "Connect the resume to the job description without pretending a gap is experience you do not have.",
] as const;

export const AMAZON_BEHAVIORAL_MISSIONS: AmazonBehavioralMission[] = [
  {
    id: "customer-impact",
    day: 1,
    title: "Customer impact with a measured result",
    principleIds: ["customer-obsession", "deliver-results"],
    prompt: "Tell me about a time you discovered and solved a problem for a customer or a team that depended on you.",
    resumeMiningCue: "Choose a resume bullet with adoption, reliability, latency, support, revenue, or time-saved impact. Identify the actual customer before writing the story.",
    proof: ["A specific customer and pain", "Your direct actions", "A before-and-after metric", "What changed for the customer"],
    followUps: ["How did you know the customer needed this?", "What would the customer say you still missed?"],
  },
  {
    id: "ownership-beyond-role",
    day: 2,
    title: "Ownership beyond the job boundary",
    principleIds: ["ownership"],
    prompt: "Tell me about a time you took responsibility for something that was not formally your job.",
    resumeMiningCue: "Look for an outage, handoff gap, neglected tool, undocumented system, or task you volunteered to carry through completion.",
    proof: ["Where your assigned responsibility ended", "Why you stepped in", "How you followed through", "The long-term mechanism you left behind"],
    followUps: ["Why did you not simply escalate it?", "What happened after you handed it off?"],
  },
  {
    id: "technical-root-cause",
    day: 3,
    title: "Technical deep dive and root cause",
    principleIds: ["dive-deep"],
    prompt: "Tell me about the hardest technical problem on your resume. Take me from symptom to proven root cause.",
    resumeMiningCue: "Pick the project where logs, profiling, experiments, traces, or test failures changed your first theory.",
    proof: ["The misleading first explanation", "The evidence that rejected it", "The actual mechanism", "The test or monitor that prevents recurrence"],
    followUps: ["Which exact metric told you where to look next?", "What did you try that failed?"],
  },
  {
    id: "ambiguous-decision",
    day: 4,
    title: "Decision under ambiguity",
    principleIds: ["bias-for-action", "are-right-a-lot"],
    prompt: "Tell me about a decision you made before you had complete information.",
    resumeMiningCue: "Choose a deadline, launch, migration, or incident where waiting also carried a cost.",
    proof: ["What was unknown", "Why the move was reversible or worth the risk", "What contrary evidence you sought", "How you corrected course"],
    followUps: ["What was the risk of acting?", "Which fact would have made you choose differently?"],
  },
  {
    id: "quality-bar",
    day: 5,
    title: "Raise the quality bar for the team",
    principleIds: ["highest-standards", "hire-and-develop-the-best", "best-employer"],
    prompt: "Tell me about a time you raised a quality standard while helping another person or team become more effective.",
    resumeMiningCue: "Look for testing, observability, code review, onboarding, documentation, accessibility, reliability, security, or release-process work.",
    proof: ["The defect or barrier people faced", "Why the existing bar was insufficient", "The mechanism and support you introduced", "Evidence that quality and capability stayed higher"],
    followUps: ["Did your standard slow delivery?", "How did you help people own the improved process without depending on you?"],
  },
  {
    id: "mistake-and-trust",
    day: 6,
    title: "Own a mistake and rebuild trust",
    principleIds: ["earn-trust"],
    prompt: "Tell me about a meaningful mistake you made and what you did after discovering it.",
    resumeMiningCue: "Use a real mistake with consequences. Do not disguise a strength as a failure.",
    proof: ["Your decision or omission", "Who you informed and when", "Immediate repair", "A lasting change in your behavior or system"],
    followUps: ["Who discovered it?", "What would the affected teammate say about your response?"],
  },
  {
    id: "disagree-and-commit",
    day: 7,
    title: "Disagree with evidence, then commit",
    principleIds: ["disagree-and-commit"],
    prompt: "Tell me about a time you strongly disagreed with a technical or product decision.",
    resumeMiningCue: "Choose a real disagreement with a manager, teammate, stakeholder, or reviewer where the outcome mattered.",
    proof: ["The other side's strongest argument", "Evidence you presented", "How the decision was made", "What full commitment looked like afterward"],
    followUps: ["What if you still believed the decision was wrong?", "How did the relationship change?"],
  },
  {
    id: "simplify-under-constraints",
    day: 8,
    title: "Simplify under constraints",
    principleIds: ["invent-and-simplify", "frugality"],
    prompt: "Tell me about a time constraints pushed you toward a substantially simpler solution.",
    resumeMiningCue: "Find automation, deleted code, reduced infrastructure, a manual process removed, or a smaller design that still met the need.",
    proof: ["The obvious expensive approach", "The simpler mechanism", "What was removed", "The cost and quality result"],
    followUps: ["What trade-off did the simpler design create?", "What would force you to invest more later?"],
  },
  {
    id: "learn-fast",
    day: 9,
    title: "Learn something unfamiliar and apply it",
    principleIds: ["learn-and-be-curious"],
    prompt: "Tell me about a time you had to learn something substantial quickly to deliver.",
    resumeMiningCue: "Choose a technology, domain, codebase, operational responsibility, or customer problem that was genuinely new to you.",
    proof: ["What you did not know", "How you learned", "How you tested your understanding", "Where the learning changed the outcome"],
    followUps: ["Who helped you?", "What did you initially misunderstand?"],
  },
  {
    id: "think-at-scale",
    day: 10,
    title: "Think beyond the immediate feature",
    principleIds: ["think-big", "success-and-scale"],
    prompt: "Tell me about a time you expanded a local solution while accounting for its wider consequences.",
    resumeMiningCue: "Look for a platform, reusable service, migration, standard, or product change that affected more users or teams than the original request.",
    proof: ["The original narrow goal", "The larger opportunity", "Second-order risks or affected groups", "Evidence the broader result was responsible"],
    followUps: ["Who could be harmed if this scaled?", "What made the broader direction credible rather than aspirational?"],
  },
];

export const AMAZON_TECHNICAL_CONCEPT_CHECKS: AmazonTechnicalConceptCheck[] = [
  { id: "java-fluency", day: 1, title: "Java fluency", area: "Programming language", why: "Amazon expects syntactically correct code without relying on an IDE.", prompts: ["When do equals() and hashCode() have to change together?", "Choose ArrayList, HashSet, HashMap, PriorityQueue, or ArrayDeque for one operation and state its complexity."] },
  { id: "data-structures", day: 2, title: "Data-structure contracts", area: "Data structures", why: "Interviewers probe operations, invariants, and trade-offs beyond memorized code.", prompts: ["State the invariant maintained by a hash map plus doubly linked list LRU.", "Compare a heap, balanced tree, and bucket approach for top-K."] },
  { id: "algorithms-complexity", day: 3, title: "Algorithm and complexity reasoning", area: "Algorithms", why: "The optimized solution must come with a defensible runtime and space argument.", prompts: ["Explain amortized analysis using dynamic-array growth.", "Give the time and auxiliary space of recursive tree traversal on balanced and skewed trees."] },
  { id: "coding-quality", day: 4, title: "Correctness and testing", area: "Coding", why: "Robust, maintainable, well-tested code and edge-case handling are explicit evaluation criteria.", prompts: ["Name five edge-case categories before running a solution.", "Explain how you would prove a loop invariant and turn it into tests."] },
  { id: "object-oriented-design", day: 5, title: "Object-oriented design", area: "Object-oriented design", why: "SDE I roles explicitly require object-oriented design fundamentals.", prompts: ["Explain composition versus inheritance with a change that favors each.", "Describe SRP, OCP, LSP, ISP, and DIP without using textbook definitions alone."] },
  { id: "databases", day: 6, title: "Database fundamentals", area: "Databases", why: "Indexes, transactions, modeling, and consistency commonly appear inside design and resume deep dives.", prompts: ["Explain what an index speeds up and what it makes more expensive.", "Describe atomicity, isolation, and one lost-update scenario."] },
  { id: "distributed-systems", day: 7, title: "Distributed-system fundamentals", area: "Distributed computing", why: "Technical Q&A and resume deep dives can probe caching, retries, replication, and failure handling even when there is no system-design round.", prompts: ["Why must a retried operation be idempotent?", "Compare cache-aside and read-through behavior during a cache miss and invalidation."] },
  { id: "operating-systems", day: 8, title: "Operating systems and concurrency", area: "Operating systems", why: "Threads, memory, synchronization, and deadlocks are common computer-science fundamentals.", prompts: ["Name the four conditions required for deadlock.", "Explain process versus thread and when shared mutable state becomes unsafe."] },
  { id: "internet", day: 9, title: "Internet and API fundamentals", area: "Internet topics", why: "Resume and design questions often descend into HTTP, DNS, transport, and API behavior.", prompts: ["Walk through what happens after entering a URL until the first response byte.", "Explain idempotent HTTP methods, status codes, and timeout versus retry behavior."] },
  { id: "ml-ai", day: 10, title: "ML and AI awareness", area: "Modern AI-powered development", why: "The recruiter guidance explicitly says the technical discussion can include modern AI-powered development.", prompts: ["Explain training versus inference and one source of data leakage.", "If your resume mentions AI, define the evaluation metric, baseline, failure modes, and human fallback."] },
  { id: "ai-assisted-development", day: 11, title: "Using GenAI as an engineer", area: "Modern AI-powered development", why: "Be ready to discuss where AI tools help, where they fail, and how you verify generated work without outsourcing judgment.", prompts: ["Describe a responsible workflow for using generated code, including tests, security, privacy, and review.", "Give one task where GenAI helps and one where its uncertainty makes it the wrong tool."] },
];

export function getAmazonBehavioralMission(id: string | null | undefined): AmazonBehavioralMission | undefined {
  return AMAZON_BEHAVIORAL_MISSIONS.find((mission) => mission.id === id);
}

export function getAmazonBehavioralMissionForDay(day: number): AmazonBehavioralMission | undefined {
  return AMAZON_BEHAVIORAL_MISSIONS.find((mission) => mission.day === day);
}

export function getAmazonTechnicalConceptForDay(day: number): AmazonTechnicalConceptCheck | undefined {
  return AMAZON_TECHNICAL_CONCEPT_CHECKS.find((concept) => concept.day === day);
}

export function getAmazonLeadershipPrinciple(id: AmazonLeadershipPrincipleId): AmazonLeadershipPrinciplePrep {
  const principle = AMAZON_LEADERSHIP_PRINCIPLES.find((candidate) => candidate.id === id);
  if (!principle) throw new Error(`Unknown Amazon Leadership Principle: ${id}`);
  return principle;
}
