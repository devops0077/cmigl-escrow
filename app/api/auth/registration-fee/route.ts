import { type NextRequest, NextResponse } from "next/server";
import { paystackService } from "@/lib/paystack-service";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/error-class";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { _escrowConfig } from "@/config";
import { PaymentMethod } from "@/lib/generated/prisma";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    logger.info("Initializing registration fee payment", {
      method: req.method,
      url: req.url,
    });
    const params = req.nextUrl.searchParams;
    const userId = params.get("userId");
    const session = await auth();
    if (!session?.user && !userId) {
      logger.error("User not authenticated or userId not provided", {
        session,
        userId,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedId = userId ?? session?.user.id;

    // Check if user has already paid the registration fee
    const user = await prisma.user.findUnique({
      where: { id: resolvedId },
      select: { registrationFee: true, email: true },
    });

    if (user?.registrationFee?.paid) {
      return NextResponse.json(
        { error: "Registration fee already paid" },
        { status: 400 }
      );
    }

    // Generate a unique reference
    const reference = paystackService.generateTransactionReference();

    // Get registration fee amount from config
    const registrationFeeAmount = _escrowConfig.registrationFee;

    // Initialize the transaction
    const result = await paystackService.initializeTransaction({
      email: user?.email as string,
      amount: registrationFeeAmount,
      reference,
      callback_url: `${req.nextUrl.origin}/dashboard`,
      metadata: {
        userId: resolvedId,
        purpose: "registration_fee",
      },
      currency: "NGN",
    });

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        amount: registrationFeeAmount,
        currency: "NGN",
        reference,
        status: "PENDING",
        paymentMethod: PaymentMethod.CARD,
        metadata: {
          userId: resolvedId,
          purpose: "registration_fee",
          type: "registration_fee",
        },
      },
    });

    logger.info("Registration fee payment initialized", {
      userId: resolvedId,
      reference,
      amount: registrationFeeAmount,
    });

    return NextResponse.json({
      ...result,
      email: user?.email,
    });
  } catch (error) {
    logger.error("Registration fee payment initialization error", { error });

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
