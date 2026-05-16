"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { Platform } from "@/lib/types";

type Props = {
  onRun: (url: string, platform: Platform) => void;
  disabled: boolean;
  busyLabel?: string;
  initialUrl?: string;
  initialPlatform?: Platform;
};

const platforms: { id: Platform; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
];

export function TopBar({
  onRun,
  disabled,
  busyLabel,
  initialUrl = "https://fal.ai",
  initialPlatform = "auto",
}: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const isBusy = !!busyLabel && busyLabel.toLowerCase().includes("research");
  const canRun = !disabled;

  return (
    <div
      className="relative w-full px-6 py-3.5 border-b border-white/10 sticky top-0 z-40"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,12,22,0.92) 0%, rgba(10,12,22,0.62) 100%)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-4">
        {/* Sober wordmark, no logo badge */}
        <div className="flex items-baseline gap-2.5 shrink-0">
          <span className="text-[13px] font-semibold tracking-[0.32em] text-ink-50">
            CRUCIBLE
          </span>
          <span className="text-[9px] uppercase tracking-[0.22em] text-ink-500">
            Live
          </span>
          {isBusy && (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-flame-300">
              <span className="w-1.5 h-1.5 rounded-full bg-flame-400 animate-pulse" />
              researching
            </span>
          )}
        </div>

        <div className="h-7 w-px bg-white/10" />

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="relative flex-1 max-w-[520px]">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={disabled}
              placeholder="Paste product URL…"
              className="w-full px-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/10 focus:border-flame-400/70 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(255,122,26,0.10)] focus:outline-none text-[13px] placeholder:text-ink-400 transition-all disabled:opacity-60"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-[0.22em] text-ink-500">
              URL
            </span>
          </div>

          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.05] border border-white/10">
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                disabled={disabled}
                className={clsx(
                  "px-2.5 py-1 rounded-md text-[11px] transition-all",
                  platform === p.id
                    ? "bg-white/[0.10] text-ink-50"
                    : "text-ink-400 hover:text-ink-100",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          onClick={() => onRun(url, platform)}
          disabled={disabled}
          whileTap={canRun ? { scale: 0.97 } : undefined}
          whileHover={canRun ? { y: -1 } : undefined}
          className="relative overflow-hidden px-5 py-2.5 rounded-lg font-semibold text-[13px] shrink-0 transition-colors"
          style={{
            background: canRun
              ? "linear-gradient(95deg, #ffb673 0%, #ff7a1a 35%, #f25b07 65%, #ff7a1a 100%)"
              : "rgba(255,255,255,0.06)",
            color: canRun ? "#070811" : "#7c8197",
            boxShadow: canRun
              ? "0 8px 24px -6px rgba(255,122,26,0.45), inset 0 1px 0 rgba(255,255,255,0.35)"
              : "none",
            cursor: canRun ? "pointer" : "not-allowed",
          }}
        >
          {canRun && (
            <motion.span
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(95deg, transparent, rgba(255,255,255,0.32), transparent)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPositionX: ["-200%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            {busyLabel ?? "Run Crucible"}
            {canRun && <span aria-hidden>→</span>}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
