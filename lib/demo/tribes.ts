import type { Tribe } from "@/lib/types";

export const tribes: Tribe[] = [
  {
    id: "tribe_1",
    name: "Quantified-Self Biohackers",
    platform: "instagram",
    profile:
      "25–40, technical, listens to Huberman, runs blood panels, has tried 3 wearables.",
    mainPain: "Their watch's HRV reading is noisy and they don't trust it.",
    buyingTrigger: "A bad HRV trend they can't explain after a clean week.",
    topObjection: "Another monthly subscription on top of what I already pay.",
    priceSensitivity: "medium",
    languageStyle: "Data-dense, stack-talk, mentions specific protocols.",
    emoji: "🧪",
    accent: "#a778ff",
  },
  {
    id: "tribe_2",
    name: "Sleep-Anxious Knowledge Workers",
    platform: "linkedin",
    profile:
      "28–45, PMs, engineers, designers. They blame themselves for every bad night.",
    mainPain: "They woke at 3am again and don't know why — but their standup is at 9.",
    buyingTrigger: "A bad week that visibly tanks their work output.",
    topObjection: "I don't need one more app telling me I'm broken.",
    priceSensitivity: "medium",
    languageStyle: "Tired, ROI-driven, ironic. Sleep-debt vocabulary.",
    emoji: "🌙",
    accent: "#3affe9",
  },
  {
    id: "tribe_3",
    name: "Endurance Athletes",
    platform: "instagram",
    profile:
      "30–50, marathoners and cyclists. Already wear a chest strap and a Garmin.",
    mainPain: "They overtrain, plateau, then can't tell whether to push or rest.",
    buyingTrigger: "A coach session where load and feel don't match.",
    topObjection: "A chest strap is more accurate than anything on a finger.",
    priceSensitivity: "low",
    languageStyle: "Power zones, intervals, recovery weeks, vO2.",
    emoji: "🏃",
    accent: "#ff7a1a",
  },
  {
    id: "tribe_4",
    name: "Cycle-Aware Women",
    platform: "instagram",
    profile:
      "25–40, fitness-engaged women tracking energy and PMS patterns across the month.",
    mainPain: "Workouts feel impossible some weeks and they don't know why.",
    buyingTrigger: "Two weeks where the same workout had wildly different effort.",
    topObjection: "I don't trust apps with my cycle data after 2022.",
    priceSensitivity: "medium",
    languageStyle: "Cycle phases, energy, fertility, hormone-aware.",
    emoji: "🌸",
    accent: "#ff5fb8",
  },
  {
    id: "tribe_5",
    name: "Burned-Out Tech Execs",
    platform: "linkedin",
    profile:
      "35–55, founders and C-suite. Recovering from a hard quarter or a failed launch.",
    mainPain: "They keep showing up at 40% and making 40% decisions.",
    buyingTrigger: "A meeting they regret, a missed window, a 4am email they wish they hadn't sent.",
    topObjection: "I am not going to wear something visible on my hand.",
    priceSensitivity: "low",
    languageStyle: "Operator language, leverage, recovery, executive function.",
    emoji: "👔",
    accent: "#ffcf6b",
  },
  {
    id: "tribe_6",
    name: "Strength & CrossFit Athletes",
    platform: "tiktok",
    profile:
      "28–45 lifters. Olympic lifting, powerlifting, CrossFit. Knurled hands, chalk.",
    mainPain: "They can't tell whether yesterday's max was the cause of today's flatness.",
    buyingTrigger: "A failed PR after a deload week.",
    topObjection: "A ring will get destroyed under a barbell — no thanks.",
    priceSensitivity: "medium",
    languageStyle: "PRs, splits, knurling, AMRAP, deload.",
    emoji: "🏋️",
    accent: "#f25b07",
  },
  {
    id: "tribe_7",
    name: "Wellness-Curious Beginners",
    platform: "tiktok",
    profile:
      "22–32. Saw a TikTok about cortisol. Has tried yoga, journaling, an Apple Watch.",
    mainPain: "They feel inexplicably tired and want a story for it.",
    buyingTrigger: "A wave of TikTok content explaining the body in 30-second hooks.",
    topObjection: "I get overwhelmed by data — I don't want another dashboard.",
    priceSensitivity: "high",
    languageStyle: "Vibes, energy, mood, cortisol, soft science.",
    emoji: "✨",
    accent: "#7be38c",
  },
];

export const heroTribeId = "tribe_2";
