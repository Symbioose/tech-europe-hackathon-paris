"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { BuyerAgent, Tribe, TribeRecommendation, TribeScore, TribeVerdict } from "@/lib/types";
import { marketSignalScore, messageMarketFit, objectionIntensity, signalStrengthLabel } from "@/lib/market-score";

type Props = {
  tribes: Tribe[];
  scores: TribeScore[];
  breakdown?: TribeRecommendation[];
  agents: BuyerAgent[];
  sourceAnchors?: Record<string, string[]>;
  onAskBuyer?: (agentId: string, question: string) => void;
};

const VERDICT_STYLE: Record<TribeVerdict, { tag: string; bar: string; label: string; bg: string; text: string }> = {
  strong: {
    tag: "Strong target",
    bar: "#3affe9",
    label: "STRONG TARGET",
    bg: "rgba(58, 255, 233, 0.10)",
    text: "#3affe9",
  },
  refine: {
    tag: "Needs refinement",
    bar: "#ffcf6b",
    label: "NEEDS REFINEMENT",
    bg: "rgba(255, 207, 107, 0.10)",
    text: "#ffcf6b",
  },
  avoid: {
    tag: "Avoid for now",
    bar: "#ff5470",
    label: "AVOID FOR NOW",
    bg: "rgba(255, 84, 112, 0.10)",
    text: "#ff5470",
  },
};

export function TribePlaybook({ tribes, scores, breakdown, agents, sourceAnchors = {}, onAskBuyer }: Props) {
  const tribeMap = new Map(tribes.map((t) => [t.id, t]));
  const scoreMap = new Map(scores.map((s) => [s.tribeId, s]));
  const agentsByTribe = new Map<string, BuyerAgent[]>();
  for (const a of agents) {
    const list = agentsByTribe.get(a.tribeId) ?? [];
    list.push(a);
    agentsByTribe.set(a.tribeId, list);
  }

  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
        <div className="inline-flex items-center gap-2 text-[12px] text-ink-300">
          <span className="w-2 h-2 rounded-full bg-flame-400 animate-pulse" />
          Building per-tribe playbook from the round data…
        </div>
      </div>
    );
  }

  // Sort so strong signal → refine → avoid
  const order: Record<TribeVerdict, number> = { strong: 0, refine: 1, avoid: 2 };
  const sorted = [...breakdown].sort((a, b) => {
    const verdictDelta = order[a.verdict] - order[b.verdict];
    if (verdictDelta !== 0) return verdictDelta;
    return marketSignalScore(scoreMap.get(b.tribeId)) - marketSignalScore(scoreMap.get(a.tribeId));
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-ink-300">
          Targeting playbook · per population
        </h3>
        <span className="text-[10px] text-ink-500">{breakdown.length} tribes</span>
      </div>

      {sorted.map((rec, i) => {
        const tribe = tribeMap.get(rec.tribeId);
        const score = scoreMap.get(rec.tribeId);
        const style = VERDICT_STYLE[rec.verdict];
        const tribeAgents = agentsByTribe.get(rec.tribeId) ?? [];
        const askAgent =
          tribeAgents.find((a) => a.isHero) ??
          tribeAgents.find((a) => a.state === "converted") ??
          tribeAgents[0];
        const signal = marketSignalScore(score);
        const anchors = sourceAnchors[rec.tribeId] ?? [];

        return (
          <motion.div
            key={rec.tribeId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="relative rounded-2xl border border-white/10 bg-ink-950/55 overflow-hidden"
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ background: style.bar, boxShadow: `0 0 10px ${style.bar}80` }}
            />

            <div className="pl-4 pr-4 py-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {tribe?.emoji && <span className="text-lg shrink-0">{tribe.emoji}</span>}
                  <h4 className="text-sm font-semibold text-ink-50 truncate">
                    {tribe?.name ?? rec.tribeId}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-[9px] uppercase tracking-[0.16em] font-semibold px-2 py-0.5 rounded-md border"
                    style={{
                      color: style.text,
                      background: style.bg,
                      borderColor: `${style.bar}55`,
                    }}
                  >
                    {style.label}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.14em] text-ink-400">
                    {rec.priority}
                  </span>
                </div>
              </div>

              {/* Signal row */}
              {score && (
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <Stat label="Signal" value={`${signal}/100`} color="#3affe9" />
                  <Stat label="Fit" value={`${messageMarketFit(score)}/100`} color="#ffcf6b" />
                  <Stat label="Objection" value={`${objectionIntensity(score)}/100`} color="#ff5470" />
                </div>
              )}

              {/* Justification */}
              <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400">
                Decision:{" "}
                <span style={{ color: style.text }} className="font-semibold">
                  {rec.verdict === "strong" ? "Target" : rec.verdict === "refine" ? "Retest" : "Avoid"}
                </span>
                {score ? (
                  <span className="ml-2 text-ink-500">
                    · signal strength {signalStrengthLabel(signal)}
                  </span>
                ) : null}
              </div>
              <p className="text-[12px] leading-snug text-ink-200">{rec.justification}</p>

              {anchors.length > 0 && (
                <div className="rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-ink-500">
                    Created from Tavily signals
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {anchors.map((anchor) => (
                      <span
                        key={anchor}
                        className="max-w-full truncate rounded-md border border-plasma/20 bg-plasma/[0.05] px-2 py-1 text-[10.5px] text-ink-200"
                      >
                        {anchor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Divider />

              {/* Why */}
              <Section title="Why they reacted this way">
                <p>{rec.whyReacted}</p>
                <KV k="Motivated by" v={rec.whatMotivates} />
                <KV k="Blocked by" v={rec.whatBlocks} />
              </Section>

              <Divider />

              {/* How to target */}
              <Section title="How to better target them">
                <KV k="Channel" v={rec.recommendedChannel} />
                <KV k="Angle" v={rec.recommendedAngle} />
                <KV k="Proof to show" v={rec.proofToShow} />
                <KV k="CTA" v={rec.recommendedCta} />
              </Section>

              <Divider />

              {/* What to change */}
              <Section title="What to change">
                <p className="text-flame-200/95">{rec.whatToAvoid}</p>
              </Section>

              <Divider />

              {/* Example improved */}
              <Section title="Example improved message">
                <div
                  className="rounded-lg border px-3 py-2 mt-1"
                  style={{ background: style.bg, borderColor: `${style.bar}40` }}
                >
                  <div className="text-[12.5px] leading-snug text-ink-50 font-medium">
                    “{rec.improvedHook}”
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]">
                    <span style={{ color: style.text }}>CTA:</span>
                    <span className="text-ink-200 normal-case tracking-normal text-[11.5px]">
                      {rec.improvedCta}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[10.5px] text-ink-400">
                    Address upfront: {rec.objectionToHandle}
                  </div>
                </div>
              </Section>

              {/* Ask this tribe */}
              {rec.suggestedQuestions?.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-plasma">
                        Ask this tribe to go deeper
                      </div>
                      {askAgent && (
                        <span className="text-[9.5px] text-ink-500">
                          → opens a chat with {askAgent.name.split(" ")[0]}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {rec.suggestedQuestions.slice(0, 3).map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={!askAgent || !onAskBuyer}
                          onClick={() =>
                            askAgent && onAskBuyer?.(askAgent.id, q)
                          }
                          className={clsx(
                            "w-full text-left px-3 py-2 rounded-lg border text-[12px] leading-snug transition-colors",
                            askAgent && onAskBuyer
                              ? "border-plasma/30 bg-plasma/5 hover:bg-plasma/10 text-ink-100"
                              : "border-white/8 bg-white/[0.02] text-ink-300 cursor-not-allowed",
                          )}
                        >
                          <span className="text-plasma mr-1.5">›</span>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.14em] text-ink-400">{label}</div>
      <div className="text-[13px] font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9.5px] uppercase tracking-[0.18em] text-ink-400 mb-1">{title}</div>
      <div className="space-y-1 text-[12px] leading-snug text-ink-200">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-[11.5px]">
      <span className="text-ink-400">{k}: </span>
      <span className="text-ink-100">{v}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-white/8" />;
}
