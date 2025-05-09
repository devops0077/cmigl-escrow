import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { getPublishedContentByType } from "@/lib/content-actions"
import { FAQContent } from "@/components/content/faq-content"

export const metadata: Metadata = {
  title: "Frequently Asked Questions - CMIGL Escrow Services",
  description: "Find answers to common questions about CMIGL Escrow Services",
}

export default async function FAQPage() {
  // Fetch FAQ content from database
  const faqContent = await getPublishedContentByType("FAQ")

  // Fallback content in case database fetch fails or is empty
  const fallbackContent =
    faqContent.length > 0
      ? faqContent
      : [
          {
            id: "faq-general-1",
            title: "What is an escrow service?",
            content:
              "<p>An escrow service is a financial arrangement where a third party holds and regulates payment of funds for two parties in a transaction. It helps protect both the buyer and seller in a transaction by ensuring that funds are only released when all terms of an agreement are met.</p>",
            category: "General",
            tags: ["basics", "escrow"],
            version: 1,
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            type: "FAQ",
            slug: "what-is-escrow-service",
            published: true,
            createdAt: new Date().toISOString(),
            authorId: "system",
          },
          {
            id: "faq-general-2",
            title: "How does CMIGL Escrow work?",
            content:
              "<p>Our escrow service works in a few simple steps: 1) The buyer and seller agree on terms, 2) The buyer sends payment to CMIGL Escrow, 3) The seller delivers the goods or services, 4) The buyer confirms receipt and satisfaction, 5) CMIGL Escrow releases the funds to the seller. This process ensures both parties are protected throughout the transaction.</p>",
            category: "General",
            tags: ["process", "escrow"],
            version: 1,
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            type: "FAQ",
            slug: "how-cmigl-escrow-works",
            published: true,
            createdAt: new Date().toISOString(),
            authorId: "system",
          },
        ]

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full bg-gradient-to-b from-muted/50 to-muted py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
                Frequently Asked Questions
              </h1>
              <p className="max-w-[46rem] text-lg text-muted-foreground sm:text-xl">
                Find answers to common questions about our escrow services, transactions, and platform features.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-4xl space-y-8 py-12 md:py-16 lg:py-20">
          <FAQContent initialFaqs={fallbackContent} />
        </section>
      </main>
    </div>
  )
}
