import { randomUUID } from "node:crypto";
import { formatCents } from "../money";
import type { Mandate, Member, Option } from "../types";

export class MandateError extends Error {}

/** Splits `total` cents evenly; leftover cents go to the first members so shares sum exactly. */
export function splitShares(total: number, members: Member[]): Record<string, number> {
  const base = Math.floor(total / members.length);
  let remainder = total - base * members.length;
  const shares: Record<string, number> = {};
  for (const m of members) {
    shares[m.id] = base + (remainder-- > 0 ? 1 : 0);
  }
  return shares;
}

export function buildMandate(option: Option, members: Member[], ttlMs: number, now = Date.now()): Mandate {
  return {
    id: `mdt_${randomUUID().slice(0, 8)}`,
    itemId: option.id,
    merchant: option.merchant,
    cap: option.price,
    shares: splitShares(option.price, members),
    expiresAt: now + ttlMs,
    status: "pending",
  };
}

export function isExpired(m: Mandate, now = Date.now()): boolean {
  return now >= m.expiresAt;
}

export function allApproved(members: Member[]): boolean {
  return members.length > 0 && members.every((m) => m.approved);
}

/** Marks the mandate active once every member has approved. */
export function activate(m: Mandate, members: Member[], now = Date.now()): Mandate {
  if (m.status !== "pending") throw new MandateError(`Mandate is ${m.status}, not pending.`);
  if (isExpired(m, now)) throw new MandateError("Mandate expired before everyone approved.");
  if (!allApproved(members)) throw new MandateError("Not every member has approved.");
  return { ...m, status: "active" };
}

export function revoke(m: Mandate): Mandate {
  return { ...m, status: "revoked" };
}

export function markSpent(m: Mandate): Mandate {
  return { ...m, status: "spent" };
}

/**
 * The guard in front of every payment. It lives here, not in a provider,
 * so the mock and the Visa sandbox are held to the same rules.
 */
export function assertCanSpend(m: Mandate, req: { amount: number; merchant: string }, now = Date.now()): void {
  if (m.status !== "active") throw new MandateError(`Mandate is ${m.status}; nothing can be charged.`);
  if (isExpired(m, now)) throw new MandateError("Mandate has expired.");
  if (req.merchant !== m.merchant) throw new MandateError(`Merchant ${req.merchant} is not the approved merchant ${m.merchant}.`);
  if (req.amount > m.cap) throw new MandateError(`Amount ${formatCents(req.amount)} is above the cap of ${formatCents(m.cap)}.`);
}
