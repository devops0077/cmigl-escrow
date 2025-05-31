import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { monnifyService } from "@/lib/monnify-service";
import { paystackService } from "@/lib/paystack-service";

// Validation schema for Monnify withdrawal requests
const monnifyWithdrawalSchema = z.object({
  type: z.literal("monnify_withdrawal"),
  amount: z
    .number()
    .positive()
    .min(1000, "Minimum withdrawal amount is ₦1,000"),
  bankCode: z.string().min(1, "Bank code is required"),
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
  accountName: z.string().min(1, "Account name is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = monnifyWithdrawalSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get user and wallet
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Check if user has sufficient balance
    if (user.wallet.balance < data.amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Generate a unique reference
    const reference = `MONNIFY_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Verify account details using Paystack (for account resolution)
    let accountDetails;
    try {
      accountDetails = await paystackService.resolveAccountNumber(
        data.accountNumber,
        data.bankCode
      );

      // Verify the resolved name matches the provided name (basic validation)
      if (
        accountDetails.account_name.toLowerCase() !==
        data.accountName.toLowerCase()
      ) {
        logger.warn("Account name mismatch during Monnify withdrawal", {
          provided: data.accountName,
          resolved: accountDetails.account_name,
          accountNumber: data.accountNumber.slice(-4).padStart(10, "*"),
        });
      }
    } catch (error) {
      logger.error("Failed to resolve account number for Monnify withdrawal", {
        accountNumber: data.accountNumber.slice(-4).padStart(10, "*"),
        bankCode: data.bankCode,
        error,
      });
      return NextResponse.json(
        {
          error:
            "Invalid account details. Please verify your bank information.",
        },
        { status: 400 }
      );
    }

    // Create a pending transaction in our database and deduct balance
    const transaction = await prisma.$transaction(async (tx) => {
      // Deduct the amount from the user's wallet
      await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            decrement: data.amount,
          },
        },
      });

      // Create a withdrawal transaction record
      const walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: user.wallet!.id,
          type: "WITHDRAWAL",
          amount: data.amount,
          reference,
          status: "PENDING",
          description: `Withdrawal to ${data.accountName} (${data.accountNumber.slice(-4).padStart(10, "*")})`,
          metadata: {
            provider: "monnify",
            bankCode: data.bankCode,
            accountNumber: data.accountNumber,
            accountName: data.accountName,
            resolvedAccountName: accountDetails.account_name,
            initiatedAt: new Date().toISOString(),
            // Add client IP and user agent for security tracking
            clientIp: user.lastLoginIp || null,
            userAgent: user.lastLoginUserAgent || null,
            // Add initial recovery data
            recoveryEligibleAt: new Date(
              Date.now() + 2 * 60 * 60 * 1000
            ).toISOString(), // 2 hours from now
          },
        },
      });

      return walletTransaction;
    });

    // Initiate the disbursement with Monnify
    try {
      const disbursementResponse = await monnifyService.initiateDisbursement({
        amount: data.amount,
        reference,
        destinationBankCode: data.bankCode,
        destinationAccountNumber: data.accountNumber,
        narration: `Withdrawal to ${data.accountName}`,
        currency: "NGN",
      });

      // Update the transaction with Monnify disbursement details
      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          metadata: {
            ...transaction.metadata,
            monnifyTransactionReference:
              disbursementResponse.transactionReference,
            monnifyPaymentReference: disbursementResponse.paymentReference,
            monnifyStatus: disbursementResponse.status,
            disbursementInitiatedAt: new Date().toISOString(),
          },
        },
      });

      logger.info("Monnify withdrawal disbursement initiated", {
        userId: user.id,
        amount: data.amount,
        reference,
        monnifyTransactionReference: disbursementResponse.transactionReference,
        status: disbursementResponse.status,
      });

      return NextResponse.json({
        reference,
        message: "Withdrawal request submitted successfully via Monnify",
        status: "pending",
        monnifyTransactionReference: disbursementResponse.transactionReference,
        accountName: data.accountName,
      });
    } catch (error) {
      logger.error("Failed to initiate Monnify disbursement", {
        userId: user.id,
        amount: data.amount,
        reference,
        error,
      });

      // Refund the user's wallet since the disbursement failed
      await prisma.$transaction(async (tx) => {
        // Return the amount to the user's wallet
        await tx.wallet.update({
          where: { userId: user.id },
          data: {
            balance: {
              increment: data.amount,
            },
          },
        });

        // Update the transaction status to failed
        await tx.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            metadata: {
              ...transaction.metadata,
              failureReason:
                error instanceof Error
                  ? error.message
                  : "Failed to initiate Monnify disbursement",
              failedAt: new Date().toISOString(),
            },
          },
        });
      });

      return NextResponse.json(
        {
          error:
            "Failed to process withdrawal via Monnify. Your funds have been returned to your wallet.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing Monnify withdrawal operation:", error);

    // Return appropriate error message
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    const status = errorMessage === "Insufficient balance" ? 400 : 500;

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
