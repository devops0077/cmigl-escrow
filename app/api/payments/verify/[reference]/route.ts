import { type NextRequest, NextResponse } from "next/server";
import { paystackService } from "@/lib/paystack-service";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/error-class";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/lib/generated/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = await params;
    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    // Verify the transaction
    const verificationResult =
      await paystackService.verifyTransaction(reference);

    // Check if the transaction was successful
    if (verificationResult.data.status === "success") {
      // Extract metadata
      const metadata = verificationResult.data.metadata || {};

      // Process based on payment type
      if (metadata?.type === "wallet_funding") {
        // Get the amount in Naira (convert from kobo)
        const amountInNaira = verificationResult.data.amount / 100;

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
                reference,
                status: "COMPLETED",
                description: "Wallet funding via Paystack",
                metadata: {
                  paymentGateway: "paystack",
                  paymentReference: reference,
                  paymentChannel: verificationResult.data.channel,
                },
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
                reference,
                status: "COMPLETED",
                description: "Wallet funding via Paystack",
                metadata: {
                  paymentGateway: "paystack",
                  paymentReference: reference,
                  paymentChannel: verificationResult.data.channel,
                },
              },
            },
          },
        });

        logger.info("Payment verified and wallet updated", {
          userId: session.user.id,
          reference,
          amount: amountInNaira,
        });
      } else if (metadata.type === "registration_fee") {
        const userId = metadata.userId || session.user.id;

        // Update registration fee status
        await prisma.registrationFee.update({
          where: { userId },
          data: {
            paid: true,
            reference,
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
          reference,
        });
      }
    }

    return NextResponse.json(verificationResult);
  } catch (error) {
    logger.error("Payment verification error", {
      error,
      reference: (await params).reference,
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
