import type { RoundResult, Recommendation } from "@/lib/types";

export async function pioneerRank(
  rounds: RoundResult[],
): Promise<Recommendation | null> {
  const key = process.env.PIONEER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.pioneer.dev/v1/rank", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ rounds }),
    });
    if (!res.ok) return null;
    return (await res.json()) as Recommendation;
  } catch {
    return null;
  }
}
