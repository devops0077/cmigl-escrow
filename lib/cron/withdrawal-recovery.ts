import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { paystackService } from "@/lib/paystack-service";
import { TransactionStatus } from "../generated/prisma";

// Configuration constants
const PENDING_THRESHOLD_HOURS = 2; // Consider transactions pending for 2+ hours as stuck
const MAX_RETRY_COUNT = 3; // Maximum number of retry attempts
const AUTO_REFUND_THRESHOLD_HOURS = 24; // Auto-refund after 24 hours if still pending

/**
 * Main function to recover stuck withdrawals
 * This should be called by a cron job or scheduled task
 */
export async function recoverStuckWithdrawals() {
  try {
    logger.info("Starting withdrawal recovery process");

    // Find all pending withdrawal transactions that have been stuck for too long
    const stuckWithdrawals = await findStuckWithdrawals();

    if (stuckWithdrawals.length === 0) {
      logger.info("No stuck withdrawals found");
      return { processed: 0, recovered: 0, refunded: 0, errors: 0 };
    }

    logger.info(
      `Found ${stuckWithdrawals.length} potentially stuck withdrawals`
    );

    // Process each stuck withdrawal
    const results = {
      processed: stuckWithdrawals.length,
      recovered: 0,
      refunded: 0,
      errors: 0,
    };

    for (const withdrawal of stuckWithdrawals) {
      try {
        const result = await processStuckWithdrawal(withdrawal);
        if (result.action === "recovered") results.recovered++;
        if (result.action === "refunded") results.refunded++;
      } catch (error) {
        logger.error("Error processing stuck withdrawal", {
          withdrawalId: withdrawal.id,
          reference: withdrawal.reference,
          error,
        });
        results.errors++;
      }
    }

    logger.info("Withdrawal recovery process completed", results);
    return results;
  } catch (error) {
    logger.error("Error in withdrawal recovery process", { error });
    throw error;
  }
}

/**
 * Find withdrawals that are stuck in pending state
 */
async function findStuckWithdrawals() {
  const pendingThresholdDate = new Date();
  pendingThresholdDate.setHours(
    pendingThresholdDate.getHours() - PENDING_THRESHOLD_HOURS
  );

  return prisma.walletTransaction.findMany({
    where: {
      type: "WITHDRAWAL",
      status: "PENDING",
      createdAt: {
        lt: pendingThresholdDate,
      },
    },
    include: {
      wallet: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

/**
 * Process a single stuck withdrawal
 */
async function processStuckWithdrawal(withdrawal: any) {
  const metadata = (withdrawal.metadata as any) || {};
  const reference = withdrawal.reference;

  logger.info("Processing stuck withdrawal", {
    withdrawalId: withdrawal.id,
    reference,
    createdAt: withdrawal.createdAt,
    amount: withdrawal.amount,
  });

  // Check if we've already tried too many times
  const retryCount = metadata.recoveryRetryCount || 0;
  const isOldTransaction = isTransactionTooOld(withdrawal.createdAt);

  // If we've tried too many times or the transaction is too old, auto-refund
  if (retryCount >= MAX_RETRY_COUNT || isOldTransaction) {
    return await refundWithdrawal(withdrawal);
  }

  // Check the status with Paystack
  try {
    // If we have a transfer code, check the status with Paystack
    if (metadata.transferCode) {
      const transferStatus = await paystackService.verifyTransfer(reference);

      // Update our database based on Paystack's response
      if (transferStatus.data.status.toLowerCase() === "success") {
        await updateWithdrawalStatus(withdrawal.id, "COMPLETED", {
          ...metadata,
          transferStatus: "SUCCESS",
          completedAt: new Date().toISOString(),
          recoveryProcessed: true,
        });
        logger.info(
          "Withdrawal marked as completed based on Paystack verification",
          {
            withdrawalId: withdrawal.id,
            reference,
          }
        );
        return { action: "recovered", status: "COMPLETED" };
      } else if (
        ["failed", "reversed"].includes(
          transferStatus.data.status.toLowerCase()
        )
      ) {
        // If Paystack says it failed, refund the user
        return await refundWithdrawal(withdrawal);
      } else {
        // Still pending in Paystack, increment retry count
        await updateWithdrawalStatus(withdrawal.id, "PENDING", {
          ...metadata,
          recoveryRetryCount: retryCount + 1,
          lastRecoveryAttempt: new Date().toISOString(),
        });
        logger.info(
          "Withdrawal still pending in Paystack, incremented retry count",
          {
            withdrawalId: withdrawal.id,
            reference,
            retryCount: retryCount + 1,
          }
        );
        return { action: "retried", status: "PENDING" };
      }
    } else {
      // No transfer code means the initial API call might have failed
      // We should check if we can find any record of this transaction in Paystack
      // If not, we should refund the user

      // For safety, let's just refund in this case
      return await refundWithdrawal(withdrawal);
    }
  } catch (error) {
    // If we can't verify with Paystack, increment retry count
    await updateWithdrawalStatus(withdrawal.id, "PENDING", {
      ...metadata,
      recoveryRetryCount: retryCount + 1,
      lastRecoveryAttempt: new Date().toISOString(),
      lastRecoveryError: error instanceof Error ? error.message : String(error),
    });

    logger.error("Error verifying withdrawal with Paystack", {
      withdrawalId: withdrawal.id,
      reference,
      error,
    });

    // If this is the last retry or an old transaction, refund anyway
    if (retryCount + 1 >= MAX_RETRY_COUNT || isOldTransaction) {
      return await refundWithdrawal(withdrawal);
    }

    return { action: "error", status: "PENDING" };
  }
}

/**
 * Refund a withdrawal to the user's wallet
 */
async function refundWithdrawal(withdrawal: any) {
  const metadata = (withdrawal.metadata as any) || {};

  try {
    await prisma.$transaction(async (tx) => {
      // Update transaction status
      await tx.walletTransaction.update({
        where: { id: withdrawal.id },
        data: {
          status: "FAILED",
          metadata: {
            ...metadata,
            refundedAt: new Date().toISOString(),
            refundReason: "Auto-refunded by recovery system",
            recoveryProcessed: true,
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
          description: `Refund for failed withdrawal (${withdrawal.reference})`,
          metadata: {
            originalTransactionId: withdrawal.id,
            originalReference: withdrawal.reference,
            refundReason: "Auto-refunded by recovery system",
          },
        },
      });
    });

    logger.info("Withdrawal refunded successfully", {
      withdrawalId: withdrawal.id,
      reference: withdrawal.reference,
      amount: withdrawal.amount,
    });

    return { action: "refunded", status: "FAILED" };
  } catch (error) {
    logger.error("Error refunding withdrawal", {
      withdrawalId: withdrawal.id,
      reference: withdrawal.reference,
      error,
    });
    throw error;
  }
}

/**
 * Update a withdrawal transaction status
 */
async function updateWithdrawalStatus(
  id: string,
  status: TransactionStatus,
  metadata: any
) {
  return prisma.walletTransaction.update({
    where: { id },
    data: {
      status,
      metadata,
    },
  });
}

/**
 * Check if a transaction is too old and should be auto-refunded
 */
function isTransactionTooOld(createdAt: Date): boolean {
  const autoRefundThresholdDate = new Date();
  autoRefundThresholdDate.setHours(
    autoRefundThresholdDate.getHours() - AUTO_REFUND_THRESHOLD_HOURS
  );
  return createdAt < autoRefundThresholdDate;
}
