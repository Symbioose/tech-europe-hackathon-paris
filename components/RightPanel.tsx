"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { AppStage, LaunchAsset, RoundResult, Tribe, Recommendation } from "@/lib/types";
import type { TavilyState } from "@/lib/session";
import { TavilyOrchestrator } from "@/components/TavilyOrchestrator";
import { RecommendationFourBlocks } from "@/components/RecommendationFourBlocks";
import clsx from "clsx";

type Props = {
  stage: AppStage;
  signals: string[];
  rounds: RoundResult[];
  currentRound: 0 | 1 | 2 | 3;
  tribes: Tribe[];
  assets: LaunchAsset[];
  recommendation?: Recommendation;
  isWorking: boolean;
  onAdvance: () => void;
  onReset: () => void;
  tavily: TavilyState;
  videoUrl?: string;
};

export function RightPanel({
  stage,
  signals,
  rounds,
  currentRound,
  tribes,
  assets,
  recommendation,
  isWorking,
  onAdvance,
  onReset,
  tavily,
  videoUrl,
}: Props) {
  const overall = rounds[rounds.length - 1]?.overallConversion ?? 0;
  const tribeMap = new Map(tribes.map((t) => [t.id, t]));

  // Find which asset matches the highlighted tribe for the current round.
  const focusTribeId =
    recommendation?.winningTribeId ??
    rounds[rounds.length - 1]?.tribeScores
      .slice()
      .sort((a, b) => b.conversionRate - a.conversionRate)[0]?.tribeId;
  const focusAsset = focusTribeId ? assets.find((a) => a.tribeId === focusTribeId) : assets[0];
  const focusTribe = focusTribeId ? tribeMap.get(focusTribeId) : undefined;

  const lastRound = rounds[rounds.length - 1];

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* Metrics header */}
      <div className="rounded-xl border border-white/12 bg-white/5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-400">
              Conversion
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <motion.span
                key={overall}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-semibold tabular-nums"
                style={{ color: overall >= 0.3 ? "#3affe9" : overall >= 0.15 ? "#ffcf6b" : "#e9ecf6" }}
              >
                {Math.round(overall * 100)}%
              </motion.span>
              {rounds.length > 0 && (
                <span className="text-[11px] text-ink-400">
                  across 70 buyers
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-400">Round</div>
            <div className="text-2xl font-semibold tabular-nums text-flame-300">
              {currentRound}/3
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          {[1, 2, 3].map((n) => {
            const r = rounds.find((x) => x.round === n);
            return (
              <div
                key={n}
                className="flex-1 h-1.5 rounded-full bg-ink-700/80 overflow-hidden"
              >
                <motion.div
                  className="h-full"
                  style={{
                    background:
                      n === 3 ? "#3affe9" : n === 2 ? "#ffcf6b" : "#ff7a1a",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: r ? `${Math.min(100, r.overallConversion * 100 * 3)}%` : "0%" }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Action button */}
      <ActionButton
        stage={stage}
        currentRound={currentRound}
        isWorking={isWorking}
        onAdvance={onAdvance}
        onReset={onReset}
      />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scroll-thin space-y-3 pr-1 min-h-0">
        {/* Recommendation first when present */}
        <AnimatePresence>
          {recommendation && (
            <motion.div
              key="rec-top"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <RecommendationFourBlocks
                recommendation={recommendation}
                winningTribe={tribes.find((t) => t.id === recommendation.winningTribeId)}
                videoUrl={videoUrl}
                creativeUrl={assets.find((a) => a.tribeId === recommendation.winningTribeId)?.creativeUrl}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Market intelligence */}
        {stage !== "idle" && (
          <Panel title="Market intelligence" badge="Tavily">
            <TavilyOrchestrator
              product={tavily.product}
              competitors={tavily.competitors}
              trends={tavily.trends}
            />
          </Panel>
        )}

        {/* Learning */}
        <AnimatePresence>
          {lastRound && (
            <motion.div
              key={`learning-${lastRound.round}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <Panel title={`Round ${lastRound.round} learning`} badge="OpenAI">
                <p className="text-[12.5px] leading-relaxed text-ink-200">
                  {lastRound.learning}
                </p>
                {lastRound.highlights.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-plasma/80 mb-1">
                      What worked
                    </div>
                    <ul className="space-y-1">
                      {lastRound.highlights.map((h) => (
                        <li key={h} className="text-[12px] text-ink-300 pl-3 relative">
                          <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-plasma" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {lastRound.failures.length > 0 && (
                  <div className="mt-2.5">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-flame-300/80 mb-1">
                      What failed
                    </div>
                    <ul className="space-y-1">
                      {lastRound.failures.map((f) => (
                        <li key={f} className="text-[12px] text-ink-300 pl-3 relative">
                          <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-flame-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top asset preview */}
        {focusAsset && focusTribe && (
          <Panel
            title={`Hook · ${focusTribe.name}`}
            badge={`R${currentRound > 0 ? currentRound : 1}`}
          >
            <motion.div
              key={`hook-${focusAsset.tribeId}-${currentRound}-${focusAsset.hook}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[13px] leading-snug text-ink-50 font-medium"
            >
              "{focusAsset.hook}"
            </motion.div>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              <KV k="Landing" v={focusAsset.landingHeadline} />
              <KV k="CTA" v={focusAsset.cta} />
            </div>
          </Panel>
        )}

      </div>

      {/* Sponsor strip pinned bottom */}
      <div className="pt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-ink-400 px-1">
        <span>Powered by</span>
        <span className="flex items-center gap-2">
          <span>OpenAI</span>
          <span>·</span>
          <span>Tavily</span>
          <span>·</span>
          <span>fal</span>
          <span>·</span>
          <span>Gradium</span>
        </span>
      </div>
    </div>
  );
}

function ActionButton({
  stage,
  currentRound,
  isWorking,
  onAdvance,
  onReset,
}: {
  stage: AppStage;
  currentRound: 0 | 1 | 2 | 3;
  isWorking: boolean;
  onAdvance: () => void;
  onReset: () => void;
}) {
  let label = "Run Round 1";
  let helper = "Broad exploration across all 7 tribes";
  let tone: "primary" | "ready" | "winner" = "primary";

  if (stage === "idle") return null;

  if (stage === "researching") {
    label = "Researching…";
    helper = "Reading the product and preparing buyer tribes";
  } else if (stage === "tribes_ready") {
    label = "Run Round 1";
    helper = "Explore every tribe with the first campaign set";
  } else if (stage === "round_1") {
    label = "Run Round 2";
    helper = "Rewrite weak hooks from the first reactions";
    tone = "ready";
  } else if (stage === "round_2") {
    label = "Run Round 3";
    helper = "Focus on the strongest tribe and objection";
    tone = "ready";
  } else if (stage === "round_3") {
    label = "Reveal recommendation";
    helper = "Synthesize the launch decision";
    tone = "winner";
  } else if (stage === "winner_ready") {
    label = "Restart simulation";
    helper = "Reset agents and try another product";
    tone = "winner";
  }

  const disabled = isWorking || stage === "researching";

  return (
    <motion.button
      onClick={stage === "winner_ready" ? onReset : onAdvance}
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      className={clsx(
        "w-full px-4 py-3 rounded-xl text-left transition-all border",
        disabled
          ? "bg-white/[0.06] border-ink-700/70 cursor-not-allowed"
          : tone === "winner"
          ? "bg-gradient-to-r from-plasma/15 to-flame-500/15 border-plasma/40 hover:border-plasma"
          : tone === "ready"
          ? "bg-white/[0.06] border-ink-700 hover:border-flame-500"
          : "bg-white/[0.06] border-ink-700 hover:border-flame-500",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={clsx(
            "font-medium text-sm",
            isWorking ? "text-ink-400" : "text-ink-50",
          )}
        >
          {label}
        </span>
        {!disabled && (
          <span className="text-flame-300 text-lg leading-none">→</span>
        )}
        {disabled && (
          <span className="inline-block w-2 h-2 rounded-full bg-flame-400 animate-pulse" />
        )}
      </div>
      <div className="text-[11px] text-ink-400 mt-0.5">{helper}</div>
    </motion.button>
  );
}

function Panel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/12 bg-white/5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-ink-700/60">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-ink-400">{title}</h3>
        {badge && (
          <span className="text-[9px] uppercase tracking-[0.18em] text-ink-400 border border-ink-600 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <div className="px-3.5 py-3">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-[11.5px]">
      <span className="text-ink-400">{k}: </span>
      <span className="text-ink-200">{v}</span>
    </div>
  );
}

function SignalsLoading() {
  return (
    <div className="space-y-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-3.5 rounded shimmer bg-ink-700/40"
          style={{ width: `${70 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

