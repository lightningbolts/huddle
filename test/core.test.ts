import assert from "node:assert/strict";
import { test } from "node:test";
import { Agent } from "../src/agent";
import { CuratedCatalog } from "../src/catalog";
import { assertCanSpend, buildMandate, MandateError, splitShares } from "../src/mandate";
import { parseDollars } from "../src/money";
import { MockProvider } from "../src/payments/mock";
import { MemoryStore } from "../src/store";
import type { Member, Option } from "../src/types";
import { parseVote, winner } from "../src/votes";

const opts: Option[] = [
  { id: "a", title: "JBL Flip 6 Speaker", merchant: "Best Buy", price: 12999, reason: "" },
  { id: "b", title: "Catan Board Game", merchant: "Target", price: 4999, reason: "" },
  { id: "c", title: "Instax Mini Camera", merchant: "Best Buy", price: 9999, reason: "" },
];
const member = (id: string, vote?: string): Member => ({ id, displayName: id, approved: false, vote });

test("parseDollars", () => {
  assert.equal(parseDollars("gift for Sam, $120"), 12000);
  assert.equal(parseDollars("budget 45.50 dollars"), 4550);
  assert.equal(parseDollars("$1,200 trip"), 120000);
  assert.equal(parseDollars("no money here"), undefined);
});

test("parseVote reads numbers, words and titles", () => {
  assert.equal(parseVote("2", opts), "b");
  assert.equal(parseVote("I vote #3", opts), "c");
  assert.equal(parseVote("option one", opts), "a");
  assert.equal(parseVote("catan for sure", opts), "b");
  assert.equal(parseVote("lol", opts), undefined);
  assert.equal(parseVote("7", opts), undefined);
});

test("winner breaks ties by lower price", () => {
  const w = winner([member("x", "a"), member("y", "c")], opts);
  assert.equal(w.id, "c");
});

test("shares sum to the price exactly", () => {
  const ms = [member("x"), member("y"), member("z")];
  const s = splitShares(10000, ms);
  assert.equal(Object.values(s).reduce((a, b) => a + b, 0), 10000);
  assert.deepEqual(Object.values(s), [3334, 3333, 3333]);
});

test("mandate refuses over-cap, wrong merchant, inactive and expired", () => {
  const m = { ...buildMandate(opts[0], [member("x")], 60_000, 0), status: "active" as const };
  assert.doesNotThrow(() => assertCanSpend(m, { amount: 12999, merchant: "Best Buy" }, 1));
  assert.throws(() => assertCanSpend(m, { amount: 13000, merchant: "Best Buy" }, 1), MandateError);
  assert.throws(() => assertCanSpend(m, { amount: 100, merchant: "Target" }, 1), MandateError);
  assert.throws(() => assertCanSpend(m, { amount: 100, merchant: "Best Buy" }, 60_000), MandateError);
  assert.throws(() => assertCanSpend({ ...m, status: "revoked" }, { amount: 100, merchant: "Best Buy" }, 1), MandateError);
});

test("catalog stays within budget and honors negatives", () => {
  const out = new CuratedCatalog().rank({ goal: "birthday gift", budget: 10000, preferences: ["no camera"] });
  assert.equal(out.length, 3);
  assert.ok(out.every((o) => o.price <= 10000));
  assert.ok(out.every((o) => !/camera/i.test(o.title)));
});

test("full thread reaches done; expired mandate goes back to options", async () => {
  let clock = 0;
  const store = new MemoryStore();
  const sent: string[] = [];
  const people = [
    { id: "1", displayName: "A" },
    { id: "2", displayName: "B" },
  ];
  const agent = new Agent({
    store,
    catalog: new CuratedCatalog(),
    payments: new MockProvider(0),
    send: async (_t, s) => void sent.push(s),
    mandateTtlMs: 1000,
    now: () => clock,
  });
  const say = (id: string, text: string) =>
    agent.handle({ threadId: "t", senderId: id, senderName: id, text, participants: people });

  await say("1", "huddle house supplies, $100");
  await say("1", "skip");
  await say("1", "1");
  await say("2", "1");
  assert.equal((await store.get("t"))!.stage, "approvals");

  clock = 5000; // past expiry
  await say("1", "approve");
  assert.equal((await store.get("t"))!.stage, "voting");

  await say("1", "2");
  await say("2", "2");
  await say("1", "approve");
  await say("2", "yes");
  const t = (await store.get("t"))!;
  assert.equal(t.stage, "done");
  assert.equal(t.mandate!.status, "spent");
  assert.equal(t.order!.status, "placed");
});

test("catalog applies a price ceiling from preferences", () => {
  const out = new CuratedCatalog().rank({ goal: "gift", budget: 50000, preferences: ["nothing over $70"] });
  assert.ok(out.length > 0 && out.every((o) => o.price <= 7000));
});
