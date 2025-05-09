import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getContentBySlug } from "@/lib/content-actions"
import { DynamicContent } from "@/components/content/dynamic-content"
import { ContentVersionInfo } from "@/components/content/content-version-info"

interface TutorialPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: TutorialPageProps): Promise<Metadata> {
  const tutorial = await getContentBySlug(params.slug)

  if (!tutorial) {
    return {
      title: "Tutorial Not Found",
      description: "The requested tutorial could not be found.",
    }
  }

  return {
    title: `${tutorial.title} - Tutorials`,
    description: tutorial.content.substring(0, 160).replace(/<[^>]*>/g, ""),
  }
}

export default async function TutorialPage({ params }: TutorialPageProps) {
  const tutorial = await getContentBySlug(params.slug)

  if (!tutorial || tutorial.type !== "TUTORIAL" || !tutorial.published) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8 md:py-12">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/tutorials">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Tutorials
            </Link>
          </Button>

          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight mb-4">{tutorial.title}</h1>

            {tutorial.category && (
              <div className="mb-4">
                <span className="inline-block bg-muted px-3 py-1 text-sm rounded-full">{tutorial.category}</span>
              </div>
            )}

            <Separator className="my-6" />

            <DynamicContent content={tutorial.content} contentId={tutorial.id} contentType="TUTORIAL" />

            <div className="mt-8">
              <ContentVersionInfo
                version={tutorial.version}
                updatedAt={tutorial.updatedAt}
                publishedAt={tutorial.publishedAt}
              />

              {tutorial.tags && tutorial.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {tutorial.tags.map((tag: string) => (
                    <span key={tag} className="inline-block bg-muted px-3 py-1 text-sm rounded-full">
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
  )
}
