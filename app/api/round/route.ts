import { NextResponse } from "next/server";
import { applyRoundState, assetsByRound, baseAgents } from "@/lib/demo-data";
import { simulateTribeReaction, type SimulatedReaction } from "@/lib/integrations/openai";
import type {
  AgentState,
  BuyerAgent,
  LaunchAsset,
  ProductBrief,
  RegenerationTarget,
  RoundResult,
  Tribe,
  TribeScore,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const roundNarrative: Record<number, Pick<RoundResult, "learning">> = {
  1: {
    learning: "Broad exploration found which pains buyers understood immediately and which claims felt too generic.",
  },
  2: {
    learning: "The marketer rewrote weak hooks around concrete moments, then shifted attention toward tribes with clearer buying triggers.",
  },
  3: {
    learning: "The final round narrowed on the strongest tribe, repeated its exact trigger, and removed the main objection from the path to conversion.",
  },
};

function learningFor(round: number): string {
  if (roundNarrative[round]) return roundNarrative[round].learning;
  return `Round ${round}: sharpened the winning hook further, kept doubling down on what the strongest tribe already validated, and trimmed messages that no longer pulled new buyers.`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distributeStates(
  agentsForTribe: BuyerAgent[],
  score: TribeScore,
): BuyerAgent[] {
  // Allocate 10 buyer states based on the live conversion / repelled / click rates.
  // Order: converted first (top of pool), then repelled (bottom of pool), then curious, then seen, rest idle.
  const n = agentsForTribe.length || 10;
  const converted = Math.round(clamp(score.conversionRate, 0, 1) * n);
  const repelled = Math.round(clamp(score.repelledRate, 0, 1) * n);
  // Click-but-didn't-buy = curious. Pull from the click delta.
  const curious = Math.max(0, Math.round((clamp(score.clickRate, 0, 1) - clamp(score.conversionRate, 0, 1)) * n));
  const remaining = Math.max(0, n - converted - repelled - curious);
  const seen = Math.min(remaining, Math.round(remaining * 0.6));
  const idle = Math.max(0, remaining - seen);

  const sequence: AgentState[] = [
    ...Array<AgentState>(converted).fill("converted"),
    ...Array<AgentState>(curious).fill("curious"),
    ...Array<AgentState>(seen).fill("seen"),
    ...Array<AgentState>(repelled).fill("repelled"),
    ...Array<AgentState>(idle).fill("idle"),
  ].slice(0, n);

  // Hero buyer stays converted whenever possible — it's the anchor for the voice demo.
  const heroIdx = agentsForTribe.findIndex((a) => a.isHero);
  if (heroIdx >= 0) {
    // Move a converted to hero position
    const firstConvertedIdx = sequence.findIndex((s) => s === "converted");
    if (firstConvertedIdx >= 0 && firstConvertedIdx !== heroIdx) {
      [sequence[heroIdx], sequence[firstConvertedIdx]] = [sequence[firstConvertedIdx], sequence[heroIdx]];
    } else if (firstConvertedIdx < 0) {
      // Force at least one converted for the hero
      sequence[heroIdx] = "converted";
    }
  }

  return agentsForTribe.map((agent, idx) => ({
    ...agent,
    state: sequence[idx] ?? "idle",
    feedback: idx === heroIdx ? score.representativeFeedback : agent.feedback,
  }));
}

function pickAssets(round: number, incoming?: LaunchAsset[]) {
  if (incoming?.length) return incoming;
  // assetsByRound only goes up to 3; for higher rounds, reuse the latest variant.
  const key = (round >= 3 ? 3 : round) as 1 | 2 | 3;
  return assetsByRound[key];
}

function reactionToScore(reaction: SimulatedReaction): TribeScore {
  return {
    tribeId: reaction.tribeId,
    conversionRate: reaction.conversionRate,
    clickRate: reaction.clickRate,
    repelledRate: reaction.repelledRate,
    topPositiveWords: reaction.topPositiveWords,
    topObjections: reaction.topObjections,
    representativeFeedback: reaction.representativeFeedback,
  };
}

function fallbackScore(tribe: Tribe, round: number, index: number): TribeScore {
  const baseByRound: Record<number, number> = { 1: 0.09, 2: 0.18, 3: 0.31 };
  // Rounds beyond 3 keep climbing slightly but with diminishing returns.
  const base = baseByRound[round] ?? Math.min(0.55, 0.31 + (round - 3) * 0.04);
  const fit = ((tribe.id.charCodeAt(tribe.id.length - 1) * 7) % 17 - 8) / 100;
  const conversionRate = clamp(base + fit - index * 0.006, 0.03, 0.66);
  return {
    tribeId: tribe.id,
    conversionRate,
    clickRate: clamp(conversionRate + 0.17, conversionRate, 0.72),
    repelledRate: clamp(0.19 - conversionRate * 0.22, 0.04, 0.24),
    topPositiveWords: [tribe.buyingTrigger.split(" ").slice(0, 3).join(" ")],
    topObjections: [tribe.topObjection],
    representativeFeedback: `${tribe.name} need a sharper reason to act on this hook.`,
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    round?: number;
    brief?: ProductBrief;
    tribes?: Tribe[];
    assets?: LaunchAsset[];
    previousRounds?: RoundResult[];
  };
  const round = Math.max(1, Math.floor(body?.round ?? 1));

  const tribes = Array.isArray(body.tribes) && body.tribes.length === 7 ? body.tribes : [];
  const updatedAssets = pickAssets(round, body.assets);

  if (tribes.length !== 7) {
    // No live data → return deterministic fallback so the UI doesn't break.
    const fallbackScores: TribeScore[] = tribes.map((t, i) => fallbackScore(t, round, i));
    const baselineByRound: Record<number, number> = { 1: 0.09, 2: 0.18, 3: 0.31 };
    const overallFallback =
      baselineByRound[round] ?? Math.min(0.55, 0.31 + (round - 3) * 0.04);
    const fallbackRound = (round >= 3 ? 3 : round) as 1 | 2 | 3;
    const result: RoundResult = {
      round,
      overallConversion: overallFallback,
      learning: learningFor(round),
      highlights: [],
      failures: [],
      assets: updatedAssets,
      tribeScores: fallbackScores,
    };
    return NextResponse.json({
      roundResult: result,
      updatedAssets,
      updatedAgents: applyRoundState(fallbackRound, baseAgents),
      mode: "no-tribes",
    });
  }

  // Build a lookup for previous round's per-tribe scores (used to give round 2/3 context).
  const prevRound = (body.previousRounds ?? []).find((r) => r.round === (round - 1));
  const prevScoreByTribe = new Map(
    (prevRound?.tribeScores ?? []).map((s) => [s.tribeId, s]),
  );

  // Fire 7 parallel real simulations.
  const reactions: Array<SimulatedReaction | null> = await Promise.all(
    tribes.map((tribe) => {
      const asset =
        updatedAssets.find((a) => a.tribeId === tribe.id) ??
        updatedAssets[0] ?? { hook: "", landingHeadline: "", cta: "" };
      const prev = prevScoreByTribe.get(tribe.id);
      return Promise.race([
        simulateTribeReaction({
          brief: body.brief ?? ({} as ProductBrief),
          tribe,
          asset: { hook: asset.hook, landingHeadline: asset.landingHeadline, cta: asset.cta },
          round,
          previousScore: prev
            ? { conversionRate: prev.conversionRate, topObjections: prev.topObjections }
            : undefined,
        }),
        new Promise<null>((r) => setTimeout(() => r(null), 12000)),
      ]).catch(() => null);
    }),
  );

  const tribeScores: TribeScore[] = tribes.map((tribe, i) => {
    const reaction = reactions[i];
    return reaction ? reactionToScore(reaction) : fallbackScore(tribe, round, i);
  });

  // Build live agents: take the existing 70 buyers, regroup by tribe, distribute states by score.
  const baseByTribe = new Map<string, BuyerAgent[]>();
  for (const a of baseAgents) {
    const list = baseByTribe.get(a.tribeId) ?? [];
    list.push(a);
    baseByTribe.set(a.tribeId, list);
  }
  const updatedAgents: BuyerAgent[] = tribes.flatMap((tribe) => {
    const pool = baseByTribe.get(tribe.id) ?? [];
    const score = tribeScores.find((s) => s.tribeId === tribe.id);
    if (!pool.length || !score) return pool;
    return distributeStates(pool, score);
  });

  // Sort tribeScores DESC by conversion (winner-first ordering everywhere)
  const sortedDesc = [...tribeScores].sort((a, b) => b.conversionRate - a.conversionRate);
  const sortedAsc = [...tribeScores].sort((a, b) => a.conversionRate - b.conversionRate);

  const overallConversion =
    tribeScores.reduce((sum, s) => sum + s.conversionRate, 0) / tribeScores.length;

  // Round 1 → mark the bottom 2 for visible regen at the start of Round 2.
  const regenerationTargets: RegenerationTarget[] | undefined =
    round === 1
      ? sortedAsc.slice(0, 2).map((s) => ({
          tribeId: s.tribeId,
          previousHook: updatedAssets.find((a) => a.tribeId === s.tribeId)?.hook ?? "",
          failureReason: s.representativeFeedback || s.topObjections[0] || "Buyers did not react clearly.",
        }))
      : undefined;

  // Highlights & failures derived from the LIVE reactions (no hardcoded copy).
  const highlights = sortedDesc.slice(0, 2).map((s) => {
    const tribe = tribes.find((t) => t.id === s.tribeId);
    return `${tribe?.name ?? s.tribeId} converted ${Math.round(s.conversionRate * 100)}%: "${s.representativeFeedback.slice(0, 90)}"`;
  });
  const failures = sortedAsc.slice(0, 2).map((s) => {
    const tribe = tribes.find((t) => t.id === s.tribeId);
    return `${tribe?.name ?? s.tribeId} only ${Math.round(s.conversionRate * 100)}%: ${s.topObjections[0] ?? "no clear objection"}`;
  });

  const roundResult: RoundResult = {
    round,
    overallConversion,
    learning: learningFor(round),
    highlights,
    failures,
    assets: updatedAssets,
    tribeScores: sortedDesc,
    regenerationTargets,
  };

  return NextResponse.json({
    roundResult,
    updatedAssets,
    updatedAgents,
    mode: reactions.every((r) => r !== null) ? "live" : "partial",
  });
}
