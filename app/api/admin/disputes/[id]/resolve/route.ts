import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";
import { emailService } from "@/lib/email-service";
import { formatCurrency } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const disputeId = (await params).id;
    const { sellerAmount, buyerAmount, adminNotes } = await request.json();

    // Validate input
    if (sellerAmount === undefined && buyerAmount === undefined) {
      return NextResponse.json(
        { error: "Either sellerAmount or buyerAmount must be provided" },
        { status: 400 }
      );
    }

    // Get the dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        transaction: {
          include: {
            buyer: {
              select: { id: true, email: true, name: true, username: true },
            },
            seller: {
              select: { id: true, email: true, name: true, username: true },
            },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // Check if dispute is already resolved
    if (dispute.status === "RESOLVED") {
      return NextResponse.json(
        { error: "Dispute is already resolved" },
        { status: 400 }
      );
    }

    const transaction = dispute.transaction;
    const totalAmount = transaction.amount;

    // Validate amounts
    const parsedSellerAmount =
      sellerAmount !== undefined
        ? Number.parseFloat(sellerAmount.toString())
        : 0;
    const parsedBuyerAmount =
      buyerAmount !== undefined ? Number.parseFloat(buyerAmount.toString()) : 0;

    if (parsedSellerAmount + parsedBuyerAmount > totalAmount) {
      return NextResponse.json(
        { error: "Total allocated amount exceeds transaction amount" },
        { status: 400 }
      );
    }

    // Update the dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "RESOLVED",
        sellerAmount: parsedSellerAmount || 0,
        buyerAmount: parsedBuyerAmount || 0,
        adminNotes,
        resolvedAt: new Date(),
      },
    });

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "RESOLVED",
        hasDispute: false,
      },
    });

    // Process payments based on resolution
    if (parsedSellerAmount > 0) {
      // Release funds to seller
      await prisma.wallet.update({
        where: { userId: transaction.sellerId },
        data: {
          balance: {
            increment: parsedSellerAmount,
          },

          transactions: {
            create: {
              amount: parsedSellerAmount,
              type: "ESCROW_RELEASE",
              status: "COMPLETED",
              description: `Dispute resolution: Funds released for transaction #${transaction.id}`,
            },
          },
        },
      });

      // Notify seller
      await createNotification({
        userId: transaction.sellerId,
        type: "DISPUTE_RESOLVED",
        title: "Dispute Resolved",
        message: `Your dispute has been resolved. ${formatCurrency(parsedSellerAmount)} has been released to your wallet.`,
        data: { transactionId: transaction.id, disputeId },
      });

      // Email seller
      try {
        await emailService.sendEmail({
          to: transaction.seller.email!,
          subject: "Dispute Resolution: Funds Released",
          html: `
            <h1>Dispute Resolution</h1>
            <p>The dispute for transaction #${transaction.id.slice(0, 8)} has been resolved.</p>
            <p>${formatCurrency(parsedSellerAmount)} has been released to your wallet.</p>
            <p><strong>Admin Notes:</strong> ${adminNotes || "No additional notes provided."}</p>
          `,
        });
      } catch (error) {
        console.error("Failed to send seller email:", error);
      }
    }

    if (parsedBuyerAmount > 0) {
      // Refund buyer
      await prisma.wallet.update({
        where: { userId: transaction.buyerId },
        data: {
          balance: {
            increment: parsedBuyerAmount,
          },
          transactions: {
            create: {
              amount: parsedBuyerAmount,
              type: "ESCROW_REFUND",
              status: "COMPLETED",
              description: `Dispute resolution: Refund for transaction #${transaction.id}`,
            },
          },
        },
      });

      // Notify buyer
      await createNotification({
        userId: transaction.buyerId,
        type: "DISPUTE_RESOLVED",
        title: "Dispute Resolved",
        message: `Your dispute has been resolved. ${formatCurrency(parsedBuyerAmount)} has been refunded to your wallet.`,
        data: { transactionId: transaction.id, disputeId },
      });

      // Email buyer
      try {
        await emailService.sendEmail({
          to: transaction.buyer.email!,
          subject: "Dispute Resolution: Funds Refunded",
          html: `
            <h1>Dispute Resolution</h1>
            <p>The dispute for transaction ${formatCurrency(transaction.amount)} has been resolved.</p>
            <p>${formatCurrency(parsedBuyerAmount)} has been refunded to your wallet.</p>
            <p><strong>Admin Notes:</strong> ${adminNotes || "No additional notes provided."}</p>
          `,
        });
      } catch (error) {
        console.error("Failed to send buyer email:", error);
      }
    }

    return NextResponse.json({ success: true, dispute: updatedDispute });
  } catch (error) {
    console.error("Error resolving dispute:", error);
    return NextResponse.json(
      { error: "Failed to resolve dispute" },
      { status: 500 }
    );
  }
}
