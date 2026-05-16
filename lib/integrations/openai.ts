import type { BuyerAgent, ProductBrief, Tribe } from "@/lib/types";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

async function openaiChat<T>(
  system: string,
  user: string,
  schema: "json" | "text" = "json",
): Promise<T | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: schema === "json" ? { type: "json_object" } : undefined,
        temperature: 0.6,
        max_tokens: 900,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) return null;
    if (schema === "json") {
      return JSON.parse(text) as T;
    }
    return text as unknown as T;
  } catch {
    return null;
  }
}

export async function summarizeProduct(url: string, raw?: string): Promise<Partial<ProductBrief> | null> {
  return openaiChat<Partial<ProductBrief>>(
    "You are a market analyst. Return strict JSON: {oneLiner, description, market, keyPromise}.",
    `Summarize this product for a launch-strategy use case. URL: ${url}\n\nRaw signals:\n${raw ?? ""}`,
  );
}

export async function generateTribes(brief: ProductBrief): Promise<Tribe[] | null> {
  // Keep the schema lean — every field beyond essentials inflates latency
  // (gpt-4o-mini ~150 tokens/tribe). The fields we drop here (profile,
  // buyingTrigger, priceSensitivity, languageStyle) are filled with sensible
  // defaults below so the rest of the app keeps its type shape.
  const result = await openaiChat<{
    tribes: Array<{
      id: string;
      name: string;
      platform: "instagram" | "tiktok" | "linkedin";
      mainPain: string;
      topObjection: string;
      emoji: string;
      accent: string;
    }>;
  }>(
    "You are a market strategist for an early-stage product launch. Return strict JSON: {tribes:[7 items]}. Each item: {id (tribe_1..tribe_7), name (3-5 words), platform (instagram|tiktok|linkedin), mainPain (1 short sentence), topObjection (1 short sentence), emoji, accent (hex color like #ff7a1a)}. Tribes must be distinct, vivid, and rooted in real buyer pain — no generic 'enthusiasts'.",
    `Product: ${brief.name}\nURL: ${brief.url}\nContext: ${brief.description}\nMarket: ${brief.market}\nCompetitor signals: ${brief.competitorSignals.slice(0, 4).join(" · ")}\nTrend signals: ${brief.trendSignals.slice(0, 4).join(" · ")}`,
  );
  if (!result?.tribes || result.tribes.length !== 7) return null;
  return result.tribes.map((t) => ({
    id: t.id,
    name: t.name,
    platform: t.platform,
    profile: `${t.name} — buyers grouped by the same pain.`,
    mainPain: t.mainPain,
    buyingTrigger: "A specific moment where the pain becomes unbearable.",
    topObjection: t.topObjection,
    priceSensitivity: "medium" as const,
    languageStyle: "Direct, specific, evidence-driven.",
    emoji: t.emoji,
    accent: t.accent,
  }));
}

export async function answerInPersona(
  buyer: BuyerAgent,
  tribe: Tribe,
  question: string,
): Promise<string | null> {
  return openaiChat<string>(
    "You are role-playing a buyer in a product simulation. Stay in character. Answer in 2-3 sentences max. Match the buyer's tribe language style and current state (converted/curious/seen/repelled). Speak directly to the founder asking the question.",
    `Buyer: ${buyer.name} (${buyer.role})\nState after the campaign: ${buyer.state}\nTribe: ${tribe.name}\nTribe pain: ${tribe.mainPain}\nTribe objection: ${tribe.topObjection}\nLanguage style: ${tribe.languageStyle}\n\nFounder asks: "${question}"`,
    "text",
  );
}

export async function isOpenAIConfigured(): Promise<boolean> {
  return Boolean(process.env.OPENAI_API_KEY);
}
