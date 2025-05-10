import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is restricted
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        restrictions: {
          where: { active: true },
          orderBy: { appliedAt: "desc" },
          take: 1,
          include: {
            appliedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has active restrictions or status is RESTRICTED
    const isRestricted = user.restrictions[0]?.active;

    return NextResponse.json({
      restricted: isRestricted ? true : false,
      restriction: user.restrictions[0] || null,
      restrictions: user.restrictions,
    });
  } catch (error) {
    console.error("Error checking user restriction:", error);
    return NextResponse.json(
      { error: "Failed to check restriction status" },
      { status: 500 }
    );
  }
}
