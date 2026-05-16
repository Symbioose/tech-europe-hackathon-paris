import type { RoundResult, Recommendation } from "@/lib/types";

/**
 * Placeholder for a future fine-tuned reaction classifier.
 *
 * The natural next step for Crucible is to fine-tune a small model that
 * classifies each buyer reaction into {intent, objection, confidence}. This
 * wrapper is intentionally not wired into the app yet; the current version
 * ranks populations from round results and market-signal scoring.
 */
export async function rankReactionsLive(
  _rounds: RoundResult[],
): Promise<Recommendation | null> {
  return null;
}
