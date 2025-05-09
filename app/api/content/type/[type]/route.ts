import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;

    // Validate content type
    const validTypes = [
      "KNOWLEDGE_BASE",
      "TUTORIAL",
      "TERMS_OF_SERVICE",
      "PRIVACY_POLICY",
      "FAQ",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const published = searchParams.get("published") === "true";
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {
      type: type as any,
    };

    // Add filters if provided
    if (published) {
      where.published = true;
    }

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get content
    const content = await prisma.contentItem.findMany({
      where,
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

    // Set cache control headers
    return NextResponse.json(content, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    logger.error("Error fetching content by type:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
