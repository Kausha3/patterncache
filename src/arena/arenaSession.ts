import type { ArenaChallenge } from "./types";

export interface ArenaAnswerOutcome {
  correct: boolean;
  points: number;
  healthDelta: number;
  feedback: string;
}

export function scoreArenaAnswer(
  challenge: ArenaChallenge,
  choiceId: string | undefined,
  secondsLeft: number,
): ArenaAnswerOutcome {
  if (!choiceId) {
    return {
      correct: false,
      points: 0,
      healthDelta: -30,
      feedback: "Time expired before you committed. In an interview, state your current best option and its tradeoff instead of going silent.",
    };
  }

  const choice = challenge.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) {
    return { correct: false, points: 0, healthDelta: -30, feedback: "That response is not part of this encounter." };
  }
  if (!choice.correct) {
    return { correct: false, points: 0, healthDelta: -25, feedback: choice.feedback };
  }

  const timeRatio = Math.max(0, Math.min(1, secondsLeft / challenge.seconds));
  return {
    correct: true,
    points: 100 + Math.round(timeRatio * 50),
    healthDelta: 5,
    feedback: choice.feedback,
  };
}

export function getArenaPerformance(score: number, maxScore: number): { label: string; message: string } {
  const ratio = maxScore === 0 ? 0 : score / maxScore;
  if (ratio >= 0.85) return { label: "Bar-raiser signal", message: "Fast recognition and defensible judgment held under pressure." };
  if (ratio >= 0.65) return { label: "Loop ready", message: "The core instincts are sound. Re-run to tighten speed and rejected-alternative explanations." };
  return { label: "Training signal", message: "Review the incident explanations, then replay until the decision arrives before the clock becomes pressure." };
}

