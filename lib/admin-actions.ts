"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { auth } from "@/auth";
import { hash } from "bcryptjs";
import { AppError } from "./error-class";

export async function ensureAdminExists() {
  // Count admin users
  const adminCount = await prisma.user.count({
    where: {
      role: "ADMIN",
    },
  });

  // If no admin exists, create one with default credentials
  if (adminCount === 0) {
    const defaultAdminPassword =
      process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123456";
    const hashedPassword = await hash(defaultAdminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        name: "System Administrator",
        email: (process.env.DEFAULT_ADMIN_EMAIL as string) || "admin@cmigl.com",
        username: "admin",
        password: hashedPassword,
        phone: (process.env.DEFAULT_ADMIN_PHONE as string) || "+2348000000000",
        role: "ADMIN",
        isActive: true,
        emailVerified: new Date(),
        status: "ACTIVE",
        termsAccepted: true,
        wallet: {
          create: {
            balance: 0,
            currency: "NGN",
          },
        },
        registrationFee: {
          create: {
            amount: 0,
            paid: true,
          },
        },
      },
    });

    console.log("Created default admin user:", admin.email);
    return { success: true, message: "Default admin user created" };
  }

  return { success: true, message: "Admin user already exists" };
}

// Get admin dashboard overview
export async function getAdminDashboardOverview() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new AppError("Unauthorized");
  }

  const [
    totalUsers,
    totalTransactions,
    totalDisputes,
    totalEscrowFees,
    recentTransactions,
    transactionStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.dispute.count(),
    prisma.transaction.aggregate({
      _sum: {
        escrowFee: true,
      },
    }),
    prisma.transaction.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            email: true,
          },
        },
      },
    }),
    prisma.transaction.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    }),
  ]);

  // Get dispute statistics
  const disputeStats = await prisma.dispute.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  });

  return {
    totalUsers,
    totalTransactions,
    totalDisputes,
    totalEscrowFees: totalEscrowFees._sum.escrowFee || 0,
    recentTransactions,
    transactionStats,
    disputeStats,
  };
}

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

  // Calculate total registration fees
  const registrationFees =
    (await prisma.registrationFee.count({
      where: {
        paid: true,
      },
    })) * 500; // ₦500 per registration

  return {
    totalUsers,
    totalTransactions,
    pendingTransactions,
    totalEscrowFees,
    totalRegistrationFees: registrationFees,
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
    include: {
      registrationFee: true,
    },
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
    isActive: user.isActive,
    registrationFeePaid: user.registrationFee?.paid || false,
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

export async function getDisputeById(disputeId: string) {
  await checkAdminPermission();

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      transaction: {
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              phone: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              phone: true,
            },
          },
        },
      },
      initiator: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  return dispute;
}
