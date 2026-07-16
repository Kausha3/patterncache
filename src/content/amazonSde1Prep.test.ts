import { describe, expect, it } from "vitest";
import {
  AMAZON_SDE1_15_DAY_PLAN,
  AMAZON_SDE1_QUESTIONS,
  AMAZON_SDE1_RESEARCH_SOURCES,
  getAmazonPrepQuestion,
  isExternalPrepHref,
} from "./amazonSde1Prep";
import { getLesson } from "@/content";
import { getColdDrill } from "@/content/coldDrills";

describe("Amazon SDE-I preparation curriculum", () => {
  it("keeps stable, unique question ids and complete learning metadata", () => {
    const ids = AMAZON_SDE1_QUESTIONS.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(50);

    for (const question of AMAZON_SDE1_QUESTIONS) {
      expect(question.title.length).toBeGreaterThan(2);
      expect(question.why.length).toBeGreaterThan(20);
      expect(question.recallCue.length).toBeGreaterThan(20);
      expect(question.proof.length).toBeGreaterThan(20);
      expect(question.variations).toHaveLength(2);
      expect(question.minutes).toBeGreaterThanOrEqual(20);
      expect(question.href.startsWith("/") || isExternalPrepHref(question.href)).toBe(true);
    }
  });

  it("prioritizes both DSA and LLD in every tier", () => {
    for (const tier of ["must", "good", "stretch"] as const) {
      const questions = AMAZON_SDE1_QUESTIONS.filter((question) => question.tier === tier);
      expect(questions.some((question) => question.track === "dsa")).toBe(true);
      expect(questions.some((question) => question.track === "lld")).toBe(true);
    }

    const must = AMAZON_SDE1_QUESTIONS.filter((question) => question.tier === "must");
    expect(must.filter((question) => question.track === "dsa").length).toBeGreaterThanOrEqual(25);
    expect(must.filter((question) => question.track === "lld").length).toBeGreaterThanOrEqual(6);
  });

  it("covers every interview-critical DSA family in the must-do tier", () => {
    const patterns = AMAZON_SDE1_QUESTIONS
      .filter((question) => question.tier === "must" && question.track === "dsa")
      .map((question) => question.pattern.toLowerCase())
      .join(" ");
    for (const required of ["hash", "prefix", "sliding", "stack", "heap", "interval", "linked", "tree", "graph", "binary", "backtracking", "dp"]) {
      expect(patterns).toContain(required);
    }
  });

  it("builds an exact 15-day plan that schedules every must-do exactly once", () => {
    expect(AMAZON_SDE1_15_DAY_PLAN).toHaveLength(15);
    expect(AMAZON_SDE1_15_DAY_PLAN.map((day) => day.day)).toEqual(Array.from({ length: 15 }, (_, index) => index + 1));

    const scheduledIds = AMAZON_SDE1_15_DAY_PLAN.flatMap((day) => day.questionIds);
    const mustIds = AMAZON_SDE1_QUESTIONS.filter((question) => question.tier === "must").map((question) => question.id);
    expect(new Set(scheduledIds).size).toBe(scheduledIds.length);
    expect([...scheduledIds].sort()).toEqual([...mustIds].sort());
    expect(scheduledIds.every((id) => getAmazonPrepQuestion(id))).toBe(true);
  });

  it("keeps official sources distinct from anecdotal reports", () => {
    expect(AMAZON_SDE1_RESEARCH_SOURCES.filter((source) => source.kind === "official").length).toBeGreaterThanOrEqual(3);
    expect(AMAZON_SDE1_RESEARCH_SOURCES.filter((source) => source.kind === "candidate-report").length).toBeGreaterThanOrEqual(4);
    expect(AMAZON_SDE1_RESEARCH_SOURCES.every((source) => source.href.startsWith("https://"))).toBe(true);
  });

  it("does not ship a dead internal lesson or cold-drill link", () => {
    const internalQuestions = AMAZON_SDE1_QUESTIONS.filter((question) => question.href.startsWith("/"));
    expect(internalQuestions.length).toBeGreaterThan(0);
    for (const question of internalQuestions) {
      const [kind, id] = question.href.split("/").filter(Boolean);
      if (kind === "lesson") expect(getLesson(id), question.href).toBeDefined();
      else if (kind === "drill") expect(getColdDrill(id), question.href).toBeDefined();
      else throw new Error(`Unsupported Amazon prep route: ${question.href}`);
    }
  });
});
