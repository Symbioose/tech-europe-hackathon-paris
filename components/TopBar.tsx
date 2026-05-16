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
  initialUrl = "https://ouraring.com",
  initialPlatform = "auto",
}: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [platform, setPlatform] = useState<Platform>(initialPlatform);

  return (
    <div
      className="w-full px-6 py-4 border-b border-white/10 backdrop-blur-2xl sticky top-0 z-40"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,12,22,0.85), rgba(10,12,22,0.45))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-flame-400 to-flame-700 flex items-center justify-center shadow-glow">
              <span className="text-ink-950 font-bold text-sm">C</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-plasma shadow-plasma" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Crucible</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 -mt-0.5">
              Watch the agent learn
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-ink-700" />

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="relative flex-1 max-w-[520px]">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={disabled}
              placeholder="Paste product URL…"
              className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-ink-700 focus:border-flame-500 focus:outline-none text-sm placeholder:text-ink-400 transition-colors disabled:opacity-60"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.18em] text-ink-400">
              URL
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.06] border border-ink-700">
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                disabled={disabled}
                className={clsx(
                  "px-2.5 py-1 rounded-md text-xs transition-all",
                  platform === p.id
                    ? "bg-ink-700 text-ink-50"
                    : "text-ink-400 hover:text-ink-50",
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
          whileTap={{ scale: 0.96 }}
          className={clsx(
            "px-5 py-2.5 rounded-lg font-medium text-sm shrink-0 transition-all flex items-center gap-2",
            disabled
              ? "bg-ink-700 text-ink-400 cursor-not-allowed"
              : "bg-gradient-to-r from-flame-400 to-flame-600 text-ink-950 hover:shadow-glow hover:from-flame-300 hover:to-flame-500",
          )}
        >
          {busyLabel ?? "Run Crucible"}
          {!disabled && <span aria-hidden>↗</span>}
        </motion.button>
      </div>
    </div>
  );
}
