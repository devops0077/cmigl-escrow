"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { auth } from "@/auth";

export async function getUserWallet() {
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

  if (!user || !user.wallet) {
    throw new Error("Wallet not found");
  }

  return {
    balance: user.wallet.balance,
  };
}

export async function getWalletTransactions() {
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

  if (!user || !user.wallet) {
    throw new Error("Wallet not found");
  }

  const transactions = await prisma.walletTransaction.findMany({
    where: {
      walletId: user.wallet.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    amount: transaction.amount,
    type: transaction.type,
    status: transaction.status,
    description: transaction.description || "",
    createdAt: transaction.createdAt.toISOString(),
  }));
}

export async function depositToWallet(amount: number) {
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

  if (!user || !user.wallet) {
    throw new Error("Wallet not found");
  }

  // In a real implementation, this would integrate with Paystack
  // For now, we'll simulate a successful payment
  const reference = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Update wallet balance
  const updatedWallet = await prisma.wallet.update({
    where: { id: user.wallet.id },
    data: {
      balance: {
        increment: amount,
      },
      transactions: {
        create: {
          amount: amount,
          type: "DEPOSIT",
          status: "COMPLETED",
          reference,
          description: `Deposit of ${amount} NGN`,
        },
      },
    },
  });

  revalidatePath("/wallet");
  revalidatePath("/dashboard");

  return {
    success: true,
    newBalance: updatedWallet.balance,
  };
}

export async function withdrawFromWallet({
  amount,
  accountName,
  accountNumber,
  bankName,
}: {
  amount: number;
  accountName: string;
  accountNumber: string;
  bankName: string;
}) {
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

  if (!user || !user.wallet) {
    throw new Error("Wallet not found");
  }

  if (user.wallet.balance < amount) {
    throw new Error("Insufficient funds");
  }

  // In a real implementation, this would integrate with Paystack
  // For now, we'll simulate a successful withdrawal
  const reference = `WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Update wallet balance
  const updatedWallet = await prisma.wallet.update({
    where: { id: user.wallet.id },
    data: {
      balance: {
        decrement: amount,
      },
      transactions: {
        create: {
          amount: -amount,
          type: "WITHDRAWAL",
          status: "COMPLETED",
          reference,
          description: `Withdrawal of ${amount} NGN to ${bankName} - ${accountNumber}`,
        },
      },
    },
  });

  // Save or update bank details
  await prisma.bankDetails.upsert({
    where: { userId: user.id },
    update: {
      bankName,
      accountNumber,
      accountName,
    },
    create: {
      userId: user.id,
      bankName,
      accountNumber,
      accountName,
    },
  });

  revalidatePath("/wallet");
  revalidatePath("/dashboard");

  return {
    success: true,
    newBalance: updatedWallet.balance,
  };
}
