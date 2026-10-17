import { randomBytes } from "node:crypto";
import { assertCanSpend } from "../mandate";
import type { Mandate, Option, Order } from "../types";
import { MockProvider } from "./mock";
import type { PaymentProvider } from "./provider";
import { VisaProvider } from "./visa";

export type { PaymentProvider, Credentials } from "./provider";

export function providerFromEnv(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "visa" ? new VisaProvider() : new MockProvider();
}

/**
 * Runs the checkout sequence against an active mandate.
 * One demo account (the payer) pays; the mandate tracks each member's share.
 */
export async function checkout(provider: PaymentProvider, mandate: Mandate, option: Option, payerId: string, now = Date.now()): Promise<Order> {
  assertCanSpend(mandate, { amount: option.price, merchant: option.merchant }, now);

  await provider.enrollAgent(payerId);
  const instructionId = await provider.submitInstruction(mandate);
  const credentials = await provider.getCredentials(instructionId);

  // The catalog is curated, so the merchant side is simulated: charge the credential for the option price.
  const confirmation = `${option.merchant.replace(/\W/g, "").slice(0, 3).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const outcome = {
    success: Boolean(credentials.token),
    amount: option.price,
    merchant: option.merchant,
    detail: credentials.last4 ? `card ending ${credentials.last4}` : undefined,
  };

  await provider.reportOutcome(instructionId, outcome);
  return { mandateId: mandate.id, status: outcome.success ? "placed" : "failed", confirmation, outcome };
}
