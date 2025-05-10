import { type NextRequest, NextResponse } from "next/server";
import { verifyWithdrawalStatus } from "@/lib/wallet-actions";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const reference = params.reference;

    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    const result = await verifyWithdrawalStatus(reference);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error verifying withdrawal status", { error });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const statusCode = errorMessage.includes("not found")
      ? 404
      : errorMessage.includes("Unauthorized")
        ? 401
        : 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
