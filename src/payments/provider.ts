import type { Mandate, Outcome } from "../types";

export interface Credentials {
  /** Network token or one-time card credential the agent uses to pay. */
  token: string;
  expiresAt: number;
  last4?: string;
}

/** Everything Huddle needs from a payment network. Visa and the mock both implement it. */
export interface PaymentProvider {
  readonly name: string;
  enrollAgent(memberId: string): Promise<string>; // agent token
  submitInstruction(m: Mandate): Promise<string>; // instruction id
  getCredentials(instructionId: string): Promise<Credentials>;
  reportOutcome(instructionId: string, o: Outcome): Promise<void>;
}
