import type { CompanyInterviewProfile, RoundKind, RoundSpec } from "./companyProfiles";
import type { FitReport, ResumeFacts } from "./resumeParser";

/**
 * Turns a company profile plus parsed resume/JD facts into a concrete
 * interview plan. Three question sources, in priority order per round:
 *
 * 1. claim probes: quantified resume claims get the "how was that measured,
 *    what was your part" cross-examination interviewers actually run
 * 2. gap probes: JD requirements the resume is silent on
 * 3. archetypes: the company's own question templates, slots filled from
 *    the resume so stories anchor to real projects
 *
 * Deterministic for the same inputs, so it is testable and a retake asks
 * the same interview.
 */

export interface PlannedQuestion {
  id: string;
  roundId: string;
  kind: RoundKind;
  text: string;
  dimensionIds: string[];
  source: "claim" | "gap" | "archetype";
  followUps: string[];
}

export interface PlannedRound {
  round: RoundSpec;
  questions: PlannedQuestion[];
}

export interface InterviewPlan {
  companyId: string;
  rounds: PlannedRound[];
}

function fillSlots(template: string, slots: Record<string, string | undefined>): string | undefined {
  let text = template;
  for (const [name, value] of Object.entries(slots)) {
    const token = `{${name}}`;
    if (text.includes(token)) {
      if (!value) return undefined;
      text = text.split(token).join(value);
    }
  }
  return text;
}

export function generateInterviewPlan(
  profile: CompanyInterviewProfile,
  resume: ResumeFacts,
  fit: FitReport,
  companyLabel?: string,
): InterviewPlan {
  const company = companyLabel ?? (profile.id === "general" ? "this company" : profile.name);
  const projects = resume.projects;
  const quantifiedClaims = projects.flatMap((project) =>
    project.claims.filter((claim) => claim.metric).map((claim) => ({ project: project.title, claim })),
  );

  // Rotating cursors keep questions varied across rounds without randomness.
  let claimCursor = 0;
  let gapCursor = 0;
  let projectCursor = 0;
  const usedArchetypes = new Set<string>();

  const technicalDimension = (roundDimensions: string[]): string[] =>
    roundDimensions.length > 0 ? roundDimensions : profile.dimensions.slice(0, 1).map((dimension) => dimension.id);

  const rounds: PlannedRound[] = profile.loop.map((round) => {
    const questions: PlannedQuestion[] = [];
    let questionIndex = 0;
    const pushQuestion = (
      text: string,
      source: PlannedQuestion["source"],
      dimensionIds: string[],
      followUps: string[],
    ) => {
      questions.push({
        id: `${round.id}-q${questionIndex += 1}`,
        roundId: round.id,
        kind: round.kind,
        text,
        dimensionIds,
        source,
        followUps,
      });
    };

    // Technical rounds lead with the resume cross-examination.
    if (round.kind === "technical-story") {
      if (claimCursor < quantifiedClaims.length && questions.length < round.questionCount) {
        const { claim } = quantifiedClaims[claimCursor];
        claimCursor += 1;
        pushQuestion(
          `Your resume says: "${claim.text}" That ${claim.metric} is exactly what an interviewer will test. How was it measured, and what specifically was your contribution to it?`,
          "claim",
          technicalDimension(round.dimensionIds),
          ["What was the baseline before?", "Who else worked on it, and what part was only yours?"],
        );
      }
      if (fit.gaps.length > gapCursor && questions.length < round.questionCount) {
        const gap = fit.gaps[gapCursor];
        gapCursor += 1;
        pushQuestion(
          `The role asks for this, and your resume does not show it directly: "${gap}" Tell me about the closest you have come to that, and be straight about the distance.`,
          "gap",
          technicalDimension(round.dimensionIds),
          ["What would your first month of closing that gap look like?"],
        );
      }
    }

    // Behavioral and HR rounds may also spend one slot on a claim probe,
    // because real interviewers do exactly that.
    if (round.kind === "behavioral" && claimCursor < quantifiedClaims.length) {
      const { claim } = quantifiedClaims[claimCursor];
      claimCursor += 1;
      pushQuestion(
        `Before the scripted questions: your resume claims "${claim.text}" Defend that number the way you would to a skeptical interviewer.`,
        "claim",
        round.dimensionIds,
        ["How would you know if that number regressed today?"],
      );
    }

    // Fill the rest from the company's archetypes for this round kind.
    for (const archetype of profile.archetypes) {
      if (questions.length >= round.questionCount) break;
      if (archetype.kind !== round.kind) continue;
      if (usedArchetypes.has(archetype.id)) continue;
      const project = projects[projectCursor % Math.max(projects.length, 1)];
      const text = fillSlots(archetype.template, {
        company,
        role: "this role",
        project: project?.title,
        tech: project?.techs[0],
        claim: project?.claims[0]?.text,
      });
      if (!text) continue;
      if (text.includes("{")) continue;
      usedArchetypes.add(archetype.id);
      if (archetype.template.includes("{project}")) projectCursor += 1;
      pushQuestion(text, "archetype", archetype.dimensionIds, archetype.followUps);
    }

    return { round, questions };
  });

  return { companyId: profile.id, rounds };
}
