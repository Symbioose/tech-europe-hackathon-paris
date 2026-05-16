"use client";

import { motion, AnimatePresence } from "framer-motion";

type Props = {
  isRegenerating: boolean;
  oldHook?: string;
  newHook?: string;
};

export function RegenerationOverlay({ isRegenerating, oldHook, newHook }: Props) {
  const showDiff = !isRegenerating && oldHook && newHook;

  return (
    <AnimatePresence>
      {(isRegenerating || showDiff) && (
        <motion.div
          key={isRegenerating ? "regenerating" : "diff"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border border-flame-500/35 bg-ink-950/85 backdrop-blur-sm px-4 py-3"
        >
          {isRegenerating ? (
            <motion.div
              className="flex items-center gap-2 text-sm font-medium text-flame-300"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <span>🔥</span>
              <span>Crucible is rewriting…</span>
            </motion.div>
          ) : showDiff ? (
            <div className="w-full space-y-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-ink-400 text-center">
                Hook rewrite
              </div>
              <div className="text-[12px] text-ink-400 line-through text-center leading-snug">
                {oldHook}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="text-[13px] font-semibold text-flame-200 text-center leading-snug"
              >
                {newHook}
              </motion.div>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
