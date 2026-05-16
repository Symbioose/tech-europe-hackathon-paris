import { NextResponse } from "next/server";
import { gradiumSpeak } from "@/lib/integrations/gradium";
import { heroBuyerFeedback } from "@/lib/demo-data";
import type { BuyerAgent, Tribe, VoiceProfile } from "@/lib/types";

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

async function openaiPersona(
  buyer: BuyerAgent,
  tribe: Tribe,
  question: string,
  hookSeen: string,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const system = `You roleplay as ${buyer.name}, a ${buyer.role}. You belong to tribe "${tribe.name}". Main pain: ${tribe.mainPain}. Top objection: ${tribe.topObjection}. Stay in character. Reply in 2-3 short sentences. Reference how the hook you saw made you feel — concrete, not generic. If you didn't convert, explain the specific block.`;
  const user = `You just saw an ad with hook: "${hookSeen ?? "Generic hook"}". The user asks: "${question}". Answer in character, max 3 sentences.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.choices?.[0]?.message?.content as string) ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    buyer?: BuyerAgent;
    tribe?: Tribe;
    question?: string;
    hookSeen?: string;
  };
  const { buyer, tribe, question, hookSeen } = body;

  if (!buyer || !tribe || !question) {
    return NextResponse.json({ error: "buyer, tribe, question required" }, { status: 400 });
  }

  let text: string | null = null;
  try {
    text = await openaiPersona(buyer, tribe, question, hookSeen ?? "Generic hook");
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

  const profile: VoiceProfile = buyer.voiceProfile ?? "f-mid";
  let audioUrl: string | null = null;
  try {
    audioUrl = await gradiumSpeak(text, profile);
  } catch {
    audioUrl = null;
  }

  return NextResponse.json({
    text,
    audioUrl,
    mode: audioUrl?.startsWith("/demo") ? "fallback" : "live",
  });
}
