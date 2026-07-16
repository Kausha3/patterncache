import type { ArenaChallenge, ArenaMode } from "@/arena/types";
import { ARENA_MODE_META } from "@/arena/arenaChallenges";
import { Icon } from "@/components/Icon";

export function ArenaWorld({
  challenge,
  mode,
  health,
}: {
  challenge: ArenaChallenge;
  mode: ArenaMode;
  health: number;
}) {
  const healthState = health <= 30 ? "critical" : health <= 65 ? "strained" : "stable";

  return (
    <section className={`arena-world arena-world-${mode}`} aria-label={`${ARENA_MODE_META[mode].label} visual model`}>
      <div className="arena-world-grid" aria-hidden />
      <header className="arena-world-header">
        <div>
          <span>LIVE MODEL</span>
          <strong>{challenge.signal}</strong>
        </div>
        <div className={`arena-health-state arena-health-${healthState}`}>
          <Icon name="shield" size={14} />
          {healthState}
        </div>
      </header>

      <div className="arena-node-chain">
        {challenge.visualNodes.map((node, index) => (
          <div className="arena-node-step" key={node.id}>
            {index > 0 && <span className="arena-node-link" aria-hidden />}
            <article className={`arena-world-node${node.critical ? " arena-world-node-critical" : ""}`} data-kind={node.kind}>
              <span className="arena-world-node-dot" aria-hidden />
              <strong>{node.label}</strong>
              <span>{node.detail}</span>
            </article>
          </div>
        ))}
      </div>

      <div
        className="arena-world-health"
        role="progressbar"
        aria-label="System integrity"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={health}
        aria-valuetext={`${health}%`}
      >
        <span>system integrity</span>
        <div><span style={{ width: `${health}%` }} /></div>
        <strong>{health}%</strong>
      </div>
    </section>
  );
}
