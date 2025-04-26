"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import type { TransactionStatus } from "./generated/prisma";
import { auth } from "@/auth";
import { compare } from "bcryptjs";
import { createNotification } from "./notification-service";
import { emailService } from "./email-service";

export async function updateUserProfile({
  name,
  username,
  email,
}: Partial<{
  name: string;
  username: string;
  email: string;
}>) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      username,
      email,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return updatedUser;
}
export async function updateUserPassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if the current password is correct
  // @ts-ignore
  const isPasswordValid = await compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  // Update the password
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: newPassword,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return updatedUser;
}

export async function getUserDashboardData() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      wallet: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get transaction counts
  const pendingTransactions = await prisma.transaction.count({
    where: {
      OR: [
        {
          buyerId: user.id,
          status: { in: ["PENDING", "PROCESSING", "SHIPPED"] },
        },
        {
          sellerId: user.id,
          status: { in: ["PENDING", "PROCESSING", "SHIPPED"] },
        },
      ],
    },
  });

  const completedTransactions = await prisma.transaction.count({
    where: {
      OR: [
        { buyerId: user.id, status: "COMPLETED" },
        { sellerId: user.id, status: "COMPLETED" },
      ],
    },
  });

  const totalTransactions = await prisma.transaction.count({
    where: {
      OR: [{ buyerId: user.id }, { sellerId: user.id }],
    },
  });

  return {
    walletBalance: user.wallet?.balance || 0,
    pendingTransactions,
    completedTransactions,
    totalTransactions,
  };
}

export async function getUserTransactions(limit = 5) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [{ buyerId: user.id }, { sellerId: user.id }],
    },
    include: {
      buyer: {
        select: {
          name: true,
          username: true,
        },
      },
      seller: {
        select: {
          name: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return transactions.map((transaction) => {
    const isBuyer = transaction.buyerId === user.id;
    const type = isBuyer ? "Purchase" : "Sale";
    const counterpartyName = isBuyer
      ? transaction.seller.name || transaction.seller.username || "Unknown"
      : transaction.buyer.name || transaction.buyer.username || "Unknown";

    return {
      id: transaction.id,
      amount: transaction.amount,
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString(),
      type,
      counterpartyName,
    };
  });
}

export async function getTransactionById(id: string) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  // Check if user is part of this transaction
  if (transaction.buyerId !== user.id && transaction.sellerId !== user.id) {
    throw new Error("Unauthorized");
  }

  return {
    ...transaction,
    isBuyer: transaction.buyerId === user.id,
    isSeller: transaction.sellerId === user.id,
  };
}

export async function searchUsers(query: string) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
      NOT: {
        id: currentUser.id, // Exclude current user
      },
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
    take: 5,
  });

  return users;
}

export async function createTransaction({
  sellerId,
  amount,
  productDetails,
  productCategory,
}: {
  sellerId: string;
  amount: number;
  productDetails: string;
  productCategory: string;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const buyer = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      wallet: true,
    },
  });

  if (!buyer) {
    throw new Error("User not found");
  }

  // Check if buyer has enough balance
  if (!buyer.wallet || buyer.wallet.balance < amount) {
    throw new Error("Insufficient funds");
  }

  // Calculate flat 1.5% fee
  const escrowFee = amount * 0.015;

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      buyerId: buyer.id,
      sellerId,
      amount,
      escrowFee,
      productDetails,
      productCategory,
      status: "PENDING",
    },
  });

  // Deduct amount from buyer's wallet
  await prisma.wallet.update({
    where: { userId: buyer.id },
    data: {
      balance: {
        decrement: amount,
      },
      transactions: {
        create: {
          amount: -amount,
          type: "ESCROW_PAYMENT",
          status: "COMPLETED",
          description: `Escrow payment for transaction #${transaction.id}`,
        },
      },
    },
  });

  // Get seller details for notification
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { email: true, name: true, username: true },
  });

  // Create notification for buyer
  await createNotification({
    userId: buyer.id,
    type: "TRANSACTION_CREATED",
    title: "Transaction Created",
    message: `You have created a new transaction for ₦${amount.toFixed(2)} with a fee of ₦${escrowFee.toFixed(2)}`,
    data: { transactionId: transaction.id },
  });

  // Create notification for seller
  await createNotification({
    userId: sellerId,
    type: "TRANSACTION_CREATED",
    title: "New Transaction",
    message: `${buyer.name || buyer.username} has created a new transaction with you for ₦${amount.toFixed(2)}`,
    data: { transactionId: transaction.id },
  });

  // Send email notifications
  try {
    // Email to buyer
    await emailService.sendTransactionNotificationEmail(
      buyer.email!,
      transaction.id,
      "created",
      {
        amount,
        fee: escrowFee,
        productDetails,
      }
    );

    // Email to seller
    if (seller?.email) {
      await emailService.sendTransactionNotificationEmail(
        seller.email,
        transaction.id,
        "created",
        {
          amount,
          fee: escrowFee,
          productDetails,
          buyerName: buyer.name || buyer.username,
        }
      );
    }
  } catch (error) {
    console.error("Failed to send transaction emails:", error);
    // Continue even if emails fail
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/wallet");

  return transaction;
}

export async function updateTransactionStatus({
  transactionId,
  status,
}: {
  transactionId: string;
  status: TransactionStatus;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      buyer: {
        select: {
          name: true,
          username: true,
        },
      },
      seller: {
        select: {
          name: true,
          username: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  // Check permissions based on status update
  if (status === "SHIPPED" && transaction.sellerId !== user.id) {
    throw new Error("Only the seller can mark a transaction as shipped");
  }

  if (status === "CONFIRMED" && transaction.buyerId !== user.id) {
    throw new Error("Only the buyer can confirm receipt");
  }

  if (status === "COMPLETED" && user.role !== "ADMIN") {
    throw new Error("Only an admin can complete a transaction");
  }

  if (status === "FAILED" && user.role !== "ADMIN") {
    throw new Error("Only an admin can mark a transaction as failed");
  }

  // Update transaction status
  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status },
  });

  // Create notifications based on status change
  const statusMessages = {
    SHIPPED: {
      buyer: `${transaction.seller.name || transaction.seller.username} has shipped your order.`,
      seller: `You have marked the transaction as shipped.`,
    },
    CONFIRMED: {
      buyer: `You have confirmed receipt of the order.`,
      seller: `${transaction.buyer.name || transaction.buyer.username} has confirmed receipt of the order.`,
    },
    COMPLETED: {
      buyer: `Your transaction has been completed. Funds have been released to the seller.`,
      seller: `Your transaction has been completed. Funds have been released to your wallet.`,
    },
    FAILED: {
      buyer: `Your transaction has been marked as failed. Funds have been refunded to your wallet.`,
      seller: `Your transaction has been marked as failed.`,
    },
    CANCELLED: {
      buyer: `Your transaction has been cancelled.`,
      seller: `Your transaction has been cancelled.`,
    },
    PENDING: {
      buyer: `Your transaction status has been updated to pending.`,
      seller: `Your transaction status has been updated to pending.`,
    },
    PROCESSING: {
      buyer: `Your transaction is now being processed.`,
      seller: `Your transaction is now being processed.`,
    },
  };

  // Create notification for buyer
  await createNotification({
    userId: transaction.buyerId,
    type: "TRANSACTION_STATUS_CHANGED",
    title: `Transaction ${status}`,
    message:
      statusMessages[status]?.buyer ||
      `Your transaction status has been updated to ${status}.`,
    data: { transactionId, status },
  });

  // Create notification for seller
  await createNotification({
    userId: transaction.sellerId,
    type: "TRANSACTION_STATUS_CHANGED",
    title: `Transaction ${status}`,
    message:
      statusMessages[status]?.seller ||
      `Your transaction status has been updated to ${status}.`,
    data: { transactionId, status },
  });

  // If transaction is completed, release funds to seller
  if (status === "COMPLETED") {
    const amountToSeller = transaction.amount - transaction.escrowFee;

    await prisma.wallet.update({
      where: { userId: transaction.sellerId },
      data: {
        balance: {
          increment: amountToSeller,
        },
        transactions: {
          create: {
            amount: amountToSeller,
            type: "ESCROW_RELEASE",
            status: "COMPLETED",
            description: `Funds released for transaction #${transaction.id}`,
          },
        },
      },
    });

    // Create wallet notification for seller
    await createNotification({
      userId: transaction.sellerId,
      type: "WALLET_UPDATED",
      title: "Funds Received",
      message: `${amountToSeller.toFixed(2)} has been added to your wallet from completed transaction.`,
      data: { transactionId, amount: amountToSeller },
    });
  }

  // If transaction failed, refund buyer
  if (status === "FAILED") {
    await prisma.wallet.update({
      where: { userId: transaction.buyerId },
      data: {
        balance: {
          increment: transaction.amount,
        },
        transactions: {
          create: {
            amount: transaction.amount,
            type: "ESCROW_REFUND",
            status: "COMPLETED",
            description: `Refund for failed transaction #${transaction.id}`,
          },
        },
      },
    });

    // Create wallet notification for buyer
    await createNotification({
      userId: transaction.buyerId,
      type: "WALLET_UPDATED",
      title: "Refund Received",
      message: `${transaction.amount.toFixed(2)} has been refunded to your wallet from failed transaction.`,
      data: { transactionId, amount: transaction.amount },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${transactionId}`);
  revalidatePath("/wallet");

  return updatedTransaction;
}
