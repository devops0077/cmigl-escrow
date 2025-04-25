"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { auth } from "@/auth";

async function checkAdminPermission() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

export async function getAdminDashboardData() {
  await checkAdminPermission();

  const totalUsers = await prisma.user.count();

  const totalTransactions = await prisma.transaction.count();

  const pendingTransactions = await prisma.transaction.count({
    where: {
      status: "CONFIRMED", // Transactions awaiting admin approval
    },
  });

  // Calculate total escrow fees
  const transactions = await prisma.transaction.findMany({
    where: {
      status: "COMPLETED",
    },
    select: {
      escrowFee: true,
    },
  });

  const totalEscrowFees = transactions.reduce(
    (sum, transaction) => sum + transaction.escrowFee,
    0
  );

  return {
    totalUsers,
    totalTransactions,
    pendingTransactions,
    totalEscrowFees,
  };
}

export async function getAllTransactions() {
  await checkAdminPermission();

  const transactions = await prisma.transaction.findMany({
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
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    amount: transaction.amount,
    escrowFee: transaction.escrowFee,
    status: transaction.status,
    createdAt: transaction.createdAt.toISOString(),
    productCategory: transaction.productCategory,
    buyerName:
      transaction.buyer.name || transaction.buyer.username || "Unknown",
    sellerName:
      transaction.seller.name || transaction.seller.username || "Unknown",
  }));
}

export async function getAllUsers() {
  await checkAdminPermission();

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function updateUserRole(userId: string, role: string) {
  await checkAdminPermission();

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as "USER" | "ADMIN" },
  });

  revalidatePath("/admin");
}

export async function getProductCategories() {
  await checkAdminPermission();

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

export async function updateFee(id: string, name: string, percentage: number) {
  await checkAdminPermission();

  await prisma.fee.update({
    where: { id },
    data: {
      productCategory: name,
      percentage,
    },
  });

  revalidatePath("/admin");
}

export async function createFee(name: string, percentage: number) {
  await checkAdminPermission();

  const fee = await prisma.fee.create({
    data: {
      productCategory: name,
      percentage,
    },
  });

  revalidatePath("/admin");

  return {
    id: fee.id,
    name: fee.productCategory,
    percentage: fee.percentage,
  };
}
