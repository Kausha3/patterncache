import { lazy, Suspense, useMemo, useState } from "react";
import type { ClassModelSpec, EntityCandidate, MethodCandidate, EdgeCase, PropertyDef, TraceStep } from "@/types";
import { color, font, radius, motion } from "@/theme/tokens";
import { Panel, Button, SectionHeader, Eyebrow, Divider, PromptBanner } from "./ui";
import { Icon } from "./Icon";
import { QuickCheckBadge } from "./QuickCheckBadge";
import { TraceVisualizer } from "./TraceVisualizer";
import { CodeBlock, RelationshipDiagram } from "./CodeBlock";
import { generateClassCode } from "./generateClassCode";

// CodeMirror + a language grammar are heavy — lazy-load so DSA/SD lessons
// (which never touch this) don't pay for it on first load.
const CodeExerciseBlock = lazy(() => import("./CodeExerciseBlock"));

/**
 * <ClassModeler /> — the LLD signature interaction. Not tiers-and-load like
 * <StageBuilder />; this is entities, responsibilities, and edge cases —
 * exactly what a low-level design round actually probes.
 *
 * Three phases, driven entirely by ClassModelSpec data:
 *  1. Watch it get designed — a real reasoning TRACE (reuses <TraceVisualizer/>,
 *     same shell as the DSA algorithm traces): step through WHY each class was
 *     accepted or rejected, why each field exists, and how classes relate —
 *     the diagram builds itself while it narrates. Fully derived from the
 *     lesson's own data; no separate content to author.
 *  2. Now you design it — one method at a time. You commit to an owner AND a
 *     reason before the reveal, then see the real justification — not a
 *     right/wrong banner. This replaced a grid "sort the chip into a bucket"
 *     matching-game mechanic that tested guessing, not reasoning.
 *  3. Edge cases — defend the design under "what if" scenarios.
 * Every phase works off the TRUE model (not the learner's picks), so a wrong
 * answer never corrupts what comes after — same "no shaming" philosophy as
 * <SandboxPractice />.
 */

type Phase = "watch" | "practice" | "edges" | "done";

const PHASE_META: Record<Phase, string> = {
  watch: "watch the class model come together",
  practice: "place each method, with your reasoning",
  edges: "defend the design under edge cases",
  done: "the finished class model",
};

export function ClassModeler({ design, prompt, onComplete, exerciseContext }: { design: ClassModelSpec; prompt?: string; onComplete?: () => void; exerciseContext?: { lessonId: string; lessonTitle: string } }) {
  const [phase, setPhase] = useState<Phase>("watch");
  const [watchDone, setWatchDone] = useState(false);

  const [practiceOrder] = useState(() => shuffle(design.methods.map((m) => m.id)));
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [placedIds, setPlacedIds] = useState<Set<string>>(new Set());
  const [typedClass, setTypedClass] = useState("");
  const [pickedReason, setPickedReason] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const [edgeIdx, setEdgeIdx] = useState(0);
  const [edgeChoice, setEdgeChoice] = useState<Record<string, string>>({});

  const correctEntities = useMemo(() => design.entities.filter((e) => e.isEntity), [design.entities]);
  const reasoningSteps = useMemo(() => buildReasoningSteps(design), [design]);
  const phaseIndex = { watch: 1, practice: 2, edges: 3, done: 3 }[phase];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {prompt && <PromptBanner prompt={prompt} tone={color.violet} />}
      <SectionHeader eyebrow={`Design it · phase ${phaseIndex} / 3`} tone={color.violet} meta={PHASE_META[phase]} />

      {phase === "watch" && (
        <div style={{ display: "grid", gap: 14 }}>
          <TraceVisualizer
            steps={reasoningSteps}
            renderStep={(step) => <ReasoningStepView step={step as TraceStep<DiagramState>} />}
            goal="How the class model comes together, one decision at a time"
            eyebrow="Watch it get designed"
            accent={color.violet}
            onComplete={() => setWatchDone(true)}
          />
          {watchDone && (
            <div>
              <Button variant="primary" accent={color.violet} iconRight="arrowRight" onClick={() => setPhase("practice")}>
                Now you design it, place the methods
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "practice" && (
        <PracticePhase
          entities={correctEntities}
          allMethods={design.methods}
          exerciseContext={exerciseContext}
          order={practiceOrder}
          idx={practiceIdx}
          placedIds={placedIds}
          typedClass={typedClass}
          pickedReason={pickedReason}
          revealed={revealed}
          onTypeClass={setTypedClass}
          onPickReason={setPickedReason}
          onReveal={() => {
            setRevealed(true);
            setPlacedIds((s) => new Set(s).add(practiceOrder[practiceIdx]));
          }}
          onNext={() => {
            if (practiceIdx < practiceOrder.length - 1) {
              setPracticeIdx((i) => i + 1);
              setTypedClass("");
              setPickedReason(null);
              setRevealed(false);
            } else {
              setPhase("edges");
            }
          }}
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Shared: a class card — used by the Watch trace, Practice's growing diagram,
// and the reasoning behind both.
// ---------------------------------------------------------------------------

export function ClassCard({
  entity,
  properties,
  methods,
  highlighted,
}: {
  entity: EntityCandidate;
  properties: PropertyDef[];
  methods: MethodCandidate[];
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        border: `1.5px solid ${highlighted ? color.teal : `${color.violet}55`}`,
        boxShadow: highlighted ? `0 0 0 3px ${color.teal}22` : undefined,
        borderRadius: radius.md,
        overflow: "hidden",
        background: "rgba(154,130,212,0.06)",
        transition: `all ${motion.step}`,
        animation: `pc-enter 280ms ${motion.enter}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: "rgba(154,130,212,0.1)", borderBottom: `1px solid ${color.violet}33` }}>
        <Icon name="layers" size={12} color={color.violet} />
        <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 12.5, color: color.violet }}>{entity.name}</span>
      </div>
      <div style={{ padding: "8px 10px", display: "grid", gap: 3 }}>
        {properties.length === 0 && methods.length === 0 && (
          <span style={{ fontSize: 10.5, color: color.textFaint, fontStyle: "italic" }}>no members yet</span>
        )}
        {properties.map((p) => (
          <span key={p.name} style={{ fontFamily: font.mono, fontSize: 10.5, color: color.textFaint }}>
            {p.name}: <span style={{ color: color.amber }}>{p.type}</span>
          </span>
        ))}
        {properties.length > 0 && methods.length > 0 && <div style={{ height: 1, background: color.hairline, margin: "2px 0" }} />}
        {methods.map((m) => (
          <span key={m.id} style={{ fontFamily: font.mono, fontSize: 10.5, color: color.textDim }}>
            {m.signature}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase 1 — Watch it get designed (a real reasoning trace)
// ---------------------------------------------------------------------------

interface DiagramState {
  design: ClassModelSpec;
  revealedEntities: string[];
  propertyCounts: Record<string, number>;
  highlightEntityIds: string[];
}

/** Derives a full reasoning trace from the lesson's own ClassModelSpec — no
 * separate content to author. Order: accept/reject each candidate noun, then
 * reveal each accepted class's fields, then draw each relationship. Methods
 * are deliberately left for the Practice phase — structure first, then the
 * behavior the learner actively places. */
function buildReasoningSteps(design: ClassModelSpec): TraceStep<DiagramState>[] {
  const steps: TraceStep<DiagramState>[] = [];
  const revealedEntities: string[] = [];
  const propertyCounts: Record<string, number> = {};

  const snapshot = (highlightEntityIds: string[]): DiagramState => ({
    design,
    revealedEntities: [...revealedEntities],
    propertyCounts: { ...propertyCounts },
    highlightEntityIds,
  });

  for (const e of design.entities) {
    if (e.isEntity) {
      revealedEntities.push(e.id);
      propertyCounts[e.id] = 0;
      steps.push({ state: snapshot([e.id]), explanation: `${e.name}: ${e.why}`, tag: "class", milestone: true });
    } else {
      steps.push({ state: snapshot([]), explanation: `${e.name}: ${e.why}`, tag: "not a class" });
    }
  }

  for (const eid of [...revealedEntities]) {
    const entity = design.entities.find((x) => x.id === eid)!;
    for (const p of entity.properties ?? []) {
      propertyCounts[eid] = (propertyCounts[eid] ?? 0) + 1;
      steps.push({ state: snapshot([eid]), explanation: `${entity.name} needs ${p.name}: ${p.type}.`, tag: "field" });
    }
  }

  for (const r of design.relationships) {
    const mentioned = design.entities.filter((e) => e.isEntity && r.includes(e.name)).map((e) => e.id);
    steps.push({ state: snapshot(mentioned), explanation: r, tag: "relationship" });
  }

  if (steps.length === 0) {
    steps.push({ state: snapshot([]), explanation: "No candidates to evaluate." });
  }

  return steps;
}

function ReasoningStepView({ step }: { step: TraceStep<DiagramState> }) {
  const s = step.state;
  const entities = s.design.entities.filter((e) => s.revealedEntities.includes(e.id));
  if (entities.length === 0) {
    return <p style={{ margin: 0, color: color.textFaint, fontSize: 13, fontStyle: "italic" }}>No classes identified yet.</p>;
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <span style={{ fontFamily: font.mono, fontSize: 10.5, color: color.textFaint }}>
        {entities.length} class{entities.length === 1 ? "" : "es"} so far
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
        {entities.map((e) => (
          <ClassCard
            key={e.id}
            entity={e}
            properties={(e.properties ?? []).slice(0, s.propertyCounts[e.id] ?? 0)}
            methods={[]}
            highlighted={s.highlightEntityIds.includes(e.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase 2 — Now you design it (justify, then reveal — not a matching game)
// ---------------------------------------------------------------------------

const REASON_TAGS = [
  { id: "data", label: "Owns the data it touches" },
  { id: "behavior", label: "Owns this responsibility" },
  { id: "role", label: "Matches its real-world role" },
  { id: "guess", label: "Not sure, best guess" },
];

function normalizeClassName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

function PracticePhase({
  entities,
  allMethods,
  exerciseContext,
  order,
  idx,
  placedIds,
  typedClass,
  pickedReason,
  revealed,
  onTypeClass,
  onPickReason,
  onReveal,
  onNext,
}: {
  entities: EntityCandidate[];
  allMethods: MethodCandidate[];
  exerciseContext?: { lessonId: string; lessonTitle: string };
  order: string[];
  idx: number;
  placedIds: Set<string>;
  typedClass: string;
  pickedReason: string | null;
  revealed: boolean;
  onTypeClass: (text: string) => void;
  onPickReason: (id: string) => void;
  onReveal: () => void;
  onNext: () => void;
}) {
  const method = allMethods.find((m) => m.id === order[idx])!;
  const owner = entities.find((e) => e.id === method.ownerId)!;
  // With only one real class on the board there's nothing to recall — the
  // card is already the only option visible. Typing its name back would just
  // test copying, not design reasoning, so skip straight to "why."
  const singleEntity = entities.length === 1;
  const isCorrect = singleEntity || normalizeClassName(typedClass) === normalizeClassName(owner.name);
  const canReveal = (singleEntity || typedClass.trim().length > 0) && !!pickedReason;
  const isLast = idx === order.length - 1;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* The diagram, growing as methods are placed */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
        {entities.map((e) => (
          <ClassCard
            key={e.id}
            entity={e}
            properties={e.properties ?? []}
            methods={allMethods.filter((m) => placedIds.has(m.id) && m.ownerId === e.id)}
            highlighted={revealed && e.id === method.ownerId}
          />
        ))}
      </div>

      <Panel style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <Eyebrow tone={color.violet}>
            Method {idx + 1} / {order.length}
          </Eyebrow>
          <QuickCheckBadge />
        </div>

        <InlineSignature signature={method.signature} />

        {singleEntity ? (
          <div style={{ display: "grid", gap: 8 }}>
            <Eyebrow>Where does this belong?</Eyebrow>
            <div
              style={{
                fontFamily: font.mono,
                fontSize: 14,
                fontWeight: 600,
                padding: "10px 13px",
                borderRadius: radius.md,
                border: `1.5px solid ${color.violet}66`,
                background: "rgba(154,130,212,0.08)",
                color: color.text,
              }}
            >
              {owner.name} is the only class here so far
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <Eyebrow>Where does this belong? Name the class. No list to pick from.</Eyebrow>
            <input
              value={typedClass}
              onChange={(e) => !revealed && onTypeClass(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canReveal && !revealed) {
                  e.preventDefault();
                  onReveal();
                }
              }}
              disabled={revealed}
              placeholder="type the class name, e.g. ParkingSpot"
              style={{
                fontFamily: font.mono,
                fontSize: 14,
                fontWeight: 600,
                padding: "10px 13px",
                borderRadius: radius.md,
                border: `1.5px solid ${revealed ? (isCorrect ? color.green : color.red) : color.panelBorder}`,
                background: revealed ? (isCorrect ? "rgba(130,184,114,0.1)" : "rgba(208,123,110,0.08)") : "rgba(255,255,255,0.02)",
                color: color.text,
                outline: "none",
                transition: `all ${motion.fast}`,
              }}
            />
          </div>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          <Eyebrow>Why do you think so?</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {REASON_TAGS.map((tag) => {
              const isPicked = pickedReason === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => !revealed && onPickReason(tag.id)}
                  disabled={revealed}
                  aria-pressed={isPicked}
                  style={{
                    fontFamily: font.mono,
                    fontSize: 12,
                    padding: "7px 12px",
                    borderRadius: radius.pill,
                    border: `1.5px solid ${isPicked ? color.blue : color.panelBorder}`,
                    background: isPicked ? "rgba(106,166,219,0.14)" : "rgba(255,255,255,0.02)",
                    color: isPicked ? color.text : color.textDim,
                    transition: `all ${motion.fast}`,
                  }}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {!revealed ? (
          <div>
            <Button variant="primary" accent={color.violet} onClick={onReveal} disabled={!canReveal}>
              Reveal
            </Button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div
              role="status"
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                background: isCorrect ? "rgba(130,184,114,0.09)" : "rgba(208,123,110,0.09)",
                border: `1px solid ${isCorrect ? color.green : color.red}55`,
                borderRadius: radius.md,
                padding: "12px 14px",
              }}
            >
              <Icon name={isCorrect ? "check" : "close"} size={16} color={isCorrect ? color.green : color.red} />
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 13, color: color.text, fontWeight: 600 }}>
                  {isCorrect ? "Right, it belongs on " : `You wrote "${typedClass.trim()}", but it actually belongs on `}
                  {owner.name}
                </span>
                <span style={{ fontSize: 13, color: color.textDim, lineHeight: 1.55 }}>
                  {method.justification ?? `${owner.name} is the class that actually owns the data and state this method touches.`}
                </span>
              </div>
            </div>
            {method.codeExercise && (
              <Suspense fallback={<p style={{ margin: 0, fontSize: 12, color: color.textFaint }}>Loading editor…</p>}>
                <CodeExerciseBlock
                  key={method.id}
                  exercise={method.codeExercise}
                  exerciseId={exerciseContext ? `${exerciseContext.lessonId}:${method.id}` : undefined}
                  exerciseLabel={exerciseContext ? `${method.signature} \u00b7 ${exerciseContext.lessonTitle}` : undefined}
                />
              </Suspense>
            )}
            <div>
              <Button variant="primary" accent={color.violet} iconRight="arrowRight" onClick={onNext}>
                {isLast ? "Continue to edge cases" : "Next method"}
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function InlineSignature({ signature }: { signature: string }) {
  return (
    <div
      style={{
        fontFamily: font.mono,
        fontSize: 16,
        fontWeight: 700,
        color: color.text,
        background: "#15171C",
        border: `1px solid ${color.hairline}`,
        borderRadius: radius.md,
        padding: "12px 14px",
      }}
    >
      {signature}
    </div>
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
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <Icon name="target" size={16} color={color.amber} />
        <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", color: color.amber }}>
          Edge case {idx + 1} / {edgeCases.length}
        </span>
        <span style={{ marginLeft: "auto" }}><QuickCheckBadge /></span>
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
  const code = useMemo(() => generateClassCode(design), [design]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="check" size={17} color={color.green} strokeWidth={2.2} />
          <Eyebrow tone={color.green}>Class model complete</Eyebrow>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
          {entities.map((e) => (
            <div
              key={e.id}
              style={{
                border: `1.5px solid ${color.violet}55`,
                borderRadius: radius.md,
                overflow: "hidden",
                background: "rgba(154,130,212,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: "rgba(154,130,212,0.1)", borderBottom: `1px solid ${color.violet}33` }}>
                <Icon name="layers" size={13} color={color.violet} />
                <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 13, color: color.violet }}>{e.name}</span>
              </div>
              <div style={{ padding: "10px 12px", display: "grid", gap: 8 }}>
                {(e.properties?.length ?? 0) === 0 && design.methods.filter((m) => m.ownerId === e.id).length === 0 && (
                  <span style={{ fontSize: 11, color: color.textFaint, fontStyle: "italic" }}>identity only</span>
                )}
                {(e.properties?.length ?? 0) > 0 && (
                  <div style={{ display: "grid", gap: 3 }}>
                    {e.properties!.map((p) => (
                      <span key={p.name} style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>
                        {p.name}: <span style={{ color: color.amber }}>{p.type}</span>
                      </span>
                    ))}
                  </div>
                )}
                {(e.properties?.length ?? 0) > 0 && design.methods.filter((m) => m.ownerId === e.id).length > 0 && (
                  <div style={{ height: 1, background: color.hairline }} />
                )}
                <div style={{ display: "grid", gap: 3 }}>
                  {design.methods
                    .filter((m) => m.ownerId === e.id)
                    .map((m) => (
                      <span key={m.id} style={{ fontFamily: font.mono, fontSize: 11, color: color.textDim }}>
                        {m.signature}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Divider />
        <div style={{ display: "grid", gap: 8 }}>
          <Eyebrow>Relationships</Eyebrow>
          <RelationshipDiagram relationships={design.relationships} entityNames={entities.map((e) => e.name)} />
        </div>
        {design.tradeoffs && design.tradeoffs.length > 0 && (
          <>
            <Divider />
            <div style={{ display: "grid", gap: 10 }}>
              <Eyebrow tone={color.amber}>Design trade-offs</Eyebrow>
              {design.tradeoffs.map((t, i) => (
                <div key={i} style={{ display: "grid", gap: 3 }}>
                  <span style={{ fontSize: 13, color: color.text, fontWeight: 600 }}>{t.decision}</span>
                  <span style={{ fontSize: 12.5, color: color.textDim, lineHeight: 1.55 }}>{t.reasoning}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {design.principles && design.principles.length > 0 && (
          <>
            <Divider />
            <div style={{ display: "grid", gap: 10 }}>
              <Eyebrow tone={color.blue}>Design principles at play</Eyebrow>
              {design.principles.map((p, i) => (
                <div key={i} style={{ display: "grid", gap: 3 }}>
                  <span style={{ fontSize: 13, color: color.blue, fontWeight: 700, fontFamily: font.mono }}>{p.name}</span>
                  <span style={{ fontSize: 12.5, color: color.textDim, lineHeight: 1.55 }}>{p.explanation}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>

      <div style={{ display: "grid", gap: 8 }}>
        <Eyebrow tone={color.violet}>Take this into the interview</Eyebrow>
        <CodeBlock code={code} label="Class skeleton" />
      </div>
    </div>
  );
}
