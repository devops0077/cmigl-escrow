"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { getContentByType } from "@/lib/content-client"
import { ContentVersionInfo } from "@/components/content/content-version-info"

interface FAQItem {
  id: string
  title: string
  content: string
  category: string | null
  tags: string[]
  version: number
  updatedAt: string
  publishedAt: string | null
}

interface FAQContentProps {
  initialFaqs: FAQItem[]
}

export function FAQContent({ initialFaqs }: FAQContentProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Group FAQs by category
  const groupFaqsByCategory = (faqs: FAQItem[]) => {
    const grouped: Record<string, FAQItem[]> = {}

    faqs.forEach((faq) => {
      const category = faq.category || "General"
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(faq)
    })

    return grouped
  }

  // Use React Query to potentially fetch updated FAQs
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["content", "FAQ"],
    queryFn: () => getContentByType("FAQ"),
    // Start with the initial FAQs we got from the server
    initialData: initialFaqs,
    // Only refetch on mount or manual refetch
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading || isRefreshing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Separator />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="flex justify-between items-center mt-8">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Separator />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load FAQ content. {error instanceof Error ? error.message : "Please try again."}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>

        {/* Fallback to initial FAQs */}
        {initialFaqs.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">Showing cached FAQ content:</p>
            {renderFaqContent(initialFaqs)}
          </div>
        )}
      </div>
    )
  }

  // If we have no FAQs to display
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No FAQ content available</h3>
        <p className="text-muted-foreground mb-4">Please check back later for FAQ content.</p>
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div>
      {renderFaqContent(data)}

      <div className="mt-8 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh Content
        </Button>
      </div>
    </div>
  )

  function renderFaqContent(faqs: FAQItem[]) {
    const groupedFaqs = groupFaqsByCategory(faqs)
    const categories = Object.keys(groupedFaqs).sort((a, b) => {
      // Always put "General" category first
      if (a === "General") return -1
      if (b === "General") return 1
      return a.localeCompare(b)
    })

    // Get the most recent FAQ for version info
    const mostRecentFaq = [...faqs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

    return (
      <div className="space-y-8">
        {/* Version info from the most recent FAQ */}
        {mostRecentFaq && (
          <div className="mb-6">
            <ContentVersionInfo
              version={mostRecentFaq.version}
              updatedAt={mostRecentFaq.updatedAt}
              publishedAt={mostRecentFaq.publishedAt || undefined}
            />
          </div>
        )}

        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{category}</h2>
              <Separator className="my-2" />

              <Accordion type="single" collapsible className="w-full">
                {groupedFaqs[category].map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left font-medium">{faq.title}</AccordionTrigger>
                    <AccordionContent>
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none pt-2"
                        dangerouslySetInnerHTML={{ __html: faq.content }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}
      </div>
    )
  }
}
