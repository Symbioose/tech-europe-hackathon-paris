import type { LaunchAsset, ProductBrief, Tribe } from "@/lib/types";

function cleanSentence(value: string, fallback: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.replace(/[.!?]+$/g, "");
}

function shortPain(tribe: Tribe) {
  return cleanSentence(tribe.mainPain, "the launch bottleneck").slice(0, 72);
}

function promiseFor(brief: ProductBrief) {
  return cleanSentence(
    brief.keyPromise || brief.oneLiner || brief.description,
    "Validate demand before spending a launch cycle",
  );
}

function hookFor(tribe: Tribe, pain: string) {
  const text = `${tribe.name} ${tribe.profile} ${tribe.mainPain}`.toLowerCase();
  if (text.includes("dev") || text.includes("engineer") || text.includes("api")) {
    return `${pain.slice(0, 46)} without another roadmap detour`;
  }
  if (text.includes("agency") || text.includes("client")) {
    return `${pain.slice(0, 46)} before the client asks again`;
  }
  if (text.includes("founder") || text.includes("startup")) {
    return `${pain.slice(0, 46)} before launch week`;
  }
  return `${pain.slice(0, 58)} should not block launch`;
}

export function buildAssetsForTribes(
  brief: ProductBrief,
  tribes: Tribe[],
): LaunchAsset[] {
  return tribes.map((tribe) => {
    const pain = shortPain(tribe);
    const text = `${tribe.name} ${tribe.profile} ${tribe.mainPain}`.toLowerCase();
    const isTechnical = /dev|engineer|api|platform|product|builder/.test(text);
    const isCreative = /creative|agency|content|video|design|marketing/.test(text);
    const cta = isTechnical
      ? "View technical proof"
      : isCreative
        ? "See example output"
        : "See the proof";

    return {
      tribeId: tribe.id,
      hook: hookFor(tribe, pain),
      landingHeadline: `${promiseFor(brief)} for ${tribe.name.toLowerCase()}`,
      cta,
      videoScript: `Open on a ${tribe.name.toLowerCase()} buyer hitting the pain: ${pain}.`,
      benefits: [`Targets ${tribe.name} with proof around: ${pain}`],
      dmReply: `Worth testing if ${pain.toLowerCase()} is your current bottleneck.`,
    };
  });
}
