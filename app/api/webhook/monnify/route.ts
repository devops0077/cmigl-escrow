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
  const transactionReference =
    payload?.meta?.payload?.transactionReference ||
    payload?.eventData?.transactionReference;
  if (!transactionReference) {
    logger.error("Missing transactionReference in webhook payload");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (await isDuplicate(transactionReference)) {
    logger.warn("Duplicate Monnify webhook received", { transactionReference });
    return NextResponse.json({}, { status: 200 });
  }

  // Transaction hash validation (optional but recommended)
  //   const sentHash = req.headers.get("monnify-signature");
  //   const computedHash = computeMonnifyHash(payload);
  //   if (sentHash !== computedHash) {
  //     logger.error("Monnify webhook hash mismatch", { sentHash, computedHash });
  //     return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  //   }

  // Process the notification asynchronously
  processMonnifyNotification(payload).catch((err) => {
    logger.error("Error processing Monnify webhook:", { err });
  });

  // Respond with 200 OK immediately
  return NextResponse.json({}, { status: 200 });
}

type MonnifyPayload = {
  meta?: {
    payload: {
      transactionReference: string;
      paymentReference: string;
      amountPaid: number;
      customer: any;
    };
  };
  eventData?: {
    transactionReference: string;
    paymentReference: string;
    amountPaid: number;
    customer: any;
    userId?: string;
  };
  metaData?: {
    type: "wallet_funding" | "registration_fee";
    userId: string;
  };
};

async function processMonnifyNotification(payload: MonnifyPayload) {
  try {
    const data = payload?.meta?.payload || payload.eventData;
    if (!data) {
      throw new AppError("Invalid payload structure", 400);
    }

    const { paymentReference, amountPaid, transactionReference: trxRef } = data;
    const metadata = payload.metaData || {};

    // Validate required fields
    if (!paymentReference || !amountPaid || !trxRef) {
      throw new AppError("Missing required payment fields", 400);
    }

    switch (metadata.type) {
      case "wallet_funding":
        const userId =
          metadata.userId ||
          (await prisma.user.findUnique({
            where: { email: data.customer?.email },
          })?.id);
        return await handleWalletFunding(userId, amountPaid, trxRef);
      case "registration_fee":
        return await handleRegistrationFee(
          metadata.userId || data.userId,
          trxRef
        );
      default:
        throw new AppError("Unknown transaction type", 400);
    }
  } catch (error) {
    logger.error("Failed to process Monnify notification:", { error });
    throw error;
  }
}

async function handleWalletFunding(
  userId: string,
  amount: number,
  reference: string
) {
  if (!userId) throw new AppError("User ID is required", 400);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  await prisma.wallet.upsert({
    where: { userId },
    update: {
      balance: { increment: amount },
      transactions: {
        create: {
          type: "DEPOSIT",
          amount,
          reference,
          status: TransactionStatus.COMPLETED,
        },
      },
    },
    create: {
      userId,
      balance: amount,
      transactions: {
        create: {
          type: "DEPOSIT",
          amount,
          reference,
          status: TransactionStatus.COMPLETED,
        },
      },
    },
  });

  return NextResponse.json({ message: "Wallet funded successfully", amount });
}

async function handleRegistrationFee(userId: string, reference: string) {
  if (!userId) throw new AppError("User ID is required", 400);

  await prisma.$transaction([
    prisma.registrationFee.update({
      where: { userId },
      data: { paid: true, reference },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    }),
  ]);

  logger.info("Registration fee payment verified and user activated", {
    userId,
    reference,
  });
}
