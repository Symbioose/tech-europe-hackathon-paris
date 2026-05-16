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

export type TribeGenSetup = {
  testType?: string;
  productNote?: string;
  targetMarket?: string;
  assetMode?: string;
};

export async function generateTribes(
  brief: ProductBrief,
  setup: TribeGenSetup = {},
): Promise<Tribe[] | null> {
  // Keep the schema lean — every field beyond essentials inflates latency
  // (gpt-4o-mini ~150 tokens/tribe). The fields we drop here (profile,
  // buyingTrigger, priceSensitivity, languageStyle) are filled with sensible
  // defaults below so the rest of the app keeps its type shape.
  const focus = setup.testType
    ? `Focus tribes on the decision: ${setup.testType.replace(/_/g, " ")}.`
    : "";
  const note = setup.productNote ? `Product context the founder added: ${setup.productNote}.` : "";
  const market = setup.targetMarket ? `Constrain tribes to: ${setup.targetMarket}.` : "";
  const systemAddon = [focus, note, market].filter(Boolean).join(" ");

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
    `You are a market strategist for an early-stage product launch. ${systemAddon} Return strict JSON: {tribes:[7 items]}. Each item: {id (tribe_1..tribe_7), name (3-5 words), platform (instagram|tiktok|linkedin), mainPain (1 short sentence), topObjection (1 short sentence), emoji, accent (hex color like #ff7a1a)}. Tribes must be distinct, vivid, and rooted in real buyer pain — no generic 'enthusiasts'.`,
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

export async function generateAssets(
  brief: ProductBrief,
  tribes: Tribe[],
  setup: TribeGenSetup = {},
): Promise<Array<{
  tribeId: string;
  hook: string;
  landingHeadline: string;
  cta: string;
  videoScript: string;
  benefits: string[];
  dmReply: string;
}> | null> {
  const focus = setup.testType
    ? `The founder is testing: ${setup.testType.replace(/_/g, " ")}.`
    : "";
  const tribesPayload = tribes
    .map(
      (t) =>
        `${t.id}: "${t.name}" — pain: ${t.mainPain}; objection: ${t.topObjection}`,
    )
    .join("\n");

  const result = await openaiChat<{
    assets: Array<{
      tribeId: string;
      hook: string;
      landingHeadline: string;
      cta: string;
      videoScript: string;
      benefit: string;
      dmReply: string;
    }>;
  }>(
    `You write launch assets for a product. ${focus} Return strict JSON: {assets:[7 items]}. Each item: {tribeId (must match input id exactly), hook (one specific moment, max 12 words, no generic claims), landingHeadline (max 16 words, names the moment + the relief), cta (3-5 words, action verb), videoScript (one sentence visualising the opening shot), benefit (one concrete promise), dmReply (one short reply to a curious DM)}. Hooks MUST be tailored to each tribe's pain and trigger — no generic 'optimize your X'.`,
    `Product: ${brief.name}\nKey promise: ${brief.keyPromise}\nMarket: ${brief.market}\nNote: ${setup.productNote ?? ""}\n\nTribes:\n${tribesPayload}`,
  );
  if (!result?.assets || result.assets.length !== 7) return null;
  return result.assets.map((a) => ({
    tribeId: a.tribeId,
    hook: a.hook,
    landingHeadline: a.landingHeadline,
    cta: a.cta,
    videoScript: a.videoScript,
    benefits: [a.benefit].filter(Boolean),
    dmReply: a.dmReply,
  }));
}

export type SimulatedReaction = {
  tribeId: string;
  conversionRate: number; // 0..1
  clickRate: number; // 0..1
  repelledRate: number; // 0..1
  topPositiveWords: string[];
  topObjections: string[];
  representativeFeedback: string;
};

export async function simulateTribeReaction(args: {
  brief: ProductBrief;
  tribe: Tribe;
  asset: { hook: string; landingHeadline: string; cta: string };
  round: 1 | 2 | 3;
  previousScore?: { conversionRate: number; topObjections: string[] };
}): Promise<SimulatedReaction | null> {
  const { brief, tribe, asset, round, previousScore } = args;
  const roundContext =
    round === 1
      ? "Round 1 is the first time this tribe sees ANY campaign for this product. Be cautious — typical first-launch conversion is 3-15%."
      : round === 2
        ? `Round 2: the marketer rewrote weak hooks based on what failed in Round 1 (this tribe's previous conversion was ${Math.round((previousScore?.conversionRate ?? 0.09) * 100)}% with objection "${previousScore?.topObjections?.[0] ?? "unclear"}"). Conversion can rise if the new hook genuinely addresses the prior failure — otherwise stays flat. Realistic range: 5-30%.`
        : `Round 3: the marketer sharpened the winning angle (previous conversion ${Math.round((previousScore?.conversionRate ?? 0.18) * 100)}%). If the hook now names a specific moment matching the tribe's trigger, conversion can hit 25-50%. Otherwise plateaus.`;

  const result = await openaiChat<SimulatedReaction>(
    `You simulate how a specific buyer tribe reacts to a marketing campaign. Be honest and concrete — do NOT inflate numbers. Return strict JSON: {tribeId, conversionRate (0..1), clickRate (0..1, must be >= conversionRate), repelledRate (0..1, max 0.3), topPositiveWords ([3 short phrases]), topObjections ([2-3 short objections]), representativeFeedback (one direct-quote sentence in the buyer's voice, max 25 words)}. ${roundContext}`,
    `Product: ${brief.name} — ${brief.keyPromise}\nTribe: ${tribe.name} (id: ${tribe.id})\n  - Main pain: ${tribe.mainPain}\n  - Buying trigger: ${tribe.buyingTrigger}\n  - Top objection: ${tribe.topObjection}\n  - Language style: ${tribe.languageStyle}\n\nCampaign they see now:\n  - Hook: "${asset.hook}"\n  - Landing headline: "${asset.landingHeadline}"\n  - CTA: "${asset.cta}"\n\nReact honestly. Tribes for whom the hook lands hit higher conversion. Tribes for whom the hook is generic or off-target stay low. Output strict JSON only.`,
  );
  if (!result) return null;
  // Defensive clamp + tribeId enforcement
  const clamp01 = (n: number) => Math.max(0, Math.min(1, Number(n) || 0));
  return {
    tribeId: tribe.id,
    conversionRate: clamp01(result.conversionRate),
    clickRate: Math.max(clamp01(result.clickRate), clamp01(result.conversionRate)),
    repelledRate: Math.min(clamp01(result.repelledRate), 0.3),
    topPositiveWords: Array.isArray(result.topPositiveWords) ? result.topPositiveWords.slice(0, 3) : [],
    topObjections: Array.isArray(result.topObjections) ? result.topObjections.slice(0, 3) : [tribe.topObjection],
    representativeFeedback:
      typeof result.representativeFeedback === "string" && result.representativeFeedback
        ? result.representativeFeedback
        : `${tribe.name} reacted but didn't say much.`,
  };
}

export async function rewriteHook(args: {
  productName: string;
  tribe: Tribe;
  previousHook: string;
  failureReason: string;
}): Promise<string | null> {
  const { tribe, previousHook, failureReason } = args;
  const result = await openaiChat<string>(
    "You rewrite marketing hooks. Output ONE new hook, max 12 words, no quotes, no preamble.",
    `Previous hook (failed): "${previousHook}". Tribe: ${tribe.name} — pain: ${tribe.mainPain}, trigger: ${tribe.buyingTrigger}, objection: ${tribe.topObjection}. Buyers said: "${failureReason}". Rewrite the hook to address the failure while keeping it concrete and one specific moment. Max 12 words.`,
    "text",
  );
  if (!result) return null;
  // Strip surrounding quotes if present
  return result.replace(/^["']|["']$/g, "").trim();
}

export async function isOpenAIConfigured(): Promise<boolean> {
  return Boolean(process.env.OPENAI_API_KEY);
}
