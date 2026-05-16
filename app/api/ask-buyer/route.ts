import { NextResponse } from "next/server";
import { answerInPersona } from "@/lib/integrations/openai";
import { gradiumSpeak } from "@/lib/integrations/gradium";
import { heroBuyerFeedback } from "@/lib/demo-data";
import type { BuyerAgent, Tribe } from "@/lib/types";

export const dynamic = "force-dynamic";

const fallbackByState: Record<string, string> = {
  converted:
    "I clicked because the hook named a moment I recognized. Then the landing page paid it off in 30 seconds. That's why I bought before my coffee.",
  curious:
    "The hook landed, but the page felt heavier than the promise. Make the payoff as short as the headline and I'm in.",
  seen:
    "I scrolled past. The hook didn't name anything I'm currently feeling. Try targeting me on a Monday morning instead.",
  repelled:
    "Either the format doesn't fit my context, or it felt like another wearable subscription. I'm not your buyer yet.",
  idle:
    "I haven't been targeted yet — I'm in the cohort waiting on the next campaign.",
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    buyer?: BuyerAgent;
    tribe?: Tribe;
    question?: string;
  };
  const { buyer, tribe, question } = body;

  if (!buyer || !tribe || !question) {
    return NextResponse.json({ error: "buyer, tribe, question required" }, { status: 400 });
  }

  let text: string | null = null;
  try {
    text = await answerInPersona(buyer, tribe, question);
  } catch {
    text = null;
  }

  if (!text) {
    if (buyer.isHero && buyer.state === "converted") {
      text = heroBuyerFeedback;
    } else {
      text = fallbackByState[buyer.state] ?? fallbackByState.seen;
    }
  }

  let audioUrl: string | null = null;
  if (buyer.isHero) {
    // Try Gradium for hero buyer only — keep latency predictable.
    try {
      audioUrl = await gradiumSpeak(text);
    } catch {
      audioUrl = null;
    }
    if (!audioUrl) {
      audioUrl = "/demo/buyer-voice.m4a";
    }
  }

  return NextResponse.json({
    text,
    audioUrl,
    mode: audioUrl?.startsWith("/demo") ? "fallback" : "live",
  });
}
