"use client";

import type React from "react";

/**
 * Better Auth has no SessionProvider: authClient.useSession() reads the
 * session cookie directly. This component is kept as a passthrough so
 * the root layout (app/layout.tsx) does not change.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
