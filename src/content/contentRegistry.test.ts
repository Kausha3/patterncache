import { describe, expect, it } from "vitest";
import { getLesson } from "./index";
import { getCompany } from "./companies";

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
});
