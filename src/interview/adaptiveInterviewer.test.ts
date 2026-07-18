import { describe, expect, it, vi } from "vitest";
import { assessAnswer } from "./answerJudge";
import { getCompanyProfile } from "./companyProfiles";
import { buildAdaptiveRequestBody, createAdaptiveFollowUp, parseAdaptiveInterviewTurn, requestAdaptiveInterviewTurn } from "./adaptiveInterviewer";
import type { PlannedQuestion } from "./questionGenerator";

const question: PlannedQuestion = {
  id: "q1",
  roundId: "behavioral",
  kind: "behavioral",
  text: "Tell me about a time you disagreed with a teammate.",
  dimensionIds: ["ownership"],
  source: "archetype",
  followUps: [],
};
const profile = getCompanyProfile("amazon")!;
const answer = "The situation was a launch disagreement. I decided to gather data and the result reduced errors by 20 percent.";
const assessment = assessAnswer(answer, question, profile);
const validTurn = {
  observation: "The result is quantified but the disagreement itself is vague.",
  strengths: ["A measurable result is present."],
  gaps: ["The other person's position is missing."],
  followUpQuestion: "What was your teammate's strongest argument, and what did you change after hearing it?",
  reason: "This distinguishes collaboration from simply winning the argument.",
  confidence: "high" as const,
};

describe("adaptive interviewer", () => {
  it("builds a bounded, non-persistent structured request without credentials", () => {
    const body = buildAdaptiveRequestBody("gpt-5-mini", { profile, question, answer, assessment });
    const serialized = JSON.stringify(body);
    expect(body).toMatchObject({ model: "gpt-5-mini", store: false, max_output_tokens: 700 });
    expect(serialized).toContain("json_schema");
    expect(serialized).not.toContain("sk-test");
    expect(serialized.length).toBeLessThan(12_000);
  });

  it("parses only complete, bounded adaptive turns", () => {
    expect(parseAdaptiveInterviewTurn(validTurn)).toEqual(validTurn);
    expect(() => parseAdaptiveInterviewTurn({ ...validTurn, followUpQuestion: "short" })).toThrow(/incomplete/i);
    expect(() => parseAdaptiveInterviewTurn({ ...validTurn, strengths: ["a", "b", "c"] })).toThrow(/incomplete/i);
  });

  it("turns a probe into a real next question without changing its scoring dimensions", () => {
    expect(createAdaptiveFollowUp(question, validTurn, 2)).toEqual({
      id: "adaptive-q1-2",
      roundId: "behavioral",
      kind: "behavioral",
      text: validTurn.followUpQuestion,
      dimensionIds: ["ownership"],
      source: "adaptive",
      followUps: [],
    });
  });

  it("sends the key only in authorization and parses output_text", async () => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => ({ output_text: JSON.stringify(validTurn) }),
      init,
    }));
    const result = await requestAdaptiveInterviewTurn({
      apiKey: "sk-test-abcdefghijklmnopqrstuvwxyz",
      model: "gpt-5-mini",
      input: { profile, question, answer, assessment },
      fetcher,
    });
    expect(result).toEqual(validTurn);
    const [, init] = fetcher.mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer sk-test-abcdefghijklmnopqrstuvwxyz");
    expect(String(init?.body)).not.toContain("sk-test-abcdefghijklmnopqrstuvwxyz");
  });

  it("returns safe errors without echoing credentials or provider bodies", async () => {
    const fetcher = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: { message: "secret body" } }) }));
    await expect(requestAdaptiveInterviewTurn({
      apiKey: "sk-test-abcdefghijklmnopqrstuvwxyz",
      model: "gpt-5-mini",
      input: { profile, question, answer, assessment },
      fetcher,
    })).rejects.toThrow(/rejected this key/i);
    await expect(requestAdaptiveInterviewTurn({
      apiKey: "too-short",
      model: "gpt-5-mini",
      input: { profile, question, answer, assessment },
      fetcher,
    })).rejects.not.toThrow(/too-short/);
  });

  it("normalizes browser network errors instead of exposing transport details", async () => {
    const fetcher = vi.fn(async () => { throw new TypeError("Failed to fetch secret-provider-detail"); });
    await expect(requestAdaptiveInterviewTurn({
      apiKey: "sk-test-abcdefghijklmnopqrstuvwxyz",
      model: "gpt-5-mini",
      input: { profile, question, answer, assessment },
      fetcher,
    })).rejects.toThrow(/could not reach OpenAI/i);
    await expect(requestAdaptiveInterviewTurn({
      apiKey: "sk-test-abcdefghijklmnopqrstuvwxyz",
      model: "gpt-5-mini",
      input: { profile, question, answer, assessment },
      fetcher,
    })).rejects.not.toThrow(/secret-provider-detail/i);
  });
});
