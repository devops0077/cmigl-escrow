import { type NextRequest, NextResponse } from "next/server";
import { paystackService } from "@/lib/paystack-service";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Get the request body as text for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    if (
      !signature ||
      !paystackService.verifyWebhookSignature(signature, body)
    ) {
      logger.warn("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the body
    const event = JSON.parse(body);
    const { event: eventType, data } = event;

    logger.info("Webhook received", { eventType });

    // Store webhook event
    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        eventType,
        eventData: event,
        processed: false,
      },
    });

    // Process based on event type
    switch (eventType) {
      case "charge.success":
        await handleChargeSuccess(data, webhookEvent.id);
        break;
      case "transfer.success":
        await handleTransferSuccess(data, webhookEvent.id);
        break;
      case "transfer.failed":
        await handleTransferFailed(data, webhookEvent.id);
        break;
      case "subscription.create":
        await handleSubscriptionCreate(data, webhookEvent.id);
        break;
      case "subscription.disable":
        await handleSubscriptionDisable(data, webhookEvent.id);
        break;
      default:
        logger.info("Unhandled webhook event type", { eventType });
    }

    // Mark webhook as processed
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { processed: true },
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error("Error processing webhook", { error: error.message });
    return NextResponse.json(
      { error: "Failed to process webhook", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle charge.success event
 */
async function handleChargeSuccess(data: any, webhookEventId: string) {
  const { reference } = data;

  // Find payment by reference
  const payment = await prisma.payment.findUnique({
    where: { reference },
  });

  if (!payment) {
    logger.error("Payment not found for webhook", { reference });
    return;
  }

  // Update payment with webhook event
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.SUCCESS,
      gatewayResponse: data.status,
      webhookEvents: {
        connect: { id: webhookEventId },
      },
    },
  });

  // Extract metadata
  const metadata = payment.metadata || {};
  const userId = metadata.user_id;

  if (!userId) {
    logger.error("User ID not found in payment metadata", {
      paymentId: payment.id,
    });
    return;
  }

  // Process based on payment type
  if (metadata.type === "wallet_funding") {
    await processWalletFunding(payment, userId);
  } else if (metadata.type === "registration_fee") {
    await processRegistrationFee(payment, userId);
  } else if (metadata.type === "transaction") {
    await processTransactionPayment(payment, userId, metadata.transaction_id);
  }

  logger.info("Charge success webhook processed", { reference });
}

/**
 * Handle transfer.success event
 */
async function handleTransferSuccess(data: any, webhookEventId: string) {
  const { reference } = data;

  // Find wallet transaction by reference
  const walletTransaction = await prisma.walletTransaction.findUnique({
    where: { reference },
    include: { wallet: true },
  });

  if (!walletTransaction) {
    logger.error("Wallet transaction not found for webhook", { reference });
    return;
  }

  // Update wallet transaction
  await prisma.walletTransaction.update({
    where: { id: walletTransaction.id },
    data: {
      status: "COMPLETED",
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: walletTransaction.wallet.userId,
      title: "Withdrawal Successful",
      message: `Your withdrawal of ${walletTransaction.amount.toFixed(2)} has been processed successfully.`,
      type: "SUCCESS",
    },
  });

  logger.info("Transfer success webhook processed", { reference });
}

/**
 * Handle transfer.failed event
 */
async function handleTransferFailed(data: any, webhookEventId: string) {
  const { reference } = data;

  // Find wallet transaction by reference
  const walletTransaction = await prisma.walletTransaction.findUnique({
    where: { reference },
    include: { wallet: true },
  });

  if (!walletTransaction) {
    logger.error("Wallet transaction not found for webhook", { reference });
    return;
  }

  // Update wallet transaction
  await prisma.walletTransaction.update({
    where: { id: walletTransaction.id },
    data: {
      status: "FAILED",
    },
  });

  // Refund the wallet
  await prisma.wallet.update({
    where: { id: walletTransaction.walletId },
    data: {
      balance: {
        increment: walletTransaction.amount,
      },
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: walletTransaction.wallet.userId,
      title: "Withdrawal Failed",
      message: `Your withdrawal of ${walletTransaction.amount.toFixed(2)} has failed. The amount has been refunded to your wallet.`,
      type: "ERROR",
    },
  });

  logger.info("Transfer failed webhook processed", { reference });
}

/**
 * Handle subscription.create event
 */
async function handleSubscriptionCreate(data: any, webhookEventId: string) {
  const { customer, subscription_code, email_token, plan } = data;

  // Find user by customer code
  const user = await prisma.user.findFirst({
    where: { paystackCustomerId: customer.customer_code },
  });

  if (!user) {
    logger.error("User not found for subscription webhook", {
      customerCode: customer.customer_code,
    });
    return;
  }

  // Create subscription
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planCode: plan.plan_code,
      subscriptionCode: subscription_code,
      status: "ACTIVE",
      amount: plan.amount / 100, // Convert from kobo to naira
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Subscription Created",
      message: `Your subscription to ${plan.name} has been created successfully.`,
      type: "SUCCESS",
    },
  });

  logger.info("Subscription create webhook processed", {
    subscriptionCode: subscription_code,
  });
}

/**
 * Handle subscription.disable event
 */
async function handleSubscriptionDisable(data: any, webhookEventId: string) {
  const { subscription_code } = data;

  // Find subscription
  const subscription = await prisma.subscription.findUnique({
    where: { subscriptionCode: subscription_code },
  });

  if (!subscription) {
    logger.error("Subscription not found for webhook", {
      subscriptionCode: subscription_code,
    });
    return;
  }

  // Update subscription
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: subscription.userId,
      title: "Subscription Cancelled",
      message: "Your subscription has been cancelled successfully.",
      type: "INFO",
    },
  });

  logger.info("Subscription disable webhook processed", {
    subscriptionCode: subscription_code,
  });
}

// Reuse the same processing functions from the verify endpoint
async function processWalletFunding(payment: any, userId: string) {
  try {
    // Get the amount in Naira
    const amountInNaira = payment.amount;

    // Update the user's wallet balance
    await prisma.wallet.upsert({
      where: { userId },
      update: {
        balance: {
          increment: amountInNaira,
        },
        transactions: {
          create: {
            type: "DEPOSIT",
            amount: amountInNaira,
            reference: payment.reference,
            status: "COMPLETED",
            description: "Wallet funding via Paystack",
            metadata: {
              paymentGateway: "paystack",
              paymentReference: payment.reference,
            },
          },
        },
      },
      create: {
        userId,
        balance: amountInNaira,
        transactions: {
          create: {
            type: "DEPOSIT",
            amount: amountInNaira,
            reference: payment.reference,
            status: "COMPLETED",
            description: "Wallet funding via Paystack",
            metadata: {
              paymentGateway: "paystack",
              paymentReference: payment.reference,
            },
          },
        },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Wallet Funded",
        message: `Your wallet has been credited with ₦${amountInNaira.toFixed(2)}.`,
        type: "SUCCESS",
      },
    });

    logger.info("Wallet funding processed successfully", {
      userId,
      amount: amountInNaira,
    });
  } catch (error) {
    logger.error("Error processing wallet funding", { error, userId });
  }
}

/**
 * Process registration fee payment
 */
async function processRegistrationFee(payment: any, userId: string) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { registrationFee: true, wallet: true },
    });

    if (!user) {
      logger.error("User not found for registration fee payment", { userId });
      return;
    }

    if (!user.registrationFee) {
      logger.error("Registration fee record not found", { userId });
      return;
    }

    if (user.registrationFee.paid) {
      logger.info("Registration fee already paid", { userId });
      return;
    }

    // Update registration fee status
    await prisma.registrationFee.update({
      where: { userId },
      data: {
        paid: true,
        reference: payment.reference,
      },
    });

    // Activate user account
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Registration Complete",
        message:
          "Your account has been activated after successful payment of registration fee.",
        type: "SUCCESS",
      },
    });

    logger.info("Registration fee processed successfully", { userId });
  } catch (error) {
    logger.error("Error processing registration fee", { error, userId });
  }
}

async function processTransactionPayment(
  payment: any,
  userId: string,
  transactionId: string
) {
  try {
    if (!transactionId) {
      logger.error("Transaction ID not found in payment metadata", {
        paymentId: payment.id,
      });
      return;
    }

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      logger.error("Transaction not found", { transactionId });
      return;
    }

    // Update transaction with payment information
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentId: payment.id,
        status: "PENDING", // Set to pending until confirmed
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Payment Successful",
        message: `Your payment of ₦${payment.amount.toFixed(2)} for transaction #${transactionId} was successful.`,
        type: "SUCCESS",
      },
    });

    logger.info("Transaction payment processed successfully", {
      userId,
      transactionId,
    });
  } catch (error) {
    logger.error("Error processing transaction payment", {
      error,
      userId,
      transactionId,
    });
  }
}
