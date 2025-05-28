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
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate") || "")
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate") || "")
      : undefined;

    const skip = (page - 1) * limit;

    // Build base filters
    let dateFilter = {};
    if (startDate) {
      dateFilter = {
        ...dateFilter,
        createdAt: {
          ...dateFilter.createdAt,
          gte: startDate,
        },
      };
    }
    if (endDate) {
      dateFilter = {
        ...dateFilter,
        createdAt: {
          ...dateFilter.createdAt,
          lte: endDate,
        },
      };
    }

    // Get escrow fees (from transactions)
    const escrowFeesFilter = {
      ...dateFilter,
      ...(status && { status: status }),
      OR: search
        ? [
            { id: { contains: search, mode: "insensitive" } },
            { buyer: { name: { contains: search, mode: "insensitive" } } },
            { buyer: { username: { contains: search, mode: "insensitive" } } },
            { seller: { name: { contains: search, mode: "insensitive" } } },
            { seller: { username: { contains: search, mode: "insensitive" } } },
          ]
        : undefined,
    };

    // Get registration fees
    const registrationFeesFilter = {
      ...dateFilter,
      ...(status && { paid: status === "PAID" }),
      OR: search
        ? [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { username: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { reference: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    };

    let escrowFees = [];
    let escrowFeesCount = 0;
    let registrationFees = [];
    let registrationFeesCount = 0;

    if (type === "all" || type === "escrow") {
      // Get escrow fees
      [escrowFees, escrowFeesCount] = await Promise.all([
        prisma.transaction.findMany({
          where: escrowFeesFilter,
          select: {
            id: true,
            amount: true,
            escrowFee: true,
            status: true,
            createdAt: true,
            buyer: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            seller: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: type === "escrow" ? limit : Math.floor(limit / 2),
        }),
        prisma.transaction.count({
          where: escrowFeesFilter,
        }),
      ]);

      // Transform escrow fees data
      escrowFees = escrowFees.map((transaction) => ({
        id: transaction.id,
        transactionId: transaction.id,
        amount: transaction.amount,
        feeAmount: transaction.escrowFee,
        status: "PAID",
        createdAt: transaction.createdAt,
        buyerName:
          transaction.buyer.name ||
          transaction.buyer.username ||
          "Unknown User",
        sellerName:
          transaction.seller.name ||
          transaction.seller.username ||
          "Unknown User",
      }));
    }

    if (type === "all" || type === "registration") {
      // Get registration fees
      [registrationFees, registrationFeesCount] = await Promise.all([
        prisma.registrationFee.findMany({
          where: registrationFeesFilter,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: type === "registration" ? limit : Math.floor(limit / 2),
        }),
        prisma.registrationFee.count({
          where: registrationFeesFilter,
        }),
      ]);

      // Transform registration fees data
      registrationFees = registrationFees.map((fee) => ({
        id: fee.id,
        userId: fee.user.id,
        userName: fee.user.name || fee.user.username || "Unknown User",
        userEmail: fee.user.email,
        amount: fee.amount,
        status: fee.paid ? "PAID" : "PENDING",
        reference: fee.reference || "",
        createdAt: fee.createdAt,
        paidAt: fee.createdAt,
      }));
    }

    // Calculate total for pagination based on selected type
    let totalCount = 0;
    if (type === "all") {
      totalCount = escrowFeesCount + registrationFeesCount;
    } else if (type === "escrow") {
      totalCount = escrowFeesCount;
    } else {
      totalCount = registrationFeesCount;
    }

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      escrowFees,
      registrationFees,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
