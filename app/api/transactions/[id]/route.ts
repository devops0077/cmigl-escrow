import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const transactionId = (await params).id;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
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
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this transaction
    if (
      transaction.buyerId !== user.id &&
      transaction.sellerId !== user.id &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Add isBuyer and isSeller flags
    const responseData = {
      ...transaction,
      isBuyer: transaction.buyerId === user.id,
      isSeller: transaction.sellerId === user.id,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
