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
 * Practice hub: one front door for every practice mode. There is exactly ONE
 * starting point for LLD (the System Forge campaign); everything else on
 * this page is extra reps or recall support, and says so. A beginner should
 * never have to choose between four LLD methodologies.
 */
const START_HERE: PracticeCard[] = [
  {
    title: "System Forge · SOLID campaign",
    route: "/arena/pattern-genome",
    blurb: "Start LLD here. One garage, five chapters, one per SOLID principle: run the world into a real failure, repair it, transfer the fix with hints off, and defend it in interview language. Start at chapter 1 and do not skip.",
    icon: "layers",
    accent: color.violet,
    tag: "Start here · Canonical LLD",
    tagTone: color.violet,
  },
];

const HLD_WORK: PracticeCard[] = [
  {
    title: "System Design Worlds",
    route: "/arena/hld-worlds",
    blurb: "Start HLD here. Keep a URL shortener, notification service, and checkout alive through traffic spikes, retries, partial failures, and change. Move real capabilities, rerun the same incident, then defend the architecture without supplied answers.",
    icon: "gauge",
    accent: color.blue,
    tag: "Canonical HLD · 3 living systems",
    tagTone: color.blue,
  },
];

const MORE_REPS: PracticeCard[] = [
  {
    title: "Amazon LLD Verification Worlds",
    route: "/arena/lld-worlds",
    blurb: "Prove all six must-do designs: Parking Lot, Circular Buffer, LRU Cache, Amazon Locker, Vending Machine, and Elevator. Each exact system fails live, accepts real responsibility moves, and ends with an evidence-based interview defense.",
    icon: "gauge",
    accent: color.teal,
    tag: "6/6 exact simulations · verified LLD",
    tagTone: color.teal,
  },
  {
    title: "Cold Design Drills",
    route: "/drill",
    blurb: "A bare prompt and a blank page. Name the classes, list the edge cases, then compare against a reference. Best after the campaign, when you have something to transfer.",
    icon: "insight",
    accent: color.blue,
  },
  {
    title: "LLD Design Studio",
    route: "/arena/lld-studio",
    blurb: "Assign responsibilities on a live Java skeleton while requirements mutate. Extra reps on the same skills the campaign teaches.",
    icon: "layers",
    accent: color.violet,
  },
  {
    title: "Arena simulations",
    route: "/arena",
    blurb: "Timed option-based runs: Pattern Combat, Incident Command, Model Defense. Good pressure practice; counts as recall, not mastery.",
    icon: "target",
    accent: color.red,
  },
];

const INTERVIEW_WORK: PracticeCard[] = [
  {
    title: "Mock interview",
    route: "/interview",
    blurb: "Paste the JD and resume you submitted. Parsing and coaching stay on this device. Optional speaking mode reads each question and transcribes your answer after an explicit browser-audio disclosure.",
    icon: "insight",
    accent: color.violet,
    tag: "Resume based · optional voice",
    tagTone: color.violet,
  },
];

const CODING_WORK: PracticeCard[] = [
  {
    title: "Algorithm Worlds",
    route: "/arena/algorithm-worlds",
    blurb: "See the invariant after you prove the code. Two worlds instrument actual Java operations; six more require a hidden-test Java clear before their canonical and variant replays unlock. Every transfer ends with a free-form defense, never answer choices.",
    icon: "layers",
    accent: color.violet,
    tag: "8 visual pattern worlds · Java-gated",
    tagTone: color.violet,
  },
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
    blurb: "Write Solution.java, compile and run it in your browser against visible and hidden tests, then defend the reasoning. Same language as your Amazon loop.",
    icon: "play",
    accent: color.teal,
    tag: "Real Java · in your browser",
    tagTone: color.teal,
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

      <Section eyebrow="Learn LLD · one starting point" tone={color.violet} cards={START_HERE} />
      <Section eyebrow="Learn HLD · one starting point" tone={color.blue} cards={HLD_WORK} />
      <Section eyebrow="Coding" tone={color.amber} cards={CODING_WORK} />
      <Section eyebrow="Interview practice" tone={color.violet} cards={INTERVIEW_WORK} />
      <Section eyebrow="More reps · after the campaign" tone={color.blue} cards={MORE_REPS} />
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
