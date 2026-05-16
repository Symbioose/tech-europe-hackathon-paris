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
  return (
    <div className="rounded-2xl border border-flame-500/30 bg-ink-950/80 backdrop-blur-md p-5 space-y-5 relative">
      <div className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.18em] text-plasma">
        Synthetic confidence · ~{confidencePct}%
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
        label="Who to target"
        value={winningTribe?.name ?? recommendation.winningTribeId}
        detail={winningTribe?.profile ?? ""}
      />
      <Block
        label="What to say"
        value={recommendation.winningHook}
        detail={recommendation.whyItWon}
      />
      <Block
        label="Where to send them"
        value={recommendation.landingHeadline}
        detail={`CTA: ${recommendation.cta}`}
      />
      <Block
        label="What objection to avoid"
        value={recommendation.objectionToAvoid}
        detail=""
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
