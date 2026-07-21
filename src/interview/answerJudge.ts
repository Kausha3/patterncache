import type { CompanyInterviewProfile, InterviewDimension } from "./companyProfiles";
import type { PlannedQuestion } from "./questionGenerator";

/**
 * The deterministic answer coach. It grades what a machine can honestly
 * grade: structure, evidence, ownership language, and the company's own
 * listed signals. It is labeled a coach everywhere, never an interviewer,
 * and it pairs every score with the self-review questions heuristics
 * cannot answer.
 */

export interface DimensionScore {
  dimensionId: string;
  name: string;
  /** Signal groups hit, out of the dimension's total. */
  hits: number;
  total: number;
  missedExamples: string[];
  antiSignalsTripped: string[];
  probe: string;
}

export interface StarReading {
  situation: boolean;
  task: boolean;
  action: boolean;
  result: boolean;
  metric: boolean;
}

export interface AnswerAssessment {
  wordCount: number;
  star: StarReading;
  /** Share of first-person singular ownership among ownership pronouns, 0..1. */
  ownershipRatio: number;
  fillerCount: number;
  dimensionScores: DimensionScore[];
  coaching: string[];
  selfReview: string[];
}

const SITUATION_CUES = ["the situation", "at the time", "context", "we had", "there was", "last year", "when i was", "the problem was", "my team was"];
const TASK_CUES = ["my task", "my responsibility", "i was responsible", "my goal", "the goal was", "i needed to", "i had to", "i was asked", "success meant", "i owned it"];
const ACTION_CUES = ["so i", "i decided", "i built", "i wrote", "i designed", "i proposed", "first i", "then i", "my approach", "i started", "i asked", "i took"];
const RESULT_CUES = ["as a result", "the result", "in the end", "shipped", "landed", "outcome", "which meant", "so now", "after that", "it worked", "we went from"];
const METRIC_PATTERN = /(\d+(?:[.,]\d+)?\s*(?:%|percent|x\b|ms\b|s\b|seconds|minutes|hours|days|users|customers|requests|qps|dollars)|\$\s?\d)/i;
const FILLER_PATTERNS = [/\blike,/gi, /\byou know\b/gi, /\bkind of\b/gi, /\bsort of\b/gi, /\bbasically\b/gi, /\bstuff\b/gi, /\bum\b/gi, /\buh\b/gi];

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function scoreDimension(answer: string, dimension: InterviewDimension): DimensionScore {
  let hits = 0;
  const missedExamples: string[] = [];
  for (const group of dimension.signals) {
    if (group.some((phrase) => answer.includes(phrase.toLowerCase()))) hits += 1;
    else missedExamples.push(group[0]);
  }
  const antiSignalsTripped = dimension.antiSignals.filter((phrase) => answer.includes(phrase.toLowerCase()));
  return {
    dimensionId: dimension.id,
    name: dimension.name,
    hits,
    total: dimension.signals.length,
    missedExamples: missedExamples.slice(0, 2),
    antiSignalsTripped,
    probe: dimension.probes[0] ?? "",
  };
}

export function assessAnswer(
  rawAnswer: string,
  question: PlannedQuestion,
  profile: CompanyInterviewProfile,
): AnswerAssessment {
  const answer = ` ${rawAnswer.toLowerCase().replace(/\s+/g, " ").trim()} `;
  const wordCount = rawAnswer.trim().length === 0 ? 0 : rawAnswer.trim().split(/\s+/).length;

  const star: StarReading = {
    situation: includesAny(answer, SITUATION_CUES),
    task: includesAny(answer, TASK_CUES),
    action: includesAny(answer, ACTION_CUES),
    result: includesAny(answer, RESULT_CUES),
    metric: METRIC_PATTERN.test(rawAnswer),
  };

  const iCount = countMatches(answer, /\b(i|my|me)\b/g);
  const weCount = countMatches(answer, /\b(we|our|us)\b/g);
  const ownershipRatio = iCount + weCount === 0 ? 0 : iCount / (iCount + weCount);

  const fillerCount = FILLER_PATTERNS.reduce((sum, pattern) => sum + countMatches(rawAnswer, pattern), 0);

  const dimensions = question.dimensionIds
    .map((id) => profile.dimensions.find((dimension) => dimension.id === id))
    .filter((dimension): dimension is InterviewDimension => !!dimension);
  const dimensionScores = dimensions.map((dimension) => scoreDimension(answer, dimension));

  const coaching: string[] = [];
  if (wordCount === 0) {
    coaching.push("Nothing to grade yet. Say the answer out loud or type it, even rough.");
  } else {
    if (wordCount < 60) coaching.push("Too thin to score well in a real room. A strong story runs 1.5 to 2 minutes spoken, roughly 150 to 250 words.");
    if (wordCount > 400) coaching.push("This is running long. Interviewers stop listening around the two minute mark; tighten to the one situation, your three key actions, and the result.");
    if (!star.situation) coaching.push("No situation setup detected. Give two sentences of context before your actions, or the story floats.");
    if (!star.task) coaching.push("Your responsibility is not explicit. State the goal, what you personally owned, and what made success difficult before describing the actions.");
    if (!star.action) coaching.push("Your specific actions are hard to find. Use 'I decided', 'I built', 'so I' and walk the steps.");
    if (!star.result) coaching.push("The story does not visibly land. End with what changed: shipped, fixed, adopted, faster.");
    if (!star.metric) coaching.push("No number anywhere. One honest metric (before and after) is the single strongest upgrade to this answer.");
    if (ownershipRatio < 0.4 && iCount + weCount >= 5) coaching.push(`Mostly 'we' language (${Math.round((1 - ownershipRatio) * 100)}% we/our). Interviewers score what YOU did; keep the team real but name your part.`);
    if (fillerCount >= 4) coaching.push(`${fillerCount} filler words (like, basically, kind of). Fine in speech, worth trimming in practice.`);
    for (const score of dimensionScores) {
      if (score.antiSignalsTripped.length > 0) {
        coaching.push(`${score.name}: "${score.antiSignalsTripped[0]}" is exactly the phrase this dimension penalizes.`);
      } else if (score.hits === 0) {
        coaching.push(`${score.name}: no evidence detected. This question was scored on it; ${profile.rubricName} interviewers would probe: ${score.probe}`);
      } else if (score.hits < score.total) {
        coaching.push(`${score.name}: partial evidence (${score.hits}/${score.total} signal groups). Missing the ${score.missedExamples.join(" and ")} side.`);
      }
    }
  }
  if (coaching.length === 0) {
    coaching.push("Structurally strong: situation, your responsibility, your actions, a measured result, and the signals this company listens for. Now pressure-test it with the follow-ups.");
  }

  const selfReview = [
    "Is every part of this story true and yours to tell?",
    "Could you survive the follow-up: " + (question.followUps[0] ?? "what would you do differently?"),
    "Would a teammate who was there agree with how you told your part?",
  ];

  return { wordCount, star, ownershipRatio, fillerCount, dimensionScores, coaching, selfReview };
}

export interface SessionDebrief {
  /** Dimension coverage across the whole session. */
  coverage: { dimensionId: string; name: string; evidenced: number; asked: number }[];
  weakest?: { dimensionId: string; name: string };
  metricAnswerShare: number;
  averageWords: number;
}

export function debriefSession(
  assessments: { question: PlannedQuestion; assessment: AnswerAssessment }[],
  profile: CompanyInterviewProfile,
): SessionDebrief {
  const byDimension = new Map<string, { evidenced: number; asked: number }>();
  for (const dimension of profile.dimensions) byDimension.set(dimension.id, { evidenced: 0, asked: 0 });
  let metricAnswers = 0;
  let totalWords = 0;
  for (const { assessment } of assessments) {
    if (assessment.star.metric) metricAnswers += 1;
    totalWords += assessment.wordCount;
    for (const score of assessment.dimensionScores) {
      const entry = byDimension.get(score.dimensionId);
      if (!entry) continue;
      entry.asked += 1;
      if (score.hits >= Math.ceil(score.total / 2)) entry.evidenced += 1;
    }
  }
  const coverage = profile.dimensions
    .map((dimension) => ({
      dimensionId: dimension.id,
      name: dimension.name,
      ...byDimension.get(dimension.id)!,
    }))
    .filter((entry) => entry.asked > 0);
  const weakestEntry = [...coverage].sort((a, b) => a.evidenced / a.asked - b.evidenced / b.asked)[0];
  return {
    coverage,
    weakest: weakestEntry ? { dimensionId: weakestEntry.dimensionId, name: weakestEntry.name } : undefined,
    metricAnswerShare: assessments.length === 0 ? 0 : metricAnswers / assessments.length,
    averageWords: assessments.length === 0 ? 0 : Math.round(totalWords / assessments.length),
  };
}
