import { useState } from "react";
import { GLOSSARY } from "@/content/glossary";
import { color, font, radius, motion } from "@/theme/tokens";
import { Icon } from "./Icon";

/**
 * Collapsible plain-English glossary for a lesson. Lowers the floor for a
 * beginner without dumbing down the lesson body — the jargon is one tap away.
 */
export function Glossary({ terms }: { terms?: string[] }) {
  const [open, setOpen] = useState(false);
  if (!terms || terms.length === 0) return null;
  const items = terms.map((k) => GLOSSARY[k]).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <div style={{ background: color.panel, border: `1px solid ${color.panelBorder}`, borderRadius: radius.lg, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "none",
          border: "none",
          padding: "14px 18px",
          textAlign: "left",
        }}
      >
        <span style={{ color: color.blue, display: "grid", placeItems: "center", transform: open ? "rotate(90deg)" : "none", transition: `transform ${motion.fast}` }}>
          <Icon name="chevronRight" size={15} />
        </span>
        <span style={{ fontFamily: font.mono, fontSize: 12.5, fontWeight: 700, color: color.text }}>New to the jargon?</span>
        <span style={{ fontSize: 12.5, color: color.textFaint }}>Plain-English key terms for this lesson</span>
      </button>

      {open && (
        <div style={{ padding: "2px 18px 18px", display: "grid", gap: 12, animation: `pc-fade 180ms ${motion.enter}` }}>
          {items.map((it) => (
            <div key={it.term} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 14, alignItems: "start" }}>
              <span style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 700, color: color.blue }}>{it.term}</span>
              <span style={{ color: color.textDim, fontSize: 13.5, lineHeight: 1.55 }}>{it.plain}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
