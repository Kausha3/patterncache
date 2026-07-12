/**
 * PatternCache design tokens — §3 of the build spec.
 * Single source of truth for color/type/motion. Exported both as a JS object
 * (for inline styles in components) and injected as CSS custom properties
 * (see theme/global.css.ts) so either access pattern stays in sync.
 */

export const color = {
  bg: "#16181D",
  panel: "#1D2027",
  panelBorder: "#2C2F38",
  text: "#F3F1EA",
  textDim: "#9B9DA5",
  textFaint: "#5C5F66",
  teal: "#4FA3A1", // primary accent — DSA track, correct/active, primary CTA
  amber: "#D4A24C", // "why", highlights, progress fill, shaky-confidence outline
  blue: "#5B9BD5", // system-design track
  red: "#C97064", // signal only — invalid/error, never decorative
  green: "#7FB069", // completion
} as const;

/** Per-track accent — used in path map, tab buttons, progress bars. §3.1 */
export const trackColor = {
  dsa: color.teal,
  "system-design": color.blue,
} as const;

export const font = {
  mono: `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`,
  body: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
} as const;

export const type = {
  display: { fontSize: "28px", fontWeight: 700, lineHeight: 1.15 },
  eyebrow: {
    fontFamily: font.mono,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
  },
  body: { fontSize: "14.5px", fontWeight: 400, lineHeight: 1.6 },
  code: { fontFamily: font.mono, fontSize: "13px" },
} as const;

/** §3.3 — keep it snappy; learning momentum matters. */
export const motion = {
  step: "220ms cubic-bezier(0.4, 0, 0.2, 1)",
  nodeIn: "300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const radius = { sm: "6px", md: "10px", lg: "14px", pill: "999px" } as const;

export const space = (n: number) => `${n * 4}px`;
