import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getLatestTermsOfService } from "@/lib/content-actions";
import { DynamicContent } from "@/components/content/dynamic-content";
import { ContentVersionInfo } from "@/components/content/content-version-info";

export const metadata: Metadata = {
  title: "Terms of Service - CMIGL Escrow Services",
  description: "Terms and conditions for using our escrow platform",
};

export default async function TermsPage() {
  const termsContent = await getLatestTermsOfService();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full bg-gradient-to-b from-muted/50 to-muted py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
                Terms of Service
              </h1>
              <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                Please read these terms and conditions carefully before using
                our escrow services.
              </p>
            </div>
          </div>
        </section>

        <section className="container px-4 mx-auto py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl space-y-8">
            {termsContent ? (
              <>
                <DynamicContent
                  content={termsContent.content}
                  contentId={termsContent.id}
                  contentType="TERMS_OF_SERVICE"
                />
                <ContentVersionInfo
                  version={termsContent.version}
                  updatedAt={termsContent.updatedAt}
                  publishedAt={termsContent.publishedAt}
                />
              </>
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">
                  Terms of Service Not Available
                </h3>
                <p className="text-muted-foreground mt-2">
                  Our terms of service are currently being updated. Please check
                  back later.
                </p>
              </div>
            )}

            {/* Static supplement: data protection note. The terms text
                above is managed in the admin content system and is not
                changed by this section. */}
            <section className="space-y-4 border-t pt-8">
              <h2 className="text-2xl font-bold">
                Data Protection
              </h2>
              <p className="text-muted-foreground">
                CMIGL Escrow Services is operated by CMIGL E-Konsult
                Limited, Suite 017 Apple Court Plaza, Nyanya, Abuja-FCT,
                Nigeria. We process your personal data in line with the
                Nigeria Data Protection Act, 2023. Our{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>{" "}
                explains what we collect, why, and the rights you hold —
                including access, rectification, erasure, portability,
                objection, and withdrawing consent — and how to complain
                to the Nigeria Data Protection Commission (NDPC) if you
                are not satisfied with our response. Our{" "}
                <Link href="/cookies" className="underline hover:text-foreground">
                  Cookie Policy
                </Link>{" "}
                lists the cookies we use and how to control them.
                Questions:{" "}
                <a
                  href="mailto:info@cmigl.org"
                  className="underline hover:text-foreground"
                >
                  info@cmigl.org
                </a>
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
                  <Link href="/privacy">
                    Privacy Policy
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

