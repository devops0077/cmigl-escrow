import { logger } from "@/lib/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { redisClient } from "@/lib/monnify-service";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/error-class";
import { TransactionStatus } from "@/lib/generated/prisma";
import { _escrowConfig } from "@/config";

const MONNIFY_CONTRACT_CODE = _escrowConfig.monnifyContractCode;
const MONNIFY_API_KEY = _escrowConfig.monnifyApiKey;

function computeMonnifyHash(payload: any): string {
  // See: https://teamapt.atlassian.net/wiki/spaces/MON/pages/212008918/Computing+Request+Validation+Hash
  const { paymentReference, amountPaid, paidOn, transactionReference } =
    payload.eventData;
  const stringToHash = `${MONNIFY_CONTRACT_CODE}|${paymentReference}|${amountPaid}|${paidOn}|${transactionReference}|${MONNIFY_API_KEY}`;
  return crypto.createHash("sha512").update(stringToHash).digest("hex");
}

async function isDuplicate(transactionReference: string): Promise<boolean> {
  // Replace with DB/Redis check in production
  const exists = await redisClient.exists(
    `monnify:transaction:${transactionReference}`
  );
  if (exists) return true;
  await redisClient.set(
    `monnify:transaction:${transactionReference}`,
    "processed"
  );
  return false;
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  logger.info("Received Monnify webhook:", { payload });

  // Duplicate notification check
  const transactionReference = payload?.eventData?.transactionReference;
  if (!transactionReference) {
    logger.error("Missing transactionReference in webhook payload");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (await isDuplicate(transactionReference)) {
    logger.warn("Duplicate Monnify webhook received", { transactionReference });
    return NextResponse.json({}, { status: 200 });
  }

  // Transaction hash validation (optional but recommended)
  const sentHash = req.headers.get("monnify-signature");
  const computedHash = computeMonnifyHash(payload);
  if (sentHash !== computedHash) {
    logger.error("Monnify webhook hash mismatch", { sentHash, computedHash });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Process the notification asynchronously
  processMonnifyNotification(payload).catch((err) => {
    logger.error("Error processing Monnify webhook:", { err });
  });

  // Respond with 200 OK immediately
  return NextResponse.json({}, { status: 200 });
}

async function processMonnifyNotification(payload: any) {
  const trxRef = payload?.eventData?.transactionReference;
  switch (payload.eventType) {
    case "SUCCESSFUL_TRANSACTION":
      console.info("Processing Monnify notification:", { payload });
      if (!payload.eventData) {
        console.error("Missing eventData in Monnify notification payload");
        break;
      }
      // Process successful transaction
      const { paymentReference, amountPaid, transactionReference } =
        payload.eventData;

      if (!paymentReference || !amountPaid || !transactionReference) {
        console.error("Missing required fields in Monnify notification", {
          paymentReference,
          amountPaid,
          transactionReference,
        });
        break;
      }
      // Here you would typically update your database, notify the user, etc.
      const metadata = payload.eventData.metaData || {};

      if (metadata?.type === "wallet_funding") {
        const amountInNaira = +amountPaid;

        // Ensure we have a valid user email
        if (!metadata.userId) {
          throw new AppError("User ID is required", 400);
        }

        // Find the user by ID
        const user = await prisma.user.findUnique({
          where: { id: metadata.userId },
        });

        if (!user) {
          throw new AppError("User not found", 404);
        }

        // Update the user's wallet balance
        await prisma.wallet.upsert({
          where: { userId: user.id },
          update: {
            balance: {
              increment: amountInNaira,
            },
            transactions: {
              create: {
                type: "DEPOSIT",
                amount: amountInNaira,
                reference: trxRef,
                status: TransactionStatus.COMPLETED,
              },
            },
          },
          create: {
            userId: user.id,
            balance: amountInNaira,
            transactions: {
              create: {
                type: "DEPOSIT",
                amount: amountInNaira,
                reference: trxRef,
                status: TransactionStatus.COMPLETED,
              },
            },
          },
        });

        return NextResponse.json({
          message: "Wallet funded successfully",
          amount: amountInNaira,
        });
      } else if (metadata?.type === "registration_fee") {
        const userId = String(metadata.userId) || payload.eventData.userId;

        // Update registration fee status
        await prisma.registrationFee.update({
          where: { userId },
          data: {
            paid: true,
            reference: trxRef,
          },
        });

        // Activate user account
        await prisma.user.update({
          where: { id: userId },
          data: { status: "ACTIVE" },
        });
        // udpate session user

        logger.info("Registration fee payment verified and user activated", {
          userId,
          reference: trxRef,
        });
      }

      console.info("Monnify transaction successful:", {
        paymentReference,
        amountPaid,
        transactionReference,
      });
      break;
    case "FAILED_TRANSACTION":
      console.warn("Monnify transaction failed:", { payload });
      break;
  }
}
