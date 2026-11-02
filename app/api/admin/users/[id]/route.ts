import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const userId = (await params).id;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format the response
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      image: user.image,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
      restricted: user.restricted,
      walletBalance: user.wallet?.balance || 0,
      transactionCount:
        user._count.receivedTransactions + user._count.sentTransactions,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}

