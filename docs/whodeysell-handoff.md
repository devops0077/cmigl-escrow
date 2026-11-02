# WhoDeySell handoff — escrow side

The marketplace (whodeysell.com) redirects buyers here after they click
"Buy with escrow" on a listing. This document describes the endpoint this
repo implements, the setup it needs, and the questions still open. The
marketplace side (signing) lives in the whodeysell repo
(`lib/escrow.ts`, `lib/actions/escrow.ts`, `docs/escrow-handoff.md`).

## Entry URL

```
GET https://escrow.cmigl.org/buy?payload=<payload>&sig=<sig>
```

- `payload`: base64url-encoded JSON (no padding), fields `v` (`1`),
  `orderId` (marketplace `EscrowOrder` id), `listingId` (marketplace
  `Listing` id), `amountKobo` (integer kobo), `sellerId` (marketplace
  user id), `ts` (unix seconds, signed at), `exp` (unix seconds,
  `ts + 900`, 15 minutes).
- `sig`: lowercase hex HMAC-SHA256 of the base64url payload string (not
  the JSON), keyed with `ESCROW_HMAC_SECRET`.

## Verification (`lib/whodeysell.ts`, used by `app/buy/page.tsx`)

In order: both parameters present → recompute the HMAC and compare in
constant time → base64url-decode and JSON-parse → `v` must be `1` →
`exp` must be in the future → the `orderId` must not already have a
transaction (stored as `Transaction.marketplaceOrderId`, unique).

On any rejection the buyer sees a clear error page and no transaction is
created. An expired link shows a link back to the listing
(`https://whodeysell.com/listings/<listingId>`), where a fresh link can
be minted. A repeat visit with an `orderId` that already has a
transaction lands on that transaction instead of creating a duplicate.

## Flow after verification

1. The buyer must be signed in to escrow. A signed-out buyer is sent to
   `/auth/login?callbackUrl=/buy?payload=...&sig=...` and returns here.
   Guest funding is not supported: the funding flow below is the
   existing wallet-first flow.
2. The seller is resolved through `MarketplaceSellerMapping` (below).
   If there is no mapping, the page refuses the checkout: no transaction
   is created and no money moves.
3. The page shows the pre-filled review: seller, item amount
   (`amountKobo / 100` in naira), escrow fee (4.5% via
   `calculateEscrowFee`), total from wallet, and wallet balance. The
   amount is never taken from any unsigned source.
4. If the wallet covers the total, the buyer confirms and the page's
   server action re-verifies everything and calls `createTransaction`
   (extended with `marketplaceOrderId` / `productCategory`), which
   deducts amount + fee from the buyer's wallet into escrow and creates
   the `PENDING` transaction. The buyer lands on
   `/dashboard/transactions/<id>`, where delivery, approval and release
   continue in the existing UI (seller marks `SHIPPED`, buyer marks
   `CONFIRMED`, admin marks `COMPLETED`).
5. If the wallet is short, the page links to wallet funding with a
   `returnUrl` back to the same signed `/buy` link. Note the 15-minute
   expiry: if funding takes longer, the buyer restarts checkout from
   the listing for a fresh link.

## Setup required on the escrow deployment

1. Set `ESCROW_HMAC_SECRET` to the same value as the marketplace's
   `ESCROW_HMAC_SECRET` (shared out of band; never commit it, never put
   it in a URL or log). Without it, every handoff fails closed.
2. Apply the migration in
   `prisma/migrations/20261102183000_whodeysell_handoff/` (adds
   `Transaction.marketplaceOrderId` and the `MarketplaceSellerMapping`
   table), then regenerate the Prisma client.
3. Create one `MarketplaceSellerMapping` row per seller, mapping their
   WhoDeySell user id to their escrow user id. Until a seller has a
   row, their listings cannot check out (by design — never pay out to
   an unresolved account).

## Open questions (need Max's confirmation)

- **Who creates seller mappings?** Options: an admin inserts rows
  manually; sellers self-link (a future "link my WhoDeySell account"
  step that proves ownership of both accounts); or the marketplace
  sends the seller's escrow id directly in a future payload version
  (`v: 2`). Until one is chosen, mappings are manual.
- **Buyer account assumption:** the buyer needs an escrow account and
  must sign in (or register) before funding. If guest checkout is ever
  wanted, that is a bigger change to the wallet-first model.
- **15-minute link vs wallet funding:** a buyer who must fund their
  wallet first may outlive the link and have to restart from the
  listing. Acceptable for now; lengthening the TTL is a marketplace
  change (`ESCROW_PAYLOAD_TTL_SECONDS`) if it proves annoying.
- **Phase 2 (not built):** server-to-server status updates back to the
  marketplace (funded / delivered / released / disputed) and webhooks.
  Until then the marketplace order stays `PENDING` after redirect and
  escrow is the system of record for the money.
