import type { AmazonPrepTrack } from "@/content/amazonSde1Prep";
import type { AmazonPrepEvidence } from "@/hooks/useAmazonPrepProgress";

export interface ColdProofDraft {
  ownership: string;
  pressure: string;
  tradeoff: string;
}

export interface ColdProofField {
  id: keyof ColdProofDraft;
  label: string;
  prompt: string;
}

export interface ColdProofValidation {
  valid: boolean;
  errors: Partial<Record<keyof ColdProofDraft, string>>;
}

export const EMPTY_COLD_PROOF: ColdProofDraft = { ownership: "", pressure: "", tradeoff: "" };

export function coldProofFields(track: AmazonPrepTrack): ColdProofField[] {
  return track === "dsa"
    ? [
        { id: "ownership", label: "Invariant", prompt: "What remains true while the algorithm runs, and why does that lead to the answer?" },
        { id: "pressure", label: "Cost", prompt: "Give time and space in Big-O, then explain what operation creates each cost." },
        { id: "tradeoff", label: "Pressure test", prompt: "Name one edge case or variant and explain what changes, if anything." },
      ]
    : [
        { id: "ownership", label: "Responsibilities", prompt: "Which classes own the important data and behavior, and why?" },
        { id: "pressure", label: "Change test", prompt: "Change one requirement. Which classes should change, and which should remain untouched?" },
        { id: "tradeoff", label: "Tradeoff", prompt: "Name one alternative design you rejected and the cost of your choice." },
      ];
}

function meaningful(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < 24 || normalized.split(" ").length < 5) return false;
  return !/^(?:i\s+do(?:n't| not)\s+know|none|n\/?a|test|asdf|todo)[.!\s]*$/i.test(normalized);
}

export function validateColdProof(track: AmazonPrepTrack, draft: ColdProofDraft): ColdProofValidation {
  const errors: ColdProofValidation["errors"] = {};
  for (const field of coldProofFields(track)) {
    if (!meaningful(draft[field.id])) errors[field.id] = `Explain ${field.label.toLowerCase()} in at least one specific sentence.`;
  }
  if (track === "dsa" && meaningful(draft.pressure) && !/\bO\s*\([^)]{1,40}\)/i.test(draft.pressure)) {
    errors.pressure = "Include explicit Big-O time and space, then explain where each cost comes from.";
  }
  const normalized = Object.values(draft).map((value) => value.trim().toLowerCase().replace(/\s+/g, " "));
  if (normalized[0] && (normalized[0] === normalized[1] || normalized[0] === normalized[2] || normalized[1] === normalized[2])) {
    errors.tradeoff = "Use a different explanation for each part of the proof.";
  }
  if (Object.values(draft).join(" ").trim().length < 120) {
    errors.tradeoff ??= "The complete proof is still too thin. Add concrete reasoning, not only conclusions.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function createColdProofEvidence(
  track: AmazonPrepTrack,
  draft: ColdProofDraft,
  recordedAt = new Date(),
): AmazonPrepEvidence {
  const validation = validateColdProof(track, draft);
  if (!validation.valid) throw new Error("Cold proof is incomplete.");
  const labels = coldProofFields(track);
  const summary = labels
    .map((field) => `${field.label}: ${draft[field.id].trim().replace(/\s+/g, " ")}`)
    .join("\n")
    .slice(0, 1600);
  return {
    kind: "cold-proof",
    verified: false,
    recordedAt: recordedAt.toISOString(),
    summary,
  };
}

export function createCombatEvidence(missionId: string, title: string, recordedAt = new Date()): AmazonPrepEvidence {
  return {
    kind: "combat-clear",
    verified: true,
    recordedAt: recordedAt.toISOString(),
    refId: missionId,
    summary: `Passed visible and hidden JVM tests for ${title}, then completed the defense round.`,
  };
}

export function createVerifiedPracticeEvidence(
  refId: string,
  summary: string,
  recordedAt = new Date(),
): AmazonPrepEvidence {
  if (!refId.trim() || !summary.trim()) throw new Error("Verified practice evidence requires a reference and summary.");
  return {
    kind: "verified-practice",
    verified: true,
    recordedAt: recordedAt.toISOString(),
    refId: refId.trim().slice(0, 120),
    summary: summary.trim().slice(0, 1600),
  };
}
