import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { monnifyService } from "@/lib/monnify-service";
import type { WalletTransactionStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = params;

    // Find the transaction
    const transaction = await prisma.walletTransaction.findFirst({
      where: {
        reference,
        wallet: {
          user: {
            email: session.user.email,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // If transaction is already completed or failed, return current status
    if (transaction.status !== "PENDING") {
      return NextResponse.json({
        status: transaction.status,
        reference,
      });
    }

    // Get Monnify transaction reference from metadata
    const metadata = transaction.metadata as any;
    if (!metadata?.monnifyTransactionReference) {
      return NextResponse.json(
        { error: "Monnify transaction details not found" },
        { status: 400 }
      );
    }

    // Verify disbursement status with Monnify
    try {
      const disbursementStatus = await monnifyService.getDisbursementStatus(
        metadata.monnifyTransactionReference
      );

      // Map Monnify status to our status
      let newStatus: WalletTransactionStatus = "PENDING";
      const monnifyStatus =
        disbursementStatus.responseBody.status.toUpperCase();

      if (monnifyStatus === "SUCCESS" || monnifyStatus === "SUCCESSFUL") {
        newStatus = "COMPLETED";
      } else if (monnifyStatus === "FAILED" || monnifyStatus === "REVERSED") {
        newStatus = "FAILED";
      }

      // Update transaction status if changed
      if (newStatus !== transaction.status) {
        await prisma.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: newStatus,
            metadata: {
              ...metadata,
              monnifyDisbursementStatus: monnifyStatus,
              verifiedAt: new Date().toISOString(),
              lastVerifiedBy: "user",
              completedOn: disbursementStatus.completedOn || null,
            },
          },
        });

        // If failed, refund the user
        if (newStatus === "FAILED") {
          await prisma.wallet.update({
            where: { userId: session.user.id },
            data: {
              balance: {
                increment: transaction.amount,
              },
            },
          });

          logger.info("Failed Monnify withdrawal refunded", {
            userId: session.user.id,
            amount: transaction.amount,
            reference,
            monnifyTransactionReference: metadata.monnifyTransactionReference,
          });
        } else if (newStatus === "COMPLETED") {
          logger.info("Monnify withdrawal completed", {
            userId: session.user.id,
            amount: transaction.amount,
            reference,
            monnifyTransactionReference: metadata.monnifyTransactionReference,
            completedOn: disbursementStatus.completedOn,
          });
        }
      }

      return NextResponse.json({
        status: newStatus,
        reference,
        monnifyStatus,
        monnifyTransactionReference: metadata.monnifyTransactionReference,
      });
    } catch (error) {
      logger.error("Error verifying Monnify disbursement status", {
        reference,
        monnifyTransactionReference: metadata.monnifyTransactionReference,
        error,
      });

      return NextResponse.json({
        status: transaction.status,
        reference,
        error: "Failed to verify disbursement status with Monnify",
      });
    }
  } catch (error) {
    logger.error("Error checking Monnify withdrawal status", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
