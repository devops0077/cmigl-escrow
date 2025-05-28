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

    // Get revenue data for each month
    const chartData = await Promise.all(
      months.map(async ({ year, month, name }) => {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        // Get escrow fees for the month
        const escrowfees = await prisma.revenue.aggregate({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: "COLLECTED",
            type: "ESCROW_FEE",
          },
          _sum: {
            amount: true,
          },
        });

        const escrowFees = escrowfees._sum.amount || 0;

        // Get registration fees for the month
        const registrationFees = await prisma.registrationFee.aggregate({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            paid: true,
          },
          _sum: {
            amount: true,
          },
        });

        const registrationFeesTotal = registrationFees._sum.amount || 0;

        return {
          name,
          escrowFees,
          registrationFees: registrationFeesTotal,
          total: escrowFees + registrationFeesTotal,
        };
      })
    );

    // Calculate total escrow fees
    const totalEscrowFees = await prisma.revenue.aggregate({
      where: {
        status: "COLLECTED",
        type: "ESCROW_FEE",
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate total registration fees
    const totalRegistrationFees = await prisma.registrationFee.aggregate({
      where: {
        paid: true,
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate current month revenue
    const currentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const nextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const currentMonthEscrowFees = await prisma.revenue.aggregate({
      where: {
        createdAt: {
          gte: currentMonth,
          lte: nextMonth,
        },
        status: "COLLECTED",
        type: "ESCROW_FEE",
      },
      _sum: {
        amount: true,
      },
    });

    const currentMonthRegistrationFees = await prisma.registrationFee.aggregate(
      {
        where: {
          createdAt: {
            gte: currentMonth,
            lte: nextMonth,
          },
          paid: true,
        },
        _sum: {
          amount: true,
        },
      }
    );

    return NextResponse.json({
      chartData,
      totalEscrowFees: totalEscrowFees._sum.amount || 0,
      totalRegistrationFees: totalRegistrationFees._sum.amount || 0,
      totalRevenue:
        (totalEscrowFees._sum.amount || 0) +
        (totalRegistrationFees._sum.amount || 0),
      currentMonthRevenue:
        (currentMonthEscrowFees._sum.amount || 0) +
        (currentMonthRegistrationFees._sum.amount || 0),
    });
  } catch (error) {
    console.error("Error fetching revenue summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
