# Architecture

One TypeScript service. Every outside dependency sits behind an interface so a mock can replace it.

| Module | Owns | Talks to |
|---|---|---|
| adapter | Receiving thread messages and sending replies (Photon Spectrum) | agent |
| agent | Thread state machine, parsing replies, composing messages | catalog, votes, mandate, payments, store |
| catalog | Candidate products, ranking, one-line reasons | agent |
| votes | Vote parsing, tally, tie-break, winner | agent |
| mandate | Cap, per-member shares, expiry, approvals, revoke, spend guard | agent, payments |
| payments | `PaymentProvider` with `visa` and `mock`, plus the checkout sequence | mandate |
| store | Per-thread state, in memory | agent |

## Stages

`idle → goal → preferences → options → voting → mandate → approvals → checkout → done`

A declined or expired mandate is revoked and the thread returns to `options`, with the declined item excluded. `options`, `mandate` and `checkout` are stages Huddle passes through while posting; members don't reply in them.

Thread commands at any stage: `huddle status`, `huddle reset`.

## Decisions in the scaffold

- **Money is integer cents** everywhere; `formatCents` only at the edge.
- **Shares** split evenly; leftover cents go to the first members so they sum to the cap exactly.
- **Payer** is the member who started the thread. One demo account pays and the mandate tracks shares, which is the fallback if the sandbox can't split a purchase.
- **Ties** go to the cheaper option, then to the higher-ranked one.
- **Expiry** is checked when the next message arrives in `approvals`, not by a timer.
- **Messages per thread** are processed one at a time in arrival order.
- **Merchant side** of checkout is simulated, since the catalog is curated.

## Open items

- Spectrum: confirm group-thread receive/send and how sender identity and tapbacks arrive. Only `src/adapter/spectrum.ts` changes.
- Visa: endpoints and auth for the four `PaymentProvider` calls. Only `src/payments/visa.ts` changes.
- Splitting: confirm whether the sandbox supports several payers on one purchase.
