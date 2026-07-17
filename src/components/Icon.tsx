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
  | "download"
  | "upload"
  | "chevronRight"
  | "target"
  | "insight"
  | "layers"
  | "gauge"
  | "flame"
  | "trophy"
  | "shield"
  | "code"
  | "microphone"
  | "volume";

const FILLED: Partial<Record<IconName, string>> = {
  play: "M7 4.5v15l12-7.5-12-7.5Z",
  insight: "M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l1-8Z",
  flame: "M13.2 2.5c.8 4.1-2.6 5.2-2.6 8.2 0 1.2.7 2.1 1.7 2.6-.1-2.1 1.2-3.4 2.8-4.8.5 2.5 3.4 4.1 3.4 7.5 0 3.3-2.8 6-6.2 6s-6.2-2.7-6.2-6c0-4.6 3.1-7.3 5.7-9.8-.2 2.2.5 3.8 1.7 4.5.2-3.6 2.1-5.8 2.8-8.2Z",
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
  download: "M12 4v11m0 0 5-5m-5 5-5-5M4 20h16",
  upload: "M12 20V9m0 0 5 5m-5-5-5 5M4 4h16",
  chevronRight: "M9 5l7 7-7 7",
  target: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  layers: "M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 8v0",
  gauge: "M12 14l4-4M5 18a9 9 0 1 1 14 0",
  trophy: "M8 4h8v4c0 3-1.8 5-4 5s-4-2-4-5V4ZM8 6H4v1c0 2.2 1.8 4 4 4M16 6h4v1c0 2.2-1.8 4-4 4M12 13v4M8 21h8M9 17h6",
  shield: "M12 3 5 6v5c0 4.5 2.7 7.7 7 10 4.3-2.3 7-5.5 7-10V6l-7-3Z",
  code: "M9 6 3 12l6 6M15 6l6 6-6 6M13.5 4 10.5 20",
  microphone: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5.5 11.5v.5a6.5 6.5 0 0 0 13 0v-.5M12 18.5V22M8.5 22h7",
  volume: "M5 10v4h3l4 4V6L8 10H5ZM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11",
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
