import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    // Get pagination parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type") || undefined;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    const where: any = {
      walletId: user.wallet.id,
    };

    // Add type filter if provided
    if (type) {
      where.type = type;
    }

    // Get total count for pagination
    const totalCount = await prisma.walletTransaction.count({ where });

    // Get wallet transactions with pagination
    const transactions = await prisma.walletTransaction.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Format transactions for response
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      description: transaction.description || "",
      reference: transaction.reference || "",
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      data: formattedTransactions,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
