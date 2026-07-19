import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from "react";
import { color, font, radius, elevation, eyebrowStyle, motion } from "@/theme/tokens";
import { Icon, type IconName } from "./Icon";

/** Shared building blocks — one visual grammar across every lesson. */

export function Eyebrow({ children, tone = color.textDim, style }: { children: ReactNode; tone?: string; style?: CSSProperties }) {
  return <div style={{ ...eyebrowStyle, color: tone, ...style }}>{children}</div>;
}

export function Panel({
  children,
  style,
  raised,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  raised?: boolean;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: color.panel,
        border: `1px solid ${color.panelBorder}`,
        borderRadius: radius.lg,
        padding: 22,
        boxShadow: raised ? elevation.raised : elevation.card,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Consistent labelled section header: eyebrow on the left, meta on the right. */
export function SectionHeader({ eyebrow, tone, meta }: { eyebrow: string; tone?: string; meta?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      {meta && <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>{meta}</span>}
    </div>
  );
}

export function Divider({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 1, background: color.hairline, ...style }} />;
}

/** Keeps the original interview prompt visible across a multi-phase
 * interaction — once you're deep in a build-out it's easy to lose sight of
 * what you're actually designing. */
export function PromptBanner({ prompt, tone = color.textDim }: { prompt: string; tone?: string }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "baseline", borderLeft: `2px solid ${tone}`, paddingLeft: 11, paddingTop: 1, paddingBottom: 1 }}>
      <span style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: tone, flexShrink: 0 }}>
        Prompt
      </span>
      <span style={{ fontSize: 13.5, color: color.textDim }}>{prompt}</span>
    </div>
  );
}

type BtnVariant = "primary" | "ghost" | "subtle" | "danger";
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  accent?: string;
  icon?: IconName;
  iconRight?: IconName;
}

export function Button({ variant = "primary", accent = color.teal, icon, iconRight, style, children, ...rest }: BtnProps) {
  const base: CSSProperties = {
    fontFamily: font.mono,
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.2px",
    padding: children ? "9px 14px" : "9px 10px",
    borderRadius: radius.md,
    border: "1px solid transparent",
    transition: `background ${motion.fast}, border-color ${motion.fast}, color ${motion.fast}, opacity ${motion.fast}`,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };
  const variants: Record<BtnVariant, CSSProperties> = {
    primary: { background: accent, color: "#12211F", borderColor: accent },
    ghost: { background: color.panel, color: color.text, borderColor: color.panelBorder },
    subtle: { background: "transparent", color: color.textDim, borderColor: "transparent" },
    danger: { background: "transparent", color: color.red, borderColor: color.red },
  };
  const disabled = rest.disabled;
  return (
    <button style={{ ...base, ...variants[variant], ...(disabled ? { opacity: 0.38, cursor: "not-allowed" } : {}), ...style }} {...rest}>
      {icon && <Icon name={icon} size={15} />}
      {children}
      {iconRight && <Icon name={iconRight} size={15} />}
    </button>
  );
}

export function InlineCode({ children, tone = color.amber }: { children: ReactNode; tone?: string }) {
  return (
    <code
      style={{
        fontFamily: font.mono,
        fontSize: 12.5,
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${color.hairline}`,
        padding: "1.5px 6px",
        borderRadius: 5,
        color: tone,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </code>
  );
}

/** Animated metric bar. `ratio` is 0..1. */
export function MetricBar({ label, value, ratio, tone = color.blue }: { label: string; value: string; ratio: number; tone?: string }) {
  const pct = Math.max(0.02, Math.min(1, ratio)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
        <span style={{ ...eyebrowStyle, fontSize: 10, color: color.textDim }}>{label}</span>
        <span style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 700, color: color.text }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: radius.pill, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: tone, borderRadius: radius.pill, transition: `width 420ms ${motion.enter}` }} />
      </div>
    </div>
  );
}
