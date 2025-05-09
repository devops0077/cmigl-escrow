import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getPublishedContentByType } from "@/lib/content-actions";
import { TutorialsClient } from "@/components/tutorials/tutorials-client";

export const metadata: Metadata = {
  title: "Tutorials - CMIGL Escrow Services",
  description:
    "Learn how to use CMIGL Escrow Services with our step-by-step tutorials",
};

export default async function TutorialsPage() {
  // Fetch tutorial content from database
  const tutorialContent = await getPublishedContentByType("TUTORIAL");

  // Fallback content in case database fetch fails or is empty
  const fallbackContent =
    tutorialContent.length > 0
      ? tutorialContent
      : [
          {
            id: "tutorial-1",
            title: "Getting Started with CMIGL Escrow",
            content:
              "<p>This tutorial will guide you through the basics of using CMIGL Escrow services.</p><img src='/placeholder.svg?height=200&width=300' alt='Getting Started' />",
            category: "Basics",
            tags: ["beginner", "escrow"],
            version: 1,
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            type: "TUTORIAL",
            slug: "getting-started",
            published: true,
            createdAt: new Date().toISOString(),
            authorId: "system",
          },
          {
            id: "tutorial-2",
            title: "How to Create Your First Transaction",
            content:
              "<p>Learn how to create and manage your first escrow transaction.</p><img src='/placeholder.svg?height=200&width=300' alt='First Transaction' />",
            category: "Transactions",
            tags: ["transaction", "beginner"],
            version: 1,
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            type: "TUTORIAL",
            slug: "first-transaction",
            published: true,
            createdAt: new Date().toISOString(),
            authorId: "system",
          },
        ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full bg-gradient-to-b from-muted/50 to-muted py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
                Tutorials
              </h1>
              <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                Learn how to use our escrow services with step-by-step tutorials
                and guides.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl space-y-8 py-12 md:py-16 lg:py-20">
          <TutorialsClient initialTutorials={fallbackContent} />
        </section>
      </main>
    </div>
  );
}
