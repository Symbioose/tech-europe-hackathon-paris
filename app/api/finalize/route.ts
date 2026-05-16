import { NextResponse } from "next/server";
import type {
  LaunchAsset,
  ProductBrief,
  RoundResult,
  Tribe,
  TribeRecommendation,
  TribeVerdict,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type FinalizeBody = {
  brief?: ProductBrief;
  tribes?: Tribe[];
  assets?: LaunchAsset[];
  rounds?: RoundResult[];
};

function verdictFor(conv: number): TribeVerdict {
  if (conv >= 0.25) return "strong";
  if (conv >= 0.12) return "refine";
  return "avoid";
}

function priorityFor(conv: number): "High" | "Medium" | "Low" {
  if (conv >= 0.25) return "High";
  if (conv >= 0.12) return "Medium";
  return "Low";
}

// Channel/proof heuristics from tribe platform + a few keywords in the tribe name.
function channelFor(tribe: Tribe): string {
  const name = tribe.name.toLowerCase();
  if (name.includes("engineer") || name.includes("dev") || name.includes("data")) return "Dev communities · GitHub · Hacker News";
  if (name.includes("founder") || name.includes("ceo") || name.includes("exec")) return "Founder Slack groups · LinkedIn · warm intros";
  if (name.includes("design")) return "Designer communities · Twitter · LinkedIn";
  if (name.includes("creator") || name.includes("influenc")) return "TikTok · Instagram Reels · creator DMs";
  if (tribe.platform === "linkedin") return "LinkedIn outbound · niche newsletters";
  if (tribe.platform === "tiktok") return "TikTok organic · creator partnerships";
  if (tribe.platform === "instagram") return "Instagram Reels · interest communities";
  return "LinkedIn · niche newsletters · founder communities";
}

function proofFor(tribe: Tribe): string {
  const name = tribe.name.toLowerCase();
  if (name.includes("engineer") || name.includes("dev")) return "API docs · latency benchmark · GitHub example";
  if (name.includes("founder") || name.includes("exec")) return "ROI calculator · short customer quote · pricing transparency";
  if (name.includes("data") || name.includes("analy")) return "Methodology page · sample dashboard · export demo";
  if (name.includes("design")) return "Polished demo video · craft case study";
  if (name.includes("coach") || name.includes("trainer") || name.includes("athlete")) return "Field-tested case study · before/after data";
  return "30-second demo · customer quote · transparent pricing";
}

function deterministicBreakdown(
  tribes: Tribe[],
  assets: LaunchAsset[],
  lastRound: RoundResult | undefined,
): TribeRecommendation[] {
  const scoreById = new Map(
    (lastRound?.tribeScores ?? []).map((s) => [s.tribeId, s]),
  );
  return tribes.map<TribeRecommendation>((tribe) => {
    const score = scoreById.get(tribe.id);
    const asset = assets.find((a) => a.tribeId === tribe.id);
    const conv = score?.conversionRate ?? 0;
    const verdict = verdictFor(conv);
    const repPct = Math.round((score?.repelledRate ?? 0) * 100);
    const clickPct = Math.round((score?.clickRate ?? 0) * 100);
    const convPct = Math.round(conv * 100);
    const objection = score?.topObjections?.[0] ?? tribe.topObjection;
    const pain = tribe.mainPain.replace(/[.!?]+$/g, "");
    const currentHook = asset?.hook || `Solve ${pain}`;
    const improvedHook =
      verdict === "strong"
        ? currentHook
        : `${pain.slice(0, 58)} — with proof before you switch`;
    return {
      tribeId: tribe.id,
      verdict,
      priority: priorityFor(conv),
      justification:
        verdict === "strong"
          ? `Strongest market signal: ${convPct}/100 purchase intent proxy, ${clickPct}/100 attention proxy.`
          : verdict === "refine"
            ? `Directional signal, but objection intensity is ${repPct}/100. Retest with sharper proof.`
            : `Weak signal and objection intensity ${repPct}/100. Avoid as the first segment.`,
      whyReacted:
        score?.representativeFeedback ||
        `${tribe.name} reacted to the hook through the lens of ${tribe.mainPain}.`,
      whatMotivates: tribe.buyingTrigger || `Acting on ${tribe.mainPain.toLowerCase()}`,
      whatBlocks: objection,
      recommendedChannel: channelFor(tribe),
      recommendedAngle:
        verdict === "strong"
          ? `Lead with the moment behind "${currentHook}" — they already recognize it.`
          : `Name the pain directly, then remove the objection: ${objection}.`,
      proofToShow: proofFor(tribe),
      recommendedCta: asset?.cta || "See it in action",
      whatToAvoid: `Avoid: "${objection}" — anything that signals this concern will lose them.`,
      improvedHook,
      improvedCta:
        verdict === "strong"
          ? asset?.cta || "Try it free"
          : "Show me how",
      objectionToHandle: objection,
      suggestedQuestions: [
        verdict === "strong"
          ? `What exact moment made you trust "${currentHook}"?`
          : `What made "${currentHook}" feel risky or irrelevant?`,
        `What proof would make this worth trying this week?`,
        `Which words would you use to describe this problem internally?`,
      ],
    };
  });
}

async function openaiBreakdown(
  brief: ProductBrief | undefined,
  tribes: Tribe[],
  assets: LaunchAsset[],
  rounds: RoundResult[],
): Promise<TribeRecommendation[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const lastRound = [...rounds].sort((a, b) => b.round - a.round)[0];
  if (!lastRound) return null;
  const scoreById = new Map(lastRound.tribeScores.map((s) => [s.tribeId, s]));

  const tribesPayload = tribes
    .map((tribe) => {
      const score = scoreById.get(tribe.id);
      const asset = assets.find((a) => a.tribeId === tribe.id);
      return [
        `tribeId: ${tribe.id}`,
        `  name: ${tribe.name}`,
        `  platform: ${tribe.platform}`,
        `  mainPain: ${tribe.mainPain}`,
        `  topObjection: ${tribe.topObjection}`,
        `  lastHook: "${asset?.hook ?? "—"}"`,
        `  lastCta: "${asset?.cta ?? "—"}"`,
        `  conversion: ${Math.round((score?.conversionRate ?? 0) * 100)}%`,
        `  clicked: ${Math.round((score?.clickRate ?? 0) * 100)}%`,
        `  repelled: ${Math.round((score?.repelledRate ?? 0) * 100)}%`,
        `  representativeFeedback: "${score?.representativeFeedback ?? ""}"`,
        `  topObjections: ${(score?.topObjections ?? []).join(" | ")}`,
        `  topPositive: ${(score?.topPositiveWords ?? []).join(" | ")}`,
      ].join("\n");
    })
    .join("\n\n");

  const roundHistory = rounds
    .sort((a, b) => a.round - b.round)
    .map((r) => `R${r.round}: ${Math.round(r.overallConversion * 100)}%`)
    .join(" → ");

  const system = `You are a launch strategist. Produce a TRIBE-BY-TRIBE playbook for a founder, based on real round data. Return STRICT JSON: {"breakdown":[<7 items>]}. Each item MUST be:
{
  "tribeId": string (must match input id exactly),
  "verdict": "strong" | "refine" | "avoid",
  "priority": "High" | "Medium" | "Low",
  "justification": string (1 short sentence quoting signal, fit, or objection intensity; do not call it real conversion),
  "whyReacted": string (1 sentence — why they did/didn't bite),
  "whatMotivates": string (1 sentence),
  "whatBlocks": string (1 short sentence),
  "recommendedChannel": string (concrete channel mix, e.g. "LinkedIn outbound + niche newsletters", "Dev communities + Hacker News", "Founder Slack groups + warm intros"),
  "recommendedAngle": string (1 sentence — the angle to lead with),
  "proofToShow": string (e.g. "API docs + latency benchmark", "ROI calculator + 1 customer quote", "Case study with before/after"),
  "recommendedCta": string (3-5 words, action verb),
  "whatToAvoid": string (1 sentence naming the specific phrase or claim that repels them),
  "improvedHook": string (one specific moment this tribe recognises, max 14 words, no buzzwords, no template phrases like "Open with the moment"),
  "improvedCta": string (3-5 words),
  "objectionToHandle": string (1 short sentence),
  "suggestedQuestions": [<exactly 3 strings>] — concrete questions a founder should ask a buyer from THIS tribe to clarify the result (e.g. "Which line of the hook landed first?", "What proof would have made you click?", "What word in the hook felt off?"). Each question must be short, specific, and impossible to answer with a yes/no.
}
Be CONCRETE and SPECIFIC to each tribe — no generic copy. Use the data given. Treat conversionRate as a synthetic purchase-intent proxy, not real conversion. Verdict must reflect conversionRate: strong >=25%, refine 12-24%, avoid <12%.`;

  const user = `Product: ${brief?.name ?? "Product"} — ${brief?.keyPromise ?? ""}
Market: ${brief?.market ?? "—"}

Round history: ${roundHistory}

Final round data for the 7 tribes:

${tribesPayload}

Return STRICT JSON only. No prose.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
        max_tokens: 2200,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) return null;
    const parsed = JSON.parse(text) as { breakdown?: TribeRecommendation[] };
    if (!Array.isArray(parsed.breakdown) || parsed.breakdown.length === 0) return null;
    // Defensive: keep only items whose tribeId matches a known tribe.
    const knownIds = new Set(tribes.map((t) => t.id));
    const filtered = parsed.breakdown.filter((b) => knownIds.has(b.tribeId));
    if (filtered.length === 0) return null;
    return filtered;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as FinalizeBody;
  const tribes = Array.isArray(body.tribes) ? body.tribes : [];
  const assets = Array.isArray(body.assets) ? body.assets : [];
  const rounds = Array.isArray(body.rounds) ? body.rounds : [];

  if (tribes.length === 0) {
    return NextResponse.json({ tribeBreakdown: [] });
  }

  const lastRound = [...rounds].sort((a, b) => b.round - a.round)[0];
  const deterministic = deterministicBreakdown(tribes, assets, lastRound);

  // Prefer OpenAI output (richer + specific to the run). Fall back to deterministic
  // if OpenAI is missing, returns invalid JSON, or times out.
  const live = await openaiBreakdown(body.brief, tribes, assets, rounds);
  let breakdown: TribeRecommendation[] = deterministic;
  if (live && live.length > 0) {
    // Merge: prefer live data per tribe, fall back to deterministic for missing tribes.
    const liveById = new Map(live.map((b) => [b.tribeId, b]));
    breakdown = deterministic.map((d) => liveById.get(d.tribeId) ?? d);
  }

  return NextResponse.json({
    tribeBreakdown: breakdown,
    mode: live ? "live" : "deterministic",
  });
}
