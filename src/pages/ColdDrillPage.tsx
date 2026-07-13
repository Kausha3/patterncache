import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getColdDrill } from "@/content/coldDrills";
import { color, font, radius } from "@/theme/tokens";
import { Panel, Button, Eyebrow, Divider, PromptBanner } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ClassCard } from "@/components/ClassModeler";
import { RelationshipDiagram } from "@/components/CodeBlock";

/**
 * The Cold Design Drill workspace — no Watch phase, no chip-picking, no
 * hints. A bare prompt and a blank page: name your own classes, give each
 * one fields and methods in your own words, list the edge cases you'd
 * raise. Only after you commit does a reference design appear, alongside
 * your own attempt, for you to compare yourself — same "commit, then see
 * ground truth" shape as everywhere else in the app, but with nothing
 * auto-graded, because there's no single correct set of class names to
 * pattern-match against.
 */

interface DraftEntity {
  localId: string;
  name: string;
  fields: string[];
  methods: string[];
}

export function ColdDrillPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const drill = id ? getColdDrill(id) : undefined;

  const counter = useRef(0);
  const [entities, setEntities] = useState<DraftEntity[]>([]);
  const [edgeCases, setEdgeCases] = useState<string[]>([]);
  const [newEntityName, setNewEntityName] = useState("");
  const [newEdgeCase, setNewEdgeCase] = useState("");
  const [revealed, setRevealed] = useState(false);

  if (!drill) {
    return (
      <Panel>
        <p style={{ margin: 0, color: color.textDim }}>Drill not found.</p>
      </Panel>
    );
  }

  const addEntity = () => {
    const name = newEntityName.trim();
    if (!name) return;
    setEntities((es) => [...es, { localId: `e${counter.current++}`, name, fields: [], methods: [] }]);
    setNewEntityName("");
  };
  const removeEntity = (localId: string) => setEntities((es) => es.filter((e) => e.localId !== localId));
  const addField = (localId: string, text: string) =>
    setEntities((es) => es.map((e) => (e.localId === localId ? { ...e, fields: [...e.fields, text] } : e)));
  const removeField = (localId: string, i: number) =>
    setEntities((es) => es.map((e) => (e.localId === localId ? { ...e, fields: e.fields.filter((_, x) => x !== i) } : e)));
  const addMethod = (localId: string, text: string) =>
    setEntities((es) => es.map((e) => (e.localId === localId ? { ...e, methods: [...e.methods, text] } : e)));
  const removeMethod = (localId: string, i: number) =>
    setEntities((es) => es.map((e) => (e.localId === localId ? { ...e, methods: e.methods.filter((_, x) => x !== i) } : e)));

  const addEdgeCase = () => {
    const text = newEdgeCase.trim();
    if (!text) return;
    setEdgeCases((ecs) => [...ecs, text]);
    setNewEdgeCase("");
  };
  const removeEdgeCase = (i: number) => setEdgeCases((ecs) => ecs.filter((_, x) => x !== i));

  const referenceEntities = drill.reference.entities.filter((e) => e.isEntity);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <button
          onClick={() => navigate("/drill")}
          style={{ display: "flex", alignItems: "center", gap: 6, color: color.textDim, fontSize: 13, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 12 }}
        >
          <Icon name="arrowLeft" size={14} /> All drills
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>{drill.title}</h1>
      </div>

      <PromptBanner prompt={drill.prompt} tone={color.violet} />

      {!revealed ? (
        <div style={{ display: "grid", gap: 20 }}>
          <Panel style={{ display: "grid", gap: 14 }}>
            <Eyebrow tone={color.violet}>Your classes — name one, then add its fields and methods</Eyebrow>
            <TextAddRow placeholder="class name, e.g. Order" value={newEntityName} onChange={setNewEntityName} onAdd={addEntity} big />
            {entities.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
                {entities.map((e) => (
                  <DraftEntityCard
                    key={e.localId}
                    entity={e}
                    onRemove={() => removeEntity(e.localId)}
                    onAddField={(t) => addField(e.localId, t)}
                    onRemoveField={(i) => removeField(e.localId, i)}
                    onAddMethod={(t) => addMethod(e.localId, t)}
                    onRemoveMethod={(i) => removeMethod(e.localId, i)}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel style={{ display: "grid", gap: 10 }}>
            <Eyebrow tone={color.amber}>Edge cases you'd raise</Eyebrow>
            {edgeCases.map((ec, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 13, color: color.text }}>{ec}</span>
                <button onClick={() => removeEdgeCase(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }} aria-label="Remove">
                  <Icon name="close" size={12} color={color.textFaint} />
                </button>
              </div>
            ))}
            <TextAddRow placeholder="edge case, e.g. what if two requests race for the same resource?" value={newEdgeCase} onChange={setNewEdgeCase} onAdd={addEdgeCase} />
          </Panel>

          <div>
            <Button variant="primary" accent={color.violet} disabled={entities.length === 0} onClick={() => setRevealed(true)}>
              Compare against a reference design
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 22 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <Eyebrow>Your attempt</Eyebrow>
            {entities.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: color.textFaint, fontStyle: "italic" }}>No classes.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
                {entities.map((e) => (
                  <DraftCardReadonly key={e.localId} entity={e} />
                ))}
              </div>
            )}
            {edgeCases.length > 0 && (
              <div style={{ display: "grid", gap: 4, marginTop: 4 }}>
                {edgeCases.map((ec, i) => (
                  <p key={i} style={{ margin: 0, fontSize: 13, color: color.textDim }}>
                    · {ec}
                  </p>
                ))}
              </div>
            )}
          </div>

          <Divider />

          <div style={{ display: "grid", gap: 14 }}>
            <Eyebrow tone={color.violet}>Reference design</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
              {referenceEntities.map((e) => (
                <ClassCard key={e.id} entity={e} properties={e.properties ?? []} methods={drill.reference.methods.filter((m) => m.ownerId === e.id)} />
              ))}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <Eyebrow>Relationships</Eyebrow>
              <RelationshipDiagram relationships={drill.reference.relationships} entityNames={referenceEntities.map((e) => e.name)} />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <Eyebrow tone={color.amber}>Edge cases</Eyebrow>
              {drill.reference.edgeCases.map((ec, i) => (
                <div key={i} style={{ display: "grid", gap: 3 }}>
                  <span style={{ fontSize: 13, color: color.text, fontWeight: 600 }}>{ec.scenario}</span>
                  <span style={{ fontSize: 12.5, color: color.textDim, lineHeight: 1.55 }}>{ec.handling}</span>
                </div>
              ))}
            </div>

            {drill.reference.tradeoffs && drill.reference.tradeoffs.length > 0 && (
              <div style={{ display: "grid", gap: 10 }}>
                <Eyebrow tone={color.amber}>Design trade-offs</Eyebrow>
                {drill.reference.tradeoffs.map((t, i) => (
                  <div key={i} style={{ display: "grid", gap: 3 }}>
                    <span style={{ fontSize: 13, color: color.text, fontWeight: 600 }}>{t.decision}</span>
                    <span style={{ fontSize: 12.5, color: color.textDim, lineHeight: 1.55 }}>{t.reasoning}</span>
                  </div>
                ))}
              </div>
            )}

            {drill.reference.principles && drill.reference.principles.length > 0 && (
              <div style={{ display: "grid", gap: 10 }}>
                <Eyebrow tone={color.blue}>Design principles at play</Eyebrow>
                {drill.reference.principles.map((p, i) => (
                  <div key={i} style={{ display: "grid", gap: 3 }}>
                    <span style={{ fontSize: 13, color: color.blue, fontWeight: 700, fontFamily: font.mono }}>{p.name}</span>
                    <span style={{ fontSize: 12.5, color: color.textDim, lineHeight: 1.55 }}>{p.explanation}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Button variant="subtle" onClick={() => navigate("/drill")}>
              Back to all drills
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TextAddRow({
  placeholder,
  value,
  onChange,
  onAdd,
  big,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  big?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        style={{
          flex: 1,
          fontFamily: font.mono,
          fontSize: big ? 13.5 : 12.5,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${color.hairline}`,
          borderRadius: radius.sm,
          padding: big ? "9px 12px" : "6px 9px",
          color: color.text,
          outline: "none",
        }}
      />
      <Button variant="subtle" icon="plus" onClick={onAdd} aria-label="Add" />
    </div>
  );
}

function DraftEntityCard({
  entity,
  onRemove,
  onAddField,
  onRemoveField,
  onAddMethod,
  onRemoveMethod,
}: {
  entity: DraftEntity;
  onRemove: () => void;
  onAddField: (text: string) => void;
  onRemoveField: (i: number) => void;
  onAddMethod: (text: string) => void;
  onRemoveMethod: (i: number) => void;
}) {
  const [fieldText, setFieldText] = useState("");
  const [methodText, setMethodText] = useState("");

  return (
    <div style={{ border: `1.5px solid ${color.violet}55`, borderRadius: radius.md, overflow: "hidden", background: "rgba(154,130,212,0.06)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          padding: "8px 10px",
          background: "rgba(154,130,212,0.1)",
          borderBottom: `1px solid ${color.violet}33`,
        }}
      >
        <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 13, color: color.violet }}>{entity.name}</span>
        <button onClick={onRemove} aria-label={`Remove ${entity.name}`} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
          <Icon name="close" size={12} color={color.textFaint} />
        </button>
      </div>
      <div style={{ padding: "10px 12px", display: "grid", gap: 6 }}>
        {entity.fields.map((f, i) => (
          <MemberRow key={i} text={f} onRemove={() => onRemoveField(i)} />
        ))}
        <MiniAddRow
          placeholder="field, e.g. isOccupied: boolean"
          value={fieldText}
          onChange={setFieldText}
          onAdd={() => {
            if (fieldText.trim()) {
              onAddField(fieldText.trim());
              setFieldText("");
            }
          }}
        />
        {(entity.fields.length > 0 || entity.methods.length > 0) && <div style={{ height: 1, background: color.hairline, margin: "2px 0" }} />}
        {entity.methods.map((m, i) => (
          <MemberRow key={i} text={m} onRemove={() => onRemoveMethod(i)} muted />
        ))}
        <MiniAddRow
          placeholder="method, e.g. assignVehicle(v): void"
          value={methodText}
          onChange={setMethodText}
          onAdd={() => {
            if (methodText.trim()) {
              onAddMethod(methodText.trim());
              setMethodText("");
            }
          }}
        />
      </div>
    </div>
  );
}

function MemberRow({ text, onRemove, muted }: { text: string; onRemove: () => void; muted?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
      <span style={{ fontFamily: font.mono, fontSize: 11.5, color: muted ? color.text : color.textDim }}>{text}</span>
      <button onClick={onRemove} aria-label="Remove" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
        <Icon name="close" size={10} color={color.textFaint} />
      </button>
    </div>
  );
}

function MiniAddRow({ placeholder, value, onChange, onAdd }: { placeholder: string; value: string; onChange: (v: string) => void; onAdd: () => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: font.mono,
          fontSize: 11,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${color.hairline}`,
          borderRadius: radius.sm,
          padding: "5px 7px",
          color: color.text,
          outline: "none",
        }}
      />
      <button
        onClick={onAdd}
        aria-label="Add"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          flexShrink: 0,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${color.hairline}`,
          borderRadius: radius.sm,
          cursor: "pointer",
        }}
      >
        <Icon name="plus" size={11} color={color.textDim} />
      </button>
    </div>
  );
}

function DraftCardReadonly({ entity }: { entity: DraftEntity }) {
  return (
    <div style={{ border: `1.5px solid ${color.panelBorder}`, borderRadius: radius.md, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
      <div style={{ padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${color.hairline}` }}>
        <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 13, color: color.text }}>{entity.name}</span>
      </div>
      <div style={{ padding: "10px 12px", display: "grid", gap: 3 }}>
        {entity.fields.length === 0 && entity.methods.length === 0 && (
          <span style={{ fontSize: 11, color: color.textFaint, fontStyle: "italic" }}>no members</span>
        )}
        {entity.fields.map((f, i) => (
          <span key={i} style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>
            {f}
          </span>
        ))}
        {entity.fields.length > 0 && entity.methods.length > 0 && <div style={{ height: 1, background: color.hairline, margin: "2px 0" }} />}
        {entity.methods.map((m, i) => (
          <span key={i} style={{ fontFamily: font.mono, fontSize: 11, color: color.textDim }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
