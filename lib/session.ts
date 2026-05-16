"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppStage, Session } from "./types";
import type { LaunchSetupValues } from "@/components/LaunchSetup";
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

const RESEARCH_STEPS = [
  "Reading product page",
  "Extracting competitor signals",
  "Finding launch patterns",
  "Generating buyer tribes",
  "Preparing simulation inputs",
];

function buildSignals(session: Session): string[] {
  const signals = [
    ...session.brief.trendSignals,
    ...session.brief.competitorSignals,
  ].filter(Boolean);
  return Array.from(new Set(signals)).slice(0, 6);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useSession() {
  const [view, setView] = useState<ViewState>(initial);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const viewRef = useRef<ViewState>(initial);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

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
        signals: buildSignals({
          ...buildFallbackSession(),
          agents,
          assets,
          rounds,
          recommendation: finalize ? fallbackRecommendation : undefined,
        }),
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

  const start = useCallback(async (setupOrUrl?: LaunchSetupValues | string) => {
    const setup: LaunchSetupValues =
      typeof setupOrUrl === "string" || setupOrUrl == null
        ? {
            productUrl: typeof setupOrUrl === "string" ? setupOrUrl : "https://ouraring.com",
            testType: "marketing_message",
            productNote: "",
            targetMarket: "",
            platform: "auto",
            assetMode: "generate",
            assetText: "",
          }
        : setupOrUrl;

    setView((v) => ({
      ...v,
      stage: "researching",
      signals: [],
      isWorking: true,
      currentRound: 0,
      session: buildFallbackSession(),
      feed: [],
    }));

    const runPromise = fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productUrl: setup.productUrl || "https://ouraring.com",
        platform: setup.platform,
        testType: setup.testType,
        productNote: setup.productNote,
        targetMarket: setup.targetMarket,
        assetMode: setup.assetMode,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    for (let i = 0; i < RESEARCH_STEPS.length; i++) {
      await delay(320);
      setView((v) => ({ ...v, signals: RESEARCH_STEPS.slice(0, i + 1) }));
    }

    const result = await Promise.race([
      runPromise,
      new Promise<null>((r) => setTimeout(() => r(null), 35000)),
    ]);

    setView((v) => {
      const session =
        result && Array.isArray(result.tribes) && result.tribes.length === 7
          ? {
              ...v.session,
              brief: result.brief ?? v.session.brief,
              tribes: result.tribes,
              assets: Array.isArray(result.initialAssets)
                ? result.initialAssets
                : v.session.assets,
              agents: Array.isArray(result.agents) ? result.agents : v.session.agents,
            }
          : v.session;
      const signals = buildSignals(session);
      return {
        ...v,
        stage: "tribes_ready",
        isWorking: false,
        session,
        signals: signals.length ? signals : buildSignals(buildFallbackSession()),
      };
    });
  }, []);

  const runRound = useCallback(async (round: 1 | 2 | 3) => {
    const snapshot = viewRef.current.session;
    setView((v) => ({ ...v, isWorking: true }));

    await delay(420);

    const apiResult = await fetch("/api/round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        round,
        brief: snapshot?.brief,
        tribes: snapshot?.tribes,
        assets: snapshot?.assets,
        previousRounds: snapshot?.rounds ?? [],
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const updatedAssets = Array.isArray(apiResult?.updatedAssets)
      ? apiResult.updatedAssets
      : assetsByRound[round].map((a) => ({ ...a }));
    const roundResult = apiResult?.roundResult ?? roundResults[round - 1];
    const updatedAgents = Array.isArray(apiResult?.updatedAgents)
      ? apiResult.updatedAgents
      : applyRoundState(
          round,
          snapshot?.agents?.length === 70 ? snapshot.agents : baseAgents,
        );

    setView((v) => ({
      ...v,
      session: {
        ...v.session,
        assets: updatedAssets,
      },
    }));

    await delay(350);
    setView((v) => {
      const roundFeed = feedByRound[round] ?? [];
      return {
        ...v,
        session: {
          ...v.session,
          agents: updatedAgents,
          rounds: [...v.session.rounds.filter((r) => r.round !== round), roundResult].sort(
            (a, b) => a.round - b.round,
          ),
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
