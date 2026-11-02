import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createNotificationWithPush } from "@/lib/api-utils";

const registrationFeeSchema = z.object({
  paid: z.boolean(),
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
    const { paid } = registrationFeeSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { registrationFee: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.registrationFee) {
      return NextResponse.json(
        { error: "Registration fee record not found" },
        { status: 404 }
      );
    }

    // Update registration fee status
    const updatedFee = await prisma.registrationFee.update({
      where: { userId },
      data: {
        paid,
        reference: paid ? `ADMIN_${Date.now()}` : null,
      },
    });

    // If marking as paid, activate the user account
    if (paid && !user.isActive) {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });
    }

    // Create notification for the user
    await createNotificationWithPush({
      userId,
      type: "SYSTEM_NOTIFICATION",
      title: `Registration Fee ${paid ? "Paid" : "Unpaid"}`,
      message: `Your registration fee has been marked as ${paid ? "paid" : "unpaid"} by an administrator.${
        paid ? " Your account is now active." : ""
      }`,
      data: {
        action: paid ? "fee_paid" : "fee_unpaid",
        adminId: admin.id,
      },
    });

    return NextResponse.json({
      message: `Registration fee marked as ${paid ? "paid" : "unpaid"} successfully`,
      registrationFee: updatedFee,
    });
  } catch (error) {
    console.error("Error updating registration fee:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update registration fee" },
      { status: 500 }
    );
  }
}

