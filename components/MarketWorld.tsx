"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import type { BuyerAgent, Tribe } from "@/lib/types";
import { stateColor } from "@/lib/simulation";
import clsx from "clsx";

type Props = {
  agents: BuyerAgent[];
  tribes: Tribe[];
  selectedAgentId: string | null;
  onSelect: (id: string | null) => void;
  isWorking: boolean;
  currentRound: 0 | 1 | 2 | 3;
  stageLabel?: string;
};

export function MarketWorld({
  agents,
  tribes,
  selectedAgentId,
  onSelect,
  isWorking,
  currentRound,
  stageLabel,
}: Props) {
  const tribeMap = useMemo(() => new Map(tribes.map((t) => [t.id, t])), [tribes]);
  const tribeCenters = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const a of agents) {
      const cur = m.get(a.tribeId);
      if (!cur) {
        m.set(a.tribeId, { x: a.x, y: a.y });
      }
    }
    // Average per tribe.
    const sums = new Map<string, { x: number; y: number; n: number }>();
    for (const a of agents) {
      const cur = sums.get(a.tribeId) ?? { x: 0, y: 0, n: 0 };
      sums.set(a.tribeId, { x: cur.x + a.x, y: cur.y + a.y, n: cur.n + 1 });
    }
    const out = new Map<string, { x: number; y: number }>();
    for (const [id, s] of sums.entries()) {
      out.set(id, { x: s.x / s.n, y: s.y / s.n });
    }
    return out;
  }, [agents]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-ink-700/70 bg-ink-900/60 backdrop-blur-sm">
      <div className="absolute inset-0 bg-grid-fade pointer-events-none" />
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px] opacity-50 pointer-events-none" />

      {/* Tribe zone halos */}
      {Array.from(tribeCenters.entries()).map(([tribeId, c]) => {
        const tribe = tribeMap.get(tribeId);
        if (!tribe) return null;
        return (
          <div
            key={tribeId}
            className="absolute pointer-events-none"
            style={{
              left: `${c.x - 14}%`,
              top: `${c.y - 14}%`,
              width: "28%",
              height: "28%",
              background: `radial-gradient(circle at center, ${tribe.accent}22 0%, transparent 65%)`,
            }}
          />
        );
      })}

      {/* Tribe labels */}
      {Array.from(tribeCenters.entries()).map(([tribeId, c]) => {
        const tribe = tribeMap.get(tribeId);
        if (!tribe) return null;
        return (
          <motion.div
            key={`label-${tribeId}`}
            className="absolute pointer-events-none"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            style={{
              left: `${c.x}%`,
              top: `${c.y - 14}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="text-[11px] font-medium tracking-wide text-ink-400/90 px-2 py-1 rounded-md bg-ink-900/60 border border-ink-700/60 backdrop-blur whitespace-nowrap">
              <span className="mr-1">{tribe.emoji}</span>
              {tribe.name}
            </div>
          </motion.div>
        );
      })}

      {/* Agents */}
      <AnimatePresence>
        {agents.map((agent, i) => {
          const color = stateColor(agent.state);
          const isSelected = selectedAgentId === agent.id;
          const isHero = agent.isHero;
          return (
            <motion.button
              key={agent.id}
              layout
              type="button"
              onClick={() => onSelect(isSelected ? null : agent.id)}
              className={clsx(
                "absolute rounded-full transition-shadow",
                "focus:outline-none focus:ring-2 focus:ring-flame-400",
                isSelected && "z-30",
              )}
              style={{
                left: `${agent.x}%`,
                top: `${agent.y}%`,
                width: 14,
                height: 14,
                marginLeft: -7,
                marginTop: -7,
                background: color.fill,
                boxShadow: `0 0 0 2px ${color.ring}, 0 0 20px ${color.ring}`,
              }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{
                opacity: 1,
                scale: isSelected ? 1.5 : isHero ? 1.15 : 1,
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.012,
                type: "spring",
                stiffness: 220,
                damping: 18,
              }}
              aria-label={`${agent.name} — ${agent.role}`}
            >
              <span className="sr-only">{agent.name}</span>
              {isHero && (
                <motion.span
                  className="absolute inset-0 rounded-full ring-pulse"
                  style={{ boxShadow: `0 0 0 0 ${color.ring}` }}
                />
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Round overlay */}
      {agents.length > 0 && stageLabel && (
        <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400/80">
            Market
          </div>
          <div className="h-3 w-px bg-ink-600" />
          <div className="text-xs text-ink-400">{stageLabel}</div>
          {isWorking && (
            <div className="text-xs text-flame-300 ml-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-flame-400 animate-pulse" />
              simulating
            </div>
          )}
        </div>
      )}

      {/* Legend — only when agents are visible */}
      {agents.length > 0 && <Legend />}
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Converted", color: "#3affe9" },
    { label: "Curious", color: "#ffcf6b" },
    { label: "Saw it", color: "#6b7390" },
    { label: "Repelled", color: "#ff5470" },
  ];
  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-ink-900/70 border border-ink-700/60 backdrop-blur-sm z-20">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5 text-[11px] text-ink-400">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: it.color, boxShadow: `0 0 8px ${it.color}` }}
          />
          {it.label}
        </div>
      ))}
    </div>
  );
}
