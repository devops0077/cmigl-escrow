import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { z } from "zod";

const updateStatusSchema = z.object({
  restricted: z.boolean(),
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
    const { restricted } = updateStatusSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { restricted },
      select: {
        id: true,
        name: true,
        email: true,
        restricted: true,
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId,
        title: restricted
          ? "Account Restricted"
          : "Account Restriction Removed",
        message: restricted
          ? "Your account has been restricted. Please contact support for more information."
          : "The restriction on your account has been removed. Your account is now active.",
        type: "SYSTEM_NOTIFICATION",
        read: false,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}

