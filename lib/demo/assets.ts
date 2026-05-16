import type { LaunchAsset } from "@/lib/types";

export const assetsRound1: LaunchAsset[] = [
  {
    tribeId: "tribe_1",
    hook: "Your HRV is lying to you.",
    videoScript:
      "[0–3s] Apple Watch on a wrist, scratchy HRV graph. [3–8s] Same person, ring on, smooth trend. [8–15s] Voiceover: 'Wrist HRV is noisy. This ring isn't. Stop tracking. Start optimizing.'",
    landingHeadline: "Stop tracking. Start optimizing.",
    benefits: ["Continuous HRV trend", "Sleep stages without wrist artefacts", "Open API for your stack"],
    cta: "Run a 30-day baseline",
    dmReply: "Sending the protocol now — open it before bed for best results.",
  },
  {
    tribeId: "tribe_2",
    hook: "You woke at 3am again.",
    videoScript:
      "[0–4s] 3:14am on a phone screen. [4–9s] Cut to morning — readiness score 47. [9–15s] 'You're not sleeping. You're not failing. There's a reason.'",
    landingHeadline: "Find out what wrecked your night before your standup.",
    benefits: ["Why you woke at 3am", "Daily readiness score", "Quiet — no notifications, no streaks"],
    cta: "See last night's reason",
    dmReply: "Try the readiness score for a week. DM me if Tuesdays trash you.",
  },
  {
    tribeId: "tribe_3",
    hook: "Train less. PR more.",
    videoScript:
      "[0–3s] Runner finishing tempo. [3–8s] Ring says 'recover.' [8–15s] Voiceover: 'Your watch tells you what you did. This tells you what to do next.'",
    landingHeadline: "The recovery monitor your coach already trusts.",
    benefits: ["Daily load score", "Recovery + readiness", "Sleep tied to power output"],
    cta: "Build my recovery week",
    dmReply: "Run the readiness check before tomorrow's session. Coach will hate it for a week, love it for a year.",
  },
  {
    tribeId: "tribe_4",
    hook: "Your cycle changes everything. Train with it.",
    videoScript:
      "[0–4s] Calendar with cycle phases. [4–10s] Workouts overlaid with energy. [10–15s] 'Your cycle, decoded. Privacy first — your data stays on your phone.'",
    landingHeadline: "Your cycle, decoded by your ring.",
    benefits: ["Predicted cycle from temperature + HRV", "Workout suggestions by phase", "Private — your data is yours"],
    cta: "See my cycle map",
    dmReply: "Privacy first — your cycle data never leaves your phone. Promise.",
  },
  {
    tribeId: "tribe_5",
    hook: "You can't out-execute bad recovery.",
    videoScript:
      "[0–5s] Founder in suit, walking into a board room. [5–10s] Readiness score 38 on phone. [10–15s] 'Operate at your peak, by Wednesday.'",
    landingHeadline: "Operate at your peak, by Wednesday.",
    benefits: ["Readiness for decision-makers", "Trend over weeks, not minutes", "Designed for discretion"],
    cta: "See my readiness curve",
    dmReply: "Board prep happens Sundays. Check readiness Friday so Sunday is real recovery.",
  },
  {
    tribeId: "tribe_6",
    hook: "Lift heavier. Recover smarter.",
    videoScript:
      "[0–4s] Powerlifter setting up. [4–9s] Ring on chalked hand. [9–15s] 'No wrist trace. No interference. Just signal.'",
    landingHeadline: "The strength athlete's recovery edge.",
    benefits: ["No wrist interference during lifts", "Load + recovery", "Sleep stages tied to PR days"],
    cta: "See my load profile",
    dmReply: "Wear it Monday through Sunday. Strip on max-lift day if it bothers you.",
  },
  {
    tribeId: "tribe_7",
    hook: "What's actually making you tired.",
    videoScript:
      "[0–4s] Young woman, yawning. [4–10s] Phone shows: stress at 11pm spiked. [10–15s] 'A ring that explains your day.'",
    landingHeadline: "A ring that explains your day.",
    benefits: ["No more guessing", "Daily morning check-in", "Beautiful enough to forget"],
    cta: "Start the morning check-in",
    dmReply: "Glad you're here. Start with daily readiness — it's the easiest one to feel.",
  },
];

export const assetsRound2: LaunchAsset[] = [
  {
    tribeId: "tribe_1",
    hook: "Your sleep score is lying. Here's the variable nobody tracks.",
    videoScript:
      "[0–4s] Apple Watch sleep score: 88. [4–9s] Ring score with the same night: 61, body temp deviation flagged. [9–15s] 'You can't optimize what you can't see.'",
    landingHeadline: "The HRV detail your watch is too dumb to see.",
    benefits: ["Body-temp deviation, the variable nobody tracks", "Continuous HRV trend", "Compare to your existing wearable"],
    cta: "Compare to your watch",
    dmReply: "Wear both for 14 days. The temperature line is what you've been missing.",
  },
  {
    tribeId: "tribe_2",
    hook: "It wasn't the wine. Your body had a fight at 3am.",
    videoScript:
      "[0–5s] 3:11am. Heart rate spike on chart. [5–10s] Readiness score 47 in morning. [10–15s] 'Stop blaming yourself for bad nights.'",
    landingHeadline: "Stop blaming yourself for bad nights.",
    benefits: ["A reason for every rough morning", "Readiness before your standup", "No buzzing, no streaks, no shame"],
    cta: "See what fought you last night",
    dmReply: "First Monday after a wedding weekend — that's when you'll feel it most. Try then.",
  },
  {
    tribeId: "tribe_3",
    hook: "Your coach can't see the load that broke you. This can.",
    videoScript:
      "[0–4s] Runner sits across from coach. [4–9s] Coach: 'You looked sharp on Tuesday.' Athlete: 'Felt wrecked.' [9–15s] Ring shows accumulated load.",
    landingHeadline: "Where your coach stops, your ring keeps watching.",
    benefits: ["Sub-perceptual load signal", "Daily readiness vs. plan", "Coach-shareable trends"],
    cta: "Run my recovery week",
    dmReply: "Share the trend with your coach after week 2 — that's when it gets real.",
  },
  {
    tribeId: "tribe_4",
    hook: "Stop training against your cycle.",
    videoScript:
      "[0–4s] Workout 1: easy. [4–9s] Workout 2, same plan, brutal. [9–15s] Phase overlay explains why. 'Train with it. Privacy first.'",
    landingHeadline: "Workouts that match your phase, not fight it.",
    benefits: ["Phase-based workout suggestions", "Cycle predicted from body, not memory", "Local-only by default"],
    cta: "See my phase plan",
    dmReply: "First cycle is a baseline. Second one is when the suggestions start being scary-good.",
  },
  {
    tribeId: "tribe_5",
    hook: "You took the meeting. Your readiness was 32.",
    videoScript:
      "[0–4s] Calendar packed. [4–9s] Readiness 32 on Tuesday. [9–15s] 'Don't lead at 32. Know before you walk in.'",
    landingHeadline: "Don't lead at 32. Know before you walk in.",
    benefits: ["Pre-meeting readiness", "Weekly peak-day map", "Subtle enough for any room"],
    cta: "Check tomorrow's readiness",
    dmReply: "Block your two highest-readiness days for hard decisions. Easy week-1 win.",
  },
  {
    tribeId: "tribe_6",
    hook: "You logged a PR. Your recovery says rest.",
    videoScript:
      "[0–4s] Lifter racks bar after a PR. [4–9s] Ring shows fatigue spike. [9–15s] 'Train hard. Recover harder.'",
    landingHeadline: "Train hard. Recover harder.",
    benefits: ["Post-PR fatigue tracking", "Deload triggers from your body", "Strip-and-reattach without losing baseline"],
    cta: "Get my deload",
    dmReply: "Take the ring off for max-effort lifts. Put it back on for sleep. Both reads improve.",
  },
  {
    tribeId: "tribe_7",
    hook: "You're not tired. You're under-recovered.",
    videoScript:
      "[0–4s] Morning, eyes closed. [4–10s] Ring says: stress high last night. [10–15s] 'Your morning, finally explained.'",
    landingHeadline: "Your morning, finally explained.",
    benefits: ["One number a day, not 40", "Why you're tired, in one sentence", "No dashboard required"],
    cta: "See yesterday's signal",
    dmReply: "Look at one thing every morning: readiness. That's the whole product for week one.",
  },
];

export const assetsRound3: LaunchAsset[] = [
  {
    tribeId: "tribe_1",
    hook: "Your watch missed the variable that crashed your week.",
    videoScript:
      "[0–4s] Same person, two devices. [4–9s] Watch: green. Ring: temp deviation amber. [9–15s] 'Track the variable nobody else does.'",
    landingHeadline: "Track the one variable your stack is missing.",
    benefits: ["Body-temp deviation flagged daily", "Trend you can export anywhere", "30-day money back"],
    cta: "Compare 14 days side by side",
    dmReply: "Wear both for 14 nights. If temp doesn't flag a single off-day, refund yourself.",
  },
  {
    tribeId: "tribe_2",
    hook: "Your worst night had a reason. Look it up tomorrow.",
    videoScript:
      "[0–5s] 3:14am on a phone. [5–10s] Cut to morning: '47 — HRV crashed at 3:11.' [10–15s] 'It wasn't on you.'",
    landingHeadline: "Stop blaming yourself for bad nights. Find the reason in 30 seconds.",
    benefits: ["Specific reason for every bad night", "Readiness before your standup", "Quiet — no buzzing, no streaks"],
    cta: "Find last night's reason",
    dmReply: "First week is free of guesswork. Check it before your coffee — it changes how you plan Mondays.",
  },
  {
    tribeId: "tribe_3",
    hook: "The session you said 'felt easy' actually broke you.",
    videoScript:
      "[0–4s] Coach: 'You looked great on Tuesday.' [4–9s] Ring fatigue spike. [9–15s] 'See the load your coach can't.'",
    landingHeadline: "See the load your coach can't.",
    benefits: ["Sub-perceptual fatigue signal", "Coach-shareable charts", "Compatible with chest strap data"],
    cta: "Build my deload week",
    dmReply: "Share the chart with your coach after a 'felt-easy-but-wasn't' day. They'll get it instantly.",
  },
  {
    tribeId: "tribe_4",
    hook: "Same workout. Two cycle phases. Two different bodies.",
    videoScript:
      "[0–5s] Phase 1: same workout, smiling. [5–10s] Phase 3: same workout, ruined. [10–15s] 'Train with your body — privately.'",
    landingHeadline: "Same workout, two phases, two different bodies. Train with yours.",
    benefits: ["Phase-aware workout cues", "Cycle predicted from body, not memory", "Local-only by default"],
    cta: "See my phase plan",
    dmReply: "Track two cycles before judging it. Phase 4 is where the gains show up.",
  },
  {
    tribeId: "tribe_5",
    hook: "32 is not a productive day. Don't waste it.",
    videoScript:
      "[0–4s] Calendar with red days. [4–9s] Readiness 32, 81, 47. [9–15s] 'Lead at 80. Recover at 32. Stop confusing the two.'",
    landingHeadline: "Lead at 80, not 32. Your ring will tell you which day is which.",
    benefits: ["Pre-meeting readiness", "Peak-day calendar overlay", "Subtle enough for any boardroom"],
    cta: "Reserve my peak days",
    dmReply: "Move one hard meeting next week onto an 80-readiness day. You'll feel it in the room.",
  },
  {
    tribeId: "tribe_6",
    hook: "The PR you survived is the one your body is paying for.",
    videoScript:
      "[0–4s] PR clip. [4–9s] 3 days later, ring says rest. [9–15s] 'Train hard. Recover harder. Strip the ring on max day.'",
    landingHeadline: "Train hard. Recover harder.",
    benefits: ["Post-PR fatigue tracking", "Strip-and-reattach without losing baseline", "Sleep-tied PR pattern"],
    cta: "Get my deload",
    dmReply: "Take the ring off for max-effort lifts. Put it back on for sleep. Both reads improve.",
  },
  {
    tribeId: "tribe_7",
    hook: "You're not lazy. You're under-recovered.",
    videoScript:
      "[0–4s] Same morning. [4–10s] Phone: one number, one sentence. [10–15s] 'Your morning, in 5 seconds. No dashboard.'",
    landingHeadline: "Your morning, in one sentence.",
    benefits: ["One number, one reason, every morning", "No data charts", "Beautiful enough to forget"],
    cta: "See yesterday's reason",
    dmReply: "Only check readiness in the morning for week one. Nothing else. Promise.",
  },
];

export const assetsByRound = {
  1: assetsRound1,
  2: assetsRound2,
  3: assetsRound3,
} as const;
