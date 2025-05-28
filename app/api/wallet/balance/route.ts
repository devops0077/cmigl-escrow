import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: {
        balance: true,
        escrowBalance: true,
      },
    });

    // Get total amount in escrow (transactions where user is buyer or seller and status is not completed)
    // const escrowTransactions = await prisma.transaction.findMany({
    //   where: {
    //     OR: [{ buyerId: userId }, { sellerId: userId }],
    //     NOT: {
    //       status: {
    //         in: ["COMPLETED", "FAILED", "CANCELLED"],
    //       },
    //     },
    //   },
    //   select: {
    //     amount: true,
    //     buyerId: true,
    //   },
    // });

    // Calculate escrow amount (only count transactions where user is buyer)
    // const escrowAmount = escrowTransactions.reduce((total, transaction) => {
    //   if (transaction.buyerId === userId) {
    //     return total + transaction.amount;
    //   }
    //   return total;
    // }, 0);

    return NextResponse.json({
      balance: wallet?.balance || 0,
      escrowAmount: wallet?.escrowBalance || 0,
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet balance" },
      { status: 500 }
    );
  }
}
