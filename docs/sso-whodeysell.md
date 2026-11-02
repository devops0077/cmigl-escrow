# SSO with WhoDeySell — escrow side

This app and WhoDeySell (whodeysell.com) sign users into each other
with Better Auth on both sides. This document covers the escrow side
only: escrow as an OAuth 2.1 / OIDC **provider** for WhoDeySell, and
escrow as a **client** of WhoDeySell's provider. The marketplace side
lives in the whodeysell repo.

## Why this mechanism (and not hand-rolled sessions)

Session creation and just-in-time (JIT) provisioning are handled by
Better Auth itself — no hand-rolled session cookies, no custom token
exchange. Replay/CSRF protection comes from the protocol: `state`,
PKCE (S256), and exact redirect-URI matching on both sides. Account
linking by email gives the sync semantics: one person, one escrow
account, whether they arrived with a password or through WhoDeySell.

## Configuration (escrow side, `auth.ts`)

- **This app as a client of WhoDeySell** — `genericOAuth` plugin:
  - `providerId: "whodeysell"`
  - `discoveryUrl`:
    `https://whodeysell.com/api/auth/.well-known/openid-configuration`
    (WhoDeySell's issuer is its auth handler base,
    `https://whodeysell.com/api/auth`; OIDC appends the well-known
    path to the issuer, which is why the path includes `/api/auth`).
    Override the origin for local dev with `WHODEYSELL_BASE_URL`
    (default `https://whodeysell.com`).
  - `scopes: ["openid", "email", "profile"]`, `pkce: true`.
  - Client entry: `authClient.signIn.social({ provider: "whodeysell",
    callbackURL })` (see `lib/auth-client.ts` and the sign-in page).
    The callback is Better Auth's generic-OAuth callback for this
    provider id: `{baseURL}/api/auth/callback/whodeysell`.
  - Credentials come from env vars only (below) — the plugin is only
    registered when both are set, so a deployment without them still
    boots and serves email/password sign-in.
- **This app as a provider for WhoDeySell** — `@better-auth/oauth-provider`:
  - `loginPage: "/auth/login"`, `consentPage: "/auth/consent"`.
    (Both are required by the plugin in Better Auth 1.7; the consent
    page at `app/auth/consent` completes via
    `authClient.oauth2.consent`. The first-party WhoDeySell client
    skips consent — see below — so the page is only reached by
    untrusted clients.)
  - `jwt()` plugin alongside it, so access tokens are verifiable JWTs
    and signing keys are served at `/api/auth/jwks`.
  - Discovery served by this app's own handler:
    `https://escrow.cmigl.org/api/auth/.well-known/openid-configuration`
    (and OAuth metadata at
    `https://escrow.cmigl.org/api/auth/.well-known/oauth-authorization-server`).
  - `trustedOrigins` includes `https://whodeysell.com` (plus
    `http://localhost:3000` outside production).
- **Account linking** (`account.accountLinking` in `auth.ts`):
  `enabled: true`, `trustedProviders: ["whodeysell"]`,
  `allowDifferentEmails` off. Behaviour, verified against the Better
  Auth docs:
  - WhoDeySell sign-in with an email that matches an existing escrow
    account **links to that account** (no duplicate, no second
    wallet) — trusted-provider linking applies even if WhoDeySell
    does not assert `email_verified`.
  - WhoDeySell sign-in with a new email **provisions a fresh escrow
    account** (JIT): name/email/image from the WhoDeySell profile,
    role `USER`, no phone yet (the `phone` column is nullable for
    exactly this reason), and a wallet row created by the
    `databaseHooks.user.create.after` hook in `auth.ts` so `/buy`
    checkout has a wallet to fund from. `termsAccepted` stays
    `false` for JIT users (open question in
    `docs/better-auth-migration.md`).
  - A different email is never auto-linked to a signed-in account.

### Trust note (read this before reusing the pattern)

`trustedProviders: ["whodeysell"]` bypasses the email-verification
check for linking. That is acceptable here **only because WhoDeySell
is first-party** (same owner, same user base, same deployment
family). Do not add a third-party provider to `trustedProviders`
without an email-ownership review — an attacker who controls an
account with a victim's email on an untrusted provider could
otherwise link into the victim's escrow account.

## Redirect URIs

| Direction | Redirect URI |
| --- | --- |
| Escrow as client of WhoDeySell (this app's callback) | `https://escrow.cmigl.org/api/auth/callback/whodeysell` |
| WhoDeySell as client of escrow (WhoDeySell's callback) | `https://whodeysell.com/api/auth/callback/escrow` |

Local-dev variants: replace the origin with the local dev origin and
keep the path, e.g. `http://localhost:3000/api/auth/callback/whodeysell`
for a local escrow instance, and the corresponding local WhoDeySell
origin for its callback. Both URIs must match **exactly** what is
registered for the client (scheme, host, port and path) or the
provider rejects the authorization request.

## Environment variables (names only, never values)

- This app as a client of WhoDeySell:
  `WHODEYSELL_OAUTH_CLIENT_ID`, `WHODEYSELL_OAUTH_CLIENT_SECRET`.
- WhoDeySell as a client of this app:
  `ESCROW_OAUTH_CLIENT_ID`, `ESCROW_OAUTH_CLIENT_SECRET`.
  These are the values **returned when the client is registered**
  (next section) and then configured on the WhoDeySell side — they
  are not set inside this repo.
- Plus `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (see
  `docs/better-auth-migration.md`).

## Deployment setup: registering WhoDeySell as a client of escrow

Client credentials are **never hardcoded**. Register WhoDeySell once,
from server code (a one-off script or an admin-only route that calls
the server API below — do not expose this endpoint publicly), after
the Better Auth migration is applied:

```ts
import { auth } from "@/auth";

// headers: pass request headers (server-only call).
const client = await auth.api.adminCreateOAuthClient({
  headers,
  body: {
    client_name: "WhoDeySell",
    redirect_uris: ["https://whodeysell.com/api/auth/callback/escrow"],
    // First-party: no consent screen.
    skip_consent: true,
    enable_end_session: true,
    client_secret_expires_at: 0,
  },
});
// client.client_id -> ESCROW_OAUTH_CLIENT_ID (on the WhoDeySell side)
// client.client_secret -> ESCROW_OAUTH_CLIENT_SECRET (shown once; store it
// in WhoDeySell's environment, never in this repo)
```

Notes:

- `skip_consent` and `client_secret_expires_at` are restricted
  fields: only `adminCreateOAuthClient` (server-only) may set them,
  which is why they are not in `auth.ts`'s `oauthProvider({...})`
  config. The config's `loginPage`/`consentPage` still apply to any
  client registered without `skip_consent`.
- For local development, register a second client (or add the local
  redirect URI to the same client) with the local-dev callback from
  the table above.
- The mirror step happens on the WhoDeySell side: escrow registers
  there as a client with redirect URI
  `https://escrow.cmigl.org/api/auth/callback/whodeysell`, producing
  `WHODEYSELL_OAUTH_CLIENT_ID` / `WHODEYSELL_OAUTH_CLIENT_SECRET`
  for this app's environment.

## Sign-in entry points

- Escrow sign-in page (`app/auth/login`): "Continue with
  WhoDeySell" button calls `signIn.social` with `callbackURL` taken
  from the page's `callbackUrl` query parameter (default
  `/dashboard`). After the round trip the user lands back on that
  URL.
- WhoDeySell handoff (`app/buy`): a signed-out buyer sees the same
  option on the `/buy` page itself ("Continue with WhoDeySell" plus
  an email sign-in link), both returning to the full `/buy` URL so
  the signed payload and signature survive the round trip. `/buy` is
  a public route for exactly this reason; the page still gates the
  actual checkout on a session. (Middleware also redirects signed-out
  visitors to `/auth/login?callbackUrl=<full /buy URL>`, and the
  login page carries the same SSO button — both paths converge.)
- Escrow as provider: WhoDeySell starts its flow against
  `https://escrow.cmigl.org/api/auth/oauth2/authorize`; an unsigned-in
  user is sent to `/auth/login` and the plugin continues the flow
  after sign-in. A trusted (`skip_consent`) client never sees the
  consent page.

## What still needs the other side

- WhoDeySell must implement the mirror image (genericOAuth client
  with providerId `"escrow"`, its own OAuth provider plugin, and the
  client registrations above) before either direction works
  end-to-end. Until then, the escrow-side buttons surface a provider
  error instead of completing sign-in, and email/password sign-in is
  unaffected.
- WhoDeySell's userinfo/id_token should assert `email_verified`
  where true. Linking still works without it (trusted provider), but
  the assertion is the defence-in-depth that lets the trust
  assumption be relaxed later.
