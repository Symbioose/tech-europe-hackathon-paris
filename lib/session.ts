"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppStage, Session } from "./types";
import {
  applyRoundState,
  buildFallbackSession,
  roundResults,
  recommendation as fallbackRecommendation,
  assetsByRound,
  baseAgents,
} from "./demo-data";
import { feedByRound, type FeedMessage } from "./demo/feed";

export type ViewState = {
  stage: AppStage;
  session: Session;
  currentRound: 0 | 1 | 2 | 3;
  selectedAgentId: string | null;
  isWorking: boolean;
  signals: string[];
  feed: FeedMessage[];
};

const initial: ViewState = {
  stage: "idle",
  session: buildFallbackSession(),
  currentRound: 0,
  selectedAgentId: null,
  isWorking: false,
  signals: [],
  feed: [],
};

const TAVILY_SIGNALS = [
  "Whoop fatigue · 38% of r/Whoop posts last month are cancellation threads",
  "Apple Watch shipped sleep stages — still no readiness score",
  "Lenny's pod guest count wearing Oura up ~4x in 18 months",
  "TikTok #HRVanxiety mentions doubling month over month",
  "Cycle tracking moved private-by-default after the 2022 debate",
];

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useSession() {
  const [view, setView] = useState<ViewState>(initial);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach(clearTimeout);
    };
  }, []);

  // Optional ?stage=tribes|r1|r2|r3|winner — instantly jump for screenshots/demo.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const stage = params.get("stage");
    if (!stage) return;
    const buildAt = (round: 0 | 1 | 2 | 3, finalize: boolean) => {
      const agents = round === 0 ? baseAgents.map((a) => ({ ...a })) : applyRoundState(round as 1 | 2 | 3, baseAgents);
      const assets =
        round === 0
          ? assetsByRound[1].map((a) => ({ ...a }))
          : assetsByRound[round as 1 | 2 | 3].map((a) => ({ ...a }));
      const rounds = round === 0 ? [] : roundResults.slice(0, round);
      setView({
        stage: finalize ? "winner_ready" : round === 0 ? "tribes_ready" : round === 1 ? "round_1" : round === 2 ? "round_2" : "round_3",
        session: {
          ...buildFallbackSession(),
          agents,
          assets,
          rounds,
          recommendation: finalize ? fallbackRecommendation : undefined,
        },
        currentRound: round,
        selectedAgentId: null,
        isWorking: false,
        signals: TAVILY_SIGNALS,
        feed: [],
      });
    };
    if (stage === "tribes") buildAt(0, false);
    else if (stage === "r1") buildAt(1, false);
    else if (stage === "r2") buildAt(2, false);
    else if (stage === "r3") buildAt(3, false);
    else if (stage === "winner") buildAt(3, true);

    // Build cumulative feed for the URL-stage shortcut too.
    const fl: FeedMessage[] = [];
    if (stage === "r1") fl.push(...feedByRound[1]);
    else if (stage === "r2") fl.push(...feedByRound[1], ...feedByRound[2]);
    else if (stage === "r3" || stage === "winner")
      fl.push(...feedByRound[1], ...feedByRound[2], ...feedByRound[3]);
    if (fl.length > 0) {
      setTimeout(() => setView((v) => ({ ...v, feed: fl })), 80);
    }

    const select = params.get("select");
    if (select) {
      setTimeout(() => setView((v) => ({ ...v, selectedAgentId: select })), 50);
    }
  }, []);

  const reset = useCallback(() => {
    setView(initial);
  }, []);

  const start = useCallback(async (productUrl?: string) => {
    setView((v) => ({
      ...v,
      stage: "researching",
      signals: [],
      isWorking: true,
      currentRound: 0,
      session: buildFallbackSession(),
      feed: [],
    }));

    // Fire the live /api/run in parallel with the visible signal stream. Whatever
    // returns first plus the timed-out floor means the demo never stalls.
    const livePromise = productUrl
      ? fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productUrl, platform: "auto" }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

    for (let i = 0; i < TAVILY_SIGNALS.length; i++) {
      await delay(360);
      setView((v) => ({ ...v, signals: TAVILY_SIGNALS.slice(0, i + 1) }));
    }

    await delay(450);
    const live = await Promise.race([
      livePromise,
      new Promise<null>((r) => setTimeout(() => r(null), 1500)),
    ]);

    setView((v) => {
      const next: ViewState = {
        ...v,
        stage: "tribes_ready",
        isWorking: false,
      };
      // If the live call returned a non-Oura set (mode === 'live') AND has 7 tribes,
      // adopt them so the demo visibly reflects the URL.
      if (
        live &&
        live.mode === "live" &&
        Array.isArray(live.tribes) &&
        live.tribes.length === 7
      ) {
        next.session = {
          ...v.session,
          brief: live.brief ?? v.session.brief,
          tribes: live.tribes,
        };
        if (Array.isArray(live.brief?.trendSignals) && live.brief.trendSignals.length > 0) {
          next.signals = [...v.signals, ...live.brief.trendSignals.slice(0, 3)];
        }
      } else if (live && live.brief?.trendSignals?.length) {
        // Even in fallback mode, prefer any fresh Tavily signals we got back.
        next.signals = live.brief.trendSignals.slice(0, 5);
      }
      return next;
    });
  }, []);

  const runRound = useCallback(async (round: 1 | 2 | 3) => {
    setView((v) => ({ ...v, isWorking: true }));

    await delay(420);
    setView((v) => ({
      ...v,
      session: {
        ...v.session,
        assets: assetsByRound[round].map((a) => ({ ...a })),
      },
    }));

    await delay(350);
    setView((v) => {
      const next = applyRoundState(round, v.session.agents.length === 70 ? v.session.agents : baseAgents);
      const roundFeed = feedByRound[round] ?? [];
      return {
        ...v,
        session: {
          ...v.session,
          agents: next,
          rounds: roundResults.slice(0, round),
        },
        currentRound: round,
        stage: round === 1 ? "round_1" : round === 2 ? "round_2" : "round_3",
        feed: [...v.feed, ...roundFeed],
      };
    });

    await delay(950);
    setView((v) => ({ ...v, isWorking: false }));

    if (round === 3) {
      await delay(450);
      setView((v) => ({
        ...v,
        stage: "winner_ready",
        session: { ...v.session, recommendation: fallbackRecommendation },
      }));
    }
  }, []);

  const selectAgent = useCallback((id: string | null) => {
    setView((v) => ({ ...v, selectedAgentId: id }));
  }, []);

  const revealRecommendation = useCallback(() => {
    setView((v) => ({
      ...v,
      stage: "winner_ready",
      session: { ...v.session, recommendation: fallbackRecommendation },
    }));
  }, []);

  return {
    view,
    actions: { start, runRound, selectAgent, reset, revealRecommendation },
  };
}
