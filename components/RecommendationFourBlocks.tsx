"use client";

import type { Recommendation, Tribe } from "@/lib/types";

type Props = {
  recommendation: Recommendation;
  winningTribe?: Tribe;
  videoUrl?: string;
  creativeUrl?: string;
};

export function RecommendationFourBlocks({
  recommendation,
  winningTribe,
  videoUrl,
  creativeUrl,
}: Props) {
  const plan = recommendation.actionPlan;
  const winningBreakdown = recommendation.tribeBreakdown?.find(
    (item) => item.tribeId === recommendation.winningTribeId,
  );
  const validationQuestions = plan?.validationPlan.discoveryQuestions.slice(0, 5) ??
    winningBreakdown?.suggestedQuestions?.slice(0, 3) ?? [];

  return (
    <div className="rounded-2xl border border-flame-500/30 bg-ink-950/80 backdrop-blur-md p-5 space-y-5 relative">
      <div className="absolute top-3 right-3 text-right">
        <div className="text-[10px] uppercase tracking-[0.18em] text-plasma">
          Synthetic confidence · {plan?.confidenceLevel ?? "Medium"}
        </div>
        <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.14em] text-ink-500">
          Not proof · validate with humans
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
        label="Decision"
        value={plan?.targetFirst ?? `Target ${winningTribe?.name ?? recommendation.winningTribeId} first.`}
        detail={`Use this hook: ${plan?.useHook ?? recommendation.winningHook}`}
      />
      <Block
        label="Why this segment won"
        value={recommendation.whyItWon}
        detail={`Avoid this objection: ${plan?.avoidObjection ?? recommendation.objectionToAvoid}`}
      />
      <Block
        label="Landing page test"
        value={recommendation.landingHeadline}
        detail={`CTA: ${recommendation.cta}`}
      />
      <Block
        label="Validate with humans"
        value={plan?.validateWith ?? `Interview 5 buyers from ${winningTribe?.name ?? "the winning population"}.`}
        detail={validationQuestions.length ? `Ask: ${validationQuestions.join(" · ")}` : ""}
      />

      {plan?.next48Hours?.length ? (
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-flame-300 mb-2">
            Next 48 hours
          </div>
          <div className="space-y-2">
            {plan.next48Hours.map((action, index) => (
              <div
                key={action}
                className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-[12px] leading-snug text-ink-100"
              >
                <span className="text-flame-300 tabular-nums">{index + 1}</span>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Block
        label="Transparency"
        value="Synthetic research is not proof."
        detail="It helps you choose what to validate next with real buyers."
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
