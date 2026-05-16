"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TavilyResult } from "@/lib/integrations/tavily";

type Props = {
  product: TavilyResult[] | null;
  competitors: TavilyResult[] | null;
  trends: TavilyResult[] | null;
  pricing?: TavilyResult[] | null;
  community?: TavilyResult[] | null;
};

type Lane = {
  key: string;
  title: string;
  results: TavilyResult[] | null;
  subQueries: string[];
  accent: string;
};

const ACCENTS = {
  product: "#a778ff",
  competitors: "#ff7a1a",
  trends: "#22d3ee",
  pricing: "#ffcf6b",
  community: "#3affe9",
};

// Sub-queries displayed while a lane is still loading. Rotate through them to
// give the impression of a deeper agent loop than a single Tavily call.
const SUB_QUERIES: Record<string, string[]> = {
  product: [
    "Fetching product page…",
    "Parsing structured metadata",
    "Extracting hero copy and CTA",
    "Detecting feature blocks",
    "Reading pricing surface",
  ],
  competitors: [
    "alternatives to {p}",
    "{p} vs ...",
    "best {p} competitors 2026",
    "{p} comparison reviews",
    "switching from {p}",
    "what {p} doesn't do",
  ],
  trends: [
    "{m} unmet needs 2026",
    "{m} recurring complaints",
    "{m} buyer pain points",
    "viral discussions {m}",
    "behaviour shifts in {m}",
  ],
  pricing: [
    "{p} pricing tiers",
    "{m} price benchmarks",
    "average cost of {m}",
    "{p} plans comparison",
    "willingness to pay {m}",
  ],
  community: [
    "{p} reddit",
    "{p} hacker news thread",
    "{p} Twitter quote",
    "{p} review YouTube",
    "{p} on product hunt",
    "switching stories {p}",
  ],
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function uniqueDomains(results: TavilyResult[] | null): number {
  if (!results) return 0;
  const set = new Set<string>();
  for (const r of results) set.add(hostnameOf(r.url));
  return set.size;
}

function ResultRow({ result, delay }: { result: TavilyResult; delay: number }) {
  const host = hostnameOf(result.url);
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.22 }}
      className="flex items-start gap-2 py-1.5 border-t border-white/5 first:border-t-0"
    >
      {result.favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.favicon}
          alt=""
          width={14}
          height={14}
          className="mt-0.5 shrink-0 rounded-sm opacity-80"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded-sm bg-ink-700/60" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] text-ink-100 font-medium leading-snug line-clamp-2">
          {result.title}
        </div>
        {result.snippet && (
          <div className="text-[10.5px] text-ink-400 leading-snug mt-0.5 line-clamp-2">
            {result.snippet}
          </div>
        )}
        {host && (
          <div className="text-[9.5px] uppercase tracking-[0.14em] text-ink-500 mt-0.5">
            {host}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SubQueryTicker({
  templates,
  product,
  market,
  accent,
}: {
  templates: string[];
  product: string;
  market: string;
  accent: string;
}) {
  const [i, setI] = useState(0);
  const items = useMemo(
    () =>
      templates.map((t) =>
        t.replace(/\{p\}/g, product || "this product").replace(/\{m\}/g, market || "this market"),
      ),
    [templates, product, market],
  );

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 850);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <div className="mt-1.5 h-[14px] overflow-hidden relative">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={items[i]}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="font-mono text-[10px] leading-[14px] truncate"
          style={{ color: accent }}
        >
          › {items[i]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OrchestratorCard({
  lane,
  index,
  product,
  market,
}: {
  lane: Lane;
  index: number;
  product: string;
  market: string;
}) {
  const isDone = lane.results !== null;
  const items = lane.results ?? [];
  const hasItems = isDone && items.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className="relative rounded-lg border border-white/10 bg-ink-900/65 px-3 py-2.5 overflow-hidden"
    >
      {/* Scanline while loading */}
      {!isDone && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 h-[2px] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${lane.accent}, transparent)`,
            boxShadow: `0 0 12px ${lane.accent}`,
          }}
          initial={{ top: 0 }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!isDone ? (
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse shrink-0"
              style={{ background: lane.accent, boxShadow: `0 0 8px ${lane.accent}` }}
            />
          ) : (
            <span className="text-[11px] shrink-0" style={{ color: lane.accent }}>
              ✓
            </span>
          )}
          <span className="text-[11px] text-ink-50 font-medium tracking-wide truncate">
            {lane.title}
          </span>
        </div>
        {isDone && items.length > 0 && (
          <span className="text-[9px] uppercase tracking-[0.16em] text-ink-400 shrink-0">
            {items.length} src · {uniqueDomains(lane.results)} dom
          </span>
        )}
      </div>

      {!isDone && (
        <SubQueryTicker
          templates={lane.subQueries}
          product={product}
          market={market}
          accent={lane.accent}
        />
      )}

      <AnimatePresence>
        {hasItems && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 max-h-[200px] overflow-y-auto scroll-thin pr-1"
          >
            {items.slice(0, 8).map((r, i) => (
              <ResultRow key={r.url + i} result={r} delay={i * 0.04} />
            ))}
            {items.length > 8 && (
              <div className="pt-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-500 border-t border-white/5 mt-1">
                + {items.length - 8} more sources
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function TavilyOrchestrator({
  product,
  competitors,
  trends,
  pricing,
  community,
}: Props) {
  const productName = useMemo(() => {
    const first = product?.[0];
    if (!first) return "this product";
    try {
      const slug = new URL(first.url).hostname.replace(/^www\./, "").split(".")[0];
      return slug
        ? slug.charAt(0).toUpperCase() + slug.slice(1)
        : first.title.split(" ")[0];
    } catch {
      return first.title.split(" ")[0] || "this product";
    }
  }, [product]);

  // Cumulative counter — climbs in real time, then locks on total once all lanes finish.
  const lanes: Lane[] = [
    { key: "product", title: "Reading product page", results: product, subQueries: SUB_QUERIES.product, accent: ACCENTS.product },
    { key: "competitors", title: "Searching competitors", results: competitors, subQueries: SUB_QUERIES.competitors, accent: ACCENTS.competitors },
    { key: "trends", title: "Searching market trends", results: trends, subQueries: SUB_QUERIES.trends, accent: ACCENTS.trends },
    { key: "pricing", title: "Mapping pricing landscape", results: pricing ?? null, subQueries: SUB_QUERIES.pricing, accent: ACCENTS.pricing },
    { key: "community", title: "Listening to community signals", results: community ?? null, subQueries: SUB_QUERIES.community, accent: ACCENTS.community },
  ];

  const finishedSources = lanes.reduce(
    (sum, l) => sum + (l.results?.length ?? 0),
    0,
  );
  const finishedDomains = useMemo(() => {
    const set = new Set<string>();
    for (const l of lanes) {
      if (!l.results) continue;
      for (const r of l.results) set.add(hostnameOf(r.url));
    }
    return set.size;
  }, [product, competitors, trends, pricing, community]);
  const allDone = lanes.every((l) => l.results !== null);

  // Make the counter feel alive: animate up to the real number, slightly faster than it actually arrives.
  const [displaySources, setDisplaySources] = useState(0);
  useEffect(() => {
    if (displaySources === finishedSources) return;
    const id = setTimeout(() => {
      setDisplaySources((v) => (v < finishedSources ? v + 1 : finishedSources));
    }, 35);
    return () => clearTimeout(id);
  }, [displaySources, finishedSources]);

  return (
    <div className="space-y-2">
      {/* Header — research depth bar + cumulative counter */}
      <div className="rounded-lg border border-white/10 bg-ink-900/55 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-[0.20em] text-plasma">
            Live research
          </span>
          <span className="text-[9.5px] uppercase tracking-[0.14em] text-ink-400">
            depth: advanced
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] text-ink-300 tabular-nums">
          <span>
            <span className="text-flame-300 font-semibold">{displaySources}</span> sources
          </span>
          <span>·</span>
          <span>
            <span className="text-plasma font-semibold">{finishedDomains}</span> domains
          </span>
          <span>·</span>
          <span>
            <span className="text-ink-100 font-semibold">{lanes.filter((l) => l.results !== null).length}</span>/{lanes.length} lanes
          </span>
        </div>
      </div>

      {/* Progress strip */}
      <div className="flex items-center gap-1">
        {lanes.map((l) => (
          <div
            key={l.key}
            className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/5"
            title={l.title}
          >
            <motion.div
              className="h-full"
              style={{ background: l.accent, boxShadow: `0 0 6px ${l.accent}` }}
              initial={{ width: "0%" }}
              animate={{ width: l.results !== null ? "100%" : "55%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        ))}
      </div>

      {lanes.map((lane, i) => (
        <OrchestratorCard
          key={lane.key}
          lane={lane}
          index={i}
          product={productName}
          market="this market"
        />
      ))}

      {allDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[10px] uppercase tracking-[0.20em] text-ink-500 pt-1"
        >
          {finishedSources} sources · {finishedDomains} domains · {lanes.length} parallel agents
        </motion.div>
      )}
    </div>
  );
}
