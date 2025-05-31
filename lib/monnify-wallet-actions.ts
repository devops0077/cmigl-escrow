import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/error-class";
import { logger } from "@/lib/logger";
import { monnifyService } from "@/lib/monnify-service";
import { paystackService } from "@/lib/paystack-service";
import { auth } from "@/auth";
import type { WalletTransactionStatus } from "@prisma/client";

/**
 * Initiate a withdrawal using Monnify
 * @param amount Withdrawal amount in Naira
 * @param bankCode Bank code
 * @param accountNumber Account number
 * @param accountName Account name
 * @returns Withdrawal initiation result
 */
export async function initiateMonnifyWithdrawal(
  amount: number,
  bankCode: string,
  accountNumber: string,
  accountName: string
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError("Unauthorized", 401);
    }

    // Check if user has sufficient balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new AppError("Wallet not found", 404);
    }

    if (user.wallet.balance < amount) {
      throw new AppError("Insufficient balance", 400);
    }

    // Generate a unique reference
    const reference = `MONNIFY_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Resolve account number to verify account details (using Paystack for verification)
    let accountDetails;
    try {
      accountDetails = await paystackService.resolveAccountNumber(
        accountNumber,
        bankCode
      );
    } catch (error) {
      logger.error("Failed to resolve account number for Monnify withdrawal", {
        accountNumber: accountNumber.slice(-4).padStart(10, "*"),
        bankCode,
        error,
      });
      throw new AppError(
        "Invalid account details. Please verify your bank information.",
        400
      );
    }

    // Create a pending transaction in our database
    const transaction = await prisma.$transaction(async (tx) => {
      // Deduct the amount from the user's wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // Create a withdrawal transaction record
      const walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: user.wallet!.id,
          type: "WITHDRAWAL",
          amount,
          reference,
          status: "PENDING",
          description: `Monnify withdrawal to ${accountName} (${accountNumber.slice(-4).padStart(10, "*")})`,
          metadata: {
            provider: "monnify",
            bankCode,
            accountNumber,
            accountName,
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
        amount,
        reference,
        bankCode,
        bankAccountNumber: accountNumber,
        narration: `Withdrawal to ${accountName}`,
        currencyCode: "NGN",
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
        amount,
        reference,
        monnifyTransactionReference: disbursementResponse.transactionReference,
        status: disbursementResponse.status,
      });

      return {
        reference,
        message: "Withdrawal request submitted successfully via Monnify",
        status: "pending",
        monnifyTransactionReference: disbursementResponse.transactionReference,
        accountName,
      };
    } catch (error) {
      logger.error("Failed to initiate Monnify disbursement", {
        userId: user.id,
        amount,
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
              increment: amount,
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

      throw new AppError(
        "Failed to process withdrawal via Monnify. Your funds have been returned to your wallet.",
        500
      );
    }
  } catch (error) {
    logger.error("Error initiating Monnify withdrawal", { error });
    throw error;
  }
}

/**
 * Verify a Monnify withdrawal transfer status
 * @param reference Transfer reference
 * @returns Updated transaction status
 */
export async function verifyMonnifyWithdrawalStatus(reference: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError("Unauthorized", 401);
    }

    // Find the transaction
    const transaction = await prisma.walletTransaction.findFirst({
      where: {
        reference,
        wallet: {
          userId: session.user.id,
        },
      },
    });

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    // If transaction is already completed or failed, return current status
    if (transaction.status !== "PENDING") {
      return {
        status: transaction.status,
        reference,
      };
    }

    // Get Monnify transaction reference from metadata
    const metadata = transaction.metadata as any;
    if (!metadata?.monnifyTransactionReference) {
      throw new AppError("Monnify transaction details not found", 400);
    }

    // Verify disbursement status with Monnify
    try {
      const disbursementStatus = await monnifyService.getDisbursementStatus(
        metadata.monnifyTransactionReference
      );

      // Map Monnify status to our status
      let newStatus: WalletTransactionStatus = "PENDING";
      const monnifyStatus = disbursementStatus.status.toUpperCase();

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

      return {
        status: newStatus,
        reference,
        monnifyStatus,
        monnifyTransactionReference: metadata.monnifyTransactionReference,
      };
    } catch (error) {
      logger.error("Error verifying Monnify disbursement status", {
        reference,
        monnifyTransactionReference: metadata.monnifyTransactionReference,
        error,
      });
      return {
        status: transaction.status,
        reference,
        error: "Failed to verify disbursement status with Monnify",
      };
    }
  } catch (error) {
    logger.error("Error checking Monnify withdrawal status", { error });
    throw error;
  }
}
