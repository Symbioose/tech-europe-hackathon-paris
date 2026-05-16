import { NextResponse } from "next/server";
import { applyRoundState, assetsByRound, baseAgents } from "@/lib/demo-data";
import type { LaunchAsset, ProductBrief, RoundResult, Tribe } from "@/lib/types";

export const dynamic = "force-dynamic";

const roundStrategy = {
  1: {
    learning: "Broad exploration found which pains buyers understood immediately and which claims felt too generic.",
    highlights: ["Specific pain language drove the first clicks", "Tribes with urgent daily symptoms reacted fastest"],
    failures: ["Generic optimization claims underperformed", "Broad wellness language created weak intent"],
  },
  2: {
    learning: "The marketer rewrote weak hooks around concrete moments, then shifted attention toward tribes with clearer buying triggers.",
    highlights: ["Moment-based hooks improved curiosity", "Objection-aware landing copy reduced drop-off"],
    failures: ["Feature-heavy scripts still lost non-technical buyers", "Some tribes needed proof before CTA"],
  },
  3: {
    learning: "The final round narrowed on the strongest tribe, repeated its exact trigger, and removed the main objection from the path to conversion.",
    highlights: ["The winning hook named a recognizable moment", "CTA clarity converted the highest-intent buyers"],
    failures: ["Low-urgency tribes stayed curious but did not convert", "Price-sensitive buyers needed more proof"],
  },
} satisfies Record<1 | 2 | 3, Pick<RoundResult, "learning" | "highlights" | "failures">>;

function hash(input: string): number {
  let value = 0;
  for (let i = 0; i < input.length; i++) {
    value = (value * 31 + input.charCodeAt(i)) >>> 0;
  }
  return value;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreTribes(tribes: Tribe[], round: 1 | 2 | 3) {
  const baseByRound = { 1: 0.09, 2: 0.18, 3: 0.31 };
  const ranked = tribes
    .map((tribe, index) => {
      const seed = hash(`${tribe.name}-${tribe.mainPain}-${round}`);
      const fit = ((seed % 17) - 8) / 100;
      const focusBoost = round === 3 && index === 1 ? 0.12 : round >= 2 && index === 1 ? 0.06 : 0;
      const conversionRate = clamp(baseByRound[round] + fit + focusBoost - index * 0.006, 0.03, 0.48);
      return {
        tribeId: tribe.id,
        conversionRate,
        clickRate: clamp(conversionRate + 0.17 + (seed % 5) / 100, conversionRate, 0.72),
        repelledRate: clamp(0.19 - conversionRate * 0.22 + (index % 3) / 100, 0.04, 0.24),
        topPositiveWords: [
          tribe.buyingTrigger.split(" ").slice(0, 3).join(" "),
          tribe.languageStyle.split(" ").slice(0, 2).join(" "),
        ].filter(Boolean),
        topObjections: [tribe.topObjection],
        representativeFeedback:
          round === 1
            ? `The promise is interesting, but ${tribe.name.toLowerCase()} need a sharper reason to act now.`
            : round === 2
              ? `The rewrite is closer because it speaks to ${tribe.mainPain.toLowerCase()}.`
              : `This worked when the hook matched their trigger: ${tribe.buyingTrigger.toLowerCase()}.`,
      };
    })
    .sort((a, b) => b.conversionRate - a.conversionRate);

  return ranked;
}

function pickAssets(round: 1 | 2 | 3, incoming?: LaunchAsset[]) {
  if (incoming?.length) return incoming;
  return assetsByRound[round];
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    round?: 1 | 2 | 3;
    brief?: ProductBrief;
    tribes?: Tribe[];
    assets?: LaunchAsset[];
  };
  const round = (body?.round ?? 1) as 1 | 2 | 3;
  if (![1, 2, 3].includes(round)) {
    return NextResponse.json({ error: "round must be 1 | 2 | 3" }, { status: 400 });
  }

  const tribes = Array.isArray(body.tribes) && body.tribes.length === 7 ? body.tribes : [];
  const tribeScores = tribes.length ? scoreTribes(tribes, round) : [];
  const overallConversion = tribeScores.length
    ? tribeScores.reduce((sum, score) => sum + score.conversionRate, 0) / tribeScores.length
    : { 1: 0.09, 2: 0.18, 3: 0.31 }[round];
  const updatedAgents = applyRoundState(round, baseAgents);
  const updatedAssets = pickAssets(round, body.assets);
  const roundResult: RoundResult = {
    round,
    overallConversion,
    ...roundStrategy[round],
    assets: updatedAssets,
    tribeScores,
  };

  return NextResponse.json({
    roundResult,
    updatedAssets,
    updatedAgents,
    mode: "fallback",
  });
}
