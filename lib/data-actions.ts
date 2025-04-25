"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { TransactionStatus } from "./generated/prisma";
import { auth } from "@/auth";

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

export async function getProductCategories() {
  const fees = await prisma.fee.findMany({
    orderBy: {
      productCategory: "asc",
    },
  });

  return fees.map((fee) => ({
    id: fee.id,
    name: fee.productCategory,
    percentage: fee.percentage,
  }));
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

  // Get fee percentage for the product category
  const fee = await prisma.fee.findUnique({
    where: { productCategory },
  });

  if (!fee) {
    throw new Error("Invalid product category");
  }

  const escrowFee = amount * fee.percentage;

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
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${transactionId}`);
  revalidatePath("/wallet");

  return updatedTransaction;
}
