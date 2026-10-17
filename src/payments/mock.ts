import { randomBytes } from "node:crypto";
import type { Mandate, Outcome } from "../types";
import type { Credentials, PaymentProvider } from "./provider";

const id = (prefix: string) => `${prefix}_${randomBytes(8).toString("hex")}`;

/** Behaves like the sandbox (realistic ids, a short delay) so the demo looks the same. */
export class MockProvider implements PaymentProvider {
  readonly name = "mock";
  private tokens = new Map<string, string>();
  private instructions = new Map<string, Mandate>();
  readonly outcomes = new Map<string, Outcome>();

  constructor(private delayMs = 600) {}

  private wait() {
    const jitter = this.delayMs * (0.5 + Math.random());
    return new Promise((r) => setTimeout(r, jitter));
  }

  async enrollAgent(memberId: string) {
    await this.wait();
    let token = this.tokens.get(memberId);
    if (!token) {
      token = id("vagt");
      this.tokens.set(memberId, token);
    }
    return token;
  }

  async submitInstruction(m: Mandate) {
    await this.wait();
    const instructionId = id("ins");
    this.instructions.set(instructionId, m);
    return instructionId;
  }

  async getCredentials(instructionId: string): Promise<Credentials> {
    await this.wait();
    if (!this.instructions.has(instructionId)) throw new Error(`Unknown instruction ${instructionId}`);
    return { token: id("ntk"), expiresAt: Date.now() + 15 * 60_000, last4: "4242" };
  }

  async reportOutcome(instructionId: string, o: Outcome) {
    await this.wait();
    this.outcomes.set(instructionId, o);
  }
}
