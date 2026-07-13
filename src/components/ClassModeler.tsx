import { useMemo, useState } from "react";
import type { ClassModelSpec, EntityCandidate, MethodCandidate, EdgeCase } from "@/types";
import { color, font, radius, motion } from "@/theme/tokens";
import { Panel, Button, SectionHeader, Eyebrow, Divider } from "./ui";
import { Icon, type IconName } from "./Icon";

/**
 * <ClassModeler /> — the LLD signature interaction. Not tiers-and-load like
 * <StageBuilder />; this is entities, responsibilities, and edge cases —
 * exactly what Amazon's low-level design round actually probes.
 *
 * Three phases, driven entirely by ClassModelSpec data:
 *  1. Entities — pick which nouns from the prompt become classes.
 *  2. Responsibilities — assign each method to the class that owns it.
 *  3. Edge cases — defend the design under "what if" scenarios.
 * Every subsequent phase works off the TRUE model (not the learner's
 * mistakes) so a wrong answer in phase 1 never corrupts phase 2 — same
 * "no shaming" philosophy as <SandboxPractice />.
 */

type Phase = "entities" | "methods" | "edges" | "done";

const PHASE_META: Record<Phase, string> = {
  entities: "which nouns become classes?",
  methods: "assign each method to its class",
  edges: "defend the design under edge cases",
  done: "the finished class model",
};

export function ClassModeler({ design, onComplete }: { design: ClassModelSpec; onComplete?: () => void }) {
  const [phase, setPhase] = useState<Phase>("entities");
  const [entitySel, setEntitySel] = useState<Set<string>>(new Set());
  const [entityChecked, setEntityChecked] = useState(false);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [pickedMethod, setPickedMethod] = useState<string | null>(null);
  const [methodMsg, setMethodMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [edgeIdx, setEdgeIdx] = useState(0);
  const [edgeChoice, setEdgeChoice] = useState<Record<string, string>>({});

  const correctEntities = useMemo(() => design.entities.filter((e) => e.isEntity), [design.entities]);
  const phaseIndex = { entities: 1, methods: 2, edges: 3, done: 3 }[phase];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <SectionHeader eyebrow={`Design it · phase ${phaseIndex} / 3`} tone={color.violet} meta={PHASE_META[phase]} />

      {phase === "entities" && (
        <EntitiesPhase
          candidates={design.entities}
          selected={entitySel}
          checked={entityChecked}
          onToggle={(id) =>
            setEntitySel((s) => {
              const n = new Set(s);
              n.has(id) ? n.delete(id) : n.add(id);
              return n;
            })
          }
          onCheck={() => setEntityChecked(true)}
          onContinue={() => setPhase("methods")}
        />
      )}

      {phase === "methods" && (
        <MethodsPhase
          entities={correctEntities}
          methods={design.methods}
          placed={placed}
          picked={pickedMethod}
          message={methodMsg}
          onPick={(id) => {
            setPickedMethod(id);
            setMethodMsg(null);
          }}
          onAssign={(entityId) => {
            if (!pickedMethod) return;
            const m = design.methods.find((x) => x.id === pickedMethod)!;
            if (m.ownerId === entityId) {
              setPlaced((p) => ({ ...p, [m.id]: entityId }));
              const name = design.entities.find((e) => e.id === entityId)!.name;
              setMethodMsg({ text: `Correct — ${m.signature} belongs to ${name}.`, ok: true });
            } else {
              const correctName = design.entities.find((e) => e.id === m.ownerId)!.name;
              setMethodMsg({ text: `Not quite — ${m.signature} belongs to ${correctName}, not here.`, ok: false });
            }
            setPickedMethod(null);
          }}
          onContinue={() => setPhase("edges")}
        />
      )}

      {phase === "edges" && (
        <EdgesPhase
          edgeCases={design.edgeCases}
          idx={edgeIdx}
          choice={edgeChoice}
          onChoose={(edgeId, optId) => setEdgeChoice((c) => ({ ...c, [edgeId]: optId }))}
          onNext={() => {
            if (edgeIdx < design.edgeCases.length - 1) {
              setEdgeIdx((i) => i + 1);
            } else {
              setPhase("done");
              onComplete?.();
            }
          }}
        />
      )}

      {phase === "done" && <FinalDiagram design={design} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase 1 — Entities
// ---------------------------------------------------------------------------

function EntitiesPhase({
  candidates,
  selected,
  checked,
  onToggle,
  onCheck,
  onContinue,
}: {
  candidates: EntityCandidate[];
  selected: Set<string>;
  checked: boolean;
  onToggle: (id: string) => void;
  onCheck: () => void;
  onContinue: () => void;
}) {
  return (
    <Panel style={{ display: "grid", gap: 16 }}>
      <p style={{ margin: 0, color: color.textDim, fontSize: 13.5 }}>
        Which of these nouns from the prompt should become their own class? Click to select, then check your answer.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
        {candidates.map((c) => {
          const isSel = selected.has(c.id);
          let tone: string = isSel ? color.violet : color.panelBorder;
          let bg = isSel ? "rgba(154,130,212,0.14)" : "rgba(255,255,255,0.02)";
          let icon: IconName | null = null;
          if (checked) {
            if (c.isEntity && isSel) {
              tone = color.green;
              bg = "rgba(130,184,114,0.14)";
              icon = "check";
            } else if (!c.isEntity && isSel) {
              tone = color.red;
              bg = "rgba(208,123,110,0.12)";
              icon = "close";
            } else if (c.isEntity && !isSel) {
              tone = color.amber;
              bg = "rgba(217,169,78,0.1)";
              icon = "target";
            } else {
              tone = color.panelBorder;
              bg = "rgba(255,255,255,0.02)";
            }
          }
          return (
            <button
              key={c.id}
              onClick={() => onToggle(c.id)}
              disabled={checked}
              aria-pressed={isSel}
              style={{
                textAlign: "left",
                border: `1.5px solid ${tone}`,
                background: bg,
                borderRadius: radius.md,
                padding: "12px 12px",
                display: "grid",
                gap: 6,
                cursor: checked ? "default" : "pointer",
                transition: `all ${motion.fast}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 13, color: color.text }}>{c.name}</span>
                {icon && <Icon name={icon} size={14} color={tone} />}
              </div>
              {checked && <span style={{ fontSize: 11.5, color: color.textDim, lineHeight: 1.45 }}>{c.why}</span>}
            </button>
          );
        })}
      </div>
      <div>
        {!checked ? (
          <Button variant="primary" accent={color.violet} onClick={onCheck} disabled={selected.size === 0}>
            Check my answer
          </Button>
        ) : (
          <Button variant="primary" accent={color.violet} iconRight="arrowRight" onClick={onContinue}>
            Continue to responsibilities
          </Button>
        )}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Phase 2 — Responsibilities (methods)
// ---------------------------------------------------------------------------

function MethodsPhase({
  entities,
  methods,
  placed,
  picked,
  message,
  onPick,
  onAssign,
  onContinue,
}: {
  entities: EntityCandidate[];
  methods: MethodCandidate[];
  placed: Record<string, string>;
  picked: string | null;
  message: { text: string; ok: boolean } | null;
  onPick: (id: string) => void;
  onAssign: (entityId: string) => void;
  onContinue: () => void;
}) {
  const pool = methods.filter((m) => !placed[m.id]);
  const allPlaced = pool.length === 0;

  return (
    <Panel style={{ display: "grid", gap: 16 }}>
      <p style={{ margin: 0, color: color.textDim, fontSize: 13.5 }}>
        Pick a method below, then click the class you think owns it.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", minHeight: 34 }}>
        {pool.length === 0 && <span style={{ fontFamily: font.mono, fontSize: 12, color: color.green }}>All methods placed.</span>}
        {pool.map((m) => (
          <button
            key={m.id}
            onClick={() => onPick(m.id)}
            aria-pressed={picked === m.id}
            style={{
              fontFamily: font.mono,
              fontSize: 12,
              padding: "7px 11px",
              borderRadius: radius.md,
              border: `1.5px solid ${picked === m.id ? color.violet : color.panelBorder}`,
              background: picked === m.id ? "rgba(154,130,212,0.16)" : "rgba(255,255,255,0.02)",
              color: color.text,
              transition: `all ${motion.fast}`,
            }}
          >
            {m.signature}
          </button>
        ))}
      </div>

      {message && (
        <div
          role="status"
          style={{
            display: "flex",
            gap: 9,
            alignItems: "flex-start",
            background: message.ok ? "rgba(130,184,114,0.09)" : "rgba(208,123,110,0.09)",
            border: `1px solid ${message.ok ? color.green : color.red}55`,
            borderRadius: radius.md,
            padding: "10px 13px",
          }}
        >
          <Icon name={message.ok ? "check" : "close"} size={14} color={message.ok ? color.green : color.red} />
          <span style={{ fontSize: 13, color: color.text }}>{message.text}</span>
        </div>
      )}

      <Divider />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {entities.map((e) => {
          const assigned = methods.filter((m) => placed[m.id] === e.id);
          return (
            <button
              key={e.id}
              onClick={() => onAssign(e.id)}
              disabled={!picked}
              style={{
                textAlign: "left",
                border: `1.5px solid ${picked ? `${color.violet}aa` : color.panelBorder}`,
                borderRadius: radius.md,
                padding: 12,
                background: "rgba(154,130,212,0.05)",
                display: "grid",
                gap: 8,
                cursor: picked ? "pointer" : "default",
                opacity: picked ? 1 : 0.85,
                transition: `all ${motion.fast}`,
              }}
            >
              <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 13, color: color.violet }}>{e.name}</span>
              <div style={{ display: "grid", gap: 4 }}>
                {assigned.length === 0 && <span style={{ fontSize: 11, color: color.textFaint }}>no methods yet</span>}
                {assigned.map((m) => (
                  <span key={m.id} style={{ fontFamily: font.mono, fontSize: 11, color: color.textDim }}>
                    · {m.signature}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <Button variant="primary" accent={color.violet} iconRight="arrowRight" onClick={onContinue} disabled={!allPlaced}>
          Continue to edge cases
        </Button>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Phase 3 — Edge cases
// ---------------------------------------------------------------------------

function EdgesPhase({
  edgeCases,
  idx,
  choice,
  onChoose,
  onNext,
}: {
  edgeCases: EdgeCase[];
  idx: number;
  choice: Record<string, string>;
  onChoose: (edgeId: string, optId: string) => void;
  onNext: () => void;
}) {
  const ec = edgeCases[idx];
  const chosen = choice[ec.id];

  return (
    <Panel style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Icon name="target" size={16} color={color.amber} />
        <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", color: color.amber }}>
          Edge case {idx + 1} / {edgeCases.length}
        </span>
      </div>
      <p style={{ margin: 0, color: color.text, fontSize: 15 }}>{ec.scenario}</p>
      <div style={{ display: "grid", gap: 8 }}>
        {ec.options.map((o) => {
          const isChosen = chosen === o.id;
          const showResult = !!chosen;
          const tone = showResult ? (o.correct ? color.green : isChosen ? color.red : color.panelBorder) : color.panelBorder;
          const bg = showResult && o.correct ? "rgba(130,184,114,0.08)" : showResult && isChosen ? "rgba(208,123,110,0.08)" : "rgba(255,255,255,0.02)";
          return (
            <div key={o.id}>
              <button
                onClick={() => !chosen && onChoose(ec.id, o.id)}
                disabled={!!chosen}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: `1.5px solid ${tone}`,
                  borderRadius: radius.md,
                  padding: "11px 13px",
                  background: bg,
                  color: color.text,
                  fontSize: 13.5,
                  transition: `all ${motion.fast}`,
                }}
              >
                {o.label}
              </button>
              {showResult && isChosen && (
                <p style={{ margin: "6px 0 0", fontSize: 12.5, color: color.textDim, paddingLeft: 4, lineHeight: 1.5 }}>{o.feedback}</p>
              )}
            </div>
          );
        })}
      </div>
      {chosen && (
        <div>
          <Button variant="primary" accent={color.violet} iconRight="arrowRight" onClick={onNext}>
            {idx < edgeCases.length - 1 ? "Next edge case" : "See the finished design"}
          </Button>
        </div>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Payoff — the finished class diagram (the TRUE model, not learner mistakes)
// ---------------------------------------------------------------------------

function FinalDiagram({ design }: { design: ClassModelSpec }) {
  const entities = design.entities.filter((e) => e.isEntity);
  return (
    <Panel style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Icon name="check" size={17} color={color.green} strokeWidth={2.2} />
        <Eyebrow tone={color.green}>Class model complete</Eyebrow>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
        {entities.map((e) => (
          <div key={e.id} style={{ border: `1.5px solid ${color.violet}55`, borderRadius: radius.md, padding: 12, background: "rgba(154,130,212,0.06)" }}>
            <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 13, color: color.violet }}>{e.name}</span>
            <div style={{ marginTop: 7, display: "grid", gap: 3 }}>
              {design.methods
                .filter((m) => m.ownerId === e.id)
                .map((m) => (
                  <span key={m.id} style={{ fontFamily: font.mono, fontSize: 11, color: color.textDim }}>
                    {m.signature}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
      <Divider />
      <div style={{ display: "grid", gap: 6 }}>
        <Eyebrow>Relationships</Eyebrow>
        {design.relationships.map((r, i) => (
          <span key={i} style={{ fontSize: 13, color: color.text }}>
            · {r}
          </span>
        ))}
      </div>
    </Panel>
  );
}
