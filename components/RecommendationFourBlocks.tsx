"use client";

import type { Recommendation, Tribe } from "@/lib/types";

type Props = {
  recommendation: Recommendation;
  winningTribe?: Tribe;
  videoUrl?: string;
  creativeUrl?: string;
  confidencePct?: number; // default 85
};

export function RecommendationFourBlocks({
  recommendation,
  winningTribe,
  videoUrl,
  creativeUrl,
  confidencePct = 85,
}: Props) {
  const winningBreakdown = recommendation.tribeBreakdown?.find(
    (item) => item.tribeId === recommendation.winningTribeId,
  );
  const runnerUp = recommendation.tribeBreakdown?.find(
    (item) =>
      item.tribeId !== recommendation.winningTribeId &&
      (item.verdict === "strong" || item.verdict === "refine"),
  );
  const validationQuestions =
    winningBreakdown?.suggestedQuestions?.slice(0, 2) ??
    [
      "What proof would make this feel safe to try?",
      "What wording would you use to describe this pain?",
    ];

  return (
    <div className="rounded-2xl border border-flame-500/30 bg-ink-950/80 backdrop-blur-md p-5 space-y-5 relative">
      <div className="absolute top-3 right-3 text-right">
        <div className="text-[10px] uppercase tracking-[0.18em] text-plasma">
          Synthetic confidence · ~{confidencePct}%
        </div>
        <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.14em] text-ink-500">
          Validate with real interviews
        </div>
      </div>

      {(videoUrl || creativeUrl) && (
        <div className="rounded-lg overflow-hidden">
          {videoUrl ? (
            <video src={videoUrl} autoPlay muted loop playsInline className="w-full" />
          ) : creativeUrl ? (
            <img src={creativeUrl} alt="" className="w-full ken-burns" />
          ) : null}
        </div>
      )}

      <Block
        label="Best population to target first"
        value={winningTribe?.name ?? recommendation.winningTribeId}
        detail={winningTribe?.profile ?? ""}
      />
      <Block
        label="Winning message"
        value={recommendation.winningHook}
        detail={recommendation.whyItWon}
      />
      <Block
        label="Landing page / CTA"
        value={recommendation.landingHeadline}
        detail={`CTA: ${recommendation.cta}`}
      />
      <Block
        label="Main objection to avoid"
        value={recommendation.objectionToAvoid}
        detail=""
      />
      <Block
        label="Next action"
        value={recommendation.nextAction}
        detail=""
      />
      <Block
        label="Market focus"
        value={`SOM: start with ${winningTribe?.name ?? recommendation.winningTribeId}`}
        detail={`TAM: all possible category buyers · SAM: populations matching the product promise · SOM: the first reachable segment to validate now.`}
      />
      <Block
        label="Validation next step"
        value={`Interview 5 buyers from ${winningTribe?.name ?? "the winning population"}${runnerUp ? " and 3 from the strongest runner-up" : ""}.`}
        detail={`Ask: ${validationQuestions.join(" · ")}`}
      />
    </div>
  );
}

function Block({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-flame-300 mb-1">{label}</div>
      <div className="text-base font-semibold text-ink-50 leading-snug">{value}</div>
      {detail && <div className="mt-1 text-xs text-ink-400 leading-relaxed">{detail}</div>}
    </div>
  );
}
