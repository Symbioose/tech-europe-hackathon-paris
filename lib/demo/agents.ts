import type { BuyerAgent, AgentState } from "@/lib/types";

type AgentSeed = {
  name: string;
  role: string;
};

const tribeSeeds: Record<string, AgentSeed[]> = {
  tribe_1: [
    { name: "Maxim Karpov", role: "ML engineer · Berlin" },
    { name: "Aisha Patel", role: "Performance coach · London" },
    { name: "Diego Reyes", role: "Med student · Madrid" },
    { name: "Soren Vik", role: "Founder, fitness API · Oslo" },
    { name: "Lena Hoffmann", role: "Quant analyst · Frankfurt" },
    { name: "Tariq Al-Mansur", role: "Triathlon coach · Dubai" },
    { name: "Yuki Sato", role: "Sleep researcher · Tokyo" },
    { name: "Marc Lefèvre", role: "Biohacking writer · Paris" },
    { name: "Naomi Cohen", role: "Health-tech PM · Tel Aviv" },
    { name: "Pradip Iyer", role: "Endocrinologist · Bengaluru" },
  ],
  tribe_2: [
    { name: "Claire Bertrand", role: "Senior PM · Paris" },
    { name: "Henrik Andersen", role: "Staff engineer · Copenhagen" },
    { name: "Priya Rao", role: "Design lead · London" },
    { name: "Tom Walsh", role: "Eng manager · Dublin" },
    { name: "Sarah Kim", role: "Product designer · Berlin" },
    { name: "James O'Connor", role: "Founder, SaaS · London" },
    { name: "Léa Dubois", role: "UX researcher · Lyon" },
    { name: "Robert Chen", role: "VP eng · Amsterdam" },
    { name: "Hannah Müller", role: "Data lead · Munich" },
    { name: "Ravi Sharma", role: "Senior PM · Bengaluru" },
  ],
  tribe_3: [
    { name: "Alex Forte", role: "Triathlete · Nice" },
    { name: "Mia Lindqvist", role: "Marathoner · Stockholm" },
    { name: "Marco Bianchi", role: "Cyclist · Milan" },
    { name: "Eli Tanaka", role: "Trail runner · Lisbon" },
    { name: "Camille Roux", role: "Cycling coach · Lyon" },
    { name: "Stefan Krüger", role: "Ironman amateur · Berlin" },
    { name: "Owen Davies", role: "Cyclist · Cardiff" },
    { name: "Iris Westra", role: "Marathoner · Utrecht" },
    { name: "Jonas Bergman", role: "Cross-country skier · Oslo" },
    { name: "Theo Marchetti", role: "Cyclist, ex-pro · Bologna" },
  ],
  tribe_4: [
    { name: "Amélie Laurent", role: "Yoga teacher · Paris" },
    { name: "Zoë Hartman", role: "Software eng · Amsterdam" },
    { name: "Tessa van Dijk", role: "PT · Rotterdam" },
    { name: "Carmen Ortiz", role: "Pilates coach · Barcelona" },
    { name: "Lin Wei", role: "Fitness creator · Singapore" },
    { name: "Anya Petrova", role: "Crossfitter · Riga" },
    { name: "Maya Bharat", role: "Founder, fem-tech · London" },
    { name: "Olivia Brennan", role: "Marathoner · Dublin" },
    { name: "Rosa Marín", role: "OB-GYN · Madrid" },
    { name: "Eun-ji Park", role: "Brand designer · Seoul" },
  ],
  tribe_5: [
    { name: "David Walters", role: "Founder · Series B SaaS · London" },
    { name: "Sophia Reinhardt", role: "CEO · health DTC · Berlin" },
    { name: "Marcus Chen", role: "CTO · fintech · Amsterdam" },
    { name: "Yuna Han", role: "Founder · creator tools · Seoul" },
    { name: "Frédéric Lévesque", role: "Partner · VC · Paris" },
    { name: "Anders Holm", role: "Operator-in-residence · Stockholm" },
    { name: "Isabel Costa", role: "Founder · climate tech · Lisbon" },
    { name: "Vikram Mehta", role: "COO · marketplace · Bengaluru" },
    { name: "Catherine Foley", role: "VP product · Dublin" },
    { name: "Lukas Vogel", role: "Founder · dev-tools · Zürich" },
  ],
  tribe_6: [
    { name: "Tank Williams", role: "Strength coach · Manchester" },
    { name: "Bryn Carter", role: "Powerlifter · Cardiff" },
    { name: "Aleksandar Petrov", role: "Olympic lifter · Sofia" },
    { name: "Jules Moreau", role: "CrossFit affiliate owner · Lyon" },
    { name: "Rafa Núñez", role: "Strongman amateur · Madrid" },
    { name: "Mike Brennan", role: "CrossFitter · Dublin" },
    { name: "Sven Bauer", role: "Strength athlete · Hamburg" },
    { name: "Naia Aronsen", role: "Powerlifter · Bergen" },
    { name: "Levi Tomas", role: "Coach · Barcelona" },
    { name: "Kira Lund", role: "Lifter · Copenhagen" },
  ],
  tribe_7: [
    { name: "Daisy Park", role: "Creator · TikTok wellness · London" },
    { name: "Mateo Rivera", role: "Barista · Madrid" },
    { name: "Indi Brooks", role: "Student · Manchester" },
    { name: "Layla Mahmoud", role: "Brand assistant · Dubai" },
    { name: "Joaquim Silva", role: "Designer · Porto" },
    { name: "Phoebe Wong", role: "PR coordinator · London" },
    { name: "Eli James", role: "Personal trainer · Brighton" },
    { name: "Mila Petrova", role: "Account exec · Berlin" },
    { name: "Yann Leroy", role: "Cook · Paris" },
    { name: "Eva Schmidt", role: "Therapist in training · Vienna" },
  ],
};

export const clusterCenters: Record<string, { cx: number; cy: number }> = {
  tribe_1: { cx: 18, cy: 26 },
  tribe_2: { cx: 50, cy: 18 },
  tribe_3: { cx: 82, cy: 26 },
  tribe_4: { cx: 18, cy: 60 },
  tribe_5: { cx: 50, cy: 52 },
  tribe_6: { cx: 82, cy: 60 },
  tribe_7: { cx: 50, cy: 84 },
};

const offsets: { dx: number; dy: number }[] = [
  { dx: -5, dy: -4 },
  { dx: 4, dy: -5 },
  { dx: -6, dy: 2 },
  { dx: 5, dy: 3 },
  { dx: 0, dy: 0 },
  { dx: -3, dy: 5 },
  { dx: 6, dy: 0 },
  { dx: -1, dy: -6 },
  { dx: 2, dy: 4 },
  { dx: -5, dy: 1 },
];

export const baseAgents: BuyerAgent[] = (() => {
  const all: BuyerAgent[] = [];
  for (const [tribeId, seeds] of Object.entries(tribeSeeds)) {
    const center = clusterCenters[tribeId];
    seeds.forEach((seed, i) => {
      const off = offsets[i];
      all.push({
        id: `${tribeId}_a${i + 1}`,
        tribeId,
        name: seed.name,
        role: seed.role,
        x: center.cx + off.dx,
        y: center.cy + off.dy,
        state: "idle",
        isHero: tribeId === "tribe_2" && i === 0,
      });
    });
  }
  return all;
})();

// Per-round state sequences for each tribe's 10 buyers (order matches agents[i] in baseAgents).
// c = converted, cu = curious, s = seen, r = repelled
type S = AgentState;
const c: S = "converted";
const cu: S = "curious";
const s: S = "seen";
const r: S = "repelled";

export const roundStates: Record<1 | 2 | 3, Record<string, AgentState[]>> = {
  1: {
    tribe_1: [c, cu, cu, s, s, s, s, s, r, r],
    tribe_2: [c, c, cu, cu, cu, s, s, s, s, r],
    tribe_3: [cu, cu, s, s, s, s, s, r, r, r],
    tribe_4: [c, cu, cu, s, s, s, s, s, r, r],
    tribe_5: [c, c, cu, cu, cu, s, s, s, s, r],
    tribe_6: [cu, s, s, s, s, r, r, r, r, r],
    tribe_7: [cu, s, s, s, s, s, r, r, r, r],
  },
  2: {
    tribe_1: [c, c, cu, cu, cu, cu, s, s, s, s],
    tribe_2: [c, c, c, c, cu, cu, cu, cu, s, s],
    tribe_3: [c, cu, cu, cu, s, s, s, s, r, r],
    tribe_4: [c, c, cu, cu, cu, s, s, s, s, s],
    tribe_5: [c, c, c, c, cu, cu, cu, s, s, s],
    tribe_6: [cu, cu, s, s, s, s, r, r, r, r],
    tribe_7: [cu, cu, s, s, s, s, s, r, r, r],
  },
  3: {
    tribe_1: [c, c, c, c, cu, cu, cu, cu, s, s],
    tribe_2: [c, c, c, c, c, c, c, cu, cu, s],
    tribe_3: [c, c, cu, cu, cu, s, s, s, s, r],
    tribe_4: [c, c, c, cu, cu, cu, cu, s, s, s],
    tribe_5: [c, c, c, c, c, c, cu, cu, cu, s],
    tribe_6: [cu, s, s, s, s, r, r, r, r, r],
    tribe_7: [cu, cu, s, s, s, s, s, r, r, r],
  },
};

export function applyRoundState(round: 1 | 2 | 3, agents: BuyerAgent[]): BuyerAgent[] {
  const map = roundStates[round];
  const byTribe = new Map<string, number>();
  return agents.map((agent) => {
    const idx = byTribe.get(agent.tribeId) ?? 0;
    byTribe.set(agent.tribeId, idx + 1);
    const seq = map[agent.tribeId];
    const state: AgentState = seq ? seq[idx] ?? "idle" : "idle";
    return { ...agent, state };
  });
}
