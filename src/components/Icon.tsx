import type { CSSProperties } from "react";

/**
 * Minimal, consistent inline-SVG icon set (stroke-based, currentColor).
 * Replaces emoji/ascii glyphs so controls read as a designed system, not
 * decoration. 24px viewBox, rendered at any size via `size`.
 */

export type IconName =
  | "play"
  | "pause"
  | "stepBack"
  | "stepForward"
  | "reset"
  | "check"
  | "arrowRight"
  | "arrowLeft"
  | "close"
  | "plus"
  | "minus"
  | "chevronRight"
  | "target"
  | "insight"
  | "layers"
  | "gauge";

const FILLED: Partial<Record<IconName, string>> = {
  play: "M7 4.5v15l12-7.5-12-7.5Z",
  insight: "M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l1-8Z",
};

const STROKE: Partial<Record<IconName, string>> = {
  pause: "M9 4.5v15M15 4.5v15",
  stepForward: "M6 5l9 7-9 7V5ZM18 5v14",
  stepBack: "M18 5l-9 7 9 7V5ZM6 5v14",
  reset: "M3.5 12a8.5 8.5 0 1 0 2.6-6.1M4 4v4h4",
  check: "M5 12.5l4.5 4.5L19 7",
  arrowRight: "M4 12h15M13 6l6 6-6 6",
  arrowLeft: "M20 12H5M11 6l-6 6 6 6",
  close: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  chevronRight: "M9 5l7 7-7 7",
  target: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  layers: "M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 8v0",
  gauge: "M12 14l4-4M5 18a9 9 0 1 1 14 0",
};

export function Icon({
  name,
  size = 16,
  color = "currentColor",
  style,
  strokeWidth = 1.85,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}) {
  const filled = FILLED[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {filled ? (
        <path d={filled} fill={color} />
      ) : (
        <path
          d={STROKE[name]}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
