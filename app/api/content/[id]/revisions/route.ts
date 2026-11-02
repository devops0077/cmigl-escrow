import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { auth } from "@/auth";
import { headers } from "next/headers";

// GET /api/content/:id/revisions - Get content revisions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const id = (await params).id;

    if (!id) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Get content revisions from database
    const revisions = await prisma.contentRevision.findMany({
      where: { contentId: id },
      orderBy: { version: "desc" },
    });

    return NextResponse.json(revisions, { status: 200 });
  } catch (error) {
    logger.error("Error fetching content revisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch content revisions" },
      { status: 500 }
    );
  }
}

