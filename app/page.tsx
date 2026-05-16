"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/session";
import { TopBar } from "@/components/TopBar";
import { TribeColumn } from "@/components/TribeColumn";
import { MarketWorld3D } from "@/components/MarketWorld3D";
import { RightPanel } from "@/components/RightPanel";
import { BuyerDrawer } from "@/components/BuyerDrawer";
import { ActivityFeed } from "@/components/ActivityFeed";
import {
  LaunchSetup,
  type LaunchSetupValues,
  type TestType,
} from "@/components/LaunchSetup";
import type { Platform } from "@/lib/types";

const testTypeLabel: Record<TestType, string> = {
  customer_discovery: "Customer discovery",
  marketing_message: "Marketing message",
  landing_page: "Landing page",
  ad_creative: "Ad creative",
  pricing_objections: "Pricing and objections",
};

const defaultSetup: LaunchSetupValues = {
  testType: "marketing_message",
  productUrl: "https://fal.ai",
  productNote: "",
  targetMarket: "",
  platform: "auto",
  assetMode: "generate",
  assetText: "",
};

export default function Page() {
  const { view, actions } = useSession();
  const [setup, setSetup] = useState<LaunchSetupValues>(defaultSetup);
  const [hasLaunched, setHasLaunched] = useState(false);
  const {
    stage,
    session,
    currentRound,
    selectedAgentId,
    prefilledQuestion,
    isWorking,
    signals,
    feed,
    tavily,
    regenState,
    videoUrl,
  } = view;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("stage")) setHasLaunched(true);
  }, []);

  const selectedAgent = useMemo(
    () => session.agents.find((a) => a.id === selectedAgentId) ?? null,
    [session.agents, selectedAgentId],
  );
  const selectedTribe = useMemo(
    () =>
      selectedAgent
        ? session.tribes.find((t) => t.id === selectedAgent.tribeId) ?? null
        : null,
    [selectedAgent, session.tribes],
  );

  const tribesVisible = stage !== "idle" && stage !== "researching";
  const winnerId = session.recommendation?.winningTribeId;
  const lastRoundScores = session.rounds[session.rounds.length - 1]?.tribeScores ?? [];

  function handleRun(url: string, platform: Platform) {
    if (stage === "idle" || stage === "winner_ready") {
      setHasLaunched(true);
      actions.reset();
      const next: LaunchSetupValues = { ...setup, productUrl: url, platform };
      setSetup(next);
      // Slight delay so reset takes effect.
      setTimeout(() => actions.start(next), 20);
    }
  }

  function handleLaunch(nextSetup: LaunchSetupValues) {
    setSetup(nextSetup);
    setHasLaunched(true);
    actions.reset();
    setTimeout(() => actions.start(nextSetup), 20);
  }

  function handleAdvance() {
    if (stage === "tribes_ready") {
      actions.runRound(1);
      return;
    }
    if (stage === "round_active") {
      actions.runRound(currentRound + 1);
      return;
    }
  }

  function handleFinish() {
    if (stage === "round_active") {
      actions.revealRecommendation();
    }
  }

  if (!hasLaunched && stage === "idle") {
    return <LaunchSetup onLaunch={handleLaunch} />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        onRun={handleRun}
        initialUrl={setup.productUrl}
        initialPlatform={setup.platform}
        disabled={stage !== "idle" && stage !== "winner_ready"}
        busyLabel={
          stage === "researching"
            ? "Researching…"
            : stage === "winner_ready"
            ? "Run again"
            : undefined
        }
      />

      <main className="flex-1 px-6 py-5 grid gap-5 [grid-template-columns:330px_1fr_380px] grid-rows-[minmax(0,1fr)] min-h-0 overflow-hidden">
        <TribeColumn
          tribes={session.tribes}
          scores={lastRoundScores}
          assets={session.assets}
          agents={session.agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={actions.selectAgent}
          winnerId={winnerId}
          visible={tribesVisible}
          regenState={regenState}
        />

        <div className="relative overflow-hidden min-h-0 h-full">
          <div className="absolute left-4 right-4 top-4 z-20 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
            <ContextPill label="Testing" value={testTypeLabel[setup.testType]} />
            <ContextPill label="Product" value={setup.productUrl.replace(/^https?:\/\//, "")} />
            <ContextPill
              label="Assets"
              value={setup.assetMode === "generate" ? "Generated variants" : "Provided creative"}
            />
          </div>

          <MarketWorld3D
            agents={stage === "idle" || stage === "researching" ? [] : session.agents}
            tribes={session.tribes}
            selectedAgentId={selectedAgentId}
            onSelect={actions.selectAgent}
            isWorking={isWorking}
            currentRound={currentRound}
            stageLabel={
              stage === "researching"
                ? "Researching market"
                : stage === "tribes_ready"
                ? "Awaiting first launch"
                : `Round ${currentRound}`
            }
          />
        </div>

        <RightPanel
          stage={stage}
          signals={signals}
          rounds={session.rounds}
          currentRound={currentRound}
          tribes={session.tribes}
          assets={session.assets}
          agents={session.agents}
          recommendation={session.recommendation}
          isWorking={isWorking}
          onAdvance={handleAdvance}
          onFinish={handleFinish}
          onReset={actions.reset}
          onAskBuyer={actions.askBuyer}
          tavily={tavily}
          videoUrl={videoUrl}
        />
      </main>

      <BuyerDrawer
        agent={selectedAgent}
        tribe={selectedTribe}
        onClose={() => actions.selectAgent(null)}
        hookSeen={
          selectedTribe
            ? session.assets.find((a) => a.tribeId === selectedTribe.id)?.hook
            : undefined
        }
        prefilledQuestion={prefilledQuestion}
      />

      <ActivityFeed
        messages={feed}
        tribes={session.tribes}
        onAgentClick={(id) => actions.selectAgent(id)}
      />
    </div>
  );
}

function ContextPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="max-w-[260px] rounded-lg border border-white/15 px-3 py-1.5"
      style={{
        background: "rgba(10,12,22,0.55)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <span className="text-[9px] uppercase tracking-[0.22em] text-ink-500">{label}</span>
      <span className="ml-2 text-[11px] text-ink-100">{value}</span>
    </div>
  );
}
