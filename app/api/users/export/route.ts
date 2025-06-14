import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkAdminPermission() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

export async function GET() {
  try {
    await checkAdminPermission();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        restricted: true,
        isActive: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
          },
        },
        _count: {
          select: {
            receivedTransactions: true,
            sentTransactions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert to CSV
    const csvHeaders = [
      "ID",
      "Name",
      "Email",
      "Username",
      "Phone",
      "Role",
      "Status",
      "Wallet Balance",
      "Transaction Count",
      "Created At",
    ];

    const csvRows = users.map((user) => [
      user.id,
      user.name || "",
      user.email || "",
      user.username || "",
      user.phone || "",
      user.role,
      user.restricted ? "Restricted" : "Active",
      user.wallet?.balance || 0,
      user._count.receivedTransactions + user._count.sentTransactions,
      user.createdAt.toISOString(),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting users:", error);
    return NextResponse.json(
      { error: "Failed to export users" },
      { status: 500 }
    );
  }
}
