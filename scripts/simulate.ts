// Feeds a scripted group thread into the agent: no phones, no Spectrum, mock payments.
//   npm run simulate                 scripted run (includes a decline and a second round)
//   npm run simulate -- --happy      scripted run with no decline
//   npm run simulate:live            type lines as "Name: message"
import { createInterface } from "node:readline/promises";
import { Agent } from "../src/agent";
import { CuratedCatalog } from "../src/catalog";
import { MockProvider } from "../src/payments/mock";
import { MemoryStore } from "../src/store";

const THREAD = "sim-thread-1";
const PEOPLE = [
  { id: "+15550001", displayName: "Alice" },
  { id: "+15550002", displayName: "Ben" },
  { id: "+15550003", displayName: "Cam" },
];

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

const store = new MemoryStore();
const agent = new Agent({
  store,
  catalog: new CuratedCatalog(),
  payments: new MockProvider(150),
  send: async (_threadId, text) => {
    console.log(`${bold("Huddle")}: ${text.replace(/\n/g, "\n        ")}\n`);
  },
});

async function say(name: string, text: string) {
  const p = PEOPLE.find((x) => x.displayName.toLowerCase() === name.toLowerCase()) ?? {
    id: `+1555${name.length}${name.charCodeAt(0)}`,
    displayName: name,
  };
  console.log(dim(`${p.displayName}: ${text}`));
  await agent.handle({ threadId: THREAD, senderId: p.id, senderName: p.displayName, text, participants: PEOPLE });
}

const script: [string, string][] = [
  ["Alice", "@huddle we need a birthday gift for Dana, $150 total"],
  ["Alice", "she's really into music"],
  ["Ben", "nothing over $130 please"],
  ["Cam", "something fun for parties"],
  ["Alice", "2"],
  ["Ben", "2"],
  ["Cam", "1"],
  ["Alice", "approve"],
  ...(process.argv.includes("--happy")
    ? []
    : ([
        ["Cam", "decline, she already has a Lego set"],
        ["Alice", "1"],
        ["Ben", "1"],
        ["Cam", "1"],
        ["Alice", "approve"],
      ] as [string, string][])),
  ["Ben", "approve"],
  ["Cam", "👍"],
];

if (process.argv.includes("--interactive")) {
  console.log(dim(`Members: ${PEOPLE.map((p) => p.displayName).join(", ")}. Type "Name: message". Ctrl-D to quit.\n`));
  const rl = createInterface({ input: process.stdin });
  for await (const line of rl) {
    const m = line.match(/^\s*([^:]+):\s*(.+)$/);
    if (m) await say(m[1].trim(), m[2]);
    else console.log(dim(`(format: Name: message)`));
  }
} else {
  for (const [name, text] of script) await say(name, text);
  const t = await store.get(THREAD);
  if (t?.stage !== "done") {
    console.error(`Simulation ended in stage "${t?.stage}", expected "done".`);
    process.exit(1);
  }
  console.log(dim(`Simulation finished: ${t.order?.status}, mandate ${t.mandate?.status}.`));
}
