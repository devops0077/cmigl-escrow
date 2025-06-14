import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { emailService } from "@/lib/email-service";
import { nanoid } from "nanoid";

async function checkAdminPermission() {
  const session = await auth();

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
    await checkAdminPermission();
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

    if (!user.email) {
      return NextResponse.json(
        { error: "User has no email address" },
        { status: 400 }
      );
    }

    // Delete any existing tokens
    await prisma.verificationToken.deleteMany({
      where: { userId },
    });

    // Create new verification token
    const token = nanoid(36);
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hour expiry

    await prisma.verificationToken.create({
      data: {
        userId,
        token,
        expires,
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, token);

    return NextResponse.json({
      message: "Verification email sent successfully",
      sentTo: user.email,
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
