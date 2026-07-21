import {
  createUrlArchitectState,
  edgeId,
  type UrlArchitectPartId,
  type UrlArchitectState,
} from "@/arena/urlShortenerArchitectEngine";

export type UrlShortenerJourneyStage = "experience" | "repair" | "transfer" | "interview" | "debrief";

export interface JourneyRuleResult {
  id: string;
  label: string;
  passed: boolean;
  relatedPartIds: UrlArchitectPartId[];
}

export interface TransferSimulation {
  passed: boolean;
  message: string;
  trace: JourneyRuleResult[];
  activePartIds: UrlArchitectPartId[];
  metrics: { latency: string; availability: string; pressure: string };
}

export interface TransferExplanationGrade {
  ready: boolean;
  missing: string[];
}

export interface InterviewRubricResult {
  id: string;
  label: string;
  passed: boolean;
  evidence: string;
}

export interface InterviewAssessment {
  score: number;
  rubric: InterviewRubricResult[];
  strengths: string[];
  gaps: string[];
}

interface EdgeRule {
  id: string;
  from: UrlArchitectPartId;
  to: UrlArchitectPartId;
  label: string;
  failure: string;
  forbidden?: boolean;
}

export const TRANSFER_PART_IDS: UrlArchitectPartId[] = [
  "browser",
  "edge",
  "redirect",
  "cache",
  "link-store",
  "queue",
  "analytics",
];

export const TRANSFER_LABELS: Partial<Record<UrlArchitectPartId, { primary: string; secondary: string }>> = {
  browser: { primary: "Viewer", secondary: "Client" },
  edge: { primary: "Site entrance", secondary: "API Gateway" },
  redirect: { primary: "Profile reader", secondary: "Profile Read Service" },
  cache: { primary: "Hot profile shelf", secondary: "Read-through Cache" },
  "link-store": { primary: "Profile records", secondary: "Primary Database" },
  queue: { primary: "View-event stream", secondary: "Event Queue" },
  analytics: { primary: "Ranking counter", secondary: "Analytics Worker" },
};

const TRANSFER_RULES: EdgeRule[] = [
  { id: "viewer-entry", from: "browser", to: "edge", label: "A viewer reaches the public entrance", failure: "The viewer cannot enter the profile system." },
  { id: "entry-reader", from: "edge", to: "redirect", label: "Profile reads reach one focused service", failure: "Profile traffic has no read service." },
  { id: "reader-cache", from: "redirect", to: "cache", label: "The read service checks hot profiles first", failure: "Every celebrity profile still reaches permanent storage." },
  { id: "cache-store", from: "cache", to: "link-store", label: "A cache miss reaches durable profile records", failure: "A cache eviction would make a valid profile disappear." },
  { id: "reader-stream", from: "redirect", to: "queue", label: "A completed view publishes an event", failure: "The profile response still owns slow ranking work." },
  { id: "stream-counter", from: "queue", to: "analytics", label: "Ranking consumes views after the response", failure: "View events wait forever because no worker consumes them." },
  { id: "no-sync-counter", from: "redirect", to: "analytics", label: "The user path does not wait for ranking", failure: "A direct profile-reader-to-ranking cable puts slow analytics back in the user request.", forbidden: true },
];

export function createIndependentUrlGraph(): UrlArchitectState {
  return { ...createUrlArchitectState(), currentIncidentIndex: 3 };
}

export function evaluateUrlShortenerTransfer(state: UrlArchitectState): TransferSimulation {
  const trace = TRANSFER_RULES.map((rule): JourneyRuleResult => {
    const connected = state.edges.some((edge) => edge.id === edgeId(rule.from, rule.to));
    return {
      id: rule.id,
      label: rule.label,
      passed: rule.forbidden ? !connected : connected,
      relatedPartIds: [rule.from, rule.to],
    };
  });
  const failedIndex = trace.findIndex((result) => !result.passed);
  const passed = failedIndex === -1;
  const activePartIds = [...new Set(
    trace
      .filter((result, index) => result.passed && (passed || index < failedIndex))
      .flatMap((result) => result.relatedPartIds),
  )];
  return {
    passed,
    message: passed
      ? "Celebrity profiles stay fast while ranking updates later. You transferred both boundaries without being told their names."
      : TRANSFER_RULES[failedIndex].failure,
    trace,
    activePartIds,
    metrics: passed
      ? { latency: "104 ms", availability: "99.9%", pressure: "Views absorbed" }
      : { latency: "4.8 s", availability: "68%", pressure: "User path overloaded" },
  };
}

export function assessTransferExplanation(answer: string): TransferExplanationGrade {
  const text = answer.toLowerCase();
  const sentences = substantiveSentences(text);
  const causal = /because|\bso\b|therefore|otherwise|instead|prevents|while|remains/;
  const checks = [
    { label: "why frequently read data stays close to the reader", hit: sentences.some((sentence) => /cache|hot|fast memory|frequent/.test(sentence) && /read|reader|latency|fast/.test(sentence) && causal.test(sentence)) },
    { label: "why permanent storage remains authoritative", hit: sentences.some((sentence) => /database|source of truth|permanent|durable|record/.test(sentence) && /authoritative|truth|durable|survive|evict|disappear|remain|because|otherwise|while/.test(sentence)) },
    { label: "why ranking leaves the user request", hit: sentences.some((sentence) => /queue|event|stream|async|later|background/.test(sentence) && /ranking|analytics|counter/.test(sentence) && /user path|response|block|latency|wait|delay/.test(sentence)) },
    { label: "three distinct causal statements", hit: sentences.length >= 3 && sentences.filter((sentence) => causal.test(sentence)).length >= 2 },
  ];
  return {
    ready: answer.trim().length >= 150 && checks.every((check) => check.hit),
    missing: checks.filter((check) => !check.hit).map((check) => check.label),
  };
}

export function getInterviewRemainingSeconds(startedAt: number, durationSeconds: number, now = Date.now()): number {
  if (!Number.isFinite(startedAt) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;
  const duration = Math.floor(durationSeconds);
  return Math.min(duration, Math.max(0, Math.ceil((startedAt + duration * 1000 - now) / 1000)));
}

export function formatInterviewClock(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const remainder = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function assessUrlShortenerInterview(state: UrlArchitectState, reasoning: string): InterviewAssessment {
  const text = reasoning.toLowerCase();
  const sentences = substantiveSentences(text);
  const has = (from: UrlArchitectPartId, to: UrlArchitectPartId) => state.edges.some((edge) => edge.id === edgeId(from, to));
  const rubric: InterviewRubricResult[] = [
    { id: "entry", label: "Public request path", passed: has("browser", "edge") && has("edge", "redirect"), evidence: "Client traffic reaches a dedicated redirect service through an API boundary." },
    { id: "cache", label: "Fast read path with durable fallback", passed: has("redirect", "cache") && (has("cache", "link-store") || has("cache", "replicas")), evidence: "Popular reads can avoid the primary store without making cache the source of truth." },
    { id: "write", label: "Independent write path", passed: has("edge", "creator") && has("creator", "id-allocator") && has("creator", "link-store"), evidence: "Creation coordinates uniqueness before persisting the mapping." },
    { id: "async", label: "Analytics outside the response", passed: has("redirect", "queue") && has("queue", "analytics") && !has("redirect", "analytics"), evidence: "Click events cross an asynchronous boundary instead of blocking redirects." },
    { id: "resilience", label: "Replica failure handling", passed: has("cache", "replicas") && has("monitor", "replicas"), evidence: "Read capacity and health ownership remain separate." },
    { id: "scale-reasoning", label: "Scale and latency reasoning", passed: sentences.some((sentence) => /scale|traffic|read heavy|read-heavy|throughput|hot/.test(sentence) && /latency|throughput|cache|read|request/.test(sentence)), evidence: "Explanation connects workload shape to a latency or throughput decision." },
    { id: "consistency-reasoning", label: "Durability or consistency reasoning", passed: sentences.some((sentence) => /durable|source of truth|consisten|collision|unique|replica/.test(sentence) && /store|database|write|mapping|allocator|cache|copy/.test(sentence)), evidence: "Explanation connects correctness to persistence or concurrency." },
    { id: "tradeoff", label: "Explicit tradeoff", passed: sentences.some((sentence) => /tradeoff|trade-off|reject|cost|accept/.test(sentence) && /because|instead|but|while|so that/.test(sentence)), evidence: "Explanation states a cost and why it is accepted or rejected." },
    { id: "failure", label: "Failure-mode reasoning", passed: sentences.some((sentence) => /fail|outage|timeout|unavailable/.test(sentence) && /retry|degrad|fallback|healthy|route|remove|serve/.test(sentence)), evidence: "Explanation says what the system does when a dependency fails." },
    { id: "communication", label: "Structured interview communication", passed: reasoning.trim().length >= 260 && sentences.length >= 4, evidence: "Explanation has enough distinct statements to cover requirements, design, failure, and tradeoffs." },
  ];
  const score = rubric.filter((item) => item.passed).length * 10;
  return {
    score,
    rubric,
    strengths: rubric.filter((item) => item.passed).map((item) => item.label),
    gaps: rubric.filter((item) => !item.passed).map((item) => item.label),
  };
}

function substantiveSentences(value: string): string[] {
  return value
    .split(/[.!?]+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12);
}

export function recommendedJourneyStage({
  experienced,
  repaired,
  transferred,
  interviewed,
}: {
  experienced: boolean;
  repaired: boolean;
  transferred: boolean;
  interviewed: boolean;
}): UrlShortenerJourneyStage {
  if (!experienced) return "experience";
  if (!repaired) return "repair";
  if (!transferred) return "transfer";
  if (!interviewed) return "interview";
  return "debrief";
}
