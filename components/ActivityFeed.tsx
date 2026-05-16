"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FeedMessage } from "@/lib/feed";
import type { Tribe } from "@/lib/types";

type Props = {
  messages: FeedMessage[];
  tribes: Tribe[];
  onAgentClick?: (agentId: string) => void;
};

const TYPE_BG: Record<FeedMessage["type"], string> = {
  praise: "rgba(58, 255, 233, 0.16)",
  chat: "rgba(255, 255, 255, 0.10)",
  protest: "rgba(255, 84, 112, 0.18)",
  announcement: "rgba(255, 122, 26, 0.18)",
};
const TYPE_BORDER: Record<FeedMessage["type"], string> = {
  praise: "rgba(58, 255, 233, 0.35)",
  chat: "rgba(255, 255, 255, 0.18)",
  protest: "rgba(255, 84, 112, 0.4)",
  announcement: "rgba(255, 207, 107, 0.45)",
};
const TYPE_LABEL_COLOR: Record<FeedMessage["type"], string> = {
  praise: "#86fff1",
  chat: "rgba(255,255,255,0.7)",
  protest: "#ffb7c4",
  announcement: "#ffcf6b",
};

export function ActivityFeed({ messages, tribes, onAgentClick }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const tribeMap = new Map(tribes.map((t) => [t.id, t]));

  const unread = messages.filter((m) => !seenIds.has(m.id)).length;
  useEffect(() => {
    if (!messages.length) return;
    const ids = messages.map((m) => m.id);
    const t = setTimeout(() => setSeenIds(new Set(ids)), 2200);
    return () => clearTimeout(t);
  }, [messages]);

  useEffect(() => {
    if (!expanded || !scrollRef.current) return;
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [expanded, messages.length]);

  return (
    <div className="fixed bottom-5 right-6 z-30 flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="w-[340px] max-h-[55vh] overflow-y-auto scroll-thin rounded-2xl backdrop-blur-2xl pointer-events-auto"
            style={{
              background: "rgba(10, 12, 22, 0.55)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.18), 0 18px 40px rgba(0,0,0,0.5)",
            }}
            ref={scrollRef}
          >
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                Buyer reactions
              </span>
              <span className="text-[10px] tabular-nums text-white/40">
                {messages.length} msg
              </span>
            </div>
            <div className="px-3 py-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-white/40 text-[12px] py-4">
                  Waiting for buyers to speak…
                </div>
              ) : (
                messages.map((m) => (
                  <FeedItem
                    key={m.id}
                    msg={m}
                    isNew={!seenIds.has(m.id)}
                    tribeName={
                      m.tribeId ? tribeMap.get(m.tribeId)?.name : undefined
                    }
                    tribeEmoji={
                      m.tribeId ? tribeMap.get(m.tribeId)?.emoji : undefined
                    }
                    onClick={() =>
                      m.agentId && onAgentClick?.(m.agentId)
                    }
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-full backdrop-blur-2xl border border-white/25 hover:bg-white/15 transition-colors"
        style={{
          background: "rgba(255,255,255,0.10)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            unread > 0 ? "bg-plasma animate-pulse" : "bg-white/40"
          }`}
        />
        <span className="text-[11px] font-semibold text-white/85 tracking-wide">
          Buyer reactions
        </span>
        {unread > 0 && !expanded && (
          <span className="bg-flame-500 text-ink-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {unread}
          </span>
        )}
        <svg
          className={`w-3 h-3 text-white/55 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}

function FeedItem({
  msg,
  isNew,
  tribeName,
  tribeEmoji,
  onClick,
}: {
  msg: FeedMessage;
  isNew: boolean;
  tribeName?: string;
  tribeEmoji?: string;
  onClick: () => void;
}) {
  const labelMap: Record<FeedMessage["type"], string> = {
    praise: "Praise",
    chat: "Chat",
    protest: "Protest",
    announcement: "Crucible",
  };
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2 " +
        (msg.agentId ? "cursor-pointer hover:bg-white/[0.06]" : "")
      }
      style={{
        background: TYPE_BG[msg.type],
        border: `1px solid ${TYPE_BORDER[msg.type]}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {tribeEmoji && <span className="text-[12px]">{tribeEmoji}</span>}
        <span
          className="text-[10.5px] font-semibold"
          style={{ color: TYPE_LABEL_COLOR[msg.type] }}
        >
          {msg.agentName}
        </span>
        {tribeName && (
          <span className="text-[9px] uppercase tracking-[0.12em] text-white/35">
            · {tribeName}
          </span>
        )}
        <span className="ml-auto text-[9px] uppercase tracking-[0.14em] text-white/30">
          {labelMap[msg.type]} · R{msg.round}
        </span>
      </div>
      <p className="text-[12.5px] leading-snug text-white/90">{msg.text}</p>
    </motion.div>
  );
}
