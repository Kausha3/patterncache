import { NavLink } from "react-router-dom";
import { useGameProgress } from "@/hooks/useGameProgress";
import { Icon } from "@/components/Icon";

export function GameStatusPill() {
  const { summary } = useGameProgress();

  return (
    <NavLink
      to="/"
      className="top-nav-game"
      aria-label={`Level ${summary.rank.level}, ${summary.rank.name}, ${summary.streak} day streak`}
    >
      <span className="top-nav-game-level">LV {summary.rank.level}</span>
      <span className="top-nav-game-streak">
        <Icon name="flame" size={12} />
        {summary.streak}
      </span>
    </NavLink>
  );
}

