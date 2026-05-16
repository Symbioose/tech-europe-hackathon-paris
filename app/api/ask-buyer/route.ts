import { NextResponse } from "next/server";
import { gradiumSpeak } from "@/lib/integrations/gradium";
import type { BuyerAgent, Tribe, VoiceProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

const defaultAnswerByState: Record<string, string> = {
  converted:
    "I clicked because the hook named a moment I recognized. Then the landing page paid it off in 30 seconds. That's why I bought before my coffee.",
  curious:
    "The hook landed, but the page felt heavier than the promise. Make the payoff as short as the headline and I'm in.",
  seen:
    "I scrolled past. The hook didn't name anything I'm currently feeling. Try targeting me on a Monday morning instead.",
  repelled:
    "Either the format doesn't fit my context, or the promise felt too broad to trust. I'm not your buyer yet.",
  idle:
    "I haven't been targeted yet — I'm in the cohort waiting on the next campaign.",
};

const SPEAKING_STYLES = [
  "dry, analytical, sentences kept short",
  "warm and conversational, uses small jokes",
  "skeptical and direct, asks counter-questions",
  "blunt and time-pressed, hates filler words",
  "thoughtful and metaphor-driven, slightly poetic",
];

const BACKGROUNDS = [
  "started your career in operations and trust spreadsheets more than slogans",
  "come from an engineering background and decode marketing as a stack of claims to verify",
  "spent years as a designer and judge products on craft before utility",
  "did 5 years in management consulting and parse every pitch for the unstated assumption",
  "are a self-taught operator who learned by getting burned and now defaults to suspicion",
];

const DECISION_VIBES = [
  "you decide fast when a single word resonates, but never re-open something once you bounce",
  "you sit with new tools for days before deciding, and silently judge anything that pushes urgency",
  "you only buy what a friend already recommended — ads barely move you",
  "you love trying the new thing first and brag about it later — early adopter energy",
  "you treat purchases like investments and refuse anything that doesn't beat the ROI calculation in your head",
];

const QUIRKS = [
  "you have a peeve for stock photos of smiling teams",
  "you genuinely respect founders who admit what their product can't do",
  "you ignore any copy that uses the word 'seamless' or 'effortless'",
  "you mute most brands but follow a handful of niche operators",
  "you read the pricing page before the homepage",
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(items: T[], seed: number, salt: number): T {
  return items[(seed + salt * 13) % items.length];
}

function personaCardFor(buyer: BuyerAgent, tribe: Tribe): string {
  const seed = hash(buyer.id);
  return [
    `Speaking style: ${pick(SPEAKING_STYLES, seed, 1)}.`,
    `Background: you ${pick(BACKGROUNDS, seed, 2)}.`,
    `Buying behaviour: ${pick(DECISION_VIBES, seed, 3)}.`,
    `Personal quirk: ${pick(QUIRKS, seed, 4)}.`,
    `Tribe context — main pain: ${tribe.mainPain}. Top objection: ${tribe.topObjection}.`,
  ].join(" ");
}

async function openaiPersona(
  buyer: BuyerAgent,
  tribe: Tribe,
  question: string,
  hookSeen: string,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const stateLine =
    buyer.state === "converted"
      ? "You CONVERTED — the hook landed perfectly. Speak about the exact moment it clicked."
      : buyer.state === "curious"
        ? "You CLICKED but did NOT buy. The hook caught you but the page lost you. Be specific about the friction."
        : buyer.state === "seen"
          ? "You saw the ad and SCROLLED PAST. The hook did not speak to your current life. Explain what would have made you stop."
          : buyer.state === "repelled"
            ? "You were ACTIVELY REPELLED. Say honestly why — context, vibe, format, or the message itself."
            : "You haven't been targeted yet — speculate based on your personality and what would make you bite.";

  const system = `You roleplay as ${buyer.name}, ${buyer.role}. ${personaCardFor(buyer, tribe)} ${stateLine} Reply in 2-3 short sentences max, first-person, in YOUR voice — do NOT be polite or generic. Reference the hook concretely. Never list bullet points. Never say "as ${buyer.name}".`;
  const user = `You just saw an ad with hook: "${hookSeen ?? "Generic hook"}". The founder asks you directly: "${question}". Answer in character, max 3 sentences, in your natural voice.`;

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
    text = defaultAnswerByState[buyer.state] ?? defaultAnswerByState.seen;
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
    mode: audioUrl ? "live" : "text",
  });
}
