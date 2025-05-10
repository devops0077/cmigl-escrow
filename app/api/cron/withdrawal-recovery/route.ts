import { type NextRequest, NextResponse } from "next/server";
import { recoverStuckWithdrawals } from "@/lib/cron/withdrawal-recovery";
import { logger } from "@/lib/logger";

// Secret key to authenticate cron job requests
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized
    const authHeader = request.headers.get("authorization");
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ") ||
      authHeader.split(" ")[1] !== CRON_SECRET
    ) {
      logger.warn("Unauthorized cron job request attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run the recovery process
    const results = await recoverStuckWithdrawals();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    logger.error("Error running withdrawal recovery cron job", { error });
    return NextResponse.json(
      {
        error: "Failed to process withdrawal recovery",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
