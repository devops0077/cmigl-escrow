import { logger } from "@/lib/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Optionally import your types
// import { MonnifyWebhookPayload } from "@/types/monnify"; // Define this if you want strong typing

export async function POST(req: NextRequest) {
  // Parse the webhook payload
  const payload = await req.json();

  // Respond immediately to avoid Monnify retries
  // (Do NOT await any long-running logic before responding)
  // You can log the payload for debugging
  logger.info("Received Monnify webhook:", { payload });

  // TODO: Implement duplicate notification check
  // Example: if (await isDuplicate(payload.transactionReference)) return NextResponse.json({}, { status: 200 });

  // TODO: Optionally validate transaction hash for security

  // Process the notification asynchronously
  processMonnifyNotification(payload).catch((err) => {
    logger.error("Error processing Monnify webhook:", { err });
  });

  // Respond with 200 OK immediately
  return NextResponse.json({}, { status: 200 });
}

// Example async processor (implement your business logic here)
async function processMonnifyNotification(payload: any) {
  // TODO: Save transaction, update user wallet, send email, etc.
  // Example:
  // if (payload.eventType === "SUCCESSFUL_TRANSACTION") { ... }
  logger.info("Processing Monnify notification:", { payload });
}
