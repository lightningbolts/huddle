import type { Catalog } from "../catalog";
import * as mandates from "../mandate";
import { MandateError } from "../mandate";
import { parseDollars } from "../money";
import { checkout, type PaymentProvider } from "../payments";
import { newThread, type Store } from "../store";
import type { IncomingMessage, Member, Send, Thread } from "../types";
import * as votes from "../votes";
import * as say from "./messages";

export interface AgentDeps {
  store: Store;
  catalog: Catalog;
  payments: PaymentProvider;
  send: Send;
  mandateTtlMs?: number;
  now?: () => number;
}

const MENTION = /\bhuddle\b/i;
const APPROVE = /\b(approve[sd]?|yes|yep|yeah|ok|okay|i'?m in)\b|👍|✅/i;
const DECLINE = /\b(decline[sd]?|no|nope|veto)\b|👎|❌/i;
const SKIP = /^\s*(skip|done|go|next)\s*[.!]?\s*$/i;

/** The thread state machine: goal → preferences → options → voting → mandate → approvals → checkout → done. */
export class Agent {
  private queues = new Map<string, Promise<void>>();
  private ttlMs: number;
  private now: () => number;

  constructor(private deps: AgentDeps) {
    this.ttlMs = deps.mandateTtlMs ?? 30 * 60_000;
    this.now = deps.now ?? Date.now;
  }

  /** Messages for one thread are handled one at a time, in arrival order. */
  handle(msg: IncomingMessage): Promise<void> {
    const prev = this.queues.get(msg.threadId) ?? Promise.resolve();
    const next = prev.then(() => this.process(msg)).catch((err) => console.error(`[agent] ${msg.threadId}:`, err));
    this.queues.set(msg.threadId, next);
    return next;
  }

  private async process(msg: IncomingMessage) {
    const { store } = this.deps;
    const t = (await store.get(msg.threadId)) ?? newThread(msg.threadId);
    const text = msg.text.trim();
    const post = (s: string) => this.deps.send(t.id, s);

    if (MENTION.test(text) && /\b(reset|cancel)\b/i.test(text) && t.stage !== "checkout") {
      Object.assign(t, newThread(t.id));
      await store.save(t);
      return post(say.reset());
    }
    if (MENTION.test(text) && /\bstatus\b/i.test(text)) return post(say.status(t));

    switch (t.stage) {
      case "idle":
      case "done":
        if (!MENTION.test(text)) return;
        this.start(t, msg);
        // The opening message may already carry the goal and budget.
        if (parseDollars(text) === undefined) {
          await post(say.askGoal());
          break;
        }
      // falls through
      case "goal":
        await this.onGoal(t, msg, post);
        break;
      case "preferences":
        await this.onPreference(t, msg, post);
        break;
      case "voting":
        await this.onVote(t, msg, post);
        break;
      case "approvals":
        await this.onApproval(t, msg, post);
        break;
      case "options":
      case "mandate":
      case "checkout":
        return; // Huddle is mid-post or mid-purchase; nothing to reply to.
    }
    await store.save(t);
  }

  private start(t: Thread, msg: IncomingMessage) {
    Object.assign(t, newThread(t.id), { stage: "goal", createdAt: this.now() });
    const people = msg.participants?.length ? msg.participants : [{ id: msg.senderId, displayName: msg.senderName }];
    t.members = people.map((p) => ({ id: p.id, displayName: p.displayName, approved: false }));
    this.member(t, msg); // the sender is always the first member and the payer
    t.members.sort((a, b) => (a.id === msg.senderId ? -1 : b.id === msg.senderId ? 1 : 0));
  }

  /** Finds the sender, adding them if the platform didn't list them up front. */
  private member(t: Thread, msg: IncomingMessage): Member {
    let m = t.members.find((x) => x.id === msg.senderId);
    if (!m) {
      m = { id: msg.senderId, displayName: msg.senderName, approved: false };
      t.members.push(m);
    }
    return m;
  }

  private async onGoal(t: Thread, msg: IncomingMessage, post: (s: string) => Promise<void>) {
    this.member(t, msg);
    const budget = parseDollars(msg.text);
    const goal = msg.text
      .replace(/@?huddle[,:]?/gi, "")
      .replace(/\$\s?[\d,]+(?:\.\d{1,2})?|\b\d+(?:\.\d{1,2})?\s?(?:dollars|bucks|usd)\b/gi, "")
      .replace(/\b(budget|total|is|of|under|max)\b/gi, "")
      .replace(/[\s,.;:-]+$|^[\s,.;:-]+/g, "")
      .replace(/^(?:we|i)\s+(?:need|want)(?:\s+to\s+(?:get|buy))?\s+/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (budget === undefined || budget <= 0) return post(say.askGoalAgain("budget"));
    if (!goal) return post(say.askGoalAgain("goal"));
    t.goal = goal;
    t.budgetTotal = budget;
    t.stage = "preferences";
    await post(say.askPreferences(t));
  }

  private async onPreference(t: Thread, msg: IncomingMessage, post: (s: string) => Promise<void>) {
    const m = this.member(t, msg);
    if (!SKIP.test(msg.text)) m.preference = msg.text.trim();
    const pending = t.members.filter((x) => !x.preference);
    if (pending.length && !SKIP.test(msg.text)) return post(say.waitingOnPreferences(pending));
    await this.presentOptions(t, post);
  }

  private async presentOptions(t: Thread, post: (s: string) => Promise<void>) {
    t.stage = "options";
    for (const m of t.members) {
      m.vote = undefined;
      m.approved = false;
      m.share = undefined;
    }
    t.mandate = undefined;
    t.options = this.deps.catalog.rank({
      goal: t.goal!,
      budget: t.budgetTotal!,
      preferences: t.members.map((m) => m.preference).filter((p): p is string => !!p),
      exclude: t.excludedItemIds,
    });
    if (!t.options.length) {
      t.stage = "goal";
      return post(say.noOptions(t.budgetTotal!));
    }
    await post(say.options(t.options, t.excludedItemIds.length + 1));
    t.stage = "voting";
    await post(say.votePrompt());
  }

  private async onVote(t: Thread, msg: IncomingMessage, post: (s: string) => Promise<void>) {
    const choice = votes.parseVote(msg.text, t.options);
    if (!choice) return; // ordinary chatter
    const m = this.member(t, msg);
    m.vote = choice;
    const counts = votes.tally(t.members, t.options);
    await post(say.tally(t.options, counts, t.members.filter((x) => !x.vote)));
    if (!votes.allVoted(t.members)) return;

    const win = votes.winner(t.members, t.options);
    t.stage = "mandate";
    t.mandate = mandates.buildMandate(win, t.members, this.ttlMs, this.now());
    for (const x of t.members) x.share = t.mandate.shares[x.id];
    await post(say.winner(win));
    await post(say.mandateCard(t.mandate, win, t.members));
    t.stage = "approvals";
  }

  private async onApproval(t: Thread, msg: IncomingMessage, post: (s: string) => Promise<void>) {
    const mandate = t.mandate!;
    const option = t.options.find((o) => o.id === mandate.itemId)!;

    if (mandates.isExpired(mandate, this.now())) {
      t.mandate = mandates.revoke(mandate);
      await post(say.expired());
      return this.presentOptions(t, post);
    }

    const m = t.members.find((x) => x.id === msg.senderId);
    if (!m) return; // only the members on the card can approve

    if (DECLINE.test(msg.text) && !/\bapprove/i.test(msg.text)) {
      t.mandate = mandates.revoke(mandate);
      t.excludedItemIds.push(mandate.itemId);
      await post(say.declined(m.displayName, option));
      return this.presentOptions(t, post);
    }
    if (!APPROVE.test(msg.text)) return;

    m.approved = true;
    if (!mandates.allApproved(t.members)) return post(say.approvals(t.members));

    t.mandate = mandates.activate(mandate, t.members, this.now());
    t.stage = "checkout";
    await this.deps.store.save(t);
    await post(say.buyingNow(option));

    const payer = t.members[0];
    try {
      t.order = await checkout(this.deps.payments, t.mandate, option, payer.id, this.now());
      t.mandate = mandates.markSpent(t.mandate);
      t.stage = "done";
      await post(say.done(t.order, option, t.members, t.mandate, payer));
    } catch (err) {
      t.mandate = mandates.revoke(t.mandate);
      const reason = err instanceof MandateError ? err.message : "the payment provider returned an error.";
      if (!(err instanceof MandateError)) console.error("[checkout]", err);
      await post(say.checkoutFailed(reason));
      await this.presentOptions(t, post);
    }
  }
}
