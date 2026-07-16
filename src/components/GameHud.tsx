import { useGameProgress } from "@/hooks/useGameProgress";
import { Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { color } from "@/theme/tokens";

export function GameHud() {
  const { summary } = useGameProgress();
  const unlockedAchievements = summary.achievements.filter((achievement) => achievement.unlocked).length;
  const progressPercent = Math.round(summary.levelProgress * 100);

  return (
    <section className="game-hud" aria-label="Player progression">
      <div className="game-level-node" aria-hidden>
        <span>LV</span>
        <strong>{summary.rank.level}</strong>
      </div>

      <div className="game-rank-copy">
        <Eyebrow tone={color.amber}>Current rank</Eyebrow>
        <h2>{summary.rank.name}</h2>
        <div
          className="game-xp-track"
          role="progressbar"
          aria-label="Experience toward next rank"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="game-xp-caption">
          {summary.nextRank
            ? `${summary.xpIntoLevel} / ${summary.xpForLevel} XP to ${summary.nextRank.name}`
            : `${summary.xp} XP · maximum rank reached`}
        </span>
      </div>

      <div className="game-hud-stats">
        <HudMetric icon="flame" value={`${summary.streak}`} label="day streak" tone={color.amber} />
        <HudMetric icon="insight" value={`${summary.xp}`} label="total XP" tone={color.teal} />
        <HudMetric icon="trophy" value={`${unlockedAchievements}/${summary.achievements.length}`} label="badges" tone={color.violet} />
      </div>
    </section>
  );
}

function HudMetric({
  icon,
  value,
  label,
  tone,
}: {
  icon: "flame" | "insight" | "trophy";
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <div className="game-hud-metric">
      <Icon name={icon} size={15} color={tone} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
