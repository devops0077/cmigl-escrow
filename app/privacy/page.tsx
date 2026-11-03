import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getLatestPrivacyPolicy } from "@/lib/content-actions";
import { DynamicContent } from "@/components/content/dynamic-content";
import { ContentVersionInfo } from "@/components/content/content-version-info";

export const metadata: Metadata = {
  title: "Privacy Policy - CMIGL Escrow Services",
  description: "How we collect, use, and protect your personal information",
};

export default async function PrivacyPolicyPage() {
  const privacyContent = await getLatestPrivacyPolicy();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full bg-gradient-to-b from-muted/50 to-muted py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
                Privacy Policy
              </h1>
              <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                How we collect, use, and protect your personal information.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl space-y-8">
            {privacyContent ? (
              <>
                <DynamicContent
                  content={privacyContent.content}
                  contentId={privacyContent.id}
                  contentType="PRIVACY_POLICY"
                />
                <ContentVersionInfo
                  version={privacyContent.version}
                  updatedAt={privacyContent.updatedAt}
                  publishedAt={privacyContent.publishedAt}
                />
              </>
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">
                  Privacy Policy Not Available
                </h3>
                <p className="text-muted-foreground mt-2">
                  Our privacy policy is currently being updated. Please check
                  back later.
                </p>
              </div>
            )}

            {/* Static supplement: Nigeria Data Protection Act, 2023.
                The policy text above is managed in the admin content
                system; this section is fixed and adds the NDPA
                disclosures that apply regardless of that text. */}
            <section className="space-y-4 border-t pt-8">
              <h2 className="text-2xl font-bold">
                Nigeria Data Protection Act (2023) — Your Rights
              </h2>
              <p className="text-muted-foreground">
                CMIGL Escrow Services is operated by{" "}
                <strong className="text-foreground">
                  CMIGL E-Konsult Limited
                </strong>
                , Suite 017 Apple Court Plaza, Nyanya, Abuja-FCT, Nigeria.
                We are the data controller for the personal data collected
                through this platform. Questions about your data, and any
                request below, can be sent to{" "}
                <a
                  href="mailto:info@cmigl.org"
                  className="underline hover:text-foreground"
                >
                  info@cmigl.org
                </a>
                .
              </p>
              <h3 className="text-lg font-semibold">
                Why we process your data (lawful bases)
              </h3>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Contract:</strong>{" "}
                  running your escrow transactions, wallet, and payouts —
                  the service cannot work without this.
                </li>
                <li>
                  <strong className="text-foreground">Legal obligation:</strong>{" "}
                  identity verification, fraud prevention, and financial
                  record-keeping.
                </li>
                <li>
                  <strong className="text-foreground">Consent:</strong>{" "}
                  optional communications and any non-essential cookies.
                  Consent can be withdrawn at any time (see Cookie
                  settings in the footer) without affecting the
                  lawfulness of processing done before withdrawal.
                </li>
                <li>
                  <strong className="text-foreground">Legitimate interest:</strong>{" "}
                  keeping the platform secure, preventing abuse, and
                  improving the service.
                </li>
              </ul>
              <h3 className="text-lg font-semibold">Your rights</h3>
              <p className="text-muted-foreground">
                Under the Nigeria Data Protection Act, 2023, you may ask
                us to:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>confirm whether we hold your data and obtain a copy (access and portability);</li>
                <li>correct inaccurate or incomplete data (rectification);</li>
                <li>delete your data where it is no longer needed (erasure);</li>
                <li>restrict processing while a concern is being resolved;</li>
                <li>object to processing based on legitimate interest;</li>
                <li>withdraw any consent you have given.</li>
              </ul>
              <p className="text-muted-foreground">
                We will respond without undue delay. If you are not
                satisfied with our response, you may lodge a complaint
                with the Nigeria Data Protection Commission (NDPC).
              </p>
              <h3 className="text-lg font-semibold">
                Who else processes your data
              </h3>
              <p className="text-muted-foreground">
                We use carefully chosen service providers who process data
                only on our instructions: Paystack and Monnify (payments),
                Pusher (real-time messages and presence), Resend (email
                delivery), Vercel (hosting), and Cloudflare (DNS and
                delivery). Session and rate-limit data is held on our own
                server. We do not sell personal data.
              </p>
              <h3 className="text-lg font-semibold">How long we keep data</h3>
              <p className="text-muted-foreground">
                Sign-in sessions last 1 day. Transaction and wallet
                records are kept while your account is active and for as
                long afterwards as needed to meet legal, tax, and audit
                obligations and to resolve disputes. Where data is no
                longer needed, it is deleted or anonymised.
              </p>
              <p className="text-muted-foreground">
                For the cookies we use and how to control them, see our{" "}
                <Link href="/cookies" className="underline hover:text-foreground">
                  Cookie Policy
                </Link>
                .
              </p>
            </section>

            <div className="mt-8 text-center">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button variant="outline" asChild>
                  <Link href="/cookies">
                    Cookie Policy
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

