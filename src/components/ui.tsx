import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from "react";
import { color, font, radius } from "@/theme/tokens";

/** Small, shared building blocks so every lesson has the same visual grammar. */

export function Eyebrow({ children, tone = color.textDim }: { children: ReactNode; tone?: string }) {
  return (
    <div
      style={{
        fontFamily: font.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: tone,
      }}
    >
      {children}
    </div>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: color.panel,
        border: `1px solid ${color.panelBorder}`,
        borderRadius: radius.lg,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type BtnVariant = "primary" | "ghost" | "danger" | "chip";
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  accent?: string;
}

export function Button({ variant = "primary", accent = color.teal, style, children, ...rest }: BtnProps) {
  const base: CSSProperties = {
    fontFamily: font.mono,
    fontSize: 13,
    fontWeight: 700,
    padding: "10px 16px",
    borderRadius: radius.md,
    border: "1px solid transparent",
    transition: "all 160ms ease",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
  const variants: Record<BtnVariant, CSSProperties> = {
    primary: { background: accent, color: "#10221F", borderColor: accent },
    ghost: { background: "transparent", color: color.text, borderColor: color.panelBorder },
    danger: { background: "transparent", color: color.red, borderColor: color.red },
    chip: { background: "rgba(255,255,255,0.03)", color: color.textDim, borderColor: color.panelBorder, padding: "6px 12px" },
  };
  return (
    <button
      style={{ ...base, ...variants[variant], ...(rest.disabled ? { opacity: 0.4, cursor: "not-allowed" } : {}), ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code
      style={{
        fontFamily: font.mono,
        fontSize: 13,
        background: "rgba(255,255,255,0.06)",
        padding: "1px 6px",
        borderRadius: 5,
        color: color.amber,
      }}
    >
      {children}
    </code>
  );
}

/** Animated metric bar for the system-design stage builder. `ratio` is 0..1. */
export function MetricBar({ label, value, ratio, tone = color.blue }: { label: string; value: string; ratio: number; tone?: string }) {
  const pct = Math.max(0.02, Math.min(1, ratio)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.5px", color: color.textDim }}>{label}</span>
        <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 700, color: color.text }}>{value}</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: radius.pill, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: tone,
            borderRadius: radius.pill,
            transition: "width 400ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </div>
  );
}
