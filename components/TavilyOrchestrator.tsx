"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { TavilyResult } from "@/lib/integrations/tavily";

type Props = {
  product: TavilyResult[] | null;
  competitors: TavilyResult[] | null;
  trends: TavilyResult[] | null;
};

type CardProps = {
  title: string;
  results: TavilyResult[] | null;
  index: number;
};

function ResultRow({ result, delay }: { result: TavilyResult; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      className="flex items-start gap-2 py-1.5 border-t border-white/5"
    >
      {result.favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.favicon}
          alt=""
          width={14}
          height={14}
          className="mt-0.5 shrink-0 rounded-sm opacity-75"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded-sm bg-ink-700/60" />
      )}
      <div className="min-w-0">
        <div className="text-[11.5px] text-ink-100 font-medium leading-snug line-clamp-2">
          {result.title}
        </div>
        {result.snippet && (
          <div className="text-[10.5px] text-ink-400 leading-snug mt-0.5 line-clamp-2">
            {result.snippet}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function OrchestratorCard({ title, results, index }: CardProps) {
  const isDone = results !== null;
  const hasItems = isDone && results.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2.5"
    >
      <div className="flex items-center gap-2">
        {!isDone ? (
          <span className="inline-block w-2 h-2 rounded-full bg-flame-400 animate-pulse shrink-0" />
        ) : (
          <span className="text-[11px] text-plasma shrink-0">✓</span>
        )}
        <span className="text-[11px] text-ink-100 font-medium tracking-wide">{title}</span>
      </div>

      <AnimatePresence>
        {hasItems && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1.5"
          >
            {results.slice(0, 4).map((r, i) => (
              <ResultRow key={r.url + i} result={r} delay={i * 0.06} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function TavilyOrchestrator({ product, competitors, trends }: Props) {
  return (
    <div className="space-y-2">
      <OrchestratorCard title="Reading product page" results={product} index={0} />
      <OrchestratorCard title="Searching competitors" results={competitors} index={1} />
      <OrchestratorCard title="Searching market trends" results={trends} index={2} />
    </div>
  );
}
