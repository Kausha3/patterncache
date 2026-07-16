import { color, font, radius } from "@/theme/tokens";

/**
 * Marks an exercise as a Quick Check: recall support that never counts as
 * mastery on the competency ledger. Mastery evidence only comes from running
 * a simulation, repairing a design, transferring without hints, passing
 * tests, or explaining out loud.
 */
export function QuickCheckBadge() {
  return (
    <span
      title="Quick checks support recall. They never count as mastery on your competency ledger."
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: "fit-content",
        fontFamily: font.mono,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        color: color.textFaint,
        border: `1px solid ${color.panelBorder}`,
        borderRadius: radius.pill,
        padding: "3px 9px",
      }}
    >
      Quick check · recall, not mastery
    </span>
  );
}
