"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { BuyerAgent, Tribe, TribeScore } from "@/lib/types";
import clsx from "clsx";
import { stateColor } from "@/lib/simulation";
import { RegenerationOverlay } from "./RegenerationOverlay";
import { marketSignalScore } from "@/lib/market-score";

type Props = {
  tribe: Tribe;
  score?: TribeScore;
  isWinner: boolean;
  index: number;
  creativeUrl?: string;
  isRegenerating?: boolean;
  oldHook?: string;
  newHook?: string;
  agents?: BuyerAgent[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
};

const platformLabel: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  linkedin: "LI",
  auto: "AUTO",
};

export function TribeCard({
  tribe,
  score,
  isWinner,
  index,
  creativeUrl,
  isRegenerating,
  oldHook,
  newHook,
  agents,
  isExpanded,
  onToggleExpand,
  selectedAgentId,
  onSelectAgent,
}: Props) {
  const signal = marketSignalScore(score);
  const expandable = (agents?.length ?? 0) > 0 && !!onToggleExpand;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      onClick={() => onToggleExpand?.()}
      className={clsx(
        "group relative rounded-xl border backdrop-blur-2xl p-3.5 transition-all",
        expandable && "cursor-pointer",
        isWinner
          ? "border-flame-400/70 shadow-glow"
          : "border-white/12 hover:border-white/25",
      )}
      style={{
        background: isWinner
          ? "linear-gradient(135deg, rgba(255,122,26,0.14), rgba(255,255,255,0.04))"
          : "rgba(255,255,255,0.05)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {isWinner && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-2 right-3 text-[10px] uppercase tracking-[0.16em] text-flame-300 bg-flame-900/90 border border-flame-600/60 px-2 py-0.5 rounded-md"
        >
          Winner
        </motion.div>
      )}

      {/* Creative image slot — 16:9, shimmer while loading */}
      <div className="mb-3 relative w-full aspect-video rounded-lg overflow-hidden border border-white/10">
        {creativeUrl ? (
          <img
            src={creativeUrl}
            alt={`${tribe.name} ad creative`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-ink-800/80 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          </div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ background: `${tribe.accent}1f`, boxShadow: `inset 0 0 0 1px ${tribe.accent}55` }}
        >
          <span>{tribe.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink-50 truncate">
              {tribe.name}
            </h3>
            <span className="text-[9px] font-mono uppercase tracking-wider text-ink-400 border border-ink-600 px-1.5 py-0.5 rounded">
              {platformLabel[tribe.platform] ?? "AUTO"}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-ink-400 line-clamp-2">
            {tribe.mainPain}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-400">
            Market signal
          </div>
          <div
            className="text-xl font-semibold tabular-nums"
            style={{ color: signal >= 58 ? "#3affe9" : signal >= 42 ? "#ffcf6b" : "#e9ecf6" }}
          >
            {signal}
          </div>
        </div>
        <div className="flex-1 max-w-[110px] h-1.5 rounded-full bg-ink-700/80 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: tribe.accent }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, signal)}%` }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        </div>
      </div>

      <RegenerationOverlay
        isRegenerating={isRegenerating ?? false}
        oldHook={oldHook}
        newHook={newHook}
      />

      {expandable && (
        <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-ink-400">
          <span>{agents!.length} buyers</span>
          <span className="text-ink-300">{isExpanded ? "Hide ▴" : "Show ▾"}</span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {expandable && isExpanded && (
          <motion.ul
            key="agents"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-2 -mx-1 overflow-hidden"
          >
            <div className="space-y-1 px-1 pt-1">
              {agents!.map((agent) => {
                const sc = stateColor(agent.state);
                const isSelected = selectedAgentId === agent.id;
                return (
                  <li key={agent.id}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAgent?.(agent.id);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                        isSelected
                          ? "bg-white/[0.10] border border-white/25"
                          : "border border-transparent hover:bg-white/[0.05]",
                      )}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: sc.fill,
                          boxShadow: `0 0 6px ${sc.fill}80`,
                        }}
                        aria-label={sc.label}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[11.5px] text-ink-100 truncate">
                          {agent.name}
                          {agent.isHero && (
                            <span className="ml-1 text-[9px] uppercase tracking-wider text-flame-300">
                              hero
                            </span>
                          )}
                        </span>
                        <span className="block text-[10px] text-ink-400 truncate">
                          {agent.role}
                        </span>
                      </span>
                      <span
                        className="text-[9px] uppercase tracking-[0.14em] shrink-0"
                        style={{ color: sc.fill }}
                      >
                        {sc.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
