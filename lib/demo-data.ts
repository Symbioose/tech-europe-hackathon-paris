import type { Session } from "@/lib/types";
import { ouraBrief } from "./demo/brief";
import { tribes, heroTribeId } from "./demo/tribes";
import { baseAgents, applyRoundState, roundStates } from "./demo/agents";
import { assetsRound1, assetsRound2, assetsRound3, assetsByRound } from "./demo/assets";
import { roundResults } from "./demo/rounds";
import { recommendation, heroBuyerFeedback } from "./demo/recommendation";

export {
  ouraBrief,
  tribes,
  heroTribeId,
  baseAgents,
  applyRoundState,
  roundStates,
  assetsRound1,
  assetsRound2,
  assetsRound3,
  assetsByRound,
  roundResults,
  recommendation,
  heroBuyerFeedback,
};

export function buildFallbackSession(): Session {
  return {
    brief: ouraBrief,
    tribes,
    agents: baseAgents.map((a) => ({ ...a })),
    assets: assetsRound1.map((a) => ({ ...a })),
    rounds: [],
  };
}

export function fallbackSessionWithRound(round: 1 | 2 | 3): Session {
  const agents = applyRoundState(round, baseAgents);
  const assets = assetsByRound[round].map((a) => ({ ...a }));
  const rounds = roundResults.slice(0, round);
  return {
    brief: ouraBrief,
    tribes,
    agents,
    assets,
    rounds,
    recommendation: round === 3 ? recommendation : undefined,
  };
}
