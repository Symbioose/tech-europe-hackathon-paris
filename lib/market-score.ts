import type { RoundResult, Session, TribeScore } from "./types";

export function marketSignalScore(score?: TribeScore): number {
  if (!score) return 0;
  const conversion = clamp01(score.conversionRate);
  const click = clamp01(score.clickRate);
  const repelled = clamp01(score.repelledRate);
  const fit = conversion * 0.5 + click * 0.25 + (1 - repelled) * 0.25;
  return Math.round(fit * 100);
}

export function overallMarketSignal(round?: RoundResult): number {
  if (!round?.tribeScores?.length) return 0;
  const scores = round.tribeScores.map(marketSignalScore);
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function messageMarketFit(score?: TribeScore): number {
  if (!score) return 0;
  return Math.round((clamp01(score.conversionRate) * 0.65 + clamp01(score.clickRate) * 0.35) * 100);
}

export function objectionIntensity(score?: TribeScore): number {
  if (!score) return 0;
  return Math.round(clamp01(score.repelledRate) * 100);
}

export function signalStrengthLabel(value: number): "Low" | "Medium" | "High" {
  if (value >= 58) return "High";
  if (value >= 42) return "Medium";
  return "Low";
}

export function confidenceForSession(session: Session): {
  level: "Low" | "Medium" | "High";
  reason: string;
} {
  const lastRound = [...session.rounds].sort((a, b) => b.round - a.round)[0];
  const sourceCount = session.brief.competitorSignals.length + session.brief.trendSignals.length;
  const roundCount = session.rounds.length;
  const topTwo = [...(lastRound?.tribeScores ?? [])]
    .sort((a, b) => marketSignalScore(b) - marketSignalScore(a))
    .slice(0, 2);
  const separation =
    topTwo.length === 2 ? marketSignalScore(topTwo[0]) - marketSignalScore(topTwo[1]) : 0;

  if (sourceCount >= 8 && roundCount >= 2 && separation >= 8) {
    return {
      level: "High",
      reason: "Multiple source lanes, repeated rounds, and a clear winner gap.",
    };
  }
  if (sourceCount >= 4 || roundCount >= 2) {
    return {
      level: "Medium",
      reason: "Useful directional signal, but still needs human validation.",
    };
  }
  return {
    level: "Low",
    reason: "Limited source coverage. Treat this as a hypothesis only.",
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}
