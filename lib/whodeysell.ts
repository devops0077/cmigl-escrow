import { createHmac, timingSafeEqual } from "node:crypto";

// WhoDeySell marketplace handoff — escrow side.
//
// The marketplace (whodeysell.com) redirects buyers here after they click
// "Buy with escrow" on a listing. It signs a base64url JSON payload with
// HMAC-SHA256, keyed with ESCROW_HMAC_SECRET — the same secret value set
// in the marketplace's environment. The secret is shared out of band and
// must never appear in URLs, logs, or client-side code.
//
// Signed payload format (v1), see docs/whodeysell-handoff.md:
//   payload = base64url(JSON { v, orderId, listingId, amountKobo, sellerId, ts, exp })
//   sig     = hex(HMAC-SHA256(ESCROW_HMAC_SECRET, payload))
//   URL     = /buy?payload=<payload>&sig=<sig>
//
// The amount in the payload is in kobo (integer). Escrow amounts are
// stored in naira (Float), so the page converts with amountKobo / 100
// and never accepts an amount from any other source.

export type WhodeysellPayload = {
  v: 1;
  orderId: string;
  listingId: string;
  amountKobo: number;
  sellerId: string;
  ts: number;
  exp: number;
};

export type WhodeysellVerification =
  | { ok: true; payload: WhodeysellPayload }
  | {
      ok: false;
      code:
        | "missing"
        | "not_configured"
        | "bad_signature"
        | "malformed"
        | "expired";
      message: string;
      // Present when the payload parsed but failed a later check (expiry),
      // so the error page can link back to the listing.
      listingId?: string;
    };

function base64urlDecode(text: string): string {
  return Buffer.from(text, "base64url").toString("utf8");
}

function isValidPayload(value: unknown): value is WhodeysellPayload {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    p.v === 1 &&
    typeof p.orderId === "string" &&
    p.orderId.length > 0 &&
    typeof p.listingId === "string" &&
    p.listingId.length > 0 &&
    typeof p.sellerId === "string" &&
    p.sellerId.length > 0 &&
    typeof p.amountKobo === "number" &&
    Number.isInteger(p.amountKobo) &&
    p.amountKobo > 0 &&
    typeof p.ts === "number" &&
    typeof p.exp === "number"
  );
}

/**
 * Verify a WhoDeySell handoff payload, in the order the marketplace spec
 * requires: presence → signature → parse/shape → version → expiry.
 * Duplicate-order detection needs the database, so it lives in the caller.
 */
export function verifyWhodeysellPayload(
  payload: string | null,
  sig: string | null,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): WhodeysellVerification {
  if (!payload || !sig) {
    return {
      ok: false,
      code: "missing",
      message:
        "This checkout link is incomplete. Please start checkout again from the listing.",
    };
  }

  const secret = process.env.ESCROW_HMAC_SECRET;
  if (!secret) {
    return {
      ok: false,
      code: "not_configured",
      message:
        "Escrow checkout is not configured yet. Please try again later.",
    };
  }

  let expectedHex: string;
  try {
    expectedHex = createHmac("sha256", secret).update(payload).digest("hex");
  } catch {
    return {
      ok: false,
      code: "bad_signature",
      message:
        "This checkout link could not be verified. Please start checkout again from the listing.",
    };
  }

  // Constant-time comparison. A non-hex or wrong-length signature can never
  // match; timingSafeEqual throws on length mismatch, so guard it.
  let sigMatches = false;
  try {
    const given = Buffer.from(sig, "hex");
    const expected = Buffer.from(expectedHex, "hex");
    sigMatches =
      given.length === expected.length && timingSafeEqual(given, expected);
  } catch {
    sigMatches = false;
  }
  if (!sigMatches) {
    return {
      ok: false,
      code: "bad_signature",
      message:
        "This checkout link could not be verified. Please start checkout again from the listing.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64urlDecode(payload));
  } catch {
    return {
      ok: false,
      code: "malformed",
      message:
        "This checkout link is damaged. Please start checkout again from the listing.",
    };
  }
  if (!isValidPayload(parsed)) {
    return {
      ok: false,
      code: "malformed",
      message:
        "This checkout link is damaged. Please start checkout again from the listing.",
    };
  }

  // Links last 15 minutes (the marketplace sets exp = ts + 900).
  if (parsed.exp <= nowSeconds) {
    return {
      ok: false,
      code: "expired",
      message:
        "This checkout link has expired. Links last 15 minutes — please start checkout again from the listing.",
      listingId: parsed.listingId,
    };
  }

  return { ok: true, payload: parsed };
}

export function whodeysellListingUrl(listingId: string): string {
  return `https://whodeysell.com/listings/${listingId}`;
}
