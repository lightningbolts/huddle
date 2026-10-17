import { SpectrumAdapter, type ChatAdapter } from "./adapter";
import { Agent } from "./agent";
import { CuratedCatalog } from "./catalog";
import { providerFromEnv } from "./payments";
import { MemoryStore } from "./store";

const adapter: ChatAdapter = new SpectrumAdapter();
const payments = providerFromEnv();

const agent = new Agent({
  store: new MemoryStore(),
  catalog: new CuratedCatalog(),
  payments,
  send: (threadId, text) => adapter.send(threadId, text),
  mandateTtlMs: Number(process.env.MANDATE_TTL_MINUTES ?? 30) * 60_000,
});

console.log(`[huddle] starting with ${payments.name} payments`);
await adapter.start((msg) => agent.handle(msg));
