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
        temperature: 0.7,
        max_tokens: 1200,
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
  const result = await openaiChat<{ tribes: Tribe[] }>(
    "You are a market strategist. Generate exactly 7 distinct customer tribes. Return strict JSON: {tribes: Tribe[]}. Each tribe: {id, name, platform, profile, mainPain, buyingTrigger, topObjection, priceSensitivity, languageStyle, emoji, accent}. Use ids tribe_1..tribe_7. Platforms: instagram | tiktok | linkedin. Accent is a hex color.",
    `Product: ${brief.name}\n${brief.description}\nMarket: ${brief.market}\nPromise: ${brief.keyPromise}\nCompetitor signals: ${brief.competitorSignals.join("; ")}\nTrend signals: ${brief.trendSignals.join("; ")}`,
  );
  return result?.tribes ?? null;
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
