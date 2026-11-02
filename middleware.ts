import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  adminRoutes,
  isPublicRouteFn,
} from "@/routes";
import axios from "axios";

// Better Auth middleware: the session is validated against the database
// on every matched request (auth.api.getSession with the request
// headers), replacing the old NextAuth JWT middleware wrapper. Role and
// restricted flags come from the session user's additionalFields
// (see auth.ts). Redirect logic is unchanged from the NextAuth version,
// including the callbackUrl preservation that sends a signed-out /buy
// visitor back to the full /buy URL after sign-in (or SSO).
export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const session = await auth.api.getSession({ headers: req.headers });
  const isLoggedIn = !!session;

  const role = session?.user.role;
  const isRestricted = session?.user.restricted;

  const isApiRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublicRoute = isPublicRouteFn(nextUrl.pathname);
  const isAdminRoute = adminRoutes.includes(nextUrl.pathname);
  const isRestrictionRoute = nextUrl.pathname === "/account-restricted";

  const isAdmin = role === "ADMIN";

  const pathname = nextUrl.pathname;

  // Check if admin exists on app initialization
  if (pathname === "/" || pathname === "/admin") {
    try {
      await axios.get(process.env.NEXT_PUBLIC_APP_URL + "/api/admin/exists");
    } catch (error) {
      console.error("Error ensuring admin exists:", error);
    }
  }
  if (isAdminRoute && !isAdmin) {
    return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
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

  // Handle restricted users
  if (
    isLoggedIn &&
    isRestricted &&
    !isRestrictionRoute &&
    !isApiRoute &&
    !isPublicRoute
  ) {
    return Response.redirect(new URL("/account-restricted", nextUrl));
  }

  return null;
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
