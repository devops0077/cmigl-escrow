"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, RefreshCw, Search, Play, FileText, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getContentByType } from "@/lib/content-client"

interface TutorialItem {
  id: string
  title: string
  slug: string
  content: string
  category: string | null
  tags: string[]
  version: number
  updatedAt: string
  publishedAt: string | null
}

interface TutorialsClientProps {
  initialTutorials: TutorialItem[]
}

export function TutorialsClient({ initialTutorials }: TutorialsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Use React Query to fetch tutorials
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["content", "TUTORIAL"],
    queryFn: () => getContentByType("TUTORIAL"),
    // Start with the initial tutorials we got from the server
    initialData: initialTutorials,
    // Stale time of 5 minutes
    staleTime: 5 * 60 * 1000,
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

  // Extract all categories from tutorials
  const categories = Array.from(new Set(data?.map((tutorial) => tutorial.category || "Uncategorized"))).sort()

  // Filter tutorials based on search query and selected category
  const filteredTutorials = data?.filter((tutorial) => {
    const matchesSearch = searchQuery
      ? tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true

    const matchesCategory = selectedCategory ? (tutorial.category || "Uncategorized") === selectedCategory : true

    return matchesSearch && matchesCategory
  })

  // Get estimated reading time from content
  const getReadingTime = (content: string) => {
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, "")
    // Average reading speed: 200 words per minute
    const words = text.split(/\s+/).length
    const minutes = Math.ceil(words / 200)
    return minutes
  }

  // Extract thumbnail from content if available
  const getThumbnail = (content: string) => {
    const imgRegex = /<img[^>]+src="([^">]+)"/
    const match = content.match(imgRegex)
    return match ? match[1] : "/placeholder.svg?height=200&width=300"
  }

  // Check if tutorial has video
  const hasVideo = (content: string) => {
    return content.includes("<video") || content.includes("<iframe")
  }

  if (isLoading || isRefreshing) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <Skeleton className="h-10 w-full sm:w-64" />
          <Skeleton className="h-10 w-full sm:w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
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
    )
  }

  if (isError) {
    return (
      <div>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load tutorials. {error instanceof Error ? error.message : "Please try again."}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>

        {/* Fallback to initial tutorials */}
        {initialTutorials.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">Showing cached tutorials:</p>
            {renderTutorialGrid(initialTutorials)}
          </div>
        )}
      </div>
    )
  }

  // If we have no tutorials to display
  if (!filteredTutorials || filteredTutorials.length === 0) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tutorials..."
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
                setSearchQuery("")
                setSelectedCategory(null)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="text-center py-12 border rounded-lg bg-card">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No tutorials found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory
              ? "Try adjusting your search or filters"
              : "No tutorials are available at this time"}
          </p>
          {(searchQuery || selectedCategory) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory(null)
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tutorials..."
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
              setSearchQuery("")
              setSelectedCategory(null)
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {renderTutorialGrid(filteredTutorials)}

      <div className="mt-8 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh Tutorials
        </Button>
      </div>
    </div>
  )

  function renderTutorialGrid(tutorials: TutorialItem[]) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => (
          <Card key={tutorial.id} className="overflow-hidden flex flex-col h-full">
            <div className="relative h-48 w-full">
              <Image
                src={getThumbnail(tutorial.content) || "/placeholder.svg"}
                alt={tutorial.title}
                fill
                className="object-cover"
              />
              {hasVideo(tutorial.content) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <CardHeader className="p-4">
              <CardTitle className="line-clamp-2">{tutorial.title}</CardTitle>
              <CardDescription>{tutorial.category || "Uncategorized"}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
              <div className="flex flex-wrap gap-2 mb-3">
                {tutorial.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {tutorial.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{tutorial.tags.length - 3} more
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {getReadingTime(tutorial.content)} min read
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button asChild className="w-full">
                <Link href={`/tutorials/${tutorial.slug}`}>View Tutorial</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }
}
