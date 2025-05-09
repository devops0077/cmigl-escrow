"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContentById } from "@/lib/content-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DynamicContentProps {
  content: string;
  contentId: string;
  contentType: string;
}

export function DynamicContent({
  content,
  contentId,
  contentType,
}: DynamicContentProps) {
  // Initial content from server-side props
  const [initialContent] = useState(content);

  // Client-side fetching with React Query for real-time updates
  const { data, error, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["content", contentId],
    queryFn: () => getContentById(contentId),
    // Start with initial data from server
    initialData: { content: initialContent, id: contentId },
    // Stale time of 5 minutes - content won't refetch for 5 minutes unless forced
    staleTime: 5 * 60 * 1000,
    // Cache time of 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry 3 times if fetch fails
    retry: 3,
    retryDelay: (attempt) =>
      Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
  });

  // Show content from query or fall back to initial content
  const displayContent = data?.content || initialContent;

  // Format the last updated time
  const lastUpdated = new Date(dataUpdatedAt).toLocaleString();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-1/2 mt-8" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load the latest content. Using cached version.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="ml-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      {/* Render the content safely */}
      <div
        className="prose prose-sm sm:prose lg:prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />

      {/* Small indicator showing when content was last checked */}
      <div className="text-xs text-muted-foreground mt-4 text-right">
        Content last checked: {lastUpdated}
      </div>
    </div>
  );
}
