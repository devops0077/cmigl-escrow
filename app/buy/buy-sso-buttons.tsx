"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * Signed-out buyer entry for the WhoDeySell handoff.
 *
 * "Continue with WhoDeySell" starts Better Auth's generic-OAuth flow
 * for provider "whodeysell" and returns to the full /buy URL (signed
 * payload + sig) via callbackURL, so checkout resumes exactly where it
 * left off. The email sign-in link does the same through the login
 * page's callbackUrl parameter.
 */
export function BuySsoButtons({ buyUrl }: { buyUrl: string }) {
  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="w-full"
        onClick={() =>
          authClient.signIn.social({
            provider: "whodeysell",
            callbackURL: buyUrl,
          })
        }
      >
        Continue with WhoDeySell
      </Button>
      <Button type="button" variant="outline" className="w-full" asChild>
        <Link href={`/auth/login?callbackUrl=${encodeURIComponent(buyUrl)}`}>
          Sign in with email
        </Link>
      </Button>
    </div>
  );
}
