"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Platform } from "@/lib/types";

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
    <div className="min-h-screen overflow-hidden bg-ink-950 text-ink-50">
      <div className="absolute inset-0 bg-grid-fade opacity-90" />
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.065)_1px,transparent_0)] [background-size:24px_24px] opacity-40" />

      <div className="relative z-10 min-h-screen px-6 py-6 flex flex-col">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-flame-400 to-flame-700 flex items-center justify-center shadow-glow">
                <span className="text-ink-950 font-bold text-sm">C</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-plasma shadow-plasma" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Crucible</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 -mt-0.5">
                Synthetic market research
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 grid items-center py-8">
          <div className="mx-auto w-full max-w-2xl">
            <div className="text-center mb-6">
              <div className="text-[10px] uppercase tracking-[0.22em] text-flame-300">
                Launch simulation
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Run a launch simulation
              </h1>
              <p className="mt-3 max-w-xl mx-auto text-[14px] leading-6 text-ink-300">
                Crucible tests who would buy, why they react, and what to change — before
                you spend a launch week finding out the hard way.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-ink-900/78 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Business question (read-only — the single supported demo path) */}
              <div className="border-b border-white/10 px-6 py-4 bg-plasma/[0.04]">
                <div className="text-[10px] uppercase tracking-[0.22em] text-plasma">
                  Business question
                </div>
                <div className="mt-1.5 text-[15px] text-ink-50 font-medium leading-snug">
                  Which customer segment and message should we launch with?
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
                <Field
                  label="Product URL"
                  hint="What you're launching. We'll read the page live."
                >
                  <input
                    value={values.productUrl}
                    onChange={(e) => update({ productUrl: e.target.value })}
                    placeholder="https://yourproduct.com"
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-500 focus:border-flame-400"
                  />
                </Field>

                <Field
                  label="What are you launching?"
                  hint="Optional · 1 line if the page is vague"
                >
                  <input
                    value={values.productNote}
                    onChange={(e) => update({ productNote: e.target.value })}
                    placeholder="e.g. Generative media API for developers"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-500 focus:border-flame-400"
                  />
                </Field>

                <Field
                  label="Target market"
                  hint="Optional · skip if you don't know yet"
                >
                  <input
                    value={values.targetMarket}
                    onChange={(e) => update({ targetMarket: e.target.value })}
                    placeholder="e.g. AI app builders · indie hackers · agencies"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-500 focus:border-flame-400"
                  />
                </Field>
              </div>

              <div className="border-t border-white/10 px-6 py-4 flex flex-col gap-2.5">
                <motion.button
                  type="button"
                  onClick={submit}
                  whileTap={{ scale: 0.985 }}
                  disabled={!canLaunch}
                  className="w-full rounded-xl bg-gradient-to-r from-flame-400 to-flame-600 px-5 py-3.5 text-[15px] font-semibold text-ink-950 shadow-glow transition-all hover:from-flame-300 hover:to-flame-500 disabled:from-ink-700 disabled:to-ink-700 disabled:text-ink-400 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Run market simulation
                </motion.button>
                <div className="text-center text-[11px] text-ink-400">
                  70 synthetic buyers · 7 customer populations · live reactions · final targeting plan
                </div>
              </div>
            </div>

            <div className="mt-5 text-center text-[11px] text-ink-500">
              Powered by OpenAI · Tavily · FAL · Gradium
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-end justify-between gap-3">
        <span className="text-sm font-medium text-ink-100">{label}</span>
        <span className="text-[11px] text-ink-500">{hint}</span>
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}
