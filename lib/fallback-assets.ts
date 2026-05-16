import type { LaunchAsset, ProductBrief, Tribe } from "@/lib/types";

function cleanSentence(value: string, fallback: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.replace(/[.!?]+$/g, "");
}

function shortPain(tribe: Tribe) {
  return cleanSentence(tribe.mainPain, "the launch bottleneck").slice(0, 72);
}

function shortPromise(brief: ProductBrief) {
  return cleanSentence(
    brief.keyPromise || brief.oneLiner || brief.description,
    "a faster way to validate demand",
  ).slice(0, 72);
}

export function buildFallbackAssetsForTribes(
  brief: ProductBrief,
  tribes: Tribe[],
): LaunchAsset[] {
  const promise = shortPromise(brief);

  return tribes.map((tribe, index) => {
    const pain = shortPain(tribe);
    const isTechnical =
      /dev|engineer|api|platform|product|builder/i.test(
        `${tribe.name} ${tribe.profile} ${tribe.mainPain}`,
      );
    const isCreative =
      /creative|agency|content|video|design|marketing/i.test(
        `${tribe.name} ${tribe.profile} ${tribe.mainPain}`,
      );
    const cta = isTechnical
      ? "View API demo"
      : isCreative
        ? "Generate first asset"
        : "See the proof";

    return {
      tribeId: tribe.id,
      hook:
        index === 0
          ? `${tribe.name}: validate demand before launch`
          : `Solve ${pain.toLowerCase()} before launch`,
      landingHeadline: `${promise} for ${tribe.name.toLowerCase()}`,
      cta,
      videoScript: `Open on a ${tribe.name.toLowerCase()} buyer hitting the pain: ${pain}.`,
      benefits: [`Targets ${tribe.name} with proof around: ${pain}`],
      dmReply: `Worth testing if ${pain.toLowerCase()} is your current bottleneck.`,
    };
  });
}
