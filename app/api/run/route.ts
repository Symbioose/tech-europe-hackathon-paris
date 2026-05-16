import { NextResponse } from "next/server";
import { buildFallbackSession, ouraBrief, tribes, baseAgents, assetsRound1 } from "@/lib/demo-data";
import { tavilyExtract } from "@/lib/integrations/tavily";
import { generateTribes, summarizeProduct } from "@/lib/integrations/openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const url: string | undefined = body?.productUrl;

  if (!url || /ouraring|oura/i.test(url) || process.env.CRUCIBLE_DEMO_MODE === "1") {
    // Deterministic fallback path — fastest and most reliable for demo recording.
    return NextResponse.json({
      brief: ouraBrief,
      tribes,
      initialAssets: assetsRound1,
      agents: baseAgents,
      mode: "fallback",
    });
  }

  // Best-effort live path.
  const fallback = buildFallbackSession();
  let brief = fallback.brief;
  try {
    const snap = await tavilyExtract(url);
    if (snap) {
      brief = {
        ...brief,
        url,
        competitorSignals: snap.competitorSignals.length
          ? snap.competitorSignals
          : brief.competitorSignals,
        trendSignals: snap.trendSignals.length ? snap.trendSignals : brief.trendSignals,
        source: "tavily",
      };
    }
    const summary = await summarizeProduct(url, brief.description);
    if (summary) {
      brief = { ...brief, ...summary };
    }
    const liveTribes = await generateTribes(brief);
    if (liveTribes && liveTribes.length === 7) {
      return NextResponse.json({
        brief,
        tribes: liveTribes,
        initialAssets: assetsRound1, // Keep asset shape stable for demo.
        agents: baseAgents,
        mode: "live",
      });
    }
  } catch {
    // fall through
  }

  return NextResponse.json({
    brief,
    tribes: fallback.tribes,
    initialAssets: assetsRound1,
    agents: baseAgents,
    mode: "fallback",
  });
}
