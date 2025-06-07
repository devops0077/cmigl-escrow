import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/content/:id - Get content by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    if (!id) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Get content from database
    const content = await prisma.contentItem.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        version: true,
        updatedAt: true,
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json(content, {
      status: 200,
    });
  } catch (error) {
    logger.error("Error fetching content by ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
