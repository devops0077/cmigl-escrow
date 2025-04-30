import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";
import { emailService } from "@/lib/email-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactionId = params.id;
    const { reason, description, evidence } = await request.json();

    // Validate input
    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: {
          select: { id: true, email: true, name: true, username: true },
        },
        seller: {
          select: { id: true, email: true, name: true, username: true },
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

    // Check if transaction already has a dispute
    if (transaction.hasDispute) {
      return NextResponse.json(
        { error: "Transaction already has an active dispute" },
        { status: 400 }
      );
    }

    // Create the dispute
    const dispute = await prisma.dispute.create({
      data: {
        transactionId,
        initiatorId: user.id,
        reason,
        description,
        evidence,
        status: "OPEN",
      },
    });

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "DISPUTED",
        hasDispute: true,
      },
    });

    // Determine the other party in the transaction
    const otherPartyId =
      user.id === transaction.buyerId
        ? transaction.sellerId
        : transaction.buyerId;
    const otherParty =
      user.id === transaction.buyerId ? transaction.seller : transaction.buyer;
    const initiatorName = user.name || user.username || user.email;

    // Create notification for the initiator
    await createNotification({
      userId: user.id,
      type: "DISPUTE_CREATED",
      title: "Dispute Created",
      message: `You have initiated a dispute for transaction #${transaction.id.slice(0, 8)}`,
      data: { transactionId, disputeId: dispute.id },
    });

    // Create notification for the other party
    await createNotification({
      userId: otherPartyId,
      type: "DISPUTE_CREATED",
      title: "Dispute Received",
      message: `${initiatorName} has initiated a dispute for transaction #${transaction.id.slice(0, 8)}`,
      data: { transactionId, disputeId: dispute.id },
    });

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "DISPUTE_CREATED",
        title: "New Dispute",
        message: `A new dispute has been created for transaction #${transaction.id.slice(0, 8)}`,
        data: { transactionId, disputeId: dispute.id },
      });

      // Send email to admin
      try {
        await emailService.sendEmail({
          to: admin.email!,
          subject: "New Dispute Created",
          html: `
            <h1>New Dispute Created</h1>
            <p>A new dispute has been created for transaction #${transaction.id.slice(0, 8)}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p>Please review this dispute in the admin dashboard.</p>
          `,
        });
      } catch (error) {
        console.error("Failed to send admin email:", error);
      }
    }

    // Send email to the other party
    if (otherParty.email) {
      try {
        await emailService.sendEmail({
          to: otherParty.email,
          subject: "Dispute Filed for Your Transaction",
          html: `
            <h1>Dispute Filed</h1>
            <p>${initiatorName} has filed a dispute for transaction #${transaction.id.slice(0, 8)}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p>Please log in to your account to respond to this dispute.</p>
          `,
        });
      } catch (error) {
        console.error("Failed to send other party email:", error);
      }
    }

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    console.error("Error creating dispute:", error);
    return NextResponse.json(
      { error: "Failed to create dispute" },
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

    const transactionId = params.id;

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this transaction or is an admin
    const isParticipant =
      transaction.buyerId === user.id || transaction.sellerId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the dispute
    const dispute = await prisma.dispute.findUnique({
      where: { transactionId },
      include: {
        initiator: {
          select: { id: true, name: true, username: true, email: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error("Error fetching dispute:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispute" },
      { status: 500 }
    );
  }
}
