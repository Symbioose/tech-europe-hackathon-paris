export type TavilySnapshot = {
  competitorSignals: string[];
  trendSignals: string[];
  source: "tavily" | "fallback";
};

export type TavilyResult = {
  title: string;
  url: string;
  snippet: string;
  favicon: string;
};

function faviconFor(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch {
    return "";
  }
}

export async function extractPage(url: string): Promise<TavilyResult[] | null> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, urls: [url] }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rawContent: string = data?.results?.[0]?.raw_content ?? "";
    const snippet = rawContent.slice(0, 320);
    return [{ title: "Product page", url, snippet, favicon: faviconFor(url) }];
  } catch {
    return null;
  }
}

type TavilySearchResult = { title: string; url: string; content: string };

async function tavilySearch(
  query: string,
  options: { max_results?: number; depth?: "basic" | "advanced" } = {},
): Promise<TavilyResult[] | null> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        max_results: options.max_results ?? 8,
        search_depth: options.depth ?? "advanced",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results: TavilySearchResult[] = data?.results ?? [];
    return results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: (r.content ?? "").slice(0, 240),
      favicon: faviconFor(r.url),
    }));
  } catch {
    return null;
  }
}

export async function searchCompetitors(
  market: string,
  productName: string,
): Promise<TavilyResult[] | null> {
  return tavilySearch(
    `Top competitors and alternatives to ${productName} in the ${market} space — feature comparison, pricing differences, user complaints, market positioning`,
    { max_results: 8, depth: "advanced" },
  );
}

export async function searchTrends(market: string): Promise<TavilyResult[] | null> {
  return tavilySearch(
    `${market} buyer pain points, unmet needs, viral discussions, recurring complaints, and emerging behaviour shifts in 2026`,
    { max_results: 8, depth: "advanced" },
  );
}

export async function searchPricing(
  productName: string,
  market: string,
): Promise<TavilyResult[] | null> {
  return tavilySearch(
    `Pricing benchmarks for ${productName} and similar ${market} products — plans, tiers, price ranges, what buyers pay today`,
    { max_results: 6, depth: "advanced" },
  );
}

export async function searchCommunity(
  productName: string,
  market: string,
): Promise<TavilyResult[] | null> {
  return tavilySearch(
    `Reddit Hacker News Twitter discussions about ${productName} or ${market} — real user quotes, complaints, recommendations, switching stories`,
    { max_results: 8, depth: "advanced" },
  );
}

export async function tavilyExtract(url: string): Promise<TavilySnapshot | null> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query: `Launch signals, competitors, and viral hooks for ${url}`,
        search_depth: "advanced",
        max_results: 6,
        include_answer: true,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const answer: string | undefined = data?.answer;
    const sources: Array<{ title: string; content: string }> = data?.results ?? [];
    const competitorSignals = sources
      .slice(0, 3)
      .map((s) => `${s.title}`)
      .filter(Boolean);
    const trendSignals = sources
      .slice(3, 6)
      .map((s) => `${s.title}`)
      .filter(Boolean);
    return {
      competitorSignals,
      trendSignals: trendSignals.length ? trendSignals : answer ? [answer] : [],
      source: "tavily",
    };
  } catch {
    return null;
  }
}
