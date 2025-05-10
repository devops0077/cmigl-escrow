import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { paystackService } from "@/lib/paystack-service";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Validation schema
const accountSchema = z.object({
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
  bankCode: z.string().min(1, "Bank code is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = accountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { accountNumber, bankCode } = validationResult.data;

    try {
      const accountDetails = await paystackService.resolveAccountNumber(
        accountNumber,
        bankCode
      );

      return NextResponse.json({
        accountDetails,
      });
    } catch (error) {
      logger.error("Error resolving account:", {
        accountNumber: accountNumber.slice(-4).padStart(10, "*"),
        bankCode,
        error,
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to verify account details";

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  } catch (error) {
    logger.error("Error in account resolution endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
