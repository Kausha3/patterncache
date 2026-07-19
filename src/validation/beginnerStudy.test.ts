import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { finishBeginnerStudy, gradeBeginnerOwnershipAnswer, loadBeginnerStudyStore, reconcileMissionEvidence, saveBeginnerStudySession, startBeginnerStudy, studyMetrics } from "./beginnerStudy";

const STRONG = "Shelf should own findAvailableBook because it owns the books being searched. Catalog should coordinate across shelves by asking each shelf. If shelf storage format changes later, the change stays inside Shelf.";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
}

describe("beginner study", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it("scores causal transfer evidence rather than length", () => {
    expect(gradeBeginnerOwnershipAnswer("architecture ".repeat(40)).score).toBe(0);
    expect(gradeBeginnerOwnershipAnswer(STRONG).score).toBe(100);
  });

  it("distinguishes verified post-start learning from prior evidence", () => {
    const fresh = startBeginnerStudy({ eligibleFirstTimer: true, consented: true, preConfidence: 1, preAnswer: "Catalog maybe", now: 100 });
    expect(reconcileMissionEvidence(fresh, 99).missionEvidence).toBe("prior-evidence");
    expect(reconcileMissionEvidence(fresh, 101).missionEvidence).toBe("verified-after-start");
  });

  it("computes score and confidence change without calling it a hiring score", () => {
    const started = startBeginnerStudy({ eligibleFirstTimer: true, consented: true, preConfidence: 1, preAnswer: "Catalog", now: 1000 });
    const completed = finishBeginnerStudy({ ...started, missionOpenedAt: 4000, missionEvidence: "verified-after-start" }, { postConfidence: 4, postAnswer: STRONG, now: 601000 });
    expect(studyMetrics(completed)).toMatchObject({ timeToStartSeconds: 3, completionMinutes: 10, confidenceChange: 3, transferScoreChange: 100, verifiedLearningLoop: true });
  });

  it("persists completed sessions and tolerates broken storage payloads", () => {
    const completed = finishBeginnerStudy(startBeginnerStudy({ eligibleFirstTimer: false, consented: true, preConfidence: 2, preAnswer: "Shelf", now: 1 }), { postConfidence: 3, postAnswer: STRONG, now: 2 });
    saveBeginnerStudySession(completed);
    expect(loadBeginnerStudyStore().sessions).toHaveLength(1);
    localStorage.setItem("patterncache.beginner-study.v1", "not json");
    expect(loadBeginnerStudyStore()).toEqual({ sessions: [] });
  });

  it("recomputes grades and rejects forged or malformed study evidence", () => {
    localStorage.setItem("patterncache.beginner-study.v1", JSON.stringify({
      active: { id: "forged", version: 1, startedAt: 100, eligibleFirstTimer: true, consented: true, preConfidence: 99, preAnswer: "Catalog", preGrade: { score: 100 }, missionCompletedAt: 90, missionEvidence: "verified-after-start" },
      sessions: [null, {}, { id: "finished", version: 1, startedAt: 1, eligibleFirstTimer: true, consented: true, preConfidence: 1, preAnswer: "Catalog", preGrade: { score: 100 }, missionEvidence: "not-completed", postAnswer: STRONG, postGrade: { score: 0 }, completedAt: 2 }],
    }));
    const store = loadBeginnerStudyStore();
    expect(store.active).toMatchObject({ preConfidence: 5, preGrade: { score: 0 }, missionEvidence: "not-completed" });
    expect(store.sessions).toHaveLength(1);
    expect(store.sessions[0].postGrade?.score).toBe(100);
  });
});
