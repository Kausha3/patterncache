import { describe, expect, it } from "vitest";
import { getLesson } from "./index";
import { getCompany } from "./companies";
import { getColdDrill } from "./coldDrills";
import { listDesignPatterns } from "./designPatterns";
import { listPatternSpotScenarios } from "./patternSpotScenarios";
import { listSolidPrinciples } from "./solidPrinciples";

describe("content registry", () => {
  it("registers the authored Amazon flagship lessons", () => {
    expect(getLesson("amazon-warehouse")?.title).toContain("Warehouse");
    expect(getLesson("amazon-checkout")?.title).toContain("Checkout");
  });

  it("keeps every Amazon LLD question playable", () => {
    const amazon = getCompany("amazon");
    expect(amazon).toBeDefined();
    expect(amazon?.lld.every((question) => !!getLesson(question.lessonId))).toBe(true);
  });

  it("exposes seven playable Amazon HLD questions", () => {
    const amazon = getCompany("amazon");
    const playable = amazon?.hld.filter((question) => !!getLesson(question.lessonId)) ?? [];
    expect(playable).toHaveLength(7);
  });

  it("keeps the Google pack level-honest instead of inventing an L3 design round", () => {
    const google = getCompany("google");
    expect(google?.status).toBe("available");
    expect(google?.hld.length).toBeGreaterThan(0);
    expect(google?.hld.every((question) => !question.levels.includes("L3"))).toBe(true);
    expect(google?.lld).toEqual([]);
    expect(google?.bucketNotes?.lld).toContain("No dedicated LLD list");
  });

  it("gives every company question an evidence note, level, and unique bucket id", () => {
    for (const companyId of ["amazon", "google"]) {
      const company = getCompany(companyId)!;
      for (const questions of [company.hld, company.lld]) {
        expect(new Set(questions.map((question) => question.lessonId)).size).toBe(questions.length);
        for (const question of questions) {
          expect(question.signalNote.trim().length, `${companyId}:${question.lessonId} evidence`).toBeGreaterThan(30);
          expect(question.levels.length, `${companyId}:${question.lessonId} levels`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("covers the interview-staple patterns including Factory and Singleton", () => {
    const ids = listDesignPatterns().map((pattern) => pattern.id);
    for (const required of ["state", "strategy", "facade", "builder", "observer", "composite", "command", "decorator", "factory", "singleton"]) {
      expect(ids).toContain(required);
    }
    for (const pattern of listDesignPatterns()) {
      expect(pattern.examples.length, `${pattern.id} needs at least one real example`).toBeGreaterThan(0);
      if (pattern.confusedWith?.patternId) {
        expect(ids, `${pattern.id} confusedWith points at a real pattern`).toContain(pattern.confusedWith.patternId);
      }
    }
  });

  it("keeps every spot-the-pattern option pointing at a real pattern, one correct each", () => {
    const ids = new Set(listDesignPatterns().map((pattern) => pattern.id));
    for (const scenario of listPatternSpotScenarios()) {
      expect(scenario.options.filter((option) => option.correct)).toHaveLength(1);
      for (const option of scenario.options) {
        expect(ids.has(option.patternId), `${scenario.id} option ${option.patternId}`).toBe(true);
      }
    }
  });

  it("backs every SOLID principle with resolvable in-app receipts", () => {
    const principles = listSolidPrinciples();
    expect(principles.map((principle) => principle.id)).toEqual(["srp", "ocp", "lsp", "isp", "dip"]);
    for (const principle of principles) {
      expect(principle.whereYouUsedIt.length).toBeGreaterThan(0);
      for (const usage of principle.whereYouUsedIt) {
        const [kind, id] = usage.route.split("/").filter(Boolean);
        if (kind === "lesson") expect(getLesson(id), usage.route).toBeDefined();
        else if (kind === "drill") expect(getColdDrill(id), usage.route).toBeDefined();
        else expect(kind, `${usage.route} should be a lesson, drill, or arena route`).toBe("arena");
      }
    }
  });
});
