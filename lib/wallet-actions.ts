import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/error-class";
import { logger } from "@/lib/logger";
import { paystackService } from "@/lib/paystack-service";
import { auth } from "@/auth";

export async function getWalletBalance() {
  try {
    const session = await auth();
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

export async function getWalletTransactions(limit = 10, page = 1) {
  try {
    const session = await auth();
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
    const session = await auth();
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
    const session = await auth();
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
    const session = await auth();
    if (!session?.user) {
      throw new AppError("Unauthorized", 401);
    }

    // Check if user has sufficient balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet || wallet.balance < amount) {
      throw new AppError("Insufficient balance", 400);
    }

    // Generate a unique reference
    const reference = paystackService.generateTransactionReference();

    // Create a withdrawal transaction (pending)
    await prisma.wallet.update({
      where: { userId: session.user.id },
      data: {
        balance: {
          decrement: amount,
        },
        transactions: {
          create: {
            type: "WITHDRAWAL",
            amount,
            reference,
            status: "PENDING",
            description: "Withdrawal to bank account",
          },
        },
      },
    });

    logger.info("Withdrawal initiated", {
      userId: session.user.id,
      amount,
      reference,
    });

    // In a real implementation, you would initiate a transfer via Paystack here
    // For now, we'll just return the reference
    return { reference };
  } catch (error) {
    logger.error("Error initiating withdrawal", { error });
    throw error;
  }
}
