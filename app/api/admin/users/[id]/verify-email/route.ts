import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { createNotificationWithPush } from "@/lib/api-utils";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminPermission();
    const userId = (await params).id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Manually verify the email
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
      },
    });

    // Delete any existing verification tokens
    await prisma.verificationToken.deleteMany({
      where: { userId },
    });

    // Create notification for the user
    await createNotificationWithPush({
      userId,
      type: "SYSTEM_NOTIFICATION",
      title: "Email Verified",
      message: "Your email address has been verified by an administrator.",
      data: { verifiedBy: admin.id },
    });

    return NextResponse.json({
      message: "Email verified successfully",
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}

