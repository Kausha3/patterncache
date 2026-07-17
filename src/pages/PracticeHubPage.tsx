import { useNavigate } from "react-router-dom";
import { Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { color, font, radius } from "@/theme/tokens";

interface PracticeCard {
  title: string;
  route: string;
  blurb: string;
  icon: IconName;
  accent: string;
  tag?: string;
  tagTone?: string;
}

/**
 * Practice hub: one front door for every practice mode. The split matters:
 * mastery work (simulate, repair, transfer, code, explain) is what counts on
 * the competency ledger; quick checks support recall and say so.
 */
const MASTERY_WORK: PracticeCard[] = [
  {
    title: "System Forge",
    route: "/arena/pattern-genome",
    blurb: "The canonical LLD experience. Run a real garage into a rush-hour failure, repair it, transfer the fix with hints off, and defend it in interview language. Five chapters, one per SOLID principle, from Single Responsibility to Dependency Inversion.",
    icon: "layers",
    accent: color.violet,
    tag: "Canonical LLD",
    tagTone: color.violet,
  },
  {
    title: "LLD Design Studio",
    route: "/arena/lld-studio",
    blurb: "Assign responsibilities on a live Java skeleton, then hold the design together while the requirements mutate.",
    icon: "layers",
    accent: color.violet,
  },
  {
    title: "Arena simulations",
    route: "/arena",
    blurb: "Timed runs: Pattern Combat, Incident Command, Model Defense. Every rejected answer explains the signal an interviewer wanted.",
    icon: "target",
    accent: color.red,
  },
  {
    title: "Cold Design Drills",
    route: "/drill",
    blurb: "A bare prompt and a blank page. Name the classes, list the edge cases, then compare against a reference. Transfer practice, self-scored.",
    icon: "insight",
    accent: color.blue,
  },
];

const CODING_WORK: PracticeCard[] = [
  {
    title: "Amazon SDE I board",
    route: "/companies/amazon/sde1",
    blurb: "The scheduled problem list with evidence tiers, recall cues, follow-up variations, and 1/3/7-day reviews. Work these in Java, the language you'll interview in.",
    icon: "check",
    accent: color.amber,
    tag: "Interview practice",
    tagTone: color.amber,
  },
  {
    title: "Coding Combat",
    route: "/arena/coding-lab",
    blurb: "Executable missions with visible and hidden tests plus a defense round. Runs JavaScript today, so treat it as the testing loop, not Amazon practice. Java execution is the target.",
    icon: "play",
    accent: color.teal,
    tag: "Engineering prototype · JS",
    tagTone: color.textFaint,
  },
];

const QUICK_CHECKS: PracticeCard[] = [
  {
    title: "Spot the Pattern",
    route: "/patterns",
    blurb: "Short scenarios, confusable options, commit then reveal. Good for recall between sessions.",
    icon: "insight",
    accent: color.textDim,
  },
];

export function PracticeHubPage() {
  return (
    <div style={{ display: "grid", gap: 26 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.6px" }}>Practice</h1>
        <p style={{ color: color.textDim, maxWidth: 680 }}>
          Two kinds of work live here. Mastery work makes you observe a failure, repair a design, transfer
          an idea, write code, or explain out loud; it's what your competency ledger counts. Quick checks
          help recall, and they never count as mastery.
        </p>
      </header>

      <Section eyebrow="Mastery work" tone={color.violet} cards={MASTERY_WORK} />
      <Section eyebrow="Coding" tone={color.amber} cards={CODING_WORK} />
      <Section
        eyebrow="Quick checks · recall support, not mastery"
        tone={color.textDim}
        cards={QUICK_CHECKS}
      />
    </div>
  );
}

function Section({ eyebrow, tone, cards }: { eyebrow: string; tone: string; cards: PracticeCard[] }) {
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {cards.map((card) => (
          <PracticeCardView key={card.route} card={card} />
        ))}
      </div>
    </section>
  );
}

function PracticeCardView({ card }: { card: PracticeCard }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(card.route)} style={{ textAlign: "left", cursor: "pointer" }}>
      <Panel style={{ display: "grid", gap: 10, height: "100%" }} raised>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <Icon name={card.icon} size={16} color={card.accent} />
            <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 15 }}>{card.title}</span>
          </div>
          <Icon name="arrowRight" size={15} color={card.accent} style={{ flexShrink: 0 }} />
        </div>
        {card.tag && (
          <span
            style={{
              width: "fit-content",
              fontFamily: font.mono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              color: card.tagTone ?? color.textFaint,
              border: `1px solid ${card.tagTone ?? color.panelBorder}55`,
              borderRadius: radius.pill,
              padding: "3px 9px",
            }}
          >
            {card.tag}
          </span>
        )}
        <p style={{ margin: 0, fontSize: 13, color: color.textDim, lineHeight: 1.55 }}>{card.blurb}</p>
      </Panel>
    </button>
  );
}
