import type { ProductBrief } from "@/lib/types";

export const ouraBrief: ProductBrief = {
  name: "Oura Ring",
  url: "https://ouraring.com",
  oneLiner: "A discreet titanium ring that reads your night and tells you why.",
  description:
    "Oura is a wearable that measures HRV, body temperature, sleep stages and recovery from a ring on the finger. The promise is not more data — it is a daily readiness number that explains why you feel the way you do.",
  market: "Wearables · Sleep & Recovery · Quantified-self",
  keyPromise:
    "Stop guessing why you feel like crap. Wear a ring, see your night.",
  competitorSignals: [
    "Whoop subscription pushback on Reddit",
    "Apple Watch Series 10 ships sleep stages but no readiness score",
    "Garmin sleep score is widely mocked among runners",
    "Eight Sleep is the high-end alternative for sleep, not portability",
  ],
  trendSignals: [
    "HRV anxiety is the new step-count anxiety on TikTok",
    "Andrew Huberman keeps pushing sleep scores on podcasts",
    "Cycle tracking moved to private-by-design after the post-Roe debate",
    "Founders are quietly wearing rings on Lenny's pod and YC interviews",
  ],
  source: "fallback",
};
