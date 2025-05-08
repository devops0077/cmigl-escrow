import { auth as middleware } from "@/auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  adminRoutes,
  isPublicRouteFn,
  paymentRoute,
} from "@/routes";
import axios from "axios";

// @ts-ignore
export default middleware(async (req, ctx) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // @ts-ignore
  const role = req.auth?.user?.role;
  const isActive = req.auth?.user?.status === "ACTIVE";

  const isApiRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublicRoute = isPublicRouteFn(nextUrl.pathname);
  const isAdminRoute = adminRoutes.includes(nextUrl.pathname);
  const isPaymentRoute = paymentRoute.includes(nextUrl.pathname);
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

  if (
    isLoggedIn &&
    !isActive &&
    !isPaymentRoute &&
    !isApiRoute &&
    !isPublicRoute
  ) {
    // Redirect to payment page if user is not active and not on the payment route
    console.log("USER ACTIVE", isActive);
    return Response.redirect(
      new URL(`/auth/payment?userId=${req?.auth?.user.id}`, nextUrl)
    );
  }

  return null; // Changed from new Response(null, { status: 204 })
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
