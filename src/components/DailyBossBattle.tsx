import { useNavigate } from "react-router-dom";
import { useGameProgress } from "@/hooks/useGameProgress";
import type { ChallengeCheckpoint, ChallengeCheckpointId } from "@/game/gameEngine";
import { Button, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { color, trackColor } from "@/theme/tokens";

export function DailyBossBattle() {
  const { challenge, toggleChallengeCheckpoint } = useGameProgress();
  const navigate = useNavigate();
  const tone = trackColor[challenge.targetTrack];
  const lessonComplete = challenge.completedCheckpointIds.includes("lesson");
  const progressPercent = Math.round((challenge.completeCount / challenge.checkpoints.length) * 100);

  return (
    <section className={`boss-battle${challenge.completed ? " boss-battle-cleared" : ""}`}>
      <div className="boss-battle-scanline" aria-hidden />
      <header className="boss-battle-header">
        <div>
          <Eyebrow tone={challenge.completed ? color.green : color.red}>
            {challenge.completed ? "Boss cleared" : "Adaptive daily boss battle"}
          </Eyebrow>
          <h2>{challenge.targetTitle}</h2>
          <p>{challenge.reason}</p>
        </div>
        <div className="boss-battle-reward">
          <Icon name={challenge.completed ? "trophy" : "target"} size={18} color={challenge.completed ? color.green : color.amber} />
          <span>{challenge.completed ? "CLEARED" : `UP TO ${challenge.availableXp} XP`}</span>
        </div>
      </header>

      <div
        className="boss-battle-progress"
        role="progressbar"
        aria-label="Boss battle checkpoints"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
      >
        <span style={{ width: `${progressPercent}%`, background: tone }} />
      </div>

      <div className="boss-checkpoint-grid">
        {challenge.checkpoints.map((checkpoint, index) => (
          <CheckpointCard
            key={checkpoint.id}
            checkpoint={checkpoint}
            number={index + 1}
            completed={challenge.completedCheckpointIds.includes(checkpoint.id)}
            locked={checkpoint.id === "defend" && !lessonComplete}
            tone={tone}
            onOpenLesson={() => navigate(`/lesson/${challenge.targetLessonId}`)}
            onToggle={(id) => toggleChallengeCheckpoint(id)}
          />
        ))}
      </div>
    </section>
  );
}

function CheckpointCard({
  checkpoint,
  number,
  completed,
  locked,
  tone,
  onOpenLesson,
  onToggle,
}: {
  checkpoint: ChallengeCheckpoint;
  number: number;
  completed: boolean;
  locked: boolean;
  tone: string;
  onOpenLesson: () => void;
  onToggle: (id: Exclude<ChallengeCheckpointId, "lesson">) => void;
}) {
  const manualCheckpointId = checkpoint.id === "lesson" ? undefined : checkpoint.id;

  return (
    <article className={`boss-checkpoint${completed ? " boss-checkpoint-complete" : ""}`}>
      <div className="boss-checkpoint-topline">
        <span className="boss-checkpoint-number" style={{ borderColor: completed ? tone : undefined, color: completed ? tone : undefined }}>
          {completed ? <Icon name="check" size={13} strokeWidth={2.4} /> : number}
        </span>
        <span className="boss-checkpoint-xp">+{checkpoint.xp} XP</span>
      </div>
      <div>
        <h3>{checkpoint.label}</h3>
        <p>{checkpoint.description}</p>
      </div>
      {checkpoint.id === "lesson" ? (
        <Button variant="ghost" iconRight="arrowRight" onClick={onOpenLesson}>
          {completed ? "Review lesson" : "Enter lesson"}
        </Button>
      ) : (
        <Button
          variant={completed ? "subtle" : "ghost"}
          icon={completed ? "reset" : "check"}
          disabled={locked}
          aria-pressed={completed}
          onClick={() => {
            if (manualCheckpointId) onToggle(manualCheckpointId);
          }}
        >
          {locked ? "Clear lesson first" : completed ? "Undo checkpoint" : "Mark checkpoint clear"}
        </Button>
      )}
    </article>
  );
}
