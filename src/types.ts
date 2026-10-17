// Shared data model. All money is integer cents.

export const STAGES = [
  "idle",
  "goal",
  "preferences",
  "options",
  "voting",
  "mandate",
  "approvals",
  "checkout",
  "done",
] as const;

export type Stage = (typeof STAGES)[number];

export interface Member {
  id: string;
  displayName: string;
  preference?: string;
  vote?: string; // option id
  approved: boolean;
  share?: number; // cents, set when the mandate is built
}

export interface Option {
  id: string;
  title: string;
  merchant: string;
  price: number; // cents
  reason: string;
}

export type MandateStatus = "pending" | "active" | "revoked" | "spent";

export interface Mandate {
  id: string;
  itemId: string;
  merchant: string;
  cap: number; // cents
  shares: Record<string, number>; // memberId -> cents
  expiresAt: number; // epoch ms
  status: MandateStatus;
}

export type OrderStatus = "placed" | "failed";

export interface Order {
  mandateId: string;
  status: OrderStatus;
  confirmation: string;
  outcome: Outcome;
}

export interface Outcome {
  success: boolean;
  amount: number; // cents
  merchant: string;
  detail?: string;
}

export interface Thread {
  id: string;
  stage: Stage;
  goal?: string;
  budgetTotal?: number; // cents
  members: Member[];
  options: Option[];
  excludedItemIds: string[]; // declined in an earlier round
  mandate?: Mandate;
  order?: Order;
  createdAt: number;
}

/** A message as the agent sees it, independent of the chat platform. */
export interface IncomingMessage {
  threadId: string;
  senderId: string;
  senderName: string;
  text: string;
  /** Everyone in the thread, when the platform can tell us. */
  participants?: { id: string; displayName: string }[];
}

export type Send = (threadId: string, text: string) => Promise<void>;
