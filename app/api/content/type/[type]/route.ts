import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/content/type/:type - Get content by type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const type = (await params).type;

    if (!type) {
      return NextResponse.json(
        { error: "Content type is required" },
        { status: 400 }
      );
    }

    // Check if we should only return published content
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get("published") === "true";

    // Get content from database
    const content = await prisma.contentItem.findMany({
      where: {
        type: type as any,
        ...(publishedOnly ? { published: true } : {}),
      },
      orderBy: {
        updatedAt: "desc",
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
    logger.error("Error fetching content by type:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
