import { NextResponse } from "next/server";
import { buildFallbackSession, ouraBrief, tribes, baseAgents, assetsRound1 } from "@/lib/demo-data";
import { tavilyExtract } from "@/lib/integrations/tavily";
import { generateTribes } from "@/lib/integrations/openai";

export const dynamic = "force-dynamic";

function inferProductName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const slug = host.split(".")[0] ?? host;
    return slug
      .split(/[-_]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  } catch {
    return "the product";
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    productUrl?: string;
    platform?: string;
    testType?: string;
    productNote?: string;
    targetMarket?: string;
    assetMode?: string;
  };
  const url: string | undefined = body?.productUrl;

  if (!url || /ouraring|oura/i.test(url) || process.env.CRUCIBLE_DEMO_MODE === "1") {
    return NextResponse.json({
      brief: ouraBrief,
      tribes,
      initialAssets: assetsRound1,
      agents: baseAgents,
      mode: "fallback",
    });
  }

  const fallback = buildFallbackSession();
  const productName = inferProductName(url);

  // Critical: do NOT inherit the Oura brief fields here — they would bias the
  // tribe generator toward sleep/recovery regardless of the actual URL.
  const seedBrief = {
    name: productName,
    url,
    oneLiner: `${productName} — product launch`,
    description: `Product at ${url}.`,
    market: "Unknown — infer from URL and Tavily signals",
    keyPromise: "Infer from the page",
    competitorSignals: [] as string[],
    trendSignals: [] as string[],
    source: "fallback" as "fallback" | "tavily",
  };

  // Tavily first (provides real context), then OpenAI tribe generation with
  // that context. Hard ceiling so the demo never stalls.
  const PRODUCT_TIMEOUT_MS = 28000;
  const deadline = Date.now() + PRODUCT_TIMEOUT_MS;

  const tavily = await Promise.race([
    tavilyExtract(url).catch(() => null),
    new Promise<null>((r) => setTimeout(() => r(null), 8000)),
  ]);

  let brief = seedBrief;
  if (tavily) {
    brief = {
      ...brief,
      description:
        tavily.trendSignals.concat(tavily.competitorSignals).slice(0, 5).join(" · ") ||
        seedBrief.description,
      market: body.targetMarket || brief.market,
      competitorSignals: tavily.competitorSignals.length
        ? tavily.competitorSignals
        : brief.competitorSignals,
      trendSignals: tavily.trendSignals.length
        ? tavily.trendSignals
        : brief.trendSignals,
      source: "tavily",
    };
  } else if (body.targetMarket) {
    brief = { ...brief, market: body.targetMarket };
  }

  // If the founder gave a one-liner note, lace it into the description so the tribe
  // generator has the founder's own framing (not just Tavily snippets).
  if (body.productNote) {
    brief = {
      ...brief,
      description: brief.description
        ? `${body.productNote} — ${brief.description}`
        : body.productNote,
    };
  }

  const remaining = Math.max(2000, deadline - Date.now());
  const liveTribes = await Promise.race([
    generateTribes(brief, {
      testType: body.testType,
      productNote: body.productNote,
      targetMarket: body.targetMarket,
      assetMode: body.assetMode,
    }).catch(() => null),
    new Promise<null>((r) => setTimeout(() => r(null), remaining)),
  ]);

  if (liveTribes && liveTribes.length === 7) {
    return NextResponse.json({
      brief,
      tribes: liveTribes,
      initialAssets: assetsRound1,
      agents: baseAgents,
      mode: "live",
    });
  }

  return NextResponse.json({
    brief,
    tribes: fallback.tribes,
    initialAssets: assetsRound1,
    agents: baseAgents,
    mode: "fallback",
  });
}
