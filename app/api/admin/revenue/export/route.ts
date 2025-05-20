import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

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
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate") || "")
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate") || "")
      : undefined;

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

    let exportData = [];
    let csvHeader = [];

    if (type === "all" || type === "escrow") {
      // Get escrow fees
      const escrowFeesFilter = {
        ...dateFilter,
        ...(status && { status: status }),
        OR: search
          ? [
              { id: { contains: search, mode: "insensitive" } },
              { buyer: { name: { contains: search, mode: "insensitive" } } },
              {
                buyer: { username: { contains: search, mode: "insensitive" } },
              },
              { seller: { name: { contains: search, mode: "insensitive" } } },
              {
                seller: { username: { contains: search, mode: "insensitive" } },
              },
            ]
          : undefined,
      };

      const escrowFees = await prisma.transaction.findMany({
        where: escrowFeesFilter,
        select: {
          id: true,
          amount: true,
          escrowFee: true,
          status: true,
          createdAt: true,
          buyer: {
            select: {
              name: true,
              username: true,
            },
          },
          seller: {
            select: {
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transform escrow fees data for export
      const escrowFeesData = escrowFees.map((transaction) => ({
        Type: "Escrow Fee",
        TransactionID: transaction.id,
        Amount: transaction.amount,
        FeeAmount: transaction.escrowFee,
        Status: transaction.status === "COMPLETED" ? "PAID" : "PENDING",
        Date: format(new Date(transaction.createdAt), "yyyy-MM-dd HH:mm:ss"),
        Buyer:
          transaction.buyer.name || transaction.buyer.username || "Unknown",
        Seller:
          transaction.seller.name || transaction.seller.username || "Unknown",
      }));

      exportData = [...exportData, ...escrowFeesData];
      if (!csvHeader.length) {
        csvHeader = Object.keys(escrowFeesData[0] || {});
      }
    }

    if (type === "all" || type === "registration") {
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

      const registrationFees = await prisma.registrationFee.findMany({
        where: registrationFeesFilter,
        include: {
          user: {
            select: {
              name: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transform registration fees data for export
      const registrationFeesData = registrationFees.map((fee) => ({
        Type: "Registration Fee",
        UserName: fee.user.name || fee.user.username || "Unknown",
        Email: fee.user.email,
        Amount: fee.amount,
        Status: fee.paid ? "PAID" : "PENDING",
        Reference: fee.reference || "",
        Date: format(new Date(fee.createdAt), "yyyy-MM-dd HH:mm:ss"),
        PaidDate: fee.paidAt
          ? format(new Date(fee.paidAt), "yyyy-MM-dd HH:mm:ss")
          : "",
      }));

      exportData = [...exportData, ...registrationFeesData];
      if (!csvHeader.length) {
        csvHeader = Object.keys(registrationFeesData[0] || {});
      }
    }

    // Generate CSV
    const csvContent = [
      csvHeader.join(","),
      ...exportData.map((row) =>
        csvHeader
          .map((key) => {
            const value = row[key]?.toString() || "";
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="revenue-export-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating revenue export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
