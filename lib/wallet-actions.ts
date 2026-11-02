import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/error-class";
import { logger } from "@/lib/logger";
import { paystackService } from "@/lib/paystack-service";
import { auth } from "@/auth";
import { headers } from "next/headers";
import type { WalletTransactionStatus } from "@prisma/client";

export async function getWalletBalance() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new AppError("Unauthorized", 401);
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    return {
      balance: wallet?.balance || 0,
    };
  } catch (error) {
    logger.error("Error getting wallet balance", { error });
    throw error;
  }
}

export async function getUserWallet() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      wallet: true,
    },
  });

  if (!user || !user.wallet) {
    throw new Error("Wallet not found");
  }

  return {
    balance: user.wallet.balance,
  };
}

export async function getWalletTransactions(limit = 10, page = 1) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new AppError("Unauthorized", 401);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: {
          wallet: {
            userId: session.user.id,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip,
      }),
      prisma.walletTransaction.count({
        where: {
          wallet: {
            userId: session.user.id,
          },
        },
      }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error getting wallet transactions", { error });
    throw error;
  }
}

export async function initiateWalletFunding(amount: number) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new AppError("Unauthorized", 401);
    }

    // Generate a unique reference
    const reference = paystackService.generateTransactionReference();

    // Initialize the transaction with Paystack
    const result = await paystackService.initializeTransaction({
      email: session.user.email as string,
      amount,
      reference,
      metadata: {
        userId: session.user.id,
        purpose: "wallet_funding",
      },
      currency: "NGN",
    });

    logger.info("Wallet funding initiated", {
      userId: session.user.id,
      amount,
      reference,
    });

    return result;
  } catch (error) {
    logger.error("Error initiating wallet funding", { error });
    throw error;
  }
}

async function verifyWalletFunding(reference: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new AppError("Unauthorized", 401);
    }

    // Verify the transaction with Paystack
    const verificationResult =
      await paystackService.verifyTransaction(reference);

    // Check if the transaction was successful
    if (verificationResult.data.status === "success") {
      // Get the amount in Naira (convert from kobo)
      const amountInNaira = verificationResult.data.amount / 100;

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
          userId: session.user.id as string,
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

      logger.info("Wallet funding verified and balance updated", {
        userId: session.user.id,
        reference,
        amount: amountInNaira,
      });
    }

    return verificationResult;
  } catch (error) {
    logger.error("Error verifying wallet funding", { error });
    throw error;
  }
}

export async function initiateWithdrawal(
  amount: number,
  bankCode: string,
  accountNumber: string
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
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
    const reference = paystackService.generateTransactionReference();

    // Resolve account number to get account name
    let accountDetails;
    try {
      accountDetails = await paystackService.resolveAccountNumber(
        accountNumber,
        bankCode
      );
    } catch (error) {
      logger.error("Failed to resolve account number during withdrawal", {
        accountNumber: accountNumber.slice(-4).padStart(10, "*"),
        bankCode,
        error,
      });
      throw new AppError(
        "Invalid account details. Please verify your bank information.",
        400
      );
    }

    // Create a transfer recipient
    let recipientResponse;
    try {
      recipientResponse = await paystackService.createTransferRecipient({
        type: "nuban", // Nigerian bank account
        name: accountDetails.account_name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
        description: `Withdrawal recipient for ${user.name || user.email}`,
        metadata: {
          userId: user.id,
        },
      });
    } catch (error) {
      logger.error("Failed to create transfer recipient", {
        accountNumber: accountNumber.slice(-4).padStart(10, "*"),
        bankCode,
        error,
      });
      throw new AppError(
        "Failed to create transfer recipient. Please try again later.",
        500
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
          walletId: user?.wallet?.id as string,
          type: "WITHDRAWAL",
          amount,
          reference,
          status: "PENDING",
          description: `Withdrawal to ${accountDetails.account_name} (${accountNumber.slice(-4).padStart(10, "*")})`,
          metadata: {
            bankCode,
            accountNumber,
            accountName: accountDetails.account_name,
            recipientCode: recipientResponse.data.recipient_code,
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

    // Initiate the transfer with Paystack
    try {
      const transferResponse = await paystackService.initiateTransfer({
        source: "balance", // Use Paystack balance
        amount,
        recipient: recipientResponse.data.recipient_code,
        reason: `Withdrawal to ${accountDetails.account_name}`,
        reference,
        currency: "NGN",
      });

      // Update the transaction with transfer details
      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          metadata: {
            all: transaction.metadata,
            transferCode: transferResponse.data.transfer_code,
            transferStatus: transferResponse.data.status,
          },
        },
      });

      logger.info("Withdrawal transfer initiated", {
        userId: user.id,
        amount,
        reference,
        transferCode: transferResponse.data.transfer_code,
        status: transferResponse.data.status,
      });

      return {
        reference,
        message: "Withdrawal request submitted successfully",
        status: "pending",
        transferCode: transferResponse.data.transfer_code,
        accountName: accountDetails.account_name,
      };
    } catch (error) {
      logger.error("Failed to initiate transfer with Paystack", {
        userId: user.id,
        amount,
        reference,
        error,
      });

      // Refund the user's wallet since the transfer failed
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
                  : "Failed to initiate transfer",
              failedAt: new Date().toISOString(),
            },
          },
        });
      });

      throw new AppError(
        "Failed to process withdrawal. Your funds have been returned to your wallet.",
        500
      );
    }
  } catch (error) {
    logger.error("Error initiating withdrawal", { error });
    throw error;
  }
}

/**
 * Verify a withdrawal transfer status
 * @param reference Transfer reference
 * @returns Updated transaction status
 */
export async function verifyWithdrawalStatus(reference: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
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

    // Get transfer code from metadata
    const metadata = transaction.metadata as any;
    if (!metadata?.transferCode) {
      throw new AppError("Transfer details not found", 400);
    }

    // Verify transfer with Paystack
    try {
      const verificationResult =
        await paystackService.verifyTransfer(reference);
      const transferStatus = verificationResult.data.status.toUpperCase();

      // Map Paystack status to our status
      let newStatus: WalletTransactionStatus = "PENDING";
      if (transferStatus === "SUCCESS") {
        newStatus = "COMPLETED";
      } else if (transferStatus === "FAILED" || transferStatus === "REVERSED") {
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
              transferStatus: transferStatus,
              verifiedAt: new Date().toISOString(),
              lastVerifiedBy: "user",
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

          logger.info("Failed withdrawal refunded", {
            userId: session.user.id,
            amount: transaction.amount,
            reference,
          });
        }
      }

      return {
        status: newStatus,
        reference,
        transferStatus,
      };
    } catch (error) {
      logger.error("Error verifying withdrawal status", {
        reference,
        error,
      });
      return {
        status: transaction.status,
        reference,
        error: "Failed to verify transfer status",
      };
    }
  } catch (error) {
    logger.error("Error checking withdrawal status", { error });
    throw error;
  }
}

