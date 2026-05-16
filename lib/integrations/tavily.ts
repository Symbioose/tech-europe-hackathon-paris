export type TavilySnapshot = {
  competitorSignals: string[];
  trendSignals: string[];
  source: "tavily" | "fallback";
};

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
