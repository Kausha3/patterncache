/**
 * PatternCache design tokens.
 * A restrained, typographic dark system: neutral-dominant surfaces with
 * sparse, purposeful accent. Exported as JS (inline styles) and mirrored as
 * CSS custom properties in theme/global.css.
 */

export const color = {
  bg: "#141519",
  panel: "#1B1D23",
  panelRaised: "#212430", // nested surfaces / hover
  panelBorder: "#2A2D36",
  hairline: "#23262E", // subtler dividers
  text: "#ECEAE3",
  textDim: "#9A9CA4",
  textFaint: "#63666E",
  teal: "#5BB0AD", // primary accent — DSA, correct/active, primary CTA
  tealDim: "#2E4A49",
  amber: "#D9A94E", // insight / "why" / progress / shaky
  amberDim: "#4A3D24",
  blue: "#6AA6DB", // system-design track
  blueDim: "#283A4C",
  violet: "#9A82D4", // async nodes
  red: "#D07B6E", // signal only — invalid/error
  green: "#82B872", // completion
} as const;

export const trackColor = {
  dsa: color.teal,
  "system-design": color.blue,
  lld: color.violet,
} as const;

/** Faint accent wash for a track (backgrounds/borders). */
export const trackWash = {
  dsa: "rgba(91,176,173,0.09)",
  "system-design": "rgba(106,166,219,0.09)",
  lld: "rgba(154,130,212,0.09)",
} as const;

export const font = {
  mono: `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`,
  body: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
} as const;

/** Uppercase mono eyebrow style, used to label every section consistently. */
export const eyebrowStyle = {
  fontFamily: font.mono,
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: "1.3px",
  textTransform: "uppercase" as const,
};

export const radius = { sm: "5px", md: "8px", lg: "12px", xl: "16px", pill: "999px" } as const;

/** Subtle elevation — a hairline top-light + soft drop, not a heavy shadow. */
export const elevation = {
  card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 1px 2px rgba(0,0,0,0.3)",
  raised: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 16px rgba(0,0,0,0.35)",
} as const;

/** Restrained motion — no overshoot. Learning momentum over flourish. */
export const motion = {
  fast: "140ms cubic-bezier(0.4, 0, 0.2, 1)",
  step: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  enter: "260ms cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const space = (n: number) => `${n * 4}px`;
