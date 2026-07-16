import { useGameProgress } from "@/hooks/useGameProgress";
import { Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { color } from "@/theme/tokens";

export function AchievementShelf() {
  const { summary } = useGameProgress();
  const unlockedCount = summary.achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <section className="achievement-shelf" aria-labelledby="achievement-heading">
      <div className="achievement-shelf-header">
        <div>
          <Eyebrow tone={color.violet}>Achievement vault</Eyebrow>
          <h2 id="achievement-heading">Proof of skill, not empty points</h2>
        </div>
        <span>{unlockedCount} / {summary.achievements.length} unlocked</span>
      </div>
      <div className="achievement-grid">
        {summary.achievements.map((achievement) => (
          <article
            key={achievement.id}
            className={`achievement-card${achievement.unlocked ? " achievement-card-unlocked" : ""}`}
          >
            <span className="achievement-icon" aria-hidden>
              <Icon name={achievement.unlocked ? "trophy" : "target"} size={17} />
            </span>
            <div>
              <h3>{achievement.name}</h3>
              <p>{achievement.description}</p>
            </div>
            <span className="achievement-state">{achievement.unlocked ? "Unlocked" : "Locked"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

