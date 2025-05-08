import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TransactionStatus } from "@/lib/generated/prisma";
import { createNotification } from "@/lib/notification-service";
import { formatCurrency } from "@/lib/utils";

export async function PATCH(
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
    const { status } = await request.json();

    const isAdmin = user.role === "ADMIN";

    if (
      !status ||
      !Object.values(TransactionStatus).includes(status as TransactionStatus)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check permissions based on status update
    if (status === "SHIPPED" && transaction.sellerId !== user.id) {
      return NextResponse.json(
        { error: "Only the seller can mark a transaction as shipped" },
        { status: 403 }
      );
    }

    if (status === "CONFIRMED" && transaction.buyerId !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Only the buyer can confirm receipt" },
        { status: 403 }
      );
    }

    if (status === "COMPLETED" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only an admin can complete a transaction" },
        { status: 403 }
      );
    }

    if (status === "FAILED" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only an admin can mark a transaction as failed" },
        { status: 403 }
      );
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: status as TransactionStatus },
    });

    //  if status is confirmed by buyer, release funds to seller
    if (status === TransactionStatus.CONFIRMED) {
      // const amountToSeller = transaction.amount - transaction.escrowFee;
      const amountToSeller = transaction.amount;

      await prisma.wallet.update({
        where: { userId: transaction.sellerId },
        data: {
          balance: {
            increment: amountToSeller,
          },
          transactions: {
            create: {
              amount: amountToSeller,
              type: "ESCROW_RELEASE",
              status: "COMPLETED",
              description: `Funds released for transaction ${transaction.id}`,
            },
          },
        },
      });

      createNotification({
        userId: transaction.sellerId,
        title: "Transaction Completed",
        type: "SYSTEM_NOTIFICATION",
        message: `Transaction ${transaction.id} has been completed. Funds released.`,
      });
    }

    // If transaction is completed, release funds to seller
    if (status === "COMPLETED") {
      // const amountToSeller = transaction.amount - transaction.escrowFee;
      const amountToSeller = transaction.amount;

      await prisma.wallet.update({
        where: { userId: transaction.sellerId },
        data: {
          balance: {
            increment: amountToSeller,
          },
          transactions: {
            create: {
              amount: amountToSeller,
              type: "ESCROW_RELEASE",
              status: "COMPLETED",
              description: `Funds released for transaction ${transaction.id}`,
            },
          },
        },
      });

      createNotification({
        userId: transaction.sellerId,
        title: "Transaction Completed",
        type: "ADMIN_NOTIFICATION",
        message: `Transaction ${transaction.id} has been completed. Funds released.`,
      });
    }

    // If transaction failed, refund buyer
    if (status === "FAILED") {
      await prisma.wallet.update({
        where: { userId: transaction.buyerId },
        data: {
          balance: {
            increment: transaction.amount,
          },
          transactions: {
            create: {
              amount: transaction.amount,
              type: "ESCROW_REFUND",
              status: "COMPLETED",
              description: `Refund for failed transaction ${transaction.id}`,
            },
          },
        },
      });

      createNotification({
        userId: transaction.buyerId,
        title: "Transaction Failed",
        type: "TRANSACTION_STATUS_CHANGED",
        message: `Transaction ${formatCurrency(transaction.amount)} has failed. Amount refunded.`,
        data: {
          trxId: transaction.id,
        },
      });
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
