import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createNotificationWithPush } from "@/lib/api-utils";

const activationSchema = z.object({
  isActive: z.boolean(),
});

async function checkAdminPermission() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminPermission();
    const userId = (await params).id;
    const body = await request.json();
    const { isActive } = activationSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user activation status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    // Create notification for the user
    await createNotificationWithPush({
      userId,
      type: "SYSTEM_NOTIFICATION",
      title: `Account ${isActive ? "Activated" : "Deactivated"}`,
      message: `Your account has been ${isActive ? "activated" : "deactivated"} by an administrator.`,
      data: {
        action: isActive ? "activated" : "deactivated",
        adminId: admin.id,
      },
    });

    return NextResponse.json({
      message: `User account ${isActive ? "activated" : "deactivated"} successfully`,
      user: {
        id: updatedUser.id,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating user activation:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update user activation" },
      { status: 500 }
    );
  }
}

