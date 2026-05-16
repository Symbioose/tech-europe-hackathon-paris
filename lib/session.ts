"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppStage, Recommendation, Session } from "./types";
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
  regenState: Record<string, { isRegenerating: boolean; oldHook?: string; newHook?: string }>;
  videoRequestId?: string;
  videoUrl?: string;
  videoStatus?: "pending" | "completed" | "error";
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
  regenState: {},
  videoRequestId: undefined,
  videoUrl: undefined,
  videoStatus: undefined,
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

function buildRecommendation(session: Session): Recommendation {
  // Pick the winner from the most recent round's tribeScores (sorted DESC by conversionRate).
  // Fall back to the Oura demo recommendation when live data is missing.
  const lastRound = [...session.rounds].sort((a, b) => b.round - a.round)[0];
  const winnerScore = lastRound?.tribeScores?.[0];
  if (!winnerScore) return fallbackRecommendation;
  const winningTribe = session.tribes.find((t) => t.id === winnerScore.tribeId);
  const winningAsset = session.assets.find((a) => a.tribeId === winnerScore.tribeId);
  if (!winningTribe || !winningAsset) return fallbackRecommendation;
  return {
    winningTribeId: winnerScore.tribeId,
    winningHook: winningAsset.hook,
    landingHeadline: winningAsset.landingHeadline,
    cta: winningAsset.cta,
    objectionToAvoid: winningTribe.topObjection,
    whyItWon: winnerScore.representativeFeedback,
    nextAction: `Lead the launch with this hook on the platform best matching ${winningTribe.platform}. Skip the runner-up tribes for the first wave.`,
    ranker: "deterministic",
  };
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
        regenState: {},
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

    // Regen step: fires BEFORE the /api/round call when advancing to round 2
    if (round === 2) {
      const prevRound = viewRef.current.session.rounds.find((r) => r.round === 1);
      const targets = prevRound?.regenerationTargets ?? [];
      if (targets.length > 0) {
        // 1. Mark targets as regenerating
        setView((v) => ({
          ...v,
          regenState: targets.reduce(
            (acc, t) => ({ ...acc, [t.tribeId]: { isRegenerating: true } }),
            {} as ViewState["regenState"],
          ),
        }));

        const regenSnapshot = viewRef.current.session;

        // 2. Fire 2 parallel regen requests
        await Promise.all(
          targets.map(async (target) => {
            const tribe = regenSnapshot.tribes.find((t) => t.id === target.tribeId);
            if (!tribe) return;
            const tribeIndex = regenSnapshot.tribes.findIndex((t) => t.id === target.tribeId);
            try {
              const res = await fetch("/api/regenerate-creative", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productName: regenSnapshot.brief.name,
                  tribe,
                  tribeIndex,
                  previousHook: target.previousHook,
                  failureReason: target.failureReason,
                  assetMode: "generate",
                }),
              });
              const data = (await res.json().catch(() => null)) as {
                tribeId: string;
                oldHook: string;
                newHook: string;
                newImageUrl: string;
              } | null;
              if (!data) return;
              setView((v) => ({
                ...v,
                regenState: {
                  ...v.regenState,
                  [data.tribeId]: { isRegenerating: false, oldHook: data.oldHook, newHook: data.newHook },
                },
                session: {
                  ...v.session,
                  assets: v.session.assets.map((a) =>
                    a.tribeId === data.tribeId
                      ? { ...a, hook: data.newHook, previousHook: data.oldHook, creativeUrl: data.newImageUrl }
                      : a,
                  ),
                },
              }));
            } catch {
              // silently ignore — card stays in regenerating state briefly
            }
          }),
        );

        // 3. Hold the before/after diff visible for ~2.2 s, then clear
        setTimeout(() => {
          setView((v) => ({ ...v, regenState: {} }));
        }, 2200);

        // Brief pause so the diff is visible before round processing begins
        await delay(500);
      }
    }

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
    const finalAgents = Array.isArray(apiResult?.updatedAgents)
      ? apiResult.updatedAgents
      : applyRoundState(
          round,
          snapshot?.agents?.length === 70 ? snapshot.agents : baseAgents,
        );

    // Commit assets, stage, and round result immediately so the right panel updates.
    setView((v) => ({
      ...v,
      session: {
        ...v.session,
        assets: updatedAssets,
        rounds: [...v.session.rounds.filter((r) => r.round !== round), roundResult].sort(
          (a, b) => a.round - b.round,
        ),
      },
      currentRound: round,
      stage: round === 1 ? "round_1" : round === 2 ? "round_2" : "round_3",
    }));

    // Stagger the 70 agent state transitions to make the simulation feel alive.
    // ~25 ms per agent × 70 = ~1.75 s of rolling visible reactions in the 3D market.
    // Buyers reveal in a randomized order (not strictly sequential by id) so the wave
    // looks organic rather than sweeping left-to-right.
    const revealOrder = finalAgents.map((_: unknown, i: number) => i);
    for (let i = revealOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [revealOrder[i], revealOrder[j]] = [revealOrder[j], revealOrder[i]];
    }

    const roundFeed = feedByRound[round] ?? [];
    const totalReveals = revealOrder.length;
    // Drip a feed message roughly every 1/N of the way through the reveal.
    const feedDripStep = roundFeed.length > 0 ? Math.max(1, Math.floor(totalReveals / roundFeed.length)) : Infinity;
    let feedDripIndex = 0;

    for (let step = 0; step < totalReveals; step++) {
      const agentIdx = revealOrder[step];
      const newState = finalAgents[agentIdx];
      const shouldDripFeed =
        feedDripIndex < roundFeed.length && step > 0 && step % feedDripStep === 0;

      setView((v) => {
        const nextAgents = v.session.agents.map((a, idx) => (idx === agentIdx ? newState : a));
        const nextFeed = shouldDripFeed
          ? [...v.feed, roundFeed[feedDripIndex]]
          : v.feed;
        return {
          ...v,
          session: { ...v.session, agents: nextAgents },
          feed: nextFeed,
        };
      });

      if (shouldDripFeed) feedDripIndex++;
      await delay(25);
    }

    // Drain any remaining feed messages
    if (feedDripIndex < roundFeed.length) {
      setView((v) => ({ ...v, feed: [...v.feed, ...roundFeed.slice(feedDripIndex)] }));
    }

    await delay(400);
    setView((v) => ({ ...v, isWorking: false }));

    if (round === 3) {
      // Kick off video generation immediately (non-blocking) using all accumulated learnings.
      const finalSnapshot = viewRef.current.session;
      const r3Scores = finalSnapshot.rounds.find((r) => r.round === 3)?.tribeScores ?? [];
      const winner = r3Scores[0]; // sorted DESC by conversionRate
      if (winner) {
        const winningTribe = finalSnapshot.tribes.find((t) => t.id === winner.tribeId);
        const winningAsset = finalSnapshot.assets.find((a) => a.tribeId === winner.tribeId);
        fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: finalSnapshot.brief.name,
            winningHook: winningAsset?.hook ?? "",
            winningTribeName: winningTribe?.name ?? "",
            winningTribePain: winningTribe?.mainPain ?? "",
            winningTribeTrigger: winningTribe?.buyingTrigger ?? "",
            objectionAvoided: winningTribe?.topObjection ?? "",
            whyItWon: winner.representativeFeedback ?? "",
            keyPromise: finalSnapshot.brief.keyPromise ?? "",
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data: { requestId?: string | null; prompt?: string } | null) => {
            if (!data?.requestId) {
              setView((v) => ({ ...v, videoStatus: "error" }));
              return;
            }
            setView((v) => ({
              ...v,
              videoRequestId: data.requestId ?? undefined,
              videoStatus: "pending",
            }));
            const interval = setInterval(async () => {
              try {
                const statusRes = await fetch(`/api/video-status?id=${data.requestId}`);
                const status = (await statusRes.json().catch(() => null)) as {
                  status?: string;
                  videoUrl?: string;
                } | null;
                if (status?.status === "completed" && status?.videoUrl) {
                  clearInterval(interval);
                  setView((v) => ({
                    ...v,
                    videoUrl: status.videoUrl,
                    videoStatus: "completed",
                  }));
                }
              } catch {
                // keep polling
              }
            }, 3000);
            // Safety: give up after 3 min
            setTimeout(() => clearInterval(interval), 180000);
          })
          .catch(() => {
            setView((v) => ({ ...v, videoStatus: "error" }));
          });
      }

      await delay(450);
      setView((v) => ({
        ...v,
        stage: "winner_ready",
        session: { ...v.session, recommendation: buildRecommendation(v.session) },
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
      session: { ...v.session, recommendation: buildRecommendation(v.session) },
    }));
  }, []);

  return {
    view,
    actions: { start, runRound, selectAgent, reset, revealRecommendation },
  };
}
