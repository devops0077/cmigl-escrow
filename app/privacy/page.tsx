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

            <div className="mt-8 text-center">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
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
