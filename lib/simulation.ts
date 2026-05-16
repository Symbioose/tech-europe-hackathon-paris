import type { BuyerAgent, AgentState, RoundResult } from "./types";
import { applyRoundState, roundResults } from "./demo-data";

export function statesForRound(
  round: 1 | 2 | 3,
  agents: BuyerAgent[],
): BuyerAgent[] {
  return applyRoundState(round, agents);
}

export function roundResultFor(round: 1 | 2 | 3): RoundResult {
  return roundResults[round - 1];
}

export function stateColor(state: AgentState): {
  fill: string;
  ring: string;
  label: string;
} {
  switch (state) {
    case "converted":
      return { fill: "#3affe9", ring: "rgba(58,255,233,0.55)", label: "Converted" };
    case "curious":
      return { fill: "#ffcf6b", ring: "rgba(255,207,107,0.55)", label: "Curious" };
    case "seen":
      return { fill: "#6bb6ff", ring: "rgba(107,182,255,0.55)", label: "Saw it" };
    case "repelled":
      return { fill: "#ff5470", ring: "rgba(255,84,112,0.55)", label: "Repelled" };
    case "idle":
    default:
      return { fill: "#2a3046", ring: "rgba(42,48,70,0.45)", label: "Idle" };
  }
}

export function tribeAccent(tribeIdx: number): string {
  const palette = ["#a778ff", "#3affe9", "#ff7a1a", "#ff5fb8", "#ffcf6b", "#f25b07", "#7be38c"];
  return palette[tribeIdx % palette.length];
}
