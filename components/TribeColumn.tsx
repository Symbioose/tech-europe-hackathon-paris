"use client";

import { motion } from "framer-motion";
import { TribeCard } from "./TribeCard";
import type { Tribe, TribeScore } from "@/lib/types";

type Props = {
  tribes: Tribe[];
  scores: TribeScore[];
  winnerId?: string;
  visible: boolean;
};

export function TribeColumn({ tribes, scores, winnerId, visible }: Props) {
  const scoreMap = new Map(scores.map((s) => [s.tribeId, s]));

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
          ? tribes.map((t, i) => (
              <TribeCard
                key={t.id}
                tribe={t}
                score={scoreMap.get(t.id)}
                isWinner={t.id === winnerId}
                index={i}
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
