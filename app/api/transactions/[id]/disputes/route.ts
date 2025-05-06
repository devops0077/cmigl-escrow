import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";
import { emailService } from "@/lib/email-service";

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
      },
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

    // Check if transaction status allows disputes
    if (
      !["PENDING", "PROCESSING", "SHIPPED", "CONFIRMED"].includes(
        transaction.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot dispute a transaction with status: " + transaction.status,
        },
        { status: 400 }
      );
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findFirst({
      where: { transactionId: (await params).id },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: "Dispute already exists for this transaction" },
        { status: 400 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const reason = formData.get("reason") as string;
    const description = formData.get("description") as string;
    const evidenceUrl = formData.get("evidenceUrl") as string | null;

    if (!reason || !description) {
      return NextResponse.json(
        { error: "Reason and description are required" },
        { status: 400 }
      );
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        transactionId: (await params).id,
        initiatorId: user.id,
        reason,
        description,
        evidence: evidenceUrl || null,
        status: "OPEN",
      },
    });

    // Update transaction status to DISPUTED
    await prisma.transaction.update({
      where: { id: (await params).id },
      data: { status: "DISPUTED" },
    });

    // Create notifications for all parties
    // For the other party
    const otherPartyId =
      user.id === transaction.buyerId
        ? transaction.sellerId
        : transaction.buyerId;
    const otherPartyName =
      user.id === transaction.buyerId
        ? transaction.seller.name || transaction.seller.username
        : transaction.buyer.name || transaction.buyer.username;

    await createNotification({
      userId: otherPartyId,
      type: "DISPUTE_CREATED",
      title: "Transaction Disputed",
      message: `${user.name || user.username} has initiated a dispute for transaction #${transaction.id.slice(0, 8)}`,
      data: { transactionId: transaction.id, disputeId: dispute.id },
    });

    // For admin (notify all admins)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "DISPUTE_CREATED",
        title: "New Dispute",
        message: `A new dispute has been created for transaction #${transaction.id.slice(0, 8)}`,
        data: { transactionId: transaction.id, disputeId: dispute.id },
      });
    }

    // Send email notifications
    try {
      // Email to the other party
      const otherPartyEmail =
        user.id === transaction.buyerId
          ? transaction.seller.email
          : transaction.buyer.email;
      if (otherPartyEmail) {
        await emailService.sendTransactionNotificationEmail(
          otherPartyEmail,
          transaction.id,
          "disputed",
          {
            initiator: user.name || user.username,
            reason,
          }
        );
      }

      // Email to admins
      const adminEmails = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true },
      });

      for (const admin of adminEmails) {
        if (admin.email) {
          await emailService.sendTransactionNotificationEmail(
            admin.email,
            transaction.id,
            "dispute_admin",
            {
              buyer: transaction.buyer.name || transaction.buyer.username,
              seller: transaction.seller.name || transaction.seller.username,
              initiator: user.name || user.username,
              reason,
            }
          );
        }
      }
    } catch (error) {
      console.error("Failed to send dispute emails:", error);
      // Continue even if emails fail
    }

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    console.error("Error creating dispute:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
