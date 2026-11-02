import { type NextRequest, NextResponse } from "next/server";
import { paystackService } from "@/lib/paystack-service";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/error-class";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, TransactionStatus } from "@/lib/generated/prisma";
import { createTransaction } from "@/lib/data-actions";
import { monnifyService } from "@/lib/monnify-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trxRef: string }> }
) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trxRef } = await params;
    if (!trxRef) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    // Verify the transaction
    const verificationResult =
      await monnifyService.getTransactionStatus(trxRef);

    logger.info("Monnify payment verification result", {
      v: verificationResult.responseBody.metaData,
      reference: trxRef,
    });

    if (verificationResult.responseBody.paymentStatus === "PAID") {
      // Process the payment based on its type
      const metadata = verificationResult.responseBody.metaData || {};

      if (metadata?.type === "wallet_funding") {
        const amountInNaira = +verificationResult.responseBody.amountPaid;

        // Ensure we have a valid user ID
        if (!session.user.id) {
          throw new AppError("User ID is required", 400);
        }

        // Update the user's wallet balance
        await prisma.wallet.upsert({
          where: { userId: session.user.id },
          update: {
            balance: {
              increment: amountInNaira,
            },
            transactions: {
              create: {
                type: "DEPOSIT",
                amount: amountInNaira,
                reference: trxRef,
                status: TransactionStatus.COMPLETED,
              },
            },
          },
          create: {
            userId: session.user.id,
            balance: amountInNaira,
            transactions: {
              create: {
                type: "DEPOSIT",
                amount: amountInNaira,
                reference: trxRef,
                status: TransactionStatus.COMPLETED,
              },
            },
          },
        });

        return NextResponse.json({
          message: "Wallet funded successfully",
          amount: amountInNaira,
        });
      } else if (metadata?.type === "registration_fee") {
        const userId = String(metadata.userId) || session.user.id;

        // Update registration fee status
        await prisma.registrationFee.update({
          where: { userId },
          data: {
            paid: true,
            reference: trxRef,
          },
        });

        // Activate user account
        await prisma.user.update({
          where: { id: userId },
          data: { status: "ACTIVE" },
        });
        // udpate session user

        logger.info("Registration fee payment verified and user activated", {
          userId,
          reference: trxRef,
        });
      }
    }
  } catch (error) {
    logger.error("Payment verification error", {
      error,
      reference: (await params).trxRef,
    });

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

