import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";

async function checkAdminPermission() {
  const session = await auth.api.getSession({ headers: await headers() });

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminPermission();
    const userId = (await params).id;

    // Get wallet data
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Calculate statistics
    const stats = await prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const deposits = await prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        amount: { gt: 0 },
        type: { in: ["DEPOSIT", "ESCROW_RELEASE", "ESCROW_REFUND"] },
      },
      _sum: {
        amount: true,
      },
    });

    const withdrawals = await prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        amount: { lt: 0 },
        type: { in: ["WITHDRAWAL", "ESCROW_PAYMENT"] },
      },
      _sum: {
        amount: true,
      },
    });

    const walletData = {
      balance: wallet.balance,
      escrowBalance: wallet.escrowBalance,
      currency: wallet.currency,
      transactions: wallet.transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        description: tx.description,
        reference: tx.reference,
        createdAt: tx.createdAt.toISOString(),
      })),
      stats: {
        totalDeposits: deposits._sum.amount || 0,
        totalWithdrawals: Math.abs(withdrawals._sum.amount || 0),
        totalTransactions: stats._count.id,
      },
    };

    return NextResponse.json(walletData);
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet data" },
      { status: 500 }
    );
  }
}

