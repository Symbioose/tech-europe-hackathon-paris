"use client";

import { motion } from "framer-motion";
import { RecommendationFourBlocks } from "@/components/RecommendationFourBlocks";
import { TribePlaybook } from "@/components/TribePlaybook";
import type { TavilyState } from "@/lib/session";
import type { BuyerAgent, LaunchAsset, Recommendation, RoundResult, SavedRunSummary, Tribe } from "@/lib/types";
import type { TavilyResult } from "@/lib/integrations/tavily";
import { marketSignalScore, overallMarketSignal } from "@/lib/market-score";

type Props = {
  recommendation: Recommendation;
  tribes: Tribe[];
  assets: LaunchAsset[];
  agents: BuyerAgent[];
  rounds: RoundResult[];
  tavily: TavilyState;
  videoUrl?: string;
  savedRuns?: SavedRunSummary[];
  onAskBuyer: (agentId: string, question: string) => void;
};

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function uniqueByHost(results: TavilyResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = hostOf(result.url) || result.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function FinalReport({
  recommendation,
  tribes,
  assets,
  agents,
  rounds,
  tavily,
  videoUrl,
  savedRuns = [],
  onAskBuyer,
}: Props) {
  const lastRound = rounds[rounds.length - 1];
  const winningTribe = tribes.find((tribe) => tribe.id === recommendation.winningTribeId);
  const winningAsset = assets.find((asset) => asset.tribeId === recommendation.winningTribeId);
  const trendSources = uniqueByHost([...(tavily.trends ?? []), ...(tavily.community ?? [])]).slice(0, 6);
  const competitorSources = uniqueByHost([...(tavily.competitors ?? []), ...(tavily.pricing ?? [])]).slice(0, 6);
  const sourceAnchors = buildSourceAnchors(tribes, tavily);
  const winningScore = lastRound?.tribeScores.find((score) => score.tribeId === recommendation.winningTribeId);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      className="h-full overflow-y-auto scroll-thin pr-2"
    >
      <div className="mx-auto max-w-6xl space-y-4 pb-8">
        <header className="rounded-2xl border border-white/12 bg-white/[0.055] backdrop-blur-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-flame-300">
                Final launch report
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-50">
                Target {winningTribe?.name ?? "the winning population"} first.
              </h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-300">
                Synthetic research is not proof. It helps you choose what to validate next
                with real buyers.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Rounds" value={String(rounds.length)} />
              <Metric
                label="Market signal"
                value={`${winningScore ? marketSignalScore(winningScore) : overallMarketSignal(lastRound)}/100`}
              />
              <Metric label="Sources" value={String(totalSources(tavily))} />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] gap-4">
          <RecommendationFourBlocks
            recommendation={recommendation}
            winningTribe={winningTribe}
            videoUrl={videoUrl}
            creativeUrl={winningAsset?.creativeUrl}
          />

          <div className="rounded-2xl border border-white/12 bg-white/[0.045] backdrop-blur-2xl p-5 space-y-4">
            <SectionTitle label="Market intelligence" badge="Tavily" />
            <InsightList title="Trends to ride" results={trendSources} empty="No live trend sources captured." />
            <InsightList
              title="Competitive pressure"
              results={competitorSources}
              empty="No live competitor sources captured."
              competitor
            />
          </div>
        </div>

        {recommendation.actionPlan ? (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] gap-4">
            <ValidationPlan plan={recommendation.actionPlan.validationPlan} />
            <RunComparison runs={savedRuns} currentScore={winningScore ? marketSignalScore(winningScore) : 0} />
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/12 bg-white/[0.045] backdrop-blur-2xl p-5">
          <SectionTitle label="Population playbook" badge="Sorted by signal" />
          <div className="mt-4">
            <TribePlaybook
              tribes={tribes}
              scores={lastRound?.tribeScores ?? []}
              breakdown={recommendation.tribeBreakdown}
              agents={agents}
              sourceAnchors={sourceAnchors}
              onAskBuyer={onAskBuyer}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function buildSourceAnchors(tribes: Tribe[], tavily: TavilyState): Record<string, string[]> {
  const lanes = [
    ...(tavily.product ?? []).map((item) => `Product page: ${item.title || hostOf(item.url)}`),
    ...(tavily.competitors ?? []).map((item) => `Competitor: ${item.title || hostOf(item.url)}`),
    ...(tavily.pricing ?? []).map((item) => `Pricing: ${item.title || hostOf(item.url)}`),
    ...(tavily.trends ?? []).map((item) => `Trend: ${item.title || hostOf(item.url)}`),
    ...(tavily.community ?? []).map((item) => `Community: ${item.title || hostOf(item.url)}`),
  ].filter(Boolean);

  return Object.fromEntries(
    tribes.map((tribe, index) => {
      const picked = lanes.length
        ? [lanes[index % lanes.length], lanes[(index + 3) % lanes.length], lanes[(index + 7) % lanes.length]]
        : ["Product page", "Market trend", "Competitive landscape"];
      return [tribe.id, Array.from(new Set(picked)).slice(0, 3)];
    }),
  );
}

function totalSources(tavily: TavilyState) {
  return [
    tavily.product,
    tavily.competitors,
    tavily.trends,
    tavily.pricing,
    tavily.community,
  ].reduce((sum, list) => sum + (list?.length ?? 0), 0);
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[82px] rounded-xl border border-white/10 bg-ink-950/45 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-ink-500">{label}</div>
      <div className="mt-0.5 text-xl font-semibold tabular-nums text-ink-50">{value}</div>
    </div>
  );
}

function SectionTitle({ label, badge }: { label: string; badge: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink-300">{label}</h2>
      <span className="rounded-md border border-ink-600 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-ink-400">
        {badge}
      </span>
    </div>
  );
}

function InsightList({
  title,
  results,
  empty,
  competitor,
}: {
  title: string;
  results: TavilyResult[];
  empty: string;
  competitor?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-flame-300">{title}</div>
      {results.length === 0 ? (
        <p className="text-[12px] text-ink-400">{empty}</p>
      ) : (
        <div className="space-y-2">
          {results.slice(0, 4).map((result, index) => (
            <div key={`${result.url}-${index}`} className="rounded-xl border border-white/8 bg-ink-950/35 p-3">
              <div className="flex items-start gap-2">
                {result.favicon ? (
                  <img src={result.favicon} alt="" className="mt-0.5 h-4 w-4 rounded-sm" />
                ) : null}
                <div className="min-w-0">
                  <div className="text-[12px] font-medium leading-snug text-ink-50 line-clamp-2">
                    {result.title}
                  </div>
                  <div className="mt-1 text-[11px] leading-snug text-ink-400 line-clamp-2">
                    {result.snippet}
                  </div>
                  <div className="mt-1.5 text-[9px] uppercase tracking-[0.14em] text-ink-500">
                    {hostOf(result.url)}
                  </div>
                </div>
              </div>
              {competitor && (
                <div className="mt-2 border-t border-white/8 pt-2 text-[11px] leading-snug text-plasma/90">
                  Positioning implication: prove speed, cost, and workflow fit against this alternative.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ValidationPlan({ plan }: { plan: NonNullable<Recommendation["actionPlan"]>["validationPlan"] }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.045] backdrop-blur-2xl p-5">
      <SectionTitle label="Validate with humans" badge={`${plan.interviewCount} interviews`} />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ActionList title="10 discovery questions" items={plan.discoveryQuestions} />
        <ActionList title="3 outbound messages" items={plan.outboundMessages} />
        <ActionList title="3 landing page angles" items={plan.landingPageAngles} />
        <ActionList title="3 ad tests" items={plan.adTests} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <DecisionCriteria title="Go criteria" items={plan.goCriteria} tone="go" />
        <DecisionCriteria title="No-go criteria" items={plan.noGoCriteria} tone="stop" />
      </div>
    </div>
  );
}

function ActionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-flame-300">{title}</div>
      <div className="space-y-1.5">
        {items.slice(0, title.startsWith("10") ? 10 : 3).map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-lg border border-white/8 bg-ink-950/35 px-3 py-2 text-[12px] leading-snug text-ink-100">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionCriteria({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "go" | "stop";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-950/35 p-3">
      <div className={tone === "go" ? "text-[10px] uppercase tracking-[0.18em] text-cyan" : "text-[10px] uppercase tracking-[0.18em] text-red-300"}>
        {title}
      </div>
      <div className="mt-2 space-y-1.5">
        {items.map((item) => (
          <div key={item} className="text-[12px] leading-snug text-ink-200">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function RunComparison({ runs, currentScore }: { runs: SavedRunSummary[]; currentScore: number }) {
  const previousRuns = runs.slice(0, 4);
  const previous = previousRuns.find((run) => run.marketSignalScore !== currentScore);
  const delta = previous ? currentScore - previous.marketSignalScore : 0;

  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.045] backdrop-blur-2xl p-5">
      <SectionTitle label="Saved run comparison" badge="Local" />
      <div className="mt-4 rounded-xl border border-white/10 bg-ink-950/45 p-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-ink-500">Current vs previous</div>
        <div className="mt-1 text-2xl font-semibold text-ink-50">
          {currentScore}/100
          {previous ? (
            <span className={delta >= 0 ? "ml-2 text-sm text-cyan" : "ml-2 text-sm text-red-300"}>
              {delta >= 0 ? "+" : ""}
              {delta}
            </span>
          ) : null}
        </div>
        <div className="mt-1 text-[11px] leading-snug text-ink-400">
          Saved locally so you can compare URL, message, segment, and round outcomes over time.
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {previousRuns.length === 0 ? (
          <div className="text-[12px] text-ink-400">No saved completed runs yet.</div>
        ) : (
          previousRuns.map((run) => (
            <div key={run.id} className="rounded-lg border border-white/8 bg-ink-950/35 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-ink-50">{run.productName}</div>
                  <div className="truncate text-[10.5px] text-ink-400">{run.winningTribe}</div>
                </div>
                <div className="text-right text-[13px] font-semibold tabular-nums text-flame-300">
                  {run.marketSignalScore}/100
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
