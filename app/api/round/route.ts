import { NextResponse } from "next/server";
import { applyRoundState, baseAgents, assetsByRound, roundResults } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const round = (body?.round ?? 1) as 1 | 2 | 3;
  if (![1, 2, 3].includes(round)) {
    return NextResponse.json({ error: "round must be 1 | 2 | 3" }, { status: 400 });
  }

  const updatedAgents = applyRoundState(round, baseAgents);
  const roundResult = roundResults[round - 1];
  const updatedAssets = assetsByRound[round];

  return NextResponse.json({
    roundResult,
    updatedAssets,
    updatedAgents,
    mode: "fallback",
  });
}
