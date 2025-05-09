import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/content/slug/:slug - Get content by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug;

    if (!slug) {
      return NextResponse.json(
        { error: "Content slug is required" },
        { status: 400 }
      );
    }

    // Get content from database
    const content = await prisma.contentItem.findUnique({
      where: {
        slug,
        published: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Add cache control headers
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, max-age=300, s-maxage=600, stale-while-revalidate=86400"
    );

    return NextResponse.json(content, {
      headers,
      status: 200,
    });
  } catch (error) {
    logger.error("Error fetching content by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
