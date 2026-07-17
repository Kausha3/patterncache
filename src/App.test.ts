import { describe, expect, it } from "vitest";
import { activeSection } from "./App";

describe("top-nav section resolution", () => {
  it("keeps Today as the front door for the root and course flow", () => {
    expect(activeSection("/")).toBe("/");
    expect(activeSection("/course")).toBe("/");
  });

  it("groups practice modes under Practice", () => {
    for (const path of ["/practice", "/arena", "/arena/coding-lab", "/arena/lld-studio", "/arena/pattern-genome", "/drill", "/drill/atm", "/patterns"]) {
      expect(activeSection(path)).toBe("/practice");
    }
  });

  it("groups content under Library, including company filters", () => {
    for (const path of ["/library", "/lesson/parking-lot", "/companies", "/companies/amazon", "/companies/amazon/sde1", "/companies/google"]) {
      expect(activeSection(path)).toBe("/library");
    }
  });

  it("keeps Progress on its own", () => {
    expect(activeSection("/progress")).toBe("/progress");
  });
});
