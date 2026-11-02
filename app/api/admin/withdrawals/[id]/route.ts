import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Validation schema for withdrawal status update
const updateSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]),
  adminNotes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;

    // Get the withdrawal details
    const withdrawal = await prisma.walletTransaction.findUnique({
      where: { id },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!withdrawal || withdrawal.type !== "WITHDRAWAL") {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(withdrawal);
  } catch (error) {
    logger.error("Error fetching withdrawal details", {
      error,
      id: (await params).id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;

    // Validate request body
    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get the withdrawal
    const withdrawal = await prisma.walletTransaction.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!withdrawal || withdrawal.type !== "WITHDRAWAL") {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    // Handle status change
    if (data.status === "FAILED" && withdrawal.status !== "FAILED") {
      // Refund the user if changing to FAILED
      await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.walletTransaction.update({
          where: { id },
          data: {
            status: "FAILED",
            metadata: {
              // @ts-ignore
              ...withdrawal.metadata,
              adminUpdated: true,
              adminNotes: data.adminNotes,
              updatedBy: session.user.email,
              updatedAt: new Date().toISOString(),
            },
          },
        });

        // Refund the user's wallet
        await tx.wallet.update({
          where: { id: withdrawal.walletId },
          data: {
            balance: {
              increment: withdrawal.amount,
            },
          },
        });

        // Create a refund transaction record
        await tx.walletTransaction.create({
          data: {
            walletId: withdrawal.walletId,
            type: "DEPOSIT",
            amount: withdrawal.amount,
            status: "COMPLETED",
            reference: `REFUND-${withdrawal.reference}`,
            description: `Admin refund for failed withdrawal (${withdrawal.reference})`,
            metadata: {
              originalTransactionId: withdrawal.id,
              originalReference: withdrawal.reference,
              refundReason: data.adminNotes || "Admin refund",
              adminEmail: session.user.email,
            },
          },
        });
      });

      logger.info("Admin refunded withdrawal", {
        withdrawalId: id,
        adminEmail: session.user.email,
        amount: withdrawal.amount,
      });

      return NextResponse.json({
        message: "Withdrawal marked as failed and funds refunded",
        id,
      });
    } else {
      // Just update the status
      await prisma.walletTransaction.update({
        where: { id },
        data: {
          status: data.status,
          metadata: {
            // @ts-ignore
            ...withdrawal.metadata,
            adminUpdated: true,
            adminNotes: data.adminNotes,
            updatedBy: session.user.email,
            updatedAt: new Date().toISOString(),
          },
        },
      });

      logger.info("Admin updated withdrawal status", {
        withdrawalId: id,
        adminEmail: session.user.email,
        newStatus: data.status,
      });

      return NextResponse.json({
        message: `Withdrawal status updated to ${data.status}`,
        id,
      });
    }
  } catch (error) {
    logger.error("Error updating withdrawal", { error, id: (await params).id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

