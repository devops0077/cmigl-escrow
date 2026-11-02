# NextAuth → Better Auth migration

Branch `zazu/better-auth-sso` replaces NextAuth v5 (Credentials provider,
JWT sessions) with Better Auth 1.7. This note covers what changed, the
deployment order, and — most importantly — what happens to existing
users. It supersedes the old auth setup; the old `auth.ts` NextAuth
config is gone.

## What changed

| Area | Before (NextAuth) | After (Better Auth) |
| --- | --- | --- |
| Server instance | `auth.ts` (NextAuth) | `auth.ts` (`betterAuth`, same path so `@/auth` imports keep working) |
| Handler | `app/api/auth/[...nextauth]` | `app/api/auth/[...all]` via `toNextJsHandler` |
| Session read (server) | `await auth()` | `await auth.api.getSession({ headers: await headers() })` |
| Session read (client) | `useSession` / `signIn` / `signOut` from `next-auth/react` | `authClient.useSession()` / `authClient.signIn.*` / `authClient.signOut()` from `lib/auth-client.ts` |
| Session provider | `<SessionProvider>` | None — `lib/auth-provider.tsx` is a passthrough kept so `app/layout.tsx` does not change |
| Middleware | NextAuth middleware wrapper (`req.auth`, JWT) | Plain middleware calling `auth.api.getSession({ headers: req.headers })`; redirect logic unchanged |
| Sessions | JWT, 1-day `maxAge` | Database sessions, 1-day `expiresIn` |
| Password storage | `User.password` (bcrypt) | `Account.password`, provider `credential` (scrypt by default) |
| `User` table | — | Same table, same ids. Escrow fields (`role`, `username`, `isActive`, `restricted`, `status`, `phone`, `bio`, `address`, `passportImage`) exposed via `additionalFields` in `auth.ts` and typed on the client via `inferAdditionalFields` in `lib/auth-client.ts` |
| Login identifiers | Email, username or phone (via `verifyCredentials`) | Same, via the `resolveLoginEmail` server action in `lib/auth-actions.ts` (Better Auth's email sign-in itself takes email only) |
| Registration / admin user creation / password reset | bcrypt into `User.password` | Scrypt into the credential `Account` row via `lib/credential-account.ts` (`createCredentialAccount` / `setCredentialPassword`) |

Removed dependencies: `next-auth`, `@auth/prisma-adapter`. Kept
deliberately: `bcryptjs` — it is still needed for the legacy verify
fallback below. The app's own email-verification and password-reset
token flows (`VerificationToken` table, `lib/auth-actions.ts`) are
unchanged, except `emailVerified` is now a boolean (below).

## Schema migration

`prisma/migrations/20261102190000_better_auth/migration.sql`
(generated with `bunx @better-auth/cli generate` against the new
`auth.ts`, then merged by hand into the existing schema — the CLI's
standalone output was not used verbatim, and its lowercase `@@map`
table names were dropped so new tables follow this repo's PascalCase
convention):

- `User` is **not** replaced and no rows are dropped. Two column
  changes:
  - `emailVerified`: `DateTime?` → `Boolean @default(false)`.
    Verified (non-null timestamp) becomes `true`, unverified (null)
    becomes `false`. **The verified-at timestamp itself is lost** — it
    was only displayed on the admin user pages, which now show a
    boolean badge instead of a date.
  - `phone`: required → nullable, so SSO JIT provisioning (see
    `docs/sso-whodeysell.md`) can create a user before a phone number
    is collected. Email/password registration still collects a phone.
- `Session` reshaped in place (`sessionToken` → `token`,
  `expires` → `expiresAt`, plus `ipAddress`, `userAgent`,
  `createdAt`, `updatedAt`).
- `Account` reshaped in place (NextAuth columns dropped, Better Auth
  columns added, plus `@@unique([providerId, accountId])` for the
  credential upsert). The old `Account`/`Session` tables were never
  written by NextAuth here (Credentials provider + JWT sessions, no
  database adapter was configured), so reshaping them drops no live
  data. If your database holds rows in them from another era, back
  them up before applying.
- New tables: `Verification` (Better Auth's own; distinct from the
  pre-existing `VerificationToken`), `Jwks` (JWT plugin), and the
  OAuth 2.1 provider tables (`OauthClient`, `OauthResource`,
  `OauthClientResource`, `OauthRefreshToken`, `OauthAccessToken`,
  `OauthConsent`, `OauthClientAssertion`).
- `User.password` is **kept** (nullable) as a legacy column. Runtime
  sign-in never reads it after this change; it exists only for the
  one-time script below. Drop it in a follow-up migration once the
  cutover is verified.

## Existing users: no password reset, no lockout

This is the part that must not be silently broken. Better Auth's
default hash is scrypt; existing passwords are bcrypt hashes in
`User.password`. The migration path chosen (the preferred path from
the task, which the docs support via
`emailAndPassword.password.verify`) is:

1. **Data migration (one-time, before deploy):**
   `scripts/migrate-legacy-passwords.ts` copies each user's bcrypt
   hash verbatim into a new credential `Account` row
   (`providerId: "credential"`, `accountId: user id`), skipping users
   who already have one. It never overwrites an existing credential
   row and never prints hashes. Run it after applying the migration
   and regenerating the client, before deploying this code — the new
   rows are inert to the old code, so there is no downtime window.
2. **Seamless verify with lazy upgrade (runtime, `auth.ts`):**
   `password.verify` tries Better Auth's default scrypt verify first;
   for `$2a$`/`$2b$`/`$2y$` hashes it falls back to `bcryptjs.compare`.
   On a successful legacy login it re-hashes the password to scrypt
   in place (best effort — if that write fails, login still succeeds
   and the bcrypt hash stays valid for the next attempt). New
   passwords and password changes/resets are scrypt from day one,
   because only `verify` is overridden, never `hash`.
3. **No fallback needed:** because the bcrypt fallback stays in place
   indefinitely, a user who never logs in after cutover still keeps a
   working password. There is no forced password-reset flow and no
   deadline. (If the fallback were ever removed, the users who had
   not yet logged in would need a reset — do not remove it without a
   reset campaign.)

Two consequences to expect at deploy, both benign:

- **All browser sessions end.** NextAuth JWT sessions cannot transfer
  to Better Auth database sessions. Every user signs in again once
  with their existing password; nothing else changes for them.
- **Middleware now does a database session lookup per request**
  (the old middleware only verified a JWT). If that ever proves too
  heavy or fails in the Edge runtime (Prisma is a Node client), the
  documented fallback is an optimistic `getSessionCookie` check in
  middleware plus server-side enforcement — that switch is not in
  this branch and needs its own review.

## Environment variables (names only, never values)

- `BETTER_AUTH_SECRET` — signing secret (required in production).
- `BETTER_AUTH_URL` — public base URL, e.g. the production origin.
  Required for the OAuth provider plugin to initialise (it crashed
  the CLI generate without it) and for the SSO redirect URIs in
  `docs/sso-whodeysell.md`.
- `DATABASE_URL` — unchanged.
- `WHODEYSELL_OAUTH_CLIENT_ID` / `WHODEYSELL_OAUTH_CLIENT_SECRET` —
  this app as a client of WhoDeySell (see `docs/sso-whodeysell.md`).
- `WHODEYSELL_BASE_URL` — optional, defaults to
  `https://whodeysell.com`; set it only for local development against
  a local WhoDeySell instance.
- `ESCROW_OAUTH_CLIENT_ID` / `ESCROW_OAUTH_CLIENT_SECRET` —
  WhoDeySell as a client of this app (registered via
  `adminCreateOAuthClient`; see `docs/sso-whodeysell.md`).
- `ESCROW_HMAC_SECRET` — unchanged, still only for the `/buy`
  handoff; it is not used for SSO.

## Deployment checklist

1. Apply `prisma/migrations/20261102190000_better_auth/` (and the
   existing `20261102183000_whodeysell_handoff` migration if it has
   not been applied yet).
2. Regenerate the Prisma client (`bun prisma generate --no-engine`
   via postinstall, or `bun run postinstall`).
3. Run `DATABASE_URL=... bun scripts/migrate-legacy-passwords.ts`
   and confirm the counts.
4. Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in the deployment
   environment.
5. Register the WhoDeySell OAuth client (see
   `docs/sso-whodeysell.md`) and set the SSO env vars, or accept that
   the "Continue with WhoDeySell" button errors until that step is
   done (email/password sign-in works regardless).
6. Deploy. Expect every user to sign in again once (above).

## Open questions

- Should the legacy `User.password` column be dropped, and when?
  Proposed: after one production cycle with no legacy-login issues.
- Middleware Edge-runtime risk (above): does `auth.api.getSession`
  (Prisma) work in this deployment's middleware runtime, or should it
  move to the `getSessionCookie` optimistic check?
- SSO-provisioned users have `termsAccepted: false` (they never saw
  the registration form). Is that acceptable, or should first SSO
  sign-in route through a terms step?
- The admin "default admin" seed (`ensureAdminExists`) now creates a
  credential account too — confirm the seeded admin's login works
  after deploy on a fresh database.
