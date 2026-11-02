import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appealText, restrictionId } = await request.json();

    if (!appealText || !restrictionId) {
      return NextResponse.json(
        { error: "Appeal text and restriction ID are required" },
        { status: 400 }
      );
    }

    // Verify the restriction belongs to the user
    const restriction = await prisma.userRestriction.findUnique({
      where: {
        id: restrictionId,
        userId: session.user.id,
        active: true,
      },
    });

    if (!restriction) {
      return NextResponse.json(
        { error: "Restriction not found or not active" },
        { status: 404 }
      );
    }

    // Update the restriction with appeal information
    const updatedRestriction = await prisma.userRestriction.update({
      where: { id: restrictionId },
      data: {
        appealSubmitted: true,
        appealText,
        appealDate: new Date(),
      },
    });

    // Create a notification for admins about the appeal
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Account Restriction Appeal",
        message: `User ${session.user.name || session.user.username} has submitted an appeal for their account restriction.`,
        type: "SYSTEM_NOTIFICATION",
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Appeal submitted successfully",
      restriction: updatedRestriction,
    });
  } catch (error) {
    console.error("Error submitting appeal:", error);
    return NextResponse.json(
      { error: "Failed to submit appeal" },
      { status: 500 }
    );
  }
}

