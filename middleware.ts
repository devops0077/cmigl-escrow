import { auth as middleware } from "@/auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  adminRoutes,
  isPublicRouteFn,
} from "@/routes";

// @ts-ignore
export default middleware(async (req, ctx) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // @ts-ignore
  const role = req.auth?.user?.role;
  const isActive = req.auth?.user?.isActive;

  const isApiRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublicRoute = isPublicRouteFn(nextUrl.pathname);
  const isAdminRoute = adminRoutes.includes(nextUrl.pathname);
  const isAdmin = role === "ADMIN";

  if (isAdminRoute && !isAdmin) {
    return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  if (isApiRoute) {
    return null;
  }

  if (isAuthRoute) {
    if (isLoggedIn && !isActive) {
      return Response.redirect(
        new URL(`/auth/payment?userId=${req?.auth?.user.id}`, nextUrl)
      );
    } else if (isLoggedIn && isActive) {
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

  return null; // Changed from new Response(null, { status: 204 })
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
