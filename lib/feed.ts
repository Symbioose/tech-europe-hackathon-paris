export type FeedMessageType = "praise" | "chat" | "protest" | "announcement";

export type FeedMessage = {
  id: string;
  agentId?: string;
  tribeId?: string;
  agentName: string;
  agentRole?: string;
  text: string;
  type: FeedMessageType;
  round: number;
};
