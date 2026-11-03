import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cookie Policy - CMIGL Escrow Services",
  description: "The cookies CMIGL Escrow uses, why, and how to control them",
};

const COOKIES = [
  {
    name: "better-auth.session_token",
    purpose:
      "Keeps you signed in and protects your account. Without it you cannot use the dashboard, wallet, or transactions.",
    duration: "1 day (session lifetime)",
    type: "Essential",
  },
  {
    name: "cookie_consent",
    purpose:
      "Records the cookie choice you made in the consent banner, so we do not ask again on every visit.",
    duration: "12 months",
    type: "Essential",
  },
  {
    name: "Security cookies",
    purpose:
      "Short-lived cookies used to prevent abuse and verify requests (for example, sign-in and payment confirmation checks).",
    duration: "Session to a few days, depending on the check",
    type: "Essential",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full bg-gradient-to-b from-muted/50 to-muted py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
                Cookie Policy
              </h1>
              <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                The cookies CMIGL Escrow uses, why, and how to control them.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl space-y-8">
            <p className="text-sm text-muted-foreground">
              Last updated: 3 November 2026. Operated by CMIGL E-Konsult
              Limited, Suite 017 Apple Court Plaza, Nyanya, Abuja-FCT,
              Nigeria. Contact:{" "}
              <a
                href="mailto:info@cmigl.org"
                className="underline hover:text-foreground"
              >
                info@cmigl.org
              </a>
              .
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">What cookies we use</h2>
              <p className="text-muted-foreground">
                CMIGL Escrow uses only essential cookies: the cookies
                needed to keep you signed in, keep escrow secure, and
                remember your cookie choice. We do{" "}
                <strong className="text-foreground">not</strong> use
                analytics, advertising, or tracking cookies, and we do
                not use cookies to follow you across other websites.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4 font-medium">Cookie</th>
                      <th className="py-2 pr-4 font-medium">Purpose</th>
                      <th className="py-2 pr-4 font-medium">Duration</th>
                      <th className="py-2 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COOKIES.map((cookie) => (
                      <tr key={cookie.name} className="border-b align-top">
                        <td className="py-3 pr-4 font-mono text-xs">
                          {cookie.name}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {cookie.purpose}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {cookie.duration}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {cookie.type}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">
                Cookies from payment providers
              </h2>
              <p className="text-muted-foreground">
                When you pay, you may be taken to a Paystack or Monnify
                checkout page. Those pages are run by the payment
                provider, not by CMIGL Escrow, and any cookies they set
                are governed by their own cookie policies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">
                Your choice, and how to change it
              </h2>
              <p className="text-muted-foreground">
                Essential cookies cannot be switched off: the site cannot
                keep you signed in or process escrow without them.
                Because we set no non-essential cookies today, there is
                nothing else to switch off. If that ever changes, the
                consent banner will ask first, and you will be able to
                change or withdraw your choice at any time from the
                “Cookie settings” link in the footer of the home page,
                or by clearing cookies in your browser settings (which
                will sign you out and show the banner again).
              </p>
              <p className="text-muted-foreground">
                This policy sits under the Nigeria Data Protection Act,
                2023: consent for any non-essential cookie must be
                freely given, specific, and withdrawable, and our{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>{" "}
                explains your wider data rights.
              </p>
            </section>

            <div className="mt-8 text-center">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button variant="outline" asChild>
                  <Link href="/privacy">
                    Privacy Policy
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/terms">
                    Terms of Service
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    Return to Home
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
