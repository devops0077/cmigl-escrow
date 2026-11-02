import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/auth";

// Better Auth catch-all handler (replaces app/api/auth/[...nextauth]).
// Serves sign-in/sign-up/session, the generic-OAuth callback
// (/api/auth/callback/whodeysell), and the OAuth 2.1 provider endpoints
// (/api/auth/.well-known/openid-configuration, /api/auth/oauth2/*,
// /api/auth/jwks) from this app.
export const { GET, POST } = toNextJsHandler(auth);
