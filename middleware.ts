import type { NextRequest } from "next/server";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  isPublicRouteFn,
} from "@/routes";

// Edge-safe middleware: Vercel middleware runs on the Edge runtime,
// which cannot run the Prisma engine client, so the previous
// auth.api.getSession() database lookup crashed every request with
// MIDDLEWARE_INVOCATION_FAILED. Session state here is therefore
// OPTIMISTIC: a present Better Auth session cookie means "signed in".
// It does NOT prove the session is still valid, and it carries neither
// the user's role nor their restricted flag, so those are enforced
// server-side instead:
//  - admin role gating lives in app/admin/layout.tsx
//  - restricted gating lives in app/dashboard/layout.tsx (and
//    app/admin/layout.tsx for restricted admins)
//  - API routes enforce auth themselves (they pass through here)
// A stale/expired cookie lets a request through to a page, and that
// page's server layout re-validates the session and redirects to
// sign-in when it is gone, so the worst case is one wasted redirect.
// Redirect logic is otherwise unchanged, including the callbackUrl
// preservation that sends a signed-out /buy visitor back to the full
// /buy URL after sign-in (or SSO).
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const isLoggedIn = SESSION_COOKIES.some(
    (name) => req.cookies.get(name)?.value
  );

  const isApiRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublicRoute = isPublicRouteFn(nextUrl.pathname);

  const pathname = nextUrl.pathname;

  // Check if admin exists on app initialization (best effort; failures
  // are swallowed exactly as before). Native fetch, not axios: axios
  // is not Edge-safe here.
  if (pathname === "/" || pathname === "/admin") {
    try {
      await fetch(process.env.NEXT_PUBLIC_APP_URL + "/api/admin/exists");
    } catch (error) {
      console.error("Error ensuring admin exists:", error);
    }
  }

  if (isApiRoute) {
    return null;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
  }

  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return Response.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  return null;
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
