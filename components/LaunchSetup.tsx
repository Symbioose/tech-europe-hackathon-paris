"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
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

const testTypes: Array<{
  id: TestType;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "customer_discovery",
    label: "Discovery",
    title: "Find who cares",
    description: "Discover the most responsive buyer tribe and the pain they already feel.",
  },
  {
    id: "marketing_message",
    label: "Message",
    title: "Test hooks",
    description: "Compare angles, claims, CTAs, and objections before posting.",
  },
  {
    id: "landing_page",
    label: "Landing",
    title: "Pressure-test the page",
    description: "See where the headline, promise, or CTA loses the buyer.",
  },
  {
    id: "ad_creative",
    label: "Creative",
    title: "Validate an ad",
    description: "Bring an image, video, or copy and simulate buyer reactions.",
  },
  {
    id: "pricing_objections",
    label: "Objections",
    title: "Map blockers",
    description: "Surface price, trust, timing, and relevance objections by tribe.",
  },
];

const assetModes: Array<{
  id: AssetMode;
  title: string;
  description: string;
}> = [
  {
    id: "generate",
    title: "Generate launch assets",
    description: "Crucible writes hooks, scripts, headlines, CTAs, and DM replies.",
  },
  {
    id: "copy",
    title: "Paste ad copy",
    description: "Test a hook, short script, email, or landing page section.",
  },
  {
    id: "image",
    title: "Image ad",
    description: "Mock upload for a static creative or screenshot.",
  },
  {
    id: "video",
    title: "Video ad",
    description: "Mock upload for a TikTok, Reel, or product demo.",
  },
];

const platforms: Array<{ id: Platform; label: string }> = [
  { id: "auto", label: "Auto-pick" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
];

export function LaunchSetup({ onLaunch }: Props) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<LaunchSetupValues>({
    testType: "marketing_message",
    productUrl: "https://ouraring.com",
    productNote: "",
    targetMarket: "",
    platform: "auto",
    assetMode: "generate",
    assetText: "",
  });

  const selectedTest = testTypes.find((item) => item.id === values.testType) ?? testTypes[1];
  const selectedAsset = assetModes.find((item) => item.id === values.assetMode) ?? assetModes[0];

  const canContinue = useMemo(() => {
    if (step === 2) return values.productUrl.trim().length > 0;
    return true;
  }, [step, values.productUrl]);

  function update(next: Partial<LaunchSetupValues>) {
    setValues((current) => ({ ...current, ...next }));
  }

  function submit() {
    onLaunch({
      ...values,
      productUrl: values.productUrl.trim() || "https://ouraring.com",
    });
  }

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
                Market simulation setup
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStep(n)}
                className={clsx(
                  "h-7 min-w-7 rounded-md px-2 text-[11px] font-medium transition-colors",
                  step === n
                    ? "bg-flame-400 text-ink-950"
                    : "text-ink-400 hover:bg-white/[0.06] hover:text-ink-100",
                )}
                aria-label={`Go to setup step ${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 grid items-center py-7">
          <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-h-[620px] rounded-2xl border border-white/10 bg-ink-900/78 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="border-b border-white/10 px-6 py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-flame-300">
                    Step {step} of 4
                  </div>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                    {step === 1 && "What decision do you need?"}
                    {step === 2 && "What product are we testing?"}
                    {step === 3 && "What asset should buyers react to?"}
                    {step === 4 && "Review the simulation brief"}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-300">
                    {step === 1 &&
                      "Start with the business question. Crucible will shape the tribes, assets, and final recommendation around that decision."}
                    {step === 2 &&
                      "Give the simulator enough context to understand the product, market, and launch surface."}
                    {step === 3 &&
                      "Bring your own creative or let Crucible generate a clean set of launch hypotheses."}
                    {step === 4 &&
                      "This is the exact setup the virtual market will use before it creates tribes and simulates reactions."}
                  </p>
                </div>
              </div>

              <div className="p-6">
                {step === 1 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {testTypes.map((item) => (
                      <SetupCard
                        key={item.id}
                        active={values.testType === item.id}
                        label={item.label}
                        title={item.title}
                        description={item.description}
                        onClick={() => update({ testType: item.id })}
                      />
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <Field label="Product URL" hint="Used for market research and fallback demo routing.">
                      <input
                        value={values.productUrl}
                        onChange={(event) => update({ productUrl: event.target.value })}
                        placeholder="https://yourproduct.com"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-500 focus:border-flame-400"
                      />
                    </Field>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="One-liner" hint="Optional, useful if the page is vague.">
                        <input
                          value={values.productNote}
                          onChange={(event) => update({ productNote: event.target.value })}
                          placeholder="AI sleep coach for knowledge workers"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-500 focus:border-flame-400"
                        />
                      </Field>
                      <Field label="Target market" hint="Optional, Crucible can infer it.">
                        <input
                          value={values.targetMarket}
                          onChange={(event) => update({ targetMarket: event.target.value })}
                          placeholder="Busy founders, operators, athletes..."
                          className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-500 focus:border-flame-400"
                        />
                      </Field>
                    </div>

                    <Field label="Primary platform" hint="Auto-pick keeps the demo moving.">
                      <div className="flex flex-wrap gap-2">
                        {platforms.map((platform) => (
                          <button
                            key={platform.id}
                            type="button"
                            onClick={() => update({ platform: platform.id })}
                            className={clsx(
                              "rounded-lg border px-3 py-2 text-sm transition-colors",
                              values.platform === platform.id
                                ? "border-flame-400 bg-flame-400 text-ink-950"
                                : "border-white/10 bg-white/[0.04] text-ink-300 hover:border-white/20 hover:text-ink-50",
                            )}
                          >
                            {platform.label}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                    <div className="space-y-2">
                      {assetModes.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => update({ assetMode: item.id })}
                          className={clsx(
                            "w-full rounded-xl border p-3 text-left transition-colors",
                            values.assetMode === item.id
                              ? "border-plasma bg-plasma/10"
                              : "border-white/10 bg-white/[0.04] hover:border-white/20",
                          )}
                        >
                          <div className="text-sm font-medium text-ink-50">{item.title}</div>
                          <div className="mt-1 text-xs leading-5 text-ink-400">{item.description}</div>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-ink-950/45 p-4">
                      {values.assetMode === "generate" ? (
                        <div className="h-full min-h-[260px] rounded-xl border border-dashed border-flame-400/35 bg-flame-400/[0.05] p-5">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-flame-300">
                            Generated by Crucible
                          </div>
                          <div className="mt-3 text-xl font-semibold">7 hooks, 7 scripts, 7 landing angles</div>
                          <p className="mt-2 max-w-lg text-sm leading-6 text-ink-300">
                            The simulator will generate launch hypotheses for each buyer tribe, then rewrite weak ones after every round.
                          </p>
                        </div>
                      ) : values.assetMode === "copy" ? (
                        <Field label="Paste the copy to test" hint="Hook, script, landing page section, DM, or ad caption.">
                          <textarea
                            value={values.assetText}
                            onChange={(event) => update({ assetText: event.target.value })}
                            placeholder="Paste the creative you want simulated buyers to react to..."
                            rows={9}
                            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 outline-none transition-colors placeholder:text-ink-500 focus:border-flame-400"
                          />
                        </Field>
                      ) : (
                        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.04] px-6 text-center">
                          <div className="text-sm font-medium text-ink-100">
                            {values.assetMode === "image" ? "Drop an image ad" : "Drop a video ad"}
                          </div>
                          <p className="mt-2 max-w-sm text-xs leading-5 text-ink-400">
                            Upload is mocked for this hackathon demo. The market simulation will still run with generated launch variants.
                          </p>
                          <button
                            type="button"
                            className="mt-4 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-ink-300"
                          >
                            Choose file
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReviewItem label="Decision" value={selectedTest.title} detail={selectedTest.description} />
                    <ReviewItem label="Product" value={values.productUrl || "https://ouraring.com"} detail={values.productNote || "Product context inferred from the URL."} />
                    <ReviewItem label="Market" value={values.targetMarket || "Auto-detected"} detail={`Platform: ${platforms.find((p) => p.id === values.platform)?.label ?? "Auto-pick"}`} />
                    <ReviewItem label="Asset mode" value={selectedAsset.title} detail={selectedAsset.description} />
                  </div>
                )}
              </div>

              <div className="mt-auto border-t border-white/10 px-6 py-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(1, current - 1))}
                  disabled={step === 1}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-ink-300 transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Back
                </button>
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep((current) => Math.min(4, current + 1))}
                    disabled={!canContinue}
                    className="rounded-lg bg-flame-400 px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-flame-300 disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-ink-400"
                  >
                    Continue
                  </button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={submit}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-lg bg-gradient-to-r from-flame-400 to-flame-600 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:from-flame-300 hover:to-flame-500"
                  >
                    Run market simulation
                  </motion.button>
                )}
              </div>
            </section>

            <aside className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
              <div className="text-[10px] uppercase tracking-[0.22em] text-ink-400">
                Simulation plan
              </div>
              <div className="mt-4 space-y-4">
                <PlanStep active={step === 1} done={step > 1} title="Choose decision" value={selectedTest.title} />
                <PlanStep active={step === 2} done={step > 2} title="Product context" value={values.productUrl || "Oura fallback"} />
                <PlanStep active={step === 3} done={step > 3} title="Asset source" value={selectedAsset.title} />
                <PlanStep active={step === 4} done={false} title="Launch" value="7 tribes · 70 buyers · 3 rounds" />
              </div>

              <div className="mt-6 rounded-xl border border-plasma/25 bg-plasma/[0.07] p-4">
                <div className="text-sm font-medium text-plasma">What happens next</div>
                <p className="mt-2 text-xs leading-5 text-ink-300">
                  Crucible researches the market, creates buyer tribes, populates the 3D market, then learns across three compressed launch rounds.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function SetupCard({
  active,
  label,
  title,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-2xl border p-4 text-left transition-all",
        active
          ? "border-flame-400 bg-flame-400/[0.10] shadow-glow"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-ink-400">
          {label}
        </span>
        <span
          className={clsx(
            "h-3 w-3 rounded-full border",
            active ? "border-flame-300 bg-flame-300" : "border-ink-500",
          )}
        />
      </div>
      <div className="mt-5 text-lg font-semibold text-ink-50">{title}</div>
      <p className="mt-2 text-sm leading-6 text-ink-400">{description}</p>
    </button>
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
    <div className="block">
      <div className="flex items-end justify-between gap-3">
        <span className="text-sm font-medium text-ink-100">{label}</span>
        <span className="text-xs text-ink-500">{hint}</span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ReviewItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-ink-50">{value}</div>
      <p className="mt-2 text-xs leading-5 text-ink-400">{detail}</p>
    </div>
  );
}

function PlanStep({
  active,
  done,
  title,
  value,
}: {
  active: boolean;
  done: boolean;
  title: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={clsx(
          "mt-0.5 h-6 w-6 shrink-0 rounded-full border flex items-center justify-center text-[11px]",
          done
            ? "border-plasma bg-plasma text-ink-950"
            : active
            ? "border-flame-400 bg-flame-400 text-ink-950"
            : "border-white/10 text-ink-500",
        )}
      >
        {done ? "✓" : ""}
      </div>
      <div className="min-w-0">
        <div className={clsx("text-sm font-medium", active ? "text-ink-50" : "text-ink-300")}>
          {title}
        </div>
        <div className="mt-0.5 truncate text-xs text-ink-500">{value}</div>
      </div>
    </div>
  );
}
