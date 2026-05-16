"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TribeCard } from "./TribeCard";
import type { BuyerAgent, Tribe, TribeScore, LaunchAsset } from "@/lib/types";
import { marketSignalScore } from "@/lib/market-score";

type Props = {
  tribes: Tribe[];
  scores: TribeScore[];
  assets: LaunchAsset[];
  agents: BuyerAgent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  winnerId?: string;
  visible: boolean;
  regenState?: Record<string, { isRegenerating: boolean; oldHook?: string; newHook?: string }>;
};

export function TribeColumn({
  tribes,
  scores,
  assets,
  agents,
  selectedAgentId,
  onSelectAgent,
  winnerId,
  visible,
  regenState,
}: Props) {
  const scoreMap = useMemo(() => new Map(scores.map((s) => [s.tribeId, s])), [scores]);
  const sortedTribes = useMemo(() => {
    if (scores.length === 0) return tribes;
    const rank = new Map(scores.map((score, index) => [score.tribeId, index]));
    return [...tribes].sort((a, b) => {
      const aScore = marketSignalScore(scoreMap.get(a.id));
      const bScore = marketSignalScore(scoreMap.get(b.id));
      if (bScore !== aScore) return bScore - aScore;
      return (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999);
    });
  }, [tribes, scores, scoreMap]);
  const agentsByTribe = useMemo(() => {
    const map = new Map<string, BuyerAgent[]>();
    for (const a of agents) {
      const list = map.get(a.tribeId) ?? [];
      list.push(a);
      map.set(a.tribeId, list);
    }
    return map;
  }, [agents]);

  const [expandedTribeId, setExpandedTribeId] = useState<string | null>(null);

  // Auto-expand the tribe containing the currently selected agent.
  useEffect(() => {
    if (!selectedAgentId) return;
    const agent = agents.find((a) => a.id === selectedAgentId);
    if (agent) setExpandedTribeId(agent.tribeId);
  }, [selectedAgentId, agents]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-1 pb-2 flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
          Customer tribes
        </h2>
        <span className="text-[11px] text-ink-400 tabular-nums">{tribes.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin pr-1 space-y-2.5">
        {visible
          ? sortedTribes.map((t, i) => (
              <TribeCard
                key={t.id}
                tribe={t}
                score={scoreMap.get(t.id)}
                isWinner={t.id === winnerId}
                index={i}
                creativeUrl={assets.find((a) => a.tribeId === t.id)?.creativeUrl}
                isRegenerating={regenState?.[t.id]?.isRegenerating}
                oldHook={regenState?.[t.id]?.oldHook}
                newHook={regenState?.[t.id]?.newHook}
                agents={agentsByTribe.get(t.id) ?? []}
                isExpanded={expandedTribeId === t.id}
                onToggleExpand={() =>
                  setExpandedTribeId((prev) => (prev === t.id ? null : t.id))
                }
                selectedAgentId={selectedAgentId}
                onSelectAgent={onSelectAgent}
              />
            ))
          : Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.55, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
                className="h-[92px] rounded-xl border border-ink-700/50 bg-ink-850/60"
              />
            ))}
      </div>
    </div>
  );
}
