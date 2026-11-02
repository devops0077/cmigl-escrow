import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || undefined;
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    // Build where clause
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { transaction: { id: { contains: search } } },
      ];
    }

    // Count total disputes matching the criteria
    const total = await prisma.dispute.count({ where });

    // Get disputes with pagination and sorting
    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            amount: true,
            status: true,
            buyer: {
              select: { id: true, name: true, username: true },
            },
            seller: {
              select: { id: true, name: true, username: true },
            },
          },
        },
        initiator: {
          select: { id: true, name: true, username: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortField]: sortDirection,
      },
    });

    // Format the response
    const formattedDisputes = disputes.map((dispute) => {
      const isBuyerInitiator =
        dispute.initiator.id === dispute.transaction.buyer.id;

      return {
        id: dispute.id,
        transactionId: dispute.transactionId,
        reason: dispute.reason,
        status: dispute.status,
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
        resolvedAt: dispute.resolvedAt,
        transactionAmount: dispute.transaction.amount,
        transactionStatus: dispute.transaction.status,
        initiatorId: dispute.initiator.id,
        initiatorName: dispute.initiator.name || dispute.initiator.username,
        initiatorType: isBuyerInitiator ? "Buyer" : "Seller",
        buyerId: dispute.transaction.buyer.id,
        buyerName:
          dispute.transaction.buyer.name || dispute.transaction.buyer.username,
        sellerId: dispute.transaction.seller.id,
        sellerName:
          dispute.transaction.seller.name ||
          dispute.transaction.seller.username,
      };
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      disputes: formattedDisputes,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching disputes:", error);
    return NextResponse.json(
      { error: "Failed to fetch disputes" },
      { status: 500 }
    );
  }
}

