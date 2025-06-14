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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminPermission();

    const userId = (await params).id;

    // Get comprehensive user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: {
          select: {
            balance: true,
            escrowBalance: true,
          },
        },
        registrationFee: true,
        _count: {
          select: {
            receivedTransactions: true,
            sentTransactions: true,
          },
        },
        securityLogs: {
          where: {
            eventType: "LOGIN_SUCCESS",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            createdAt: true,
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
      phone: user.phone,
      image: user.image,
      bio: user.bio,
      address: user.address,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
      restricted: user.restricted,
      emailVerified: user.emailVerified?.toISOString() || null,
      termsAccepted: user.termsAccepted,
      walletBalance: user.wallet?.balance || 0,
      escrowBalance: user.wallet?.escrowBalance || 0,
      transactionCount:
        user._count.receivedTransactions + user._count.sentTransactions,
      registrationFee: user.registrationFee,
      lastLogin: user.securityLogs[0]?.createdAt?.toISOString() || null,
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
