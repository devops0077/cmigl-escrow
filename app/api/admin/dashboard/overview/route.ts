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

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Get current date and calculate dates for the past 12 months
    const currentDate = new Date();
    const months = [];
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
      months.map(async ({ year, month, name }) => {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: "COMPLETED",
          },
          select: {
            escrowFee: true,
          },
        });

        // Calculate total fees for the month
        const total = transactions.reduce(
          (sum, transaction) => sum + transaction.escrowFee,
          0
        );

        return {
          name,
          total,
        };
      })
    );

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get transaction counts
    const totalTransactions = await prisma.transaction.count();

    const pendingTransactions = await prisma.transaction.count({
      where: {
        status: { in: ["PENDING", "PROCESSING", "SHIPPED"] },
      },
    });

    const completedTransactions = await prisma.transaction.count({
      where: {
        status: { in: ["COMPLETED", "CONFIRMED"] },
      },
    });

    // Calculate total escrow fees
    const escrowFees = await prisma.revenue.aggregate({
      where: {
        type: "ESCROW_FEE",
      },
      _sum: {
        amount: true,
      },
    });
    // Calculate total escrow fees
    const totalRegistrationFees = await prisma.registrationFee.aggregate({
      where: {
        paid: true,
      },
      _sum: {
        amount: true,
      },
    });

    // Get recent user registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return NextResponse.json({
      chartData: transactionData,
      totalUsers,
      totalTransactions,
      pendingTransactions,
      completedTransactions,
      totalEscrowFees: escrowFees._sum.amount || 0,
      totalRegistrationFees: totalRegistrationFees._sum.amount || 0,
      newUsers,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
