import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current date and calculate dates for the past 12 months
    const currentDate = new Date();
    const months: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() - i);
      months.push({
        name: date.toLocaleString("default", { month: "short" }),
        year: date.getFullYear(),
        month: date.getMonth(),
      });
    }

    // Get transaction data for each month
    const transactionData = await Promise.all(
      months.map(async ({ year, month }) => {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
          where: {
            OR: [{ buyerId: user.id }, { sellerId: user.id }],
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: "COMPLETED",
          },
          select: {
            amount: true,
            buyerId: true,
          },
        });

        // Calculate total amount for the month
        const total = transactions.reduce((sum, transaction) => {
          // If user is buyer, it's an expense; if seller, it's income
          const amount =
            transaction.buyerId === user.id
              ? -transaction.amount
              : transaction.amount;
          return sum + amount;
        }, 0);

        return {
          name: months[months.length - 1 - month].name,
          total: Math.abs(total), // Use absolute value for chart display
          isIncome: total >= 0,
        };
      })
    );

    // Get wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

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

    // Get total in escrow
    const inEscrow = await prisma.transaction.aggregate({
      where: {
        buyerId: user.id,
        status: { in: ["PENDING", "PROCESSING", "SHIPPED", "CONFIRMED"] },
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      chartData: transactionData,
      walletBalance: wallet?.balance || 0,
      pendingTransactions,
      completedTransactions,
      totalTransactions,
      inEscrow: inEscrow._sum.amount || 0,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
