import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: (await params).id },
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
        feedbacks: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            giverId: true,
            receiverId: true,
          },
        },
        dispute: {
          select: {
            id: true,
            reason: true,
            description: true,
            evidence: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            resolvedAt: true,
            buyerAmount: true,
            sellerAmount: true,
            adminNotes: true,
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

    // Check if user is part of this transaction or is an admin
    if (
      transaction.buyerId !== user.id &&
      transaction.sellerId !== user.id &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if transaction has a dispute
    const hasDispute = !!transaction.dispute;

    return NextResponse.json({
      ...transaction,
      isBuyer: transaction.buyerId === user.id,
      isSeller: transaction.sellerId === user.id,
      hasDispute,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

