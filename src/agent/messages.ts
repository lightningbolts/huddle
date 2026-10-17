// Everything Huddle says, in one place.
import { formatCents } from "../money";
import type { Mandate, Member, Option, Order, Thread } from "../types";

const names = (ms: Member[]) => ms.map((m) => m.displayName).join(", ");

export const askGoal = () =>
  `Hi, I'm Huddle 👋 What are we buying, and what's the total budget? Reply in one message, e.g. "birthday gift for Sam, $120".`;

export const askGoalAgain = (missing: "budget" | "goal") =>
  missing === "budget"
    ? `I need a total budget too, e.g. "$120".`
    : `What's it for? e.g. "a speaker for the house, $150".`;

export const askPreferences = (t: Thread) =>
  `Goal: ${t.goal}, ${formatCents(t.budgetTotal!)} total.\n` +
  `${names(t.members)}: reply with one preference or constraint each (e.g. "nothing over $80", "she loves music"). Say "skip" to go straight to options.`;

export const waitingOnPreferences = (pending: Member[]) => `Got it. Still waiting on: ${names(pending)}.`;

export const options = (opts: Option[], round: number) =>
  `${round > 1 ? "New round. " : ""}Here are ${opts.length} options:\n` +
  opts.map((o, i) => `${i + 1}. ${o.title}, ${formatCents(o.price)} at ${o.merchant}\n   ${o.reason}`).join("\n");

export const noOptions = (budget: number) =>
  `Nothing in my catalog fits ${formatCents(budget)}. Send a new goal and budget to try again.`;

export const votePrompt = () => `Vote by replying with a number.`;

export const tally = (opts: Option[], counts: Map<string, number>, pending: Member[]) =>
  `Votes: ` +
  opts.map((o, i) => `${i + 1}) ${counts.get(o.id) ?? 0}`).join("  ") +
  (pending.length ? `\nWaiting on: ${names(pending)}` : "");

export const winner = (o: Option) => `${o.title} wins.`;

export const mandateCard = (m: Mandate, o: Option, members: Member[]) =>
  [
    `🧾 Spending mandate`,
    `Item: ${o.title}`,
    `Merchant: ${m.merchant}`,
    `Cap: ${formatCents(m.cap)}`,
    `Shares: ${members.map((x) => `${x.displayName} ${formatCents(m.shares[x.id])}`).join(", ")}`,
    `Expires: ${new Date(m.expiresAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
    ``,
    `Everyone reply "approve" to authorize, or "decline" to cancel.`,
  ].join("\n");

export const approvals = (members: Member[]) => {
  const yes = members.filter((m) => m.approved);
  const no = members.filter((m) => !m.approved);
  return `Approved: ${yes.length ? names(yes) : "nobody yet"}. Waiting on: ${no.length ? names(no) : "nobody"}.`;
};

export const declined = (who: string, o: Option) =>
  `${who} declined, so the mandate for ${o.title} is revoked. Let's look again.`;

export const expired = () => `The mandate expired before everyone approved, so it's revoked. Let's look again.`;

export const buyingNow = (o: Option) => `Everyone's in. Buying ${o.title} from ${o.merchant} now…`;

export const done = (order: Order, o: Option, members: Member[], m: Mandate, payer: Member) =>
  [
    `✅ Order placed: ${o.title} from ${o.merchant}, ${formatCents(order.outcome.amount)}.`,
    `Confirmation: ${order.confirmation}. Status: ${order.status}.`,
    `${payer.displayName} paid; who owes ${payer.displayName}: ` +
      (members
        .filter((x) => x.id !== payer.id)
        .map((x) => `${x.displayName} ${formatCents(m.shares[x.id])}`)
        .join(", ") || "nobody"),
  ].join("\n");

export const checkoutFailed = (reason: string) => `Checkout didn't go through: ${reason} The mandate is revoked; let's look again.`;

export const reset = () => `Okay, I've cleared this purchase. Mention Huddle to start a new one.`;

export const status = (t: Thread) =>
  t.stage === "idle" ? `Nothing in progress. Mention Huddle to start.` : `Stage: ${t.stage}.${t.goal ? ` Goal: ${t.goal}.` : ""}`;
