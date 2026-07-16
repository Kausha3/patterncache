import { describe, expect, it } from "vitest";
import { LLD_STUDIO_MISSIONS } from "./lldStudioMissions";

describe("LLD Studio mission pack", () => {
  it("keeps every owner, relationship, mutation, and defense reference valid", () => {
    expect(LLD_STUDIO_MISSIONS).toHaveLength(3);
    expect(new Set(LLD_STUDIO_MISSIONS.map((mission) => mission.id)).size).toBe(LLD_STUDIO_MISSIONS.length);

    for (const mission of LLD_STUDIO_MISSIONS) {
      expect(mission.types).toHaveLength(6);
      expect(mission.responsibilities).toHaveLength(6);
      expect(mission.mutations).toHaveLength(3);
      const typeIds = new Set(mission.types.map((type) => type.id));
      expect(typeIds.size).toBe(mission.types.length);
      expect(new Set(mission.responsibilities.map((responsibility) => responsibility.id)).size).toBe(mission.responsibilities.length);
      for (const type of mission.types) expect(type.name).toMatch(/^[A-Z][A-Za-z0-9]*$/);
      for (const responsibility of mission.responsibilities) {
        expect(typeIds.has(responsibility.correctOwnerId), responsibility.id).toBe(true);
        expect(responsibility.signature).toMatch(/^[A-Za-z][^{};]+\([^)]*\)$/);
      }
      for (const relationship of mission.relationships) {
        expect(typeIds.has(relationship.fromId), relationship.id).toBe(true);
        expect(typeIds.has(relationship.toId), relationship.id).toBe(true);
        expect(relationship.fromId).not.toBe(relationship.toId);
      }
      for (const mutation of mission.mutations) {
        expect(mutation.options).toHaveLength(3);
        expect(mutation.options.filter((option) => option.correct), mutation.id).toHaveLength(1);
      }
      expect(mission.defense.options).toHaveLength(3);
      expect(mission.defense.options.filter((option) => option.correct)).toHaveLength(1);
    }
  });
});
