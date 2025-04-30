import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    const { receiverId, rating, comment, isPublic } = await request.json();

    // Verify transaction exists and user is part of it
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this transaction
    if (transaction.buyerId !== user.id && transaction.sellerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify receiver is the other party in the transaction
    if (
      receiverId !== transaction.buyerId &&
      receiverId !== transaction.sellerId
    ) {
      return NextResponse.json({ error: "Invalid receiver" }, { status: 400 });
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        transactionId,
        giverId: user.id,
        receiverId,
      },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: "Feedback already submitted" },
        { status: 400 }
      );
    }

    // Create feedback
    const feedback = await prisma.feedback.up({
      data: {
        transactionId,
        giverId: user.id,
        receiverId,
        rating,
        comment,
        isPublic,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const transactionId = params.id;

    // Verify transaction exists and user is part of it
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this transaction or is admin
    if (
      transaction.buyerId !== user.id &&
      transaction.sellerId !== user.id &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get feedback for this transaction
    const feedback = await prisma.feedback.findMany({
      where: {
        transactionId,
      },
      include: {
        giver: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
