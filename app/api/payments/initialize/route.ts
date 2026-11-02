import { type NextRequest, NextResponse } from "next/server";
import { paystackService } from "@/lib/paystack-service";
import { logger } from "@/lib/logger";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { calculateTotalWithAllFees } from "@/lib/fee-calculator";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const {
      amount,
      callbackUrl,
      metadata,
      currency = "NGN",
      includeFees = false,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a unique reference
    const reference = `pay_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    // Calculate fees if needed
    let finalAmount = amount;
    let feeBreakdown = null;

    if (includeFees) {
      const isInternational = currency !== "NGN";
      const calculation = calculateTotalWithAllFees(amount, isInternational);
      finalAmount = calculation.totalAmount;
      feeBreakdown = {
        baseAmount: calculation.baseAmount,
        escrowFee: calculation.escrowFee,
        paystackFee: calculation.paystackFee,
        totalAmount: calculation.totalAmount,
      };
    }

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        amount: Number.parseFloat(amount.toString()),
        currency,
        reference,
        status: "PENDING",
        paymentMethod: "CARD", // Default, will be updated after payment
        metadata: {
          originalAmount: amount,
          feeBreakdown,
          ...(metadata || {}),
        },
      },
    });

    // Initialize transaction with Paystack
    const paystackResponse = await paystackService.initializeTransaction({
      email: user.email!,
      amount: Number.parseFloat(amount.toString()),
      reference,
      callback_url:
        callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payments/verify`,
      metadata: {
        payment_id: payment.id,
        user_id: user.id,
        feeBreakdown,
        ...metadata,
      },
      currency,
    });

    logger.info("Payment initialized", {
      paymentId: payment.id,
      reference,
      amount: finalAmount,
      includeFees,
      feeBreakdown,
    });
    return NextResponse.json({
      success: true,
      data: {
        // @ts-ignore
        authorization_url: paystackResponse.authorization_url,
        // @ts-ignore
        access_code: paystackResponse.access_code,
        // @ts-ignore
        reference: paystackResponse.reference,
        paymentId: payment.id,
      },
    });
  } catch (error: any) {
    logger.error("Error initializing payment", { error: error.message });
    return NextResponse.json(
      { error: "Failed to initialize payment", details: error.message },
      { status: 500 }
    );
  }
}

