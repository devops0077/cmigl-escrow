import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import cronJobService from "@/lib/cron-job-service";
import { logger } from "@/lib/logger";

// API route to check cron server health
export async function GET() {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Check cron server health
    const health = await cronJobService.checkHealth();

    return NextResponse.json(health);
  } catch (error: any) {
    logger.error("Failed to check cron server health", {
      error: error.message,
    });

    return NextResponse.json(
      { error: "Failed to check cron server health" },
      { status: 500 }
    );
  }
}

