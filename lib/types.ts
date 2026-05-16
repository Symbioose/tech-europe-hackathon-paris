export type Platform = "instagram" | "tiktok" | "linkedin" | "auto";

export type ProductBrief = {
  name: string;
  url: string;
  oneLiner: string;
  description: string;
  market: string;
  keyPromise: string;
  competitorSignals: string[];
  trendSignals: string[];
  source: "tavily" | "fallback";
};

export type Tribe = {
  id: string;
  name: string;
  platform: Platform;
  profile: string;
  mainPain: string;
  buyingTrigger: string;
  topObjection: string;
  priceSensitivity: "low" | "medium" | "high";
  languageStyle: string;
  emoji: string;
  accent: string;
};

export type AgentState =
  | "idle"
  | "seen"
  | "curious"
  | "converted"
  | "repelled";

export type VoiceProfile =
  | "f-young"
  | "f-mid"
  | "m-young"
  | "m-mid"
  | "m-mature";

export type BuyerAgent = {
  id: string;
  tribeId: string;
  name: string;
  role: string;
  x: number;
  y: number;
  state: AgentState;
  feedback?: string;
  isHero?: boolean;
  voiceProfile?: VoiceProfile;
};

export type LaunchAsset = {
  tribeId: string;
  hook: string;
  videoScript: string;
  landingHeadline: string;
  benefits: string[];
  cta: string;
  dmReply: string;
  creativeUrl?: string;
  previousHook?: string;
};

export type RegenerationTarget = {
  tribeId: string;
  previousHook: string;
  failureReason: string;
};

export type TribeScore = {
  tribeId: string;
  conversionRate: number;
  clickRate: number;
  repelledRate: number;
  topPositiveWords: string[];
  topObjections: string[];
  representativeFeedback: string;
};

export type RoundResult = {
  round: number;
  overallConversion: number;
  learning: string;
  highlights: string[];
  failures: string[];
  assets: LaunchAsset[];
  tribeScores: TribeScore[];
  regenerationTargets?: RegenerationTarget[];
};

export type Recommendation = {
  winningTribeId: string;
  winningHook: string;
  landingHeadline: string;
  cta: string;
  objectionToAvoid: string;
  whyItWon: string;
  nextAction: string;
  videoUrl?: string;
  ranker: "deterministic" | "live";
};

export type Session = {
  brief: ProductBrief;
  tribes: Tribe[];
  agents: BuyerAgent[];
  assets: LaunchAsset[];
  rounds: RoundResult[];
  recommendation?: Recommendation;
};

export type AppStage =
  | "idle"
  | "researching"
  | "tribes_ready"
  | "round_active"
  | "winner_ready";
