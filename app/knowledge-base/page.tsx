import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getPublishedContentByType } from "@/lib/content-actions";
import { KnowledgeBaseClient } from "@/components/knowledge-base/knowledge-base-client";

export const metadata: Metadata = {
  title: "Knowledge Base - CMIGL Escrow Services",
  description:
    "Find answers and learn about CMIGL Escrow Services in our knowledge base",
};

export default async function KnowledgeBasePage() {
  // Fetch knowledge base content from database
  const knowledgeBaseContent =
    await getPublishedContentByType("KNOWLEDGE_BASE");

  // Fallback content in case database fetch fails or is empty
  const fallbackContent =
    knowledgeBaseContent.length > 0
      ? knowledgeBaseContent
      : [
          {
            id: "kb-1",
            title: "Understanding Escrow Services",
            content:
              "<p>An escrow service is a financial arrangement where a third party holds and regulates payment of funds for two parties in a transaction. This article explains how escrow services work and their benefits.</p>",
            category: "Basics",
            tags: ["escrow", "basics"],
            version: 1,
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            type: "KNOWLEDGE_BASE",
            slug: "understanding-escrow",
            published: true,
            createdAt: new Date().toISOString(),
            authorId: "system",
          },
          {
            id: "kb-2",
            title: "Escrow Fees Explained",
            content:
              "<p>This article breaks down the fee structure for CMIGL Escrow services and explains how fees are calculated for different transaction types.</p>",
            category: "Fees",
            tags: ["fees", "pricing"],
            version: 1,
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            type: "KNOWLEDGE_BASE",
            slug: "escrow-fees-explained",
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
                Knowledge Base
              </h1>
              <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                Find answers to your questions about our escrow services and
                platform features.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 max-w-6xl space-y-8 py-12 md:py-16 lg:py-20">
          <KnowledgeBaseClient initialArticles={fallbackContent} />
        </section>
      </main>
    </div>
  );
}
