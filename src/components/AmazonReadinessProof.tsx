import { useState } from "react";
import { Button, Eyebrow } from "@/components/ui";
import {
  EMPTY_COLD_PROOF,
  coldProofFields,
  createColdProofEvidence,
  createCombatEvidence,
  validateColdProof,
  type ColdProofDraft,
} from "@/amazon/readinessProof";
import type { AmazonPrepTrack } from "@/content/amazonSde1Prep";
import type { AmazonPrepEvidence } from "@/hooks/useAmazonPrepProgress";

export function AmazonReadinessProof({
  questionTitle,
  track,
  combatMissionId,
  combatCompleted,
  evidence,
  onProof,
}: {
  questionTitle: string;
  track: AmazonPrepTrack;
  combatMissionId?: string;
  combatCompleted: boolean;
  evidence?: AmazonPrepEvidence;
  onProof: (evidence: AmazonPrepEvidence) => void;
}) {
  const [draft, setDraft] = useState<ColdProofDraft>(EMPTY_COLD_PROOF);
  const [errors, setErrors] = useState<Partial<Record<keyof ColdProofDraft, string>>>({});
  const fields = coldProofFields(track);

  if (evidence) {
    return (
      <div className={`amazon-proof-record ${evidence.verified ? "is-verified" : "is-reviewed"}`}>
        <div>
          <Eyebrow tone={evidence.verified ? "var(--green)" : "var(--amber)"}>
            {evidence.verified ? "Machine-verified evidence" : "Structured self-review"}
          </Eyebrow>
          <strong>{evidence.verified ? "Hidden JVM tests passed" : "Cold explanation recorded"}</strong>
        </div>
        <pre>{evidence.summary}</pre>
      </div>
    );
  }

  const submitColdProof = () => {
    const validation = validateColdProof(track, draft);
    setErrors(validation.errors);
    if (!validation.valid) return;
    onProof(createColdProofEvidence(track, draft));
  };

  return (
    <div className="amazon-proof-panel">
      <div className="amazon-proof-heading">
        <div>
          <Eyebrow tone="var(--violet)">Prove readiness · no supplied answer</Eyebrow>
          <strong>Defend {questionTitle} from memory</strong>
        </div>
        <span>{track === "dsa" ? "Invariant · cost · pressure test" : "Responsibilities · change · tradeoff"}</span>
      </div>

      {combatMissionId ? (
        <div className={`amazon-combat-proof ${combatCompleted ? "is-complete" : ""}`}>
          <div>
            <strong>{combatCompleted ? "A verified JVM clear already exists" : "Machine verification is available"}</strong>
            <small>
              {combatCompleted
                ? "Visible and hidden tests passed in Coding Combat. Record that clear as the strongest available evidence."
                : "Pass the hidden JVM tests in Coding Combat, then return here. You can still submit a cold explanation now."}
            </small>
          </div>
          {combatCompleted ? (
            <Button icon="shield" onClick={() => onProof(createCombatEvidence(combatMissionId, questionTitle))}>
              Use verified clear
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="amazon-proof-fields">
        {fields.map((field) => (
          <label key={field.id}>
            <span>{field.label}</span>
            <small>{field.prompt}</small>
            <textarea
              value={draft[field.id]}
              onChange={(event) => {
                setDraft((current) => ({ ...current, [field.id]: event.target.value }));
                setErrors((current) => ({ ...current, [field.id]: undefined }));
              }}
              aria-invalid={!!errors[field.id]}
              aria-describedby={errors[field.id] ? `${field.id}-proof-error` : undefined}
              placeholder="Explain in your own words…"
            />
            {errors[field.id] ? <em id={`${field.id}-proof-error`}>{errors[field.id]}</em> : null}
          </label>
        ))}
      </div>
      <div className="amazon-proof-footer">
        <p>
          This checks completeness, not correctness. Cold proof is honestly marked self-reviewed; only a passed JVM mission is machine-verified.
        </p>
        <Button icon="check" onClick={submitColdProof}>Record cold proof</Button>
      </div>
    </div>
  );
}
