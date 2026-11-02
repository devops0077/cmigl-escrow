"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";

/**
 * Better Auth React client. Sessions are cookie-based, so there is no
 * SessionProvider wrapper: components call authClient.useSession()
 * directly (see lib/auth-provider.tsx, now a passthrough kept so the
 * root layout does not change).
 *
 * inferAdditionalFields mirrors the server's user.additionalFields
 * (auth.ts) on the client session type; without it useSession()'s user
 * only carries Better Auth's core fields and session.user.role etc.
 * would not typecheck (they are still returned at runtime).
 *
 * SSO sign-in goes through the standard social flow:
 *   authClient.signIn.social({ provider: "whodeysell", callbackURL })
 * which hits /api/auth/sign-in/social and returns via
 * /api/auth/callback/whodeysell.
 */
export const authClient = createAuthClient({
  plugins: [
    // Enables authClient.oauth2.consent() for the OAuth provider's
    // consent page (app/auth/consent); forwards the signed oauth_query
    // automatically.
    oauthProviderClient(),
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        username: { type: "string" },
        phone: { type: "string" },
        isActive: { type: "boolean" },
        restricted: { type: "boolean" },
        status: { type: "string" },
        bio: { type: "string" },
        address: { type: "string" },
        passportImage: { type: "string" },
      },
    }),
  ],
});
