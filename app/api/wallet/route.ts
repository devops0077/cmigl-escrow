import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { initiateWithdrawal } from "@/lib/wallet-actions";

// Validation schema for withdrawal requests
const withdrawalSchema = z.object({
  type: z.literal("withdrawal"),
  amount: z
    .number()
    .positive()
    .min(1000, "Minimum withdrawal amount is ₦1,000"),
  bankCode: z.string().min(1, "Bank code is required"),
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
  accountName: z.string().optional(),
});

// Union type for all wallet operations
const walletOperationSchema = z.discriminatedUnion("type", [
  withdrawalSchema,
  // Add other operation types here if needed
]);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: true,
      },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json({
      balance: user.wallet.balance,
    });
  } catch (error) {
    logger.error("Error fetching wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = walletOperationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Handle different operation types
    if (data.type === "withdrawal") {
      try {
        const result = await initiateWithdrawal(
          data.amount,
          data.bankCode,
          data.accountNumber
        );
        return NextResponse.json(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to process withdrawal";
        const statusCode = errorMessage.includes("Insufficient balance")
          ? 400
          : errorMessage.includes("Invalid account")
            ? 400
            : 500;

        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    }

    // If we get here, it's an unsupported operation type
    return NextResponse.json(
      { error: "Unsupported operation type" },
      { status: 400 }
    );
  } catch (error) {
    logger.error("Error processing wallet operation:", error);

    // Return appropriate error message
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    const status = errorMessage === "Insufficient balance" ? 400 : 500;

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
