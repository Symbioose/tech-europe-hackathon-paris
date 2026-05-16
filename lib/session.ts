"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppStage, Session } from "./types";
import type { LaunchSetupValues } from "@/components/LaunchSetup";
import type { TavilyResult } from "@/lib/integrations/tavily";
import {
  applyRoundState,
  buildFallbackSession,
  roundResults,
  recommendation as fallbackRecommendation,
  assetsByRound,
  baseAgents,
} from "./demo-data";
import { feedByRound, type FeedMessage } from "./demo/feed";

export type TavilyState = {
  product: TavilyResult[] | null;
  competitors: TavilyResult[] | null;
  trends: TavilyResult[] | null;
};

export type ViewState = {
  stage: AppStage;
  session: Session;
  currentRound: 0 | 1 | 2 | 3;
  selectedAgentId: string | null;
  isWorking: boolean;
  signals: string[];
  feed: FeedMessage[];
  tavily: TavilyState;
};

const initial: ViewState = {
  stage: "idle",
  session: buildFallbackSession(),
  currentRound: 0,
  selectedAgentId: null,
  isWorking: false,
  signals: [],
  feed: [],
  tavily: { product: null, competitors: null, trends: null },
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
        tavily: { product: null, competitors: null, trends: null },
      });
    };
    if (stage === "tribes") buildAt(0, false);
    else if (stage === "r1") buildAt(1, false);
    else if (stage === "r2") buildAt(2, false);
    else if (stage === "r3") buildAt(3, false);
    else if (stage === "winner") buildAt(3, true);
    // Reset tavily state for URL-stage shortcuts (no SSE was consumed)
    setView((v) => ({ ...v, tavily: { product: null, competitors: null, trends: null } }));

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
      tavily: { product: null, competitors: null, trends: null },
    }));

    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({
      productUrl: setup.productUrl || "https://ouraring.com",
      platform: setup.platform,
      testType: setup.testType,
      productNote: setup.productNote,
      targetMarket: setup.targetMarket,
      assetMode: setup.assetMode,
    });

    let finalSession: typeof initial.session = viewRef.current.session;

    try {
      const res = await fetch("/api/run", { method: "POST", headers, body });

      if (!res.body) {
        // Fallback: no streaming support — treat as done with fallback session
        setView((v) => ({
          ...v,
          stage: "tribes_ready",
          isWorking: false,
        }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Accumulator holds partial SSE state until `done` is received
      const acc: {
        brief?: import("./types").ProductBrief;
        tribes?: import("./types").Tribe[];
        agents?: import("./types").BuyerAgent[];
        initialAssets?: import("./types").LaunchAsset[];
      } = {};

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const lines = raw.trim().split("\n");
          let eventName = "";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventName = line.slice(7).trim();
            if (line.startsWith("data: ")) dataLine = line.slice(6).trim();
          }
          if (!eventName || !dataLine) continue;

          let parsed: unknown;
          try {
            parsed = JSON.parse(dataLine);
          } catch {
            continue;
          }

          switch (eventName) {
            case "tavily:product":
              setView((v) => ({
                ...v,
                tavily: { ...v.tavily, product: parsed as import("@/lib/integrations/tavily").TavilyResult[] },
              }));
              break;
            case "tavily:competitors":
              setView((v) => ({
                ...v,
                tavily: { ...v.tavily, competitors: parsed as import("@/lib/integrations/tavily").TavilyResult[] },
              }));
              break;
            case "tavily:trends":
              setView((v) => ({
                ...v,
                tavily: { ...v.tavily, trends: parsed as import("@/lib/integrations/tavily").TavilyResult[] },
              }));
              break;
            case "brief":
              acc.brief = parsed as import("./types").ProductBrief;
              break;
            case "tribes:all":
              acc.tribes = parsed as import("./types").Tribe[];
              break;
            case "agents":
              acc.agents = parsed as import("./types").BuyerAgent[];
              break;
            case "initialAssets":
              acc.initialAssets = parsed as import("./types").LaunchAsset[];
              break;
            case "done":
              // Commit accumulated session state
              setView((v) => {
                const tribes = Array.isArray(acc.tribes) && acc.tribes.length === 7
                  ? acc.tribes
                  : v.session.tribes;
                finalSession = {
                  ...v.session,
                  brief: acc.brief ?? v.session.brief,
                  tribes,
                  assets: Array.isArray(acc.initialAssets) ? acc.initialAssets : v.session.assets,
                  agents: Array.isArray(acc.agents) ? acc.agents : v.session.agents,
                };
                const signals = buildSignals(finalSession);
                return {
                  ...v,
                  stage: "tribes_ready",
                  isWorking: false,
                  session: finalSession,
                  signals: signals.length ? signals : buildSignals(buildFallbackSession()),
                };
              });
              break;
          }
        }
      }

      // If `done` event never arrived (stream closed without it), commit what we have
      if (viewRef.current.stage === "researching") {
        setView((v) => {
          const tribes = Array.isArray(acc.tribes) && acc.tribes.length === 7
            ? acc.tribes
            : v.session.tribes;
          finalSession = {
            ...v.session,
            brief: acc.brief ?? v.session.brief,
            tribes,
            assets: Array.isArray(acc.initialAssets) ? acc.initialAssets : v.session.assets,
            agents: Array.isArray(acc.agents) ? acc.agents : v.session.agents,
          };
          const signals = buildSignals(finalSession);
          return {
            ...v,
            stage: "tribes_ready",
            isWorking: false,
            session: finalSession,
            signals: signals.length ? signals : buildSignals(buildFallbackSession()),
          };
        });
      }
    } catch {
      // Network failure — fall through to tribes_ready with fallback data
      setView((v) => ({
        ...v,
        stage: "tribes_ready",
        isWorking: false,
      }));
    }

    // Fire 7 parallel creative fetches — do NOT await, so UI transitions immediately
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      // Wait one tick for finalSession to be assigned inside the setView callback
      await Promise.resolve();
      const sessionForCreatives = finalSession ?? viewRef.current.session;
      const tribes = sessionForCreatives.tribes ?? [];
      const productName = sessionForCreatives.brief?.name ?? "Product";

      const fetchCreative = async (index: number) => {
        const tribe = tribes[index];
        if (!tribe) return;

        // Find the hook for this tribe from the current assets
        const assetHook =
          sessionForCreatives.assets.find((a) => a.tribeId === tribe.id)?.hook ?? "";

        try {
          const res = await fetch("/api/generate-creative", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productName,
              tribeName: tribe.name,
              tribeIndex: index,
              hook: assetHook,
              assetMode: setup.assetMode,
            }),
          });
          if (!res.ok) return;
          const data = (await res.json()) as { imageUrl?: string };
          const imageUrl = data.imageUrl;
          if (!imageUrl) return;

          setView((v) => ({
            ...v,
            session: {
              ...v.session,
              assets: v.session.assets.map((a) =>
                a.tribeId === tribe.id ? { ...a, creativeUrl: imageUrl } : a,
              ),
            },
          }));
        } catch {
          // silently ignore — shimmer stays until next refresh
        }
      };

      // All 7 in parallel
      await Promise.all(tribes.slice(0, 7).map((_, i) => fetchCreative(i)));
    })();
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
