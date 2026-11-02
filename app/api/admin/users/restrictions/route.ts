import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { userId, reason, details } = await request.json();

    if (!userId || !reason) {
      return NextResponse.json(
        { error: "User ID and reason are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create restriction and update user status
    const [restriction] = await prisma.$transaction([
      prisma.userRestriction.create({
        data: {
          userId,
          reason,
          details: details || "",
          appliedById: admin.id,
          appliedAt: new Date(),
          active: true,
        },
      }),
      prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          restricted: true,
        },
      }),
    ]);

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId,
        title: "Account Restricted",
        message:
          "Your account has been temporarily restricted. Please check your account status for more information.",
        type: "SYSTEM_NOTIFICATION",
        read: false,
      },
    });

    revalidatePath("/admin/users");

    return NextResponse.json({
      success: true,
      message: "User restricted successfully",
      restriction,
    });
  } catch (error) {
    console.error("Error restricting user:", error);
    return NextResponse.json(
      { error: "Failed to restrict user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const restrictionId = searchParams.get("id");

    if (!restrictionId) {
      return NextResponse.json(
        { error: "Restriction ID is required" },
        { status: 400 }
      );
    }

    // Get the restriction to find the user
    const restriction = await prisma.userRestriction.findUnique({
      where: { id: restrictionId },
    });

    if (!restriction) {
      return NextResponse.json(
        { error: "Restriction not found" },
        { status: 404 }
      );
    }

    // Remove restriction and update user status
    await prisma.userRestriction.update({
      where: { id: restrictionId },
      data: {
        active: false,
        resolvedAt: new Date(),
        resolvedById: admin.id,
      },
    });
    const remainingActiveRestrictions = await prisma.userRestriction.count({
      where: {
        userId: restriction.userId,
        active: true,
      },
    });

    // Only update user's restricted status if no active restrictions remain
    if (remainingActiveRestrictions === 0) {
      await prisma.user.update({
        where: { id: restriction.userId },
        data: { restricted: false },
      });

      // Create notification for the user
      await prisma.notification.create({
        data: {
          userId: restriction.userId,
          title: "Account Restriction Removed",
          message:
            "The restriction on your account has been removed. Your account is now active.",
          type: "SYSTEM_NOTIFICATION",
          read: false,
        },
      });
    }
    revalidatePath("/admin/users");

    return NextResponse.json({
      success: true,
      message: "User restriction removed successfully",
    });
  } catch (error) {
    console.error("Error removing user restriction:", error);
    return NextResponse.json(
      { error: "Failed to remove user restriction" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      // Get all active restrictions
      const restrictions = await prisma.userRestriction.findMany({
        where: { active: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
          appliedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      });

      return NextResponse.json({ restrictions });
    } else {
      // Get restrictions for a specific user
      const restrictions = await prisma.userRestriction.findMany({
        where: { userId },
        include: {
          appliedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      });

      return NextResponse.json({ restrictions });
    }
  } catch (error) {
    console.error("Error fetching user restrictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user restrictions" },
      { status: 500 }
    );
  }
}

