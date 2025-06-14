import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminPermission();
    const userId = (await params).id;

    // Get user transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
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
      orderBy: { createdAt: "desc" },
    });

    // Calculate statistics
    const stats = {
      totalTransactions: transactions.length,
      totalVolume: transactions.reduce((sum, tx) => sum + tx.amount, 0),
      totalFeesPaid: transactions
        .filter((tx) => tx.buyerId === userId)
        .reduce((sum, tx) => sum + tx.escrowFee, 0),
      completedTransactions: transactions.filter(
        (tx) => tx.status === "COMPLETED"
      ).length,
    };

    // Format transactions
    const formattedTransactions = transactions.map((transaction) => {
      const isBuyer = transaction.buyerId === userId;
      const counterparty = isBuyer ? transaction.seller : transaction.buyer;

      return {
        id: transaction.id,
        amount: transaction.amount,
        escrowFee: transaction.escrowFee,
        status: transaction.status,
        productDetails: transaction.productDetails,
        createdAt: transaction.createdAt.toISOString(),
        isBuyer,
        counterparty: {
          name: counterparty.name,
          username: counterparty.username,
          email: counterparty.email,
        },
      };
    });

    return NextResponse.json({
      transactions: formattedTransactions,
      stats,
    });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction data" },
      { status: 500 }
    );
  }
}
