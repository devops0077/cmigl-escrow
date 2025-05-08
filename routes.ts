/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/help",
  "/terms",
  "/privacy",
  "/knowledge-base",
  "/knowledge-base/(.*)",
  "/tutorials",
  "/tutorials/(.*)",
  "/faq",
  "/new-verification",
  "/api/referral/validate",
  "/api/auth/compare",
  "/api/send-email",
  "/api/users/search",
  "/api/users/status",
  "/api/auth/registration-fee/",
  "/api/payments/verify/(.*)",
  "/api/upload",
  "/api/admin/exists",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify",
];

export const paymentRoute = ["/auth/payment"];

export const adminRoutes = ["/admin"];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

/**
 * Check if a route is public
 * @param {string} path - The route path to check
 * @returns {boolean} - True if the route is public, false otherwise
 */
export const isPublicRouteFn = (path: string): boolean => {
  return publicRoutes.some((route) =>
    new RegExp(`^${route.replace(/\(.*\)/, ".*")}$`).test(path)
  );
};
