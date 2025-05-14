import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getContentBySlug } from "@/lib/content-actions";
import { DynamicContent } from "@/components/content/dynamic-content";
import { ContentVersionInfo } from "@/components/content/content-version-info";

interface KnowledgeBaseArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: KnowledgeBaseArticlePageProps): Promise<Metadata> {
  const article = await getContentBySlug((await params).slug);

  if (!article) {
    return {
      title: "Article Not Found",
      description: "The requested knowledge base article could not be found.",
    };
  }

  return {
    title: `${article.title} - Knowledge Base`,
    description: article.content.substring(0, 160).replace(/<[^>]*>/g, ""),
  };
}

export default async function KnowledgeBaseArticlePage({
  params,
}: KnowledgeBaseArticlePageProps) {
  const article = await getContentBySlug((await params).slug);

  if (!article || article.type !== "KNOWLEDGE_BASE" || !article.published) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-1 py-8 md:py-12">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/knowledge-base">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Knowledge Base
            </Link>
          </Button>

          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              {article.title}
            </h1>

            {article.category && (
              <div className="mb-4">
                <span className="inline-block bg-muted px-3 py-1 text-sm rounded-full">
                  {article.category}
                </span>
              </div>
            )}

            <Separator className="my-6" />

            <DynamicContent
              content={article.content}
              contentId={article.id}
              contentType="KNOWLEDGE_BASE"
            />

            <div className="mt-8">
              <ContentVersionInfo
                version={article.version}
                updatedAt={article.updatedAt}
                publishedAt={article.publishedAt}
              />

              {article.tags && article.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {article.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-block bg-muted px-3 py-1 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
