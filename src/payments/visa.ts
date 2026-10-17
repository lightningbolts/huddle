import type { Mandate, Outcome } from "../types";
import type { Credentials, PaymentProvider } from "./provider";

/**
 * Visa Intelligent Commerce sandbox.
 *
 * TODO: fill in once sandbox access is granted (ask at the Visa workshop).
 * The four calls map to the APIs Visa lists for Intelligent Commerce:
 * agent payment tokens, submitting a user instruction, retrieving
 * credentials, and reporting the purchase outcome. Endpoint paths and auth
 * (API key + shared secret, or mutual TLS) must come from the real docs.
 */
export class VisaProvider implements PaymentProvider {
  readonly name = "visa";

  constructor(
    private config = {
      baseUrl: process.env.VISA_API_BASE ?? "https://sandbox.api.visa.com",
      apiKey: process.env.VISA_API_KEY ?? "",
      sharedSecret: process.env.VISA_SHARED_SECRET ?? "",
    },
  ) {
    if (!this.config.apiKey) throw new Error("VISA_API_KEY is not set. Use PAYMENT_PROVIDER=mock until sandbox access is confirmed.");
  }

  async enrollAgent(_memberId: string): Promise<string> {
    return this.notYet("enrollAgent");
  }

  async submitInstruction(_m: Mandate): Promise<string> {
    return this.notYet("submitInstruction");
  }

  async getCredentials(_instructionId: string): Promise<Credentials> {
    return this.notYet("getCredentials");
  }

  async reportOutcome(_instructionId: string, _o: Outcome): Promise<void> {
    return this.notYet("reportOutcome");
  }

  private notYet(call: string): never {
    throw new Error(`VisaProvider.${call} is not implemented yet; confirm the sandbox endpoint first.`);
  }
}
