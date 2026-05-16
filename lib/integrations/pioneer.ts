import type { RoundResult, Recommendation } from "@/lib/types";

/**
 * Placeholder for a future fine-tuned reaction classifier.
 *
 * The natural next step for Crucible is to fine-tune a small model (e.g. via
 * Pioneer) that classifies each buyer reaction into {intent, objection,
 * confidence} and uses those structured outputs to rank the winning tribe and
 * surface the dominant objection. We did not ship a proper fine-tune for the
 * hackathon, so this wrapper is intentionally NOT wired into /api/finalize and
 * is exported only as a stub describing the integration surface. The current
 * demo uses deterministic ranking from the round results.
 */
export async function rankReactionsLive(
  _rounds: RoundResult[],
): Promise<Recommendation | null> {
  return null;
}
