import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers as nextHeaders } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { SecurityService } from "@/lib/security-service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await nextHeaders() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            balance: true,
            createdAt: true,
          },
        },
        userSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      select: {
        id: true,
        amount: true,
        escrowFee: true,
        status: true,
        productDetails: true,
        productCategory: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get wallet transactions
    const walletTransactions = await prisma.walletTransaction.findMany({
      where: {
        wallet: {
          userId: user.id,
        },
      },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        reference: true,
        createdAt: true,
      },
    });

    // Compile user data export
    const userData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      wallet: user.wallet,
      settings: user.userSettings,
      transactions,
      walletTransactions,
    };

    // Set headers for file download
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set(
      "Content-Disposition",
      `attachment; filename="user-data-${user.id}.json"`
    );

    return new NextResponse(JSON.stringify(userData, null, 2), {
      status: 200,
      headers,
    });
  } catch (error) {
    logger.error("Error exporting user data", { error });
    return NextResponse.json(
      { error: "Failed to export user data" },
      { status: 500 }
    );
  }
}

