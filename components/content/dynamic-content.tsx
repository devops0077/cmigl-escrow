"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getContentById } from "@/lib/content-client";

interface DynamicContentProps {
  content: string;
  contentId: string;
  contentType: string;
  initialVersion?: number;
}

export function DynamicContent({
  content: initialContent,
  contentId,
  contentType,
  initialVersion,
}: DynamicContentProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use React Query to potentially fetch updated content
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["content", contentId],
    queryFn: async () => await getContentById(contentId),
    // Start with the initial content we got from the server
    initialData: { id: contentId, content: initialContent },
    // Only refetch on mount or manual refetch
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || isRefreshing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-full" />
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
            Failed to load content.{" "}
            {error instanceof Error ? error.message : "Please try again."}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        {/* Fallback to initial content */}
        <div
          className="mt-6 prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: initialContent }}
        />
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
      <div className="mt-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
