import type { BuyerAgent, Tribe, VoiceProfile } from "./types";

export const clusterCenters: Record<string, { cx: number; cy: number }> = {
  tribe_1: { cx: 18, cy: 26 },
  tribe_2: { cx: 50, cy: 18 },
  tribe_3: { cx: 82, cy: 26 },
  tribe_4: { cx: 18, cy: 60 },
  tribe_5: { cx: 50, cy: 52 },
  tribe_6: { cx: 82, cy: 60 },
  tribe_7: { cx: 50, cy: 84 },
};

const offsets = [
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

const names = [
  "Maya Chen",
  "Alex Rivera",
  "Claire Dubois",
  "David Moreau",
  "Amelie Laurent",
  "Maxim Keller",
  "Daisy Martin",
  "Noah Singh",
  "Lea Bernard",
  "Sam Carter",
];

const regions = [
  "Paris",
  "London",
  "Berlin",
  "Amsterdam",
  "Barcelona",
  "New York",
  "Toronto",
  "Stockholm",
  "Milan",
  "Lisbon",
];

const voiceProfiles: VoiceProfile[] = ["f-young", "m-young", "f-mid", "m-mid", "m-mature"];

function roleFor(tribe: Tribe, index: number) {
  const profile = tribe.profile.split(/[,.]/)[0]?.trim();
  const base = profile && profile.length < 48 ? profile : tribe.name;
  return `${base} · ${regions[index % regions.length]}`;
}

export function buildAgentsForTribes(tribes: Tribe[]): BuyerAgent[] {
  return tribes.flatMap((tribe, tribeIndex) => {
    const center = clusterCenters[tribe.id] ?? { cx: 50, cy: 50 };
    return offsets.map(({ dx, dy }, buyerIndex) => ({
      id: `${tribe.id}_buyer_${buyerIndex + 1}`,
      tribeId: tribe.id,
      name: names[(tribeIndex * 3 + buyerIndex) % names.length],
      role: roleFor(tribe, buyerIndex),
      x: center.cx + dx,
      y: center.cy + dy,
      state: "idle",
      isHero: buyerIndex === 0,
      voiceProfile: voiceProfiles[(tribeIndex + buyerIndex) % voiceProfiles.length],
    }));
  });
}
