"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { Platform } from "@/lib/types";

// Three.js mounts on the client only — keep it out of any pre-render path.
const ShaderBackground = dynamic(
  () => import("./ShaderBackground").then((m) => m.ShaderBackground),
  { ssr: false },
);

export type TestType =
  | "customer_discovery"
  | "marketing_message"
  | "landing_page"
  | "ad_creative"
  | "pricing_objections";

export type AssetMode = "generate" | "copy" | "image" | "video";

export type LaunchSetupValues = {
  testType: TestType;
  productUrl: string;
  productNote: string;
  targetMarket: string;
  platform: Platform;
  assetMode: AssetMode;
  assetText: string;
};

type Props = {
  onLaunch: (values: LaunchSetupValues) => void;
};

const DEFAULTS: LaunchSetupValues = {
  testType: "marketing_message",
  productUrl: "https://fal.ai",
  productNote: "",
  targetMarket: "",
  platform: "auto",
  assetMode: "generate",
  assetText: "",
};

export function LaunchSetup({ onLaunch }: Props) {
  const [values, setValues] = useState<LaunchSetupValues>(DEFAULTS);
  const [focused, setFocused] = useState<string | null>(null);

  function update(next: Partial<LaunchSetupValues>) {
    setValues((current) => ({ ...current, ...next }));
  }

  function submit() {
    onLaunch({
      ...values,
      productUrl: values.productUrl.trim() || DEFAULTS.productUrl,
    });
  }

  const canLaunch = values.productUrl.trim().length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-ink-50">
      {/* Live WebGL mesh-gradient (three.js shader) */}
      <ShaderBackground intensity={0.85} />
      {/* Top-down darkening so foreground text always reads cleanly */}
      <div className="absolute inset-0 -z-[5] bg-gradient-to-b from-ink-950/30 via-ink-950/60 to-ink-950/85" />

      <div className="relative z-10 min-h-screen px-6 py-6 flex flex-col">
        {/* Sober wordmark — no logo badge */}
        <header className="flex items-center justify-between">
          <div className="text-[14px] font-semibold tracking-[0.32em] text-ink-50">
            CRUCIBLE
          </div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-ink-300/80">
            Tech: Europe Paris · 2026
          </div>
        </header>

        <main className="flex-1 grid items-center py-8">
          <div className="mx-auto w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
              className="text-center mb-7"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-flame-400/35 bg-flame-400/[0.08] px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-flame-300 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.28em] text-flame-200">
                  Minutes · not weeks
                </span>
              </div>
              <h1 className="mt-4 text-[42px] sm:text-[54px] font-semibold tracking-[-0.02em] leading-[1.04]">
                Test your launch{" "}
                <span className="bg-gradient-to-r from-flame-300 via-flame-400 to-plasma bg-clip-text text-transparent">
                  before
                </span>{" "}
                you ship.
              </h1>
              <p className="mt-4 max-w-xl mx-auto text-[14.5px] leading-7 text-ink-200/95">
                Find out who would buy, why they react, and what to change before
                you spend a launch week testing it for real.
              </p>
              <p className="mt-2 text-[12px] text-ink-400">
                Pre-research before real interviews: narrow the market first, then validate with humans.
              </p>

              {/* Differentiation stats — fast, cheap, no recruiting */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-ink-200/95">
                <Stat value="< 2 min" label="end-to-end run" />
                <Sep />
                <Stat value="70" label="synthetic buyers" />
                <Sep />
                <Stat value="100×" label="cheaper than user research" />
                <Sep />
                <Stat value="0" label="recruiting" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1], delay: 0.12 }}
              className="relative rounded-2xl overflow-hidden border border-white/15"
              style={{
                background:
                  "linear-gradient(180deg, rgba(20,22,38,0.62) 0%, rgba(10,12,22,0.58) 100%)",
                backdropFilter: "blur(22px) saturate(140%)",
                WebkitBackdropFilter: "blur(22px) saturate(140%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.18), 0 30px 80px -20px rgba(255,122,26,0.20), 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              {/* Specular highlight (liquid-glass cue) */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 60% at 50% -10%, rgba(255,122,26,0.18), transparent 50%)",
                }}
              />

              {/* Business question — read-only banner */}
              <div className="relative border-b border-white/10 px-6 py-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-plasma/95">
                  Business question
                </div>
                <div className="mt-1.5 text-[15px] text-ink-50 font-medium leading-snug">
                  Which customer segment should we target first, and what message will convert them?
                </div>
              </div>

              <div className="relative px-6 py-5 space-y-5">
                <Field
                  id="url"
                  label="Product URL"
                  hint="We'll read the product page live."
                  focused={focused === "url"}
                >
                  <input
                    id="url"
                    value={values.productUrl}
                    onChange={(e) => update({ productUrl: e.target.value })}
                    onFocus={() => setFocused("url")}
                    onBlur={() => setFocused(null)}
                    placeholder="https://yourproduct.com"
                    autoFocus
                    className={inputClass}
                  />
                </Field>

                <Field
                  id="note"
                  label="What are you launching?"
                  hint="Optional · Add one line if the page is vague."
                  focused={focused === "note"}
                >
                  <input
                    id="note"
                    value={values.productNote}
                    onChange={(e) => update({ productNote: e.target.value })}
                    onFocus={() => setFocused("note")}
                    onBlur={() => setFocused(null)}
                    placeholder="e.g. Generative media API for developers"
                    className={inputClass}
                  />
                </Field>

                <Field
                  id="market"
                  label="Target market"
                  hint="Optional · Leave blank if you want Crucible to discover it."
                  focused={focused === "market"}
                >
                  <input
                    id="market"
                    value={values.targetMarket}
                    onChange={(e) => update({ targetMarket: e.target.value })}
                    onFocus={() => setFocused("market")}
                    onBlur={() => setFocused(null)}
                    placeholder="e.g. AI app builders · indie hackers · agencies"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="relative border-t border-white/10 px-6 py-4 flex flex-col gap-2.5">
                <motion.button
                  type="button"
                  onClick={submit}
                  whileTap={{ scale: 0.985 }}
                  whileHover={canLaunch ? { y: -1 } : undefined}
                  disabled={!canLaunch}
                  className="relative w-full overflow-hidden rounded-xl px-5 py-3.5 text-[15px] font-semibold text-ink-950 disabled:text-ink-400 disabled:cursor-not-allowed transition-colors"
                  style={{
                    background: canLaunch
                      ? "linear-gradient(95deg, #ffb673 0%, #ff7a1a 35%, #f25b07 65%, #ff7a1a 100%)"
                      : "rgba(255,255,255,0.06)",
                    boxShadow: canLaunch
                      ? "0 14px 36px -8px rgba(255,122,26,0.55), inset 0 1px 0 rgba(255,255,255,0.4)"
                      : "none",
                    border: canLaunch ? "none" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {canLaunch && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(95deg, transparent, rgba(255,255,255,0.32), transparent)",
                        backgroundSize: "200% 100%",
                      }}
                      animate={{ backgroundPositionX: ["-200%", "200%"] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <span className="relative">Run market simulation →</span>
                </motion.button>
                <div className="text-center text-[11px] text-ink-400">
                  70 synthetic buyers · 7 customer populations · live reactions · targeting plan
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-7 text-center"
            >
              <div className="text-[19px] sm:text-[22px] font-semibold tracking-[-0.01em] text-ink-100">
                Don't guess.{" "}
                <span className="bg-gradient-to-r from-flame-300 to-plasma bg-clip-text text-transparent">
                  Simulate.
                </span>
              </div>
              <div className="mt-3 flex items-center justify-center gap-3 text-[10.5px] uppercase tracking-[0.24em] text-ink-500">
                <span>OpenAI</span>
                <Dot />
                <span>Tavily</span>
                <Dot />
                <span>FAL</span>
                <Dot />
                <span>Gradium</span>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-[14px] outline-none transition-all placeholder:text-ink-500 border-white/10 focus:bg-white/[0.06] focus:border-flame-400/70 focus:shadow-[0_0_0_4px_rgba(255,122,26,0.10)]";

function Field({
  id,
  label,
  hint,
  focused,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="flex items-end justify-between gap-3 mb-2">
        <span
          className={
            "text-[13px] font-medium transition-colors " +
            (focused ? "text-flame-200" : "text-ink-100")
          }
        >
          {label}
        </span>
        <span className="text-[11px] text-ink-500">{hint}</span>
      </label>
      {children}
    </div>
  );
}

function Dot() {
  return <span className="w-1 h-1 rounded-full bg-ink-500" />;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-semibold text-ink-50">{value}</span>
      <span className="text-ink-400">{label}</span>
    </span>
  );
}

function Sep() {
  return <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-ink-500/80" />;
}
