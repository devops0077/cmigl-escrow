import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth, jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { compare } from "bcryptjs";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { prisma } from "./lib/prisma";

/**
 * Better Auth instance for CMIGL Escrow (replaces NextAuth v5).
 *
 * Existing users and ids are preserved: the Prisma `User` table is NOT
 * replaced. Escrow-specific user columns are exposed through
 * `additionalFields` below, and transactions/wallets keep referencing
 * `User.id` exactly as before.
 *
 * Session lifetime mirrors the old NextAuth config (1 day).
 */

// bcrypt hashes emitted by bcryptjs start with $2a$ / $2b$ (and $2y$
// from PHP tooling). Better Auth's default hash is scrypt, which looks
// nothing like these, so the prefix test cleanly separates the two.
const BCRYPT_HASH = /^\$2[aby]\$/;

/**
 * Password verification with a legacy-bcrypt fallback.
 *
 * New passwords (and password changes/resets) are hashed with Better
 * Auth's default scrypt hasher, because only `verify` is overridden
 * here — `hash` is left at the default.
 *
 * Legacy users whose credential lives in `Account.password` as a bcrypt
 * hash (migrated from the old `User.password` column, see
 * docs/better-auth-migration.md) verify with bcryptjs. On a successful
 * legacy login the hash is upgraded to scrypt in place (best effort:
 * if the write fails, login still succeeds and the bcrypt hash stays
 * valid for the next attempt, so nobody is ever locked out by a failed
 * upgrade write).
 */
async function verifyPasswordWithLegacyFallback({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  if (BCRYPT_HASH.test(hash)) {
    const ok = await compare(password, hash);
    if (ok) {
      try {
        const upgraded = await hashPassword(password);
        // bcrypt salts are random per hash, so a stored hash is
        // effectively unique to one account row.
        await prisma.account.updateMany({
          where: { password: hash },
          data: { password: upgraded },
        });
      } catch {
        // Best effort only — the bcrypt hash remains valid.
      }
    }
    return ok;
  }
  return verifyPassword({ hash, password });
}

// WhoDeySell as an OAuth/OIDC identity provider for escrow sign-in.
// Discovery is served by WhoDeySell's own Better Auth handler: the
// issuer is its auth handler base (https://whodeysell.com/api/auth),
// so the discovery document lives at
// https://whodeysell.com/api/auth/.well-known/openid-configuration
// (OIDC path-appending for issuers with a path). The callback below is
// Better Auth's generic-OAuth callback for this provider id:
// {baseURL}/api/auth/callback/whodeysell, i.e. in production
// https://escrow.cmigl.org/api/auth/callback/whodeysell.
// The plugin is only registered once client credentials exist, so a
// deployment without WHODEYSELL_OAUTH_CLIENT_ID/SECRET still boots and
// serves email/password sign-in; the "Continue with WhoDeySell" button
// then surfaces the provider error instead of crashing auth startup.
const whodeysellBaseUrl =
  process.env.WHODEYSELL_BASE_URL || "https://whodeysell.com";
const whodeysellOAuth =
  process.env.WHODEYSELL_OAUTH_CLIENT_ID &&
  process.env.WHODEYSELL_OAUTH_CLIENT_SECRET
    ? genericOAuth({
        config: [
          {
            providerId: "whodeysell",
            clientId: process.env.WHODEYSELL_OAUTH_CLIENT_ID,
            clientSecret: process.env.WHODEYSELL_OAUTH_CLIENT_SECRET,
            discoveryUrl: `${whodeysellBaseUrl}/api/auth/.well-known/openid-configuration`,
            // Fallback endpoints from WhoDeySell's discovery document
            // (verified live). Same rationale as the whodeysell side:
            // keeps the provider usable when discovery fails fast,
            // without skipping the discovery fetch itself. ID-token
            // verification stays on whenever discovery succeeds.
            authorizationUrl: `${whodeysellBaseUrl}/api/auth/oauth2/authorize`,
            tokenUrl: `${whodeysellBaseUrl}/api/auth/oauth2/token`,
            userInfoUrl: `${whodeysellBaseUrl}/api/auth/oauth2/userinfo`,
            scopes: ["openid", "email", "profile"],
            pkce: true,
            // Explicit so the registered redirect URI is exactly the
            // production callback in the deployment docs. When
            // BETTER_AUTH_URL is unset, Better Auth derives the same
            // {baseURL}/api/auth/callback/whodeysell path itself.
            redirectURI: process.env.BETTER_AUTH_URL
              ? `${process.env.BETTER_AUTH_URL}/api/auth/callback/whodeysell`
              : undefined,
          },
        ],
      })
    : null;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    password: {
      verify: verifyPasswordWithLegacyFallback,
    },
  },
  session: {
    // Same 1-day lifetime the NextAuth config used (maxAge: 86400).
    expiresIn: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        // Users created through Better Auth itself — i.e. SSO (WhoDeySell)
        // JIT provisioning, since the app's own registration creates its
        // wallet directly via Prisma — need a wallet row, or the /buy
        // checkout (which reads buyer.wallet) has nothing to fund from.
        // Best effort: a wallet failure must not fail sign-up/sign-in;
        // it is logged and the user can still sign in (see
        // docs/sso-whodeysell.md).
        after: async (user) => {
          try {
            const existing = await prisma.wallet.findUnique({
              where: { userId: user.id },
            });
            if (!existing) {
              await prisma.wallet.create({
                data: { userId: user.id, balance: 0, currency: "NGN" },
              });
            }
          } catch (error) {
            console.error(
              "Failed to provision wallet for Better Auth user:",
              error
            );
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      // Escrow-specific columns on the existing User table. These are
      // returned on the session user, so server code keeps reading
      // session.user.role / username / isActive / restricted / status /
      // phone / bio / address / passportImage as before. `name`,
      // `email`, `image` and `emailVerified` are Better Auth core
      // fields; `emailVerified` is boolean (see the migration that
      // converts the old DateTime column).
      role: { type: "string", required: false, defaultValue: "USER" },
      username: { type: "string", required: false },
      phone: { type: "string", required: false },
      isActive: { type: "boolean", required: false, defaultValue: false },
      restricted: { type: "boolean", required: false, defaultValue: false },
      status: { type: "string", required: false, defaultValue: "PENDING" },
      bio: { type: "string", required: false },
      address: { type: "string", required: false },
      passportImage: { type: "string", required: false },
    },
  },
  account: {
    accountLinking: {
      // Default behaviour, stated explicitly because SSO depends on
      // it: a WhoDeySell sign-in whose email matches an existing
      // escrow account links to that account instead of creating a
      // duplicate, and a new email provisions a fresh account (JIT).
      // WhoDeySell is first-party, so it is trusted even when it does
      // not assert email_verified — see docs/better-auth-migration.md
      // and docs/sso-whodeysell.md for the trust rationale. Different
      // emails are never auto-linked (allowDifferentEmails stays off).
      enabled: true,
      trustedProviders: ["whodeysell"],
    },
  },
  // WhoDeySell's browser requests to escrow's auth handler (cross-site
  // SSO callbacks) must be accepted as trusted origins.
  trustedOrigins: [
    "https://whodeysell.com",
    // The new Vercel deployment's own address: until escrow.cmigl.org
    // moves to this deployment, browser sign-ins originate here, and
    // Better Auth rejects them without this entry (the login form
    // masks every auth error as "Invalid credentials", which hides
    // the real cause). Harmless to keep after the domain move.
    "https://cmigl-escrow.vercel.app",
    ...(process.env.NODE_ENV !== "production"
      ? ["http://localhost:3000"]
      : []),
  ],
  plugins: [
    // JWT plugin: the OAuth provider issues verifiable (JWT) access
    // tokens and serves signing keys at /api/auth/jwks for the
    // relying party (WhoDeySell) to verify.
    jwt(),
    // This app as an OAuth 2.1 / OIDC provider for WhoDeySell.
    // WhoDeySell is registered as a client out of band via
    // auth.api.adminCreateOAuthClient (see docs/sso-whodeysell.md) —
    // no client secret is hardcoded here. skip_consent is set on that
    // registered client, not in this config, because it is a
    // per-client restricted field. Any other (untrusted) client gets the
    // consent screen at consentPage (app/auth/consent), which completes
    // the flow via authClient.oauth2.consent.
    oauthProvider({
      loginPage: "/auth/login",
      consentPage: "/auth/consent",
    }),
    ...(whodeysellOAuth ? [whodeysellOAuth] : []),
    // MUST stay last so server actions can set cookies.
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;

