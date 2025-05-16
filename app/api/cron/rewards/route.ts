import { NextResponse } from "next/server";
import { processRewards } from "@/lib/cron/reward-processor";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // Check for authorization
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      logger.warn("CRON_SECRET environment variable not set");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      logger.warn("Unauthorized cron job attempt", {
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip"),
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process rewards
    const result = await processRewards();

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error in reward cron job", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
