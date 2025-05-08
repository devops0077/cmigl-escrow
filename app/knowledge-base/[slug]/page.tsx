import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ArticleContent } from "@/components/knowledge-base/article-content";

// This would typically come from a database or CMS
const articles = [
  {
    slug: "getting-started-with-escrow",
    title: "Getting Started with CMIGL Escrow",
    description:
      "Learn the basics of our escrow service and how to complete your first transaction.",
    category: "getting-started",
  },
  {
    slug: "create-and-verify-account",
    title: "How to Create and Verify Your Account",
    description:
      "A step-by-step guide to setting up your account and completing verification.",
    category: "account",
  },
  // Additional articles would be defined here
];

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateMetadata({ params }: Props): Metadata {
  const article = articles.find(
    async (article) => article.slug === (await params).slug
  );

  if (!article) {
    return {
      title: "Article Not Found - CMIGL Escrow Services",
      description: "The requested article could not be found.",
    };
  }

  return {
    title: `${article.title} - CMIGL Escrow Knowledge Base`,
    description: article.description,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((article) => article.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <ArticleContent slug={(await params).slug} />
    </div>
  );
}
