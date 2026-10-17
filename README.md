# Huddle

Huddle is an agent that lives in a group iMessage thread and takes a group from "what should we get?" to a completed purchase, with a vote and a shared spending limit in between. Built at DubHacks 2026 for the Visa track (Reimagine Shopping) on Photon's Spectrum SDK.

**Devpost:** _TODO: add link_

## How it works

1. Someone mentions Huddle with a goal and a total budget.
2. Each member replies with one preference or constraint.
3. Huddle posts three options, each with price, merchant and a one-line reason.
4. The group votes; Huddle posts the running tally and the winner.
5. Huddle posts a mandate card: item, merchant, spending cap, each member's share, expiry.
6. Every member approves (a decline revokes it and Huddle offers new options).
7. Huddle checks out through the Visa sandbox, or a mock behind the same interface, and posts the confirmation and who owes what.

Before any payment call, the mandate refuses amounts above the cap, other merchants, and requests after expiry or revoke. That check lives in Huddle, so it applies to the mock too.

## Run it

Requires Node 20+.

```bash
npm install
npm run simulate        # scripted three-person thread, mock payments
npm run simulate:live   # type "Alice: message" lines yourself
npm test
npm run typecheck
```

`npm start` boots the real Spectrum adapter, which is not wired up yet (see `src/adapter/spectrum.ts`).

Copy `.env.example` to `.env` to configure. `PAYMENT_PROVIDER=mock` is the default.

## Layout

```
src/
  index.ts        boots the adapter and wires modules
  adapter/        chat platform in and out (Photon Spectrum)
  agent/          thread state machine and message text
  catalog/        curated items, ranking and reasons
  votes/          parsing, tally, tie-break, winner
  mandate/        cap, shares, expiry, approvals, spend guard
  payments/       PaymentProvider interface, visa and mock
  store/          per-thread state (in memory)
scripts/simulate.ts   fake group thread for testing without phones
docs/                 architecture notes and demo script
```

## Team

_TODO: names and Discord handles_
