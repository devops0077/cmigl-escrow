"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, Search, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getContentByType } from "@/lib/content-client";

interface KnowledgeBaseItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  tags: string[];
  version: number;
  updatedAt: string;
  publishedAt: string | null;
}

interface KnowledgeBaseClientProps {
  initialArticles: KnowledgeBaseItem[];
}

export function KnowledgeBaseClient({
  initialArticles,
}: KnowledgeBaseClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use React Query to fetch knowledge base articles
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["content", "KNOWLEDGE_BASE"],
    queryFn: async () => await getContentByType("KNOWLEDGE_BASE"),
    // Start with the initial articles we got from the server
    initialData: initialArticles,
    // Stale time of 5 minutes
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Extract all categories from articles
  const categories = Array.from(
    new Set(data?.map((article) => article.category || "Uncategorized"))
  ).sort();

  // Filter articles based on search query and selected category
  const filteredArticles = data?.filter((article) => {
    const matchesSearch = searchQuery
      ? article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true;

    const matchesCategory = selectedCategory
      ? (article.category || "Uncategorized") === selectedCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  // Get excerpt from content
  const getExcerpt = (content: string, maxLength = 150) => {
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, "");
    // Truncate to maxLength
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  if (isLoading || isRefreshing) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <Skeleton className="h-10 w-full sm:w-64" />
          <Skeleton className="h-10 w-full sm:w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load knowledge base articles.{" "}
            {error instanceof Error ? error.message : "Please try again."}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>

        {/* Fallback to initial articles */}
        {initialArticles.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Showing cached articles:
            </p>
            {renderArticleGrid(initialArticles)}
          </div>
        )}
      </div>
    );
  }

  // If we have no articles to display
  if (!filteredArticles || filteredArticles.length === 0) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search knowledge base..."
              className="pl-8 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2"
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="text-center py-12 border rounded-lg bg-card">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No articles found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory
              ? "Try adjusting your search or filters"
              : "No knowledge base articles are available at this time"}
          </p>
          {(searchQuery || selectedCategory) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search knowledge base..."
            className="pl-8 w-full sm:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2"
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory(null);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {renderArticleGrid(filteredArticles)}

      <div className="mt-8 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh Articles
        </Button>
      </div>
    </div>
  );

  function renderArticleGrid(articles: KnowledgeBaseItem[]) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="flex flex-col h-full">
            <CardHeader className="p-4">
              <CardTitle className="line-clamp-2">{article.title}</CardTitle>
              <CardDescription>
                {article.category || "Uncategorized"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
              <div className="flex flex-wrap gap-2 mb-3">
                {article.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {article.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{article.tags.length - 3} more
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {getExcerpt(article.content)}
              </p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button asChild className="w-full">
                <Link href={`/knowledge-base/${article.slug}`}>
                  Read Article
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
}
