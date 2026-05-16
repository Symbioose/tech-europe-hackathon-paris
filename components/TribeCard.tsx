"use client";

import { motion } from "framer-motion";
import type { Tribe, TribeScore } from "@/lib/types";
import clsx from "clsx";

type Props = {
  tribe: Tribe;
  score?: TribeScore;
  isWinner: boolean;
  index: number;
  creativeUrl?: string;
};

const platformLabel: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  linkedin: "LI",
  auto: "AUTO",
};

export function TribeCard({ tribe, score, isWinner, index, creativeUrl }: Props) {
  const conversion = score ? Math.round(score.conversionRate * 100) : 0;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className={clsx(
        "group relative rounded-xl border backdrop-blur-2xl p-3.5 transition-all",
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
            Conversion
          </div>
          <div
            className="text-xl font-semibold tabular-nums"
            style={{ color: conversion >= 30 ? "#3affe9" : conversion >= 15 ? "#ffcf6b" : "#e9ecf6" }}
          >
            {conversion}%
          </div>
        </div>
        <div className="flex-1 max-w-[110px] h-1.5 rounded-full bg-ink-700/80 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: tribe.accent }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, conversion)}%` }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
