import { useState } from "react";
import type { ReactNode } from "react";
import type { ClassModelSpec } from "@/types";
import { color, font, radius, motion } from "@/theme/tokens";
import { Icon } from "./Icon";

/**
 * Generates a TS-flavored class-code snippet from a finished class model —
 * the literal artifact a candidate could reference or actually recite in an
 * interview, not just a text description of it.
 */
export function generateClassCode(design: ClassModelSpec): string {
  const entities = design.entities.filter((e) => e.isEntity);
  const relComment = design.relationships.map((r) => `// ${r}`).join("\n");
  const classes = entities
    .map((e) => {
      const props = e.properties ?? [];
      const methods = design.methods.filter((m) => m.ownerId === e.id);
      const propLines = props.map((p) => `  ${p.name}: ${p.type}`);
      const methodLines = methods.map((m) => `  ${m.signature}`);
      const parts: string[] = [];
      if (propLines.length) parts.push(propLines.join("\n"));
      if (methodLines.length) parts.push(methodLines.join("\n"));
      const body = parts.length ? parts.join("\n\n") : "  // no members — identity only";
      return `class ${e.name} {\n${body}\n}`;
    })
    .join("\n\n");
  return `${relComment}\n\n${classes}`;
}

/** A code block with light syntax coloring and a copy button — no syntax
 * highlighting library, just per-line pattern matching, which is plenty for
 * the class-skeleton shape this always renders. */
export function CodeBlock({ code, label = "Code" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable in this context — button just won't confirm */
    }
  };

  return (
    <div style={{ background: "#15171C", border: `1px solid ${color.hairline}`, borderRadius: radius.md, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${color.hairline}` }}>
        <span style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: color.textFaint }}>
          {label}
        </span>
        <button
          onClick={copy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: font.mono,
            fontSize: 10.5,
            fontWeight: 700,
            color: copied ? color.green : color.textDim,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${copied ? color.green : color.panelBorder}`,
            borderRadius: radius.sm,
            padding: "4px 9px",
            transition: `all ${motion.fast}`,
          }}
        >
          <Icon name={copied ? "check" : "layers"} size={12} strokeWidth={2.2} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", overflowX: "auto", fontFamily: font.mono, fontSize: 12.5, lineHeight: 1.7 }}>
        {lines.map((line, i) => (
          <CodeLine key={i} line={line} />
        ))}
      </pre>
    </div>
  );
}

function CodeLine({ line }: { line: string }) {
  if (line === "") return <div>&nbsp;</div>;

  const trimmed = line.trimStart();
  const indent = line.slice(0, line.length - trimmed.length);

  if (trimmed.startsWith("//")) {
    return <div style={{ color: color.textFaint, fontStyle: "italic" }}>{indent}{trimmed}</div>;
  }

  const classMatch = trimmed.match(/^class (\w+) \{$/);
  if (classMatch) {
    return (
      <div>
        {indent}
        <span style={{ color: color.violet, fontWeight: 700 }}>class</span>{" "}
        <span style={{ color: color.text, fontWeight: 700 }}>{classMatch[1]}</span>{" "}
        <span style={{ color: color.textFaint }}>{"{"}</span>
      </div>
    );
  }

  if (trimmed === "}") {
    return <div style={{ color: color.textFaint }}>{indent}{"}"}</div>;
  }

  const methodMatch = trimmed.match(/^([A-Za-z_]\w*)(\([^)]*\))(:\s*.+)?$/);
  if (methodMatch) {
    const [, name, args, ret] = methodMatch;
    return (
      <div>
        {indent}
        <span style={{ color: color.blue }}>{name}</span>
        <span style={{ color: color.textDim }}>{args}</span>
        {ret && <span style={{ color: color.amber }}>{ret}</span>}
      </div>
    );
  }

  // A property/field line: "name: Type" — no parens, unlike a method.
  const fieldMatch = trimmed.match(/^([A-Za-z_]\w*):\s*(.+)$/);
  if (fieldMatch) {
    const [, name, type] = fieldMatch;
    return (
      <div>
        {indent}
        <span style={{ color: color.text }}>{name}</span>
        <span style={{ color: color.textFaint }}>: </span>
        <span style={{ color: color.amber }}>{type}</span>
      </div>
    );
  }

  return <div style={{ color: color.textDim }}>{line}</div>;
}

// ---------------------------------------------------------------------------
// Relationship diagram — highlights entity names as pills instead of a plain
// bullet list, so it reads as a small graph you could point at in an interview.
// ---------------------------------------------------------------------------

export function RelationshipDiagram({ relationships, entityNames }: { relationships: string[]; entityNames: string[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {relationships.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13, color: color.text, lineHeight: 1.7 }}>
          <Icon name="chevronRight" size={13} color={color.violet} />
          <span>{renderRelationshipText(r, entityNames)}</span>
        </div>
      ))}
    </div>
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderRelationshipText(text: string, entityNames: string[]): ReactNode[] {
  if (entityNames.length === 0) return [text];
  // Longest names first so e.g. "ParkingSpot" doesn't get shadowed by a
  // shorter overlapping name; `s?\b` absorbs a trailing plural into the same
  // pill (so "Levels" reads as one token, not "Level" + a stray "s").
  const sorted = [...entityNames].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sorted.map((n) => `${escapeRegex(n)}s?\\b`).join("|")})`, "g");
  const parts = text.split(pattern);
  const isEntityToken = (part: string) => entityNames.some((n) => part === n || part === `${n}s`);
  return parts.map((part, i) =>
    isEntityToken(part) ? (
      <span
        key={i}
        style={{
          fontFamily: font.mono,
          fontSize: 12,
          fontWeight: 700,
          color: color.violet,
          background: "rgba(154,130,212,0.14)",
          border: `1px solid ${color.violet}55`,
          borderRadius: radius.sm,
          padding: "1px 6px",
        }}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
