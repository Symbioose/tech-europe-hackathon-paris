"use client";

import { useMemo } from "react";
import { useSession } from "@/lib/session";
import { TopBar } from "@/components/TopBar";
import { TribeColumn } from "@/components/TribeColumn";
import { MarketWorld3D } from "@/components/MarketWorld3D";
import { RightPanel } from "@/components/RightPanel";
import { BuyerDrawer } from "@/components/BuyerDrawer";
import { ActivityFeed } from "@/components/ActivityFeed";
import type { Platform } from "@/lib/types";

export default function Page() {
  const { view, actions } = useSession();
  const {
    stage,
    session,
    currentRound,
    selectedAgentId,
    isWorking,
    signals,
    feed,
  } = view;

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

  function handleRun(url: string, _platform: Platform) {
    if (stage === "idle" || stage === "winner_ready") {
      actions.reset();
      // Slight delay so reset takes effect.
      setTimeout(() => actions.start(url), 20);
    }
  }

  function handleAdvance() {
    if (stage === "tribes_ready") {
      actions.runRound(1);
      return;
    }
    if (stage === "round_1") {
      actions.runRound(2);
      return;
    }
    if (stage === "round_2") {
      actions.runRound(3);
      return;
    }
    if (stage === "round_3") {
      actions.revealRecommendation();
      return;
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        onRun={handleRun}
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
          winnerId={winnerId}
          visible={tribesVisible}
        />

        <div className="relative overflow-hidden min-h-0 h-full">
          <MarketWorld3D
            agents={stage === "idle" || stage === "researching" ? [] : session.agents}
            tribes={session.tribes}
            selectedAgentId={selectedAgentId}
            onSelect={actions.selectAgent}
            isWorking={isWorking}
            currentRound={currentRound}
            stageLabel={
              stage === "idle"
                ? ""
                : stage === "researching"
                ? "Researching market"
                : stage === "tribes_ready"
                ? "Awaiting first launch"
                : `Round ${currentRound} of 3`
            }
          />

          {stage === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
              <div className="text-[11px] uppercase tracking-[0.22em] text-ink-400 mb-2">
                Self-improving launch agent
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">
                One product in. <span className="text-flame-300">One decision out.</span>
              </h1>
              <p className="text-ink-300 mt-3 max-w-[520px] leading-relaxed">
                Crucible builds 7 customer tribes, generates 7 launch campaigns, and runs them
                through 70 simulated buyers — then learns from failure across 3 rounds and converges
                on one launch decision.
              </p>
              <div className="mt-4 flex items-center gap-3 text-[12px] text-ink-400">
                <Pill>7 tribes</Pill>
                <Pill>70 buyers</Pill>
                <Pill>3 rounds</Pill>
                <Pill highlight>1 launch decision</Pill>
              </div>
            </div>
          )}
        </div>

        <RightPanel
          stage={stage}
          signals={signals}
          rounds={session.rounds}
          currentRound={currentRound}
          tribes={session.tribes}
          assets={session.assets}
          recommendation={session.recommendation}
          isWorking={isWorking}
          onAdvance={handleAdvance}
          onReset={actions.reset}
        />
      </main>

      <BuyerDrawer
        agent={selectedAgent}
        tribe={selectedTribe}
        onClose={() => actions.selectAgent(null)}
      />

      <ActivityFeed
        messages={feed}
        tribes={session.tribes}
        onAgentClick={(id) => actions.selectAgent(id)}
      />
    </div>
  );
}

function Pill({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <span
      className={
        "px-2.5 py-1 rounded-md border " +
        (highlight
          ? "border-flame-500/60 bg-flame-900/30 text-flame-200"
          : "border-ink-700 bg-ink-850 text-ink-300")
      }
    >
      {children}
    </span>
  );
}
