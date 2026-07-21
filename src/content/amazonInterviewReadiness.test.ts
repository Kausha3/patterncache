import { describe, expect, it } from "vitest";
import {
  AMAZON_BEHAVIORAL_MISSIONS,
  AMAZON_CODING_INTERVIEW_PROTOCOL,
  AMAZON_INTERVIEW_DAY_RULES,
  AMAZON_LEADERSHIP_PRINCIPLES,
  AMAZON_NEW_GRAD_INTERVIEW_FORMAT,
  AMAZON_PROFILE_DIMENSION_BY_PRINCIPLE,
  AMAZON_STAR_BLUEPRINT,
  AMAZON_TECHNICAL_CONCEPT_CHECKS,
} from "./amazonInterviewReadiness";

describe("Amazon New Grad interview readiness", () => {
  it("encodes the confirmed recruiter format without adding system design", () => {
    expect(AMAZON_NEW_GRAD_INTERVIEW_FORMAT).toMatchObject({
      jobId: "3177934",
      rounds: 4,
      minutesPerRound: 60,
      systemDesignRequired: false,
      recommendedStoryCount: { min: 8, max: 10 },
      storyRecencyYears: 5,
    });
    expect(AMAZON_NEW_GRAD_INTERVIEW_FORMAT.sections).toEqual([
      "Introduction",
      "Technical Q&A and live coding",
      "Behavioral questions",
      "Your questions for the interviewer",
    ]);
  });

  it("covers all sixteen Leadership Principles with ten reusable stories", () => {
    expect(AMAZON_LEADERSHIP_PRINCIPLES).toHaveLength(16);
    expect(AMAZON_BEHAVIORAL_MISSIONS).toHaveLength(10);
    const covered = new Set(AMAZON_BEHAVIORAL_MISSIONS.flatMap((mission) => mission.principleIds));
    expect([...covered].sort()).toEqual(AMAZON_LEADERSHIP_PRINCIPLES.map((principle) => principle.id).sort());
    for (const principle of AMAZON_LEADERSHIP_PRINCIPLES) {
      expect(AMAZON_PROFILE_DIMENSION_BY_PRINCIPLE[principle.id]).toBeTruthy();
    }
  });

  it("uses complete STAR and the full technical topic checklist", () => {
    expect(AMAZON_STAR_BLUEPRINT.map((part) => part.id)).toEqual(["situation", "task", "action", "result"]);
    expect(AMAZON_TECHNICAL_CONCEPT_CHECKS.map((check) => check.area)).toEqual(expect.arrayContaining([
      "Programming language",
      "Data structures",
      "Algorithms",
      "Coding",
      "Object-oriented design",
      "Databases",
      "Distributed computing",
      "Operating systems",
      "Internet topics",
      "Modern AI-powered development",
    ]));
    expect(AMAZON_CODING_INTERVIEW_PROTOCOL).toHaveLength(3);
    expect(AMAZON_INTERVIEW_DAY_RULES.some((rule) => rule.includes("generative AI"))).toBe(true);
  });

  it("keeps user-facing readiness content free of placeholder blanks and em dashes", () => {
    const content = JSON.stringify({
      AMAZON_BEHAVIORAL_MISSIONS,
      AMAZON_CODING_INTERVIEW_PROTOCOL,
      AMAZON_INTERVIEW_DAY_RULES,
      AMAZON_LEADERSHIP_PRINCIPLES,
      AMAZON_STAR_BLUEPRINT,
      AMAZON_TECHNICAL_CONCEPT_CHECKS,
    });
    expect(content).not.toContain("___");
    expect(content).not.toContain("—");
  });
});
